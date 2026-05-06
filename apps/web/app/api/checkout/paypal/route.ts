import { NextRequest, NextResponse } from 'next/server'

interface PayPalCheckoutRequest {
  amountInCents: number
  currencyCode: string
  itemName: string
  cartId: string
}

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
  let body: PayPalCheckoutRequest
  try {
    body = (await req.json()) as PayPalCheckoutRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Input validation
  if (
    typeof body.amountInCents !== 'number' ||
    !Number.isInteger(body.amountInCents) ||
    body.amountInCents <= 0 ||
    body.amountInCents > 10_000_000
  ) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }
  if (typeof body.cartId !== 'string' || body.cartId.length < 1 || body.cartId.length > 100) {
    return NextResponse.json({ error: 'Invalid cartId' }, { status: 400 })
  }
  if (typeof body.itemName !== 'string' || body.itemName.length < 1) {
    return NextResponse.json({ error: 'Invalid itemName' }, { status: 400 })
  }
  if (body.currencyCode !== undefined && (typeof body.currencyCode !== 'string' || body.currencyCode.length !== 3)) {
    return NextResponse.json({ error: 'Invalid currencyCode' }, { status: 400 })
  }

  const clientId = process.env.PAYPAL_CLIENT_ID ?? ''
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'
  const isSandbox = process.env.NODE_ENV !== 'production'

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Payment configuration missing' }, { status: 500 })
  }

  const apiBase = isSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

  const amountValue = (body.amountInCents / 100).toFixed(2)
  const currencyCode = (body.currencyCode ?? 'ZAR').toUpperCase()
  const itemName = body.itemName.slice(0, 127)
  const { cartId } = body

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
        'PayPal-Request-Id': `sr-${cartId}`,
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
      console.error('[PayPal] Create order failed', { status: res.status, body: errBody })
      return NextResponse.json({ error: 'PayPal order creation failed' }, { status: 502 })
    }

    const order = (await res.json()) as PayPalOrderResponse
    const approvalLink = order.links.find((l) => l.rel === 'payer-action')

    if (!approvalLink) {
      console.error('[PayPal] No payer-action link in order response', { orderId: order.id })
      return NextResponse.json({ error: 'PayPal approval URL not returned' }, { status: 502 })
    }

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: approvalLink.href,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[PayPal] Create order error', { message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
