import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/log'
import { compareCapture, loadCart, medusaBase, medusaHeaders, openCapturedSession } from '@/lib/paypal'

interface CaptureRequest {
  orderId: string
  cartId: string
}

// PayPal order IDs are 17-char alphanumeric uppercase strings
const PAYPAL_ORDER_ID_RE = /^[A-Z0-9]{10,25}$/

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

async function completeMedusaCart(cartId: string): Promise<{ type?: string; order?: { id: string } }> {
  const res = await fetch(`${medusaBase()}/store/carts/${encodeURIComponent(cartId)}/complete`, {
    method: 'POST',
    headers: medusaHeaders(),
  })

  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 200)
    console.warn('[PayPal capture] Medusa cart complete returned non-OK', {
      cartId,
      status: res.status,
      body,
    })
    return {}
  }

  return (await res.json()) as { type?: string; order?: { id: string } }
}

export async function POST(req: NextRequest) {
  let body: CaptureRequest
  try {
    body = (await req.json()) as CaptureRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { orderId, cartId } = body

  // Validate inputs — orderId format guards against path traversal in PayPal URL
  if (!orderId || typeof orderId !== 'string' || !PAYPAL_ORDER_ID_RE.test(orderId)) {
    return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 })
  }
  if (!cartId || typeof cartId !== 'string' || cartId.length > 100) {
    return NextResponse.json({ error: 'Invalid cartId' }, { status: 400 })
  }

  const clientId = process.env.PAYPAL_CLIENT_ID ?? ''
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? ''

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Payment configuration missing' }, { status: 500 })
  }

  const isSandbox = process.env.PAYPAL_SANDBOX === 'true'
  const apiBase = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'

  try {
    const token = await getAccessToken(apiBase, clientId, clientSecret)

    const captureRes = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `sr-capture-${orderId}`,
      },
    })

    if (!captureRes.ok) {
      const errBody = (await captureRes.text()).slice(0, 400)
      logError('[PayPal] Capture failed', undefined, { orderId, status: captureRes.status, body: errBody })
      return NextResponse.json({ error: 'PayPal capture failed' }, { status: 502 })
    }

    const captureData = (await captureRes.json()) as {
      id: string
      status: string
      purchase_units?: Array<{
        custom_id?: string
        payments?: {
          captures?: Array<{
            id: string
            status: string
            amount?: { value?: string; currency_code?: string }
          }>
        }
      }>
    }

    // Verify that the order's custom_id matches the cartId provided by the client.
    // This prevents a substitution attack where an attacker captures their own PayPal
    // order but supplies a different victim's cartId to complete a more valuable cart.
    const paypalCartId = captureData.purchase_units?.[0]?.custom_id ?? ''
    if (paypalCartId !== cartId) {
      logError('[PayPal] cartId mismatch — possible substitution attack', undefined, {
        paypalCartId,
        providedCartId: cartId,
        orderId,
      })
      return NextResponse.json({ error: 'Order mismatch' }, { status: 400 })
    }

    // Only complete when PayPal collected exactly what the cart costs, in the
    // cart currency. The order amount comes from the cart, but the cart can
    // change after the order was created, and this is the last point where an
    // underpayment can be stopped before an order exists.
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0]
    // PayPal can answer 201 with a capture that is PENDING (review hold,
    // eCheck) or DECLINED. Only a COMPLETED capture is money taken; a pending
    // one is placed by the PAYMENT.CAPTURE.COMPLETED webhook once it clears.
    if (captureData.status !== 'COMPLETED' || capture?.status !== 'COMPLETED') {
      console.warn('[PayPal] Capture not completed yet, not placing the order', {
        orderId,
        cartId,
        orderStatus: captureData.status,
        captureStatus: capture?.status ?? null,
      })
      return NextResponse.json(
        { error: 'Your payment is being reviewed by PayPal. Your order will be confirmed by email once it clears.', pending: true },
        { status: 202 }
      )
    }
    const cart = await loadCart(cartId)
    if (!cart) {
      logError('[PayPal] Cart could not be loaded after capture, not completing', undefined, {
        cartId,
        orderId,
        captureId: capture?.id,
        received: capture?.amount?.value ?? null,
        currency: capture?.amount?.currency_code ?? null,
      })
      return NextResponse.json({ error: 'Could not verify the payment against the cart' }, { status: 502 })
    }
    const check = compareCapture(cart, capture?.amount)
    if (!check.ok) {
      logError('[PayPal] Amount mismatch, not completing cart', undefined, {
        cartId,
        orderId,
        captureId: capture?.id,
        expected: check.expected,
        received: Number.isFinite(check.received) ? check.received : null,
        expectedCurrency: check.expectedCurrency,
        receivedCurrency: check.receivedCurrency,
      })
      return NextResponse.json({ error: 'Payment amount does not match the cart' }, { status: 409 })
    }

    console.info('[PayPal] Capture success', {
      orderId,
      cartId,
      captureStatus: captureData.status,
      captureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    })

    // A cart already completed (the webhook got there first) needs nothing more.
    if (cart.completed_at) {
      return NextResponse.json({ paypalOrderId: orderId, paypalStatus: captureData.status, medusaOrderId: null })
    }

    // Medusa completes a cart only with a paid payment session on it: open the
    // captured PayPal session first (proof keyed with the client secret, D021).
    const sessionOpened = await openCapturedSession(
      {
        cartId,
        orderId,
        captureId: capture?.id ?? '',
        amountCents: check.received,
        currencyCode: check.receivedCurrency ?? '',
      },
      clientSecret
    )
    if (!sessionOpened) {
      // The webhook may have placed the order in the meantime.
      if ((await loadCart(cartId))?.completed_at) {
        return NextResponse.json({ paypalOrderId: orderId, paypalStatus: captureData.status, medusaOrderId: null })
      }
      // PayPal has the money but there is no order yet. Logged loudly in
      // openCapturedSession; the PAYMENT.CAPTURE.COMPLETED webhook retries.
      return NextResponse.json({ error: 'Payment received, order not yet placed' }, { status: 502 })
    }

    // Complete the Medusa cart to create an order record.
    // The PayPal webhook (PAYMENT.CAPTURE.COMPLETED) also calls completeCart as a
    // server-side fallback. Medusa's cart complete is idempotent — the second call
    // returns the already-created order without duplicating side effects.
    const medusaResult = await completeMedusaCart(cartId)

    return NextResponse.json({
      paypalOrderId: orderId,
      paypalStatus: captureData.status,
      medusaOrderId: medusaResult.order?.id ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logError('[PayPal] Capture error', err, { message })
    return NextResponse.json({ error: 'PayPal capture failed' }, { status: 500 })
  }
}
