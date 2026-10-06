import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logError } from '@/lib/log'
import { cartUrl, isPayPalCurrency, medusaHeaders, type StoreCart } from '@/lib/paypal'

// Creates the PayPal order for a cart. The amount and currency are read from
// the Medusa cart on the server, never from the request body, so a tampered
// client cannot open an order for less than the cart total. The capture route
// and the PAYMENT.CAPTURE.COMPLETED webhook re-check the captured amount
// against the cart before completing it.

const bodySchema = z.object({
  // Accepted for backwards compatibility with the current client and ignored.
  amountInCents: z.number().optional(),
  currencyCode: z.string().optional(),
  itemName: z.string().min(1).max(255),
  cartId: z.string().min(1).max(100),
})

interface PayPalOrderResponse {
  id: string
  status: string
  links: Array<{ rel: string; href: string; method: string }>
}

async function getAccessToken(base: string, clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const clientId = process.env.PAYPAL_CLIENT_ID ?? ''
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'
  const isSandbox = process.env.PAYPAL_SANDBOX === 'true'

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Payment configuration missing' }, { status: 500 })
  }

  const { cartId } = parsed
  let cart: StoreCart
  try {
    const cartRes = await fetch(cartUrl(cartId), { headers: medusaHeaders() })
    if (cartRes.status === 404) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }
    if (!cartRes.ok) {
      return NextResponse.json({ error: 'Could not load cart' }, { status: 502 })
    }
    cart = ((await cartRes.json()) as { cart: StoreCart }).cart
  } catch (err) {
    logError('[PayPal] Cart load error', err, { cartId })
    return NextResponse.json({ error: 'Could not load cart' }, { status: 502 })
  }

  if (cart.completed_at) {
    return NextResponse.json(
      { error: 'This order has already been placed', alreadyPlaced: true },
      { status: 409 }
    )
  }
  if (!cart.items || cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  if (!cart.email) {
    return NextResponse.json({ error: 'Add your email address first' }, { status: 400 })
  }
  // PayPal cannot take ZAR as a transaction currency, and there is no
  // conversion here: charging a ZAR total as some other currency would bill
  // the wrong amount. Refuse instead.
  if (!isPayPalCurrency(cart.currency_code)) {
    return NextResponse.json(
      {
        error: `PayPal cannot accept payments in ${(cart.currency_code ?? 'this currency').toUpperCase()}. Please pay with PayFast instead.`,
        unsupportedCurrency: true,
      },
      { status: 400 }
    )
  }
  const totalCents = Number(cart.total)
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    return NextResponse.json({ error: 'This cart has nothing to pay' }, { status: 400 })
  }

  const apiBase = isSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

  const amountValue = (totalCents / 100).toFixed(2)
  const currencyCode = String(cart.currency_code).toUpperCase()
  const itemName = parsed.itemName.slice(0, 127)

  // Embed cartId in the return URL so ConfirmationContent can trigger capture
  const returnUrl = `${siteUrl}/checkout/confirmation?gateway=paypal&cartId=${encodeURIComponent(cartId)}`
  const cancelUrl = `${siteUrl}/cart`

  try {
    const token = await getAccessToken(apiBase, clientId, clientSecret)

    const res = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // Keyed on the amount too: a cart whose total changed must get a new
        // order, not PayPal's replay of the old one at the old amount.
        'PayPal-Request-Id': `sr-${cartId}-${totalCents}-${currencyCode}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: cartId,
            description: itemName,
            amount: { currency_code: currencyCode, value: amountValue },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: returnUrl,
              cancel_url: cancelUrl,
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              brand_name: 'Dr. Suzanne Ravenall',
              shipping_preference: 'NO_SHIPPING',
            },
          },
        },
      }),
    })

    if (!res.ok) {
      const errBody = (await res.text()).slice(0, 400)
      logError('[PayPal] Create order failed', undefined, { status: res.status, body: errBody })
      return NextResponse.json({ error: 'PayPal order creation failed' }, { status: 502 })
    }

    const order = (await res.json()) as PayPalOrderResponse
    const approvalLink = order.links.find((l) => l.rel === 'payer-action')

    if (!approvalLink) {
      logError('[PayPal] No payer-action link in order response', undefined, { orderId: order.id })
      return NextResponse.json({ error: 'PayPal approval URL not returned' }, { status: 502 })
    }

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: approvalLink.href,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logError('[PayPal] Create order error', err, { message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
