import { createHmac } from 'crypto'
import { logError } from '@/lib/log'

// Shared PayPal amount helpers. The Medusa cart is the only source of truth for
// what a buyer owes: the create-order route builds the PayPal amount from it,
// and the capture route and webhook compare what PayPal collected against it
// before turning the cart into an order.

export interface StoreCart {
  id: string
  email: string | null
  total: number
  currency_code?: string | null
  items?: unknown[]
  completed_at?: string | null
}

// PayPal transaction currencies that use two decimal places. ZAR is not a
// PayPal transaction currency at all. The zero-decimal ones (JPY, HUF, TWD) are
// left out on purpose: cart totals here are integer cents, and sending those as
// "x.yz" would be rejected or mis-charged.
const PAYPAL_CURRENCIES = new Set([
  'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'ILS', 'MYR', 'MXN',
  'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'SGD', 'SEK', 'CHF', 'THB', 'USD',
])

export function isPayPalCurrency(currencyCode: string | null | undefined): boolean {
  return Boolean(currencyCode) && PAYPAL_CURRENCIES.has(String(currencyCode).toUpperCase())
}

export function medusaBase(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_URL ??
    'http://medusa:9000'
  ).replace(/\/$/, '')
}

export function cartUrl(cartId: string): string {
  return `${medusaBase()}/store/carts/${encodeURIComponent(cartId)}`
}

export function medusaHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '',
  }
}

// Loads the cart for an amount comparison. Returns null on any failure; the
// caller then refuses to complete.
export async function loadCart(cartId: string): Promise<StoreCart | null> {
  try {
    const res = await fetch(cartUrl(cartId), { headers: medusaHeaders() })
    if (!res.ok) return null
    const data = (await res.json()) as { cart?: StoreCart }
    return data.cart ?? null
  } catch {
    return null
  }
}

// "1995.00" -> 199500. Returns NaN for anything that is not a plain amount.
export function toCents(value: string | undefined | null): number {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value.trim())) return NaN
  return Math.round(parseFloat(value) * 100)
}

export interface AmountCheck {
  ok: boolean
  expected: number
  received: number
  expectedCurrency: string | null
  receivedCurrency: string | null
}

// True only when PayPal collected exactly the cart total, in the cart currency.
export function compareCapture(
  cart: StoreCart,
  captured: { value?: string; currency_code?: string } | undefined,
): AmountCheck {
  const expected = Number(cart.total)
  const received = toCents(captured?.value)
  const expectedCurrency = cart.currency_code ? cart.currency_code.toUpperCase() : null
  const receivedCurrency = captured?.currency_code ? captured.currency_code.toUpperCase() : null
  const ok =
    Number.isFinite(expected) &&
    expected > 0 &&
    received === expected &&
    expectedCurrency !== null &&
    receivedCurrency === expectedCurrency
  return { ok, expected, received, expectedCurrency, receivedCurrency }
}

// Medusa's PayPal provider (apps/medusa/src/modules/payment-paypal) marks a
// payment session captured only when its data carries this proof: an HMAC of
// the cart, the PayPal order and capture, the amount and the currency, keyed
// with PAYPAL_CLIENT_SECRET, which only our servers hold. So the public store
// API cannot mark a cart as paid, and the order reads as paid (captured) once
// PayPal has taken the money, as PayFast orders do (KI086). D021.
export const PAYPAL_PROVIDER_ID = 'pp_paypal_paypal'

export interface PayPalCaptureProofInput {
  cartId: string
  orderId: string
  captureId: string
  amountCents: number
  currencyCode: string
}

export function capturedProof(input: PayPalCaptureProofInput, secret: string): string {
  const { cartId, orderId, captureId, amountCents, currencyCode } = input
  return createHmac('sha256', secret)
    .update(`${cartId}:${orderId}:${captureId}:${amountCents}:${currencyCode.toUpperCase()}`)
    .digest('hex')
}

/**
 * Open the captured PayPal payment session on the cart, so cart completion
 * finds a paid session. Returns false on any failure (logged); the caller then
 * does not complete the cart and the webhook can retry.
 */
export async function openCapturedSession(input: PayPalCaptureProofInput, secret: string): Promise<boolean> {
  const { cartId } = input
  const headers = medusaHeaders()
  try {
    const cartRes = await fetch(`${cartUrl(cartId)}?fields=id,*payment_collection`, { headers })
    const cartData = cartRes.ok
      ? ((await cartRes.json()) as { cart?: { payment_collection?: { id?: string } | null } })
      : null
    let collectionId = cartData?.cart?.payment_collection?.id
    if (!collectionId) {
      const pcRes = await fetch(`${medusaBase()}/store/payment-collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cart_id: cartId }),
      })
      const pc = (await pcRes.json().catch(() => ({}))) as { payment_collection?: { id?: string } }
      collectionId = pc.payment_collection?.id
      if (!pcRes.ok || !collectionId) {
        logError('[PayPal] Could not create payment collection', undefined, { cartId, status: pcRes.status })
        return false
      }
    }
    const sessRes = await fetch(
      `${medusaBase()}/store/payment-collections/${encodeURIComponent(collectionId)}/payment-sessions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider_id: PAYPAL_PROVIDER_ID,
          data: {
            cart_id: cartId,
            paypal_order_id: input.orderId,
            capture_id: input.captureId,
            amount_cents: input.amountCents,
            currency_code: input.currencyCode.toUpperCase(),
            capture_proof: capturedProof(input, secret),
          },
        }),
      }
    )
    if (!sessRes.ok) {
      logError('[PayPal] Could not open the PayPal payment session', undefined, {
        cartId,
        status: sessRes.status,
        body: (await sessRes.text().catch(() => '')).slice(0, 200),
      })
      return false
    }
    return true
  } catch (err) {
    logError('[PayPal] Payment session network error', err, { cartId })
    return false
  }
}
