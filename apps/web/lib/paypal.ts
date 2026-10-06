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
