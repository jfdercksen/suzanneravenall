/*
 * PayPal Webhook Handler
 *
 * Events handled:
 *   PAYMENT.CAPTURE.COMPLETED  → complete Medusa cart to create order
 *   PAYMENT.CAPTURE.DENIED     → log the failure (TODO Phase 5: Sentry)
 *
 * Sandbox test steps (run once PayPal sandbox credentials are set):
 *   1. Create a PayPal sandbox buyer account at developer.paypal.com
 *   2. Set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID in infra/.env
 *   3. Set NODE_ENV=development or PAYPAL_SANDBOX=true to hit sandbox APIs
 *   4. Go to /checkout, select "Outside South Africa", fill in details, click Pay with PayPal
 *   5. Complete payment on PayPal sandbox with the buyer account
 *   6. Verify PayPal redirects to /checkout/confirmation?gateway=paypal&cartId=...&token=...
 *   7. Confirm page calls /api/checkout/paypal/capture and shows medusaOrderId
 *   8. Check VPS logs: docker logs infra-web-1 --tail 50 | grep PayPal
 *   9. Verify webhook fires: [PayPal Webhook] PAYMENT.CAPTURE.COMPLETED in logs
 */

import { NextRequest, NextResponse } from 'next/server'

interface PayPalWebhookHeaders {
  transmissionId: string
  transmissionTime: string
  certUrl: string
  transmissionSig: string
  authAlgo: string
}

// PayPal cert URLs must originate from PayPal's own infrastructure
function isTrustedCertUrl(certUrl: string, isSandbox: boolean): boolean {
  const trustedPrefixes = isSandbox
    ? ['https://api-m.sandbox.paypal.com/', 'https://api.sandbox.paypal.com/']
    : ['https://api-m.paypal.com/', 'https://api.paypal.com/']
  return trustedPrefixes.some((prefix) => certUrl.startsWith(prefix))
}

// Returns 'verified' | 'forged' | 'transient_error'
async function verifyWebhookSignature(
  headers: PayPalWebhookHeaders,
  rawBody: string,
  isSandbox: boolean
): Promise<'verified' | 'forged' | 'transient_error'> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID ?? ''

  if (!webhookId) {
    // PAYPAL_SANDBOX=true bypass only for local dev where no real Medusa data exists.
    // Staging and production must always have PAYPAL_WEBHOOK_ID set.
    const localDevBypass = process.env.PAYPAL_SANDBOX === 'true' && process.env.NODE_ENV === 'development'
    if (localDevBypass) {
      console.warn('[PayPal Webhook] PAYPAL_WEBHOOK_ID not set — bypassing (local dev only)')
      return 'verified'
    }
    console.error('[PayPal Webhook] PAYPAL_WEBHOOK_ID not set — rejecting webhook')
    return 'forged'
  }

  // Validate cert_url before forwarding — prevent SSRF via untrusted certificate origin
  if (!isTrustedCertUrl(headers.certUrl, isSandbox)) {
    console.error('[PayPal Webhook] cert_url origin not trusted', { certUrl: headers.certUrl })
    return 'forged'
  }

  const clientId = process.env.PAYPAL_CLIENT_ID ?? ''
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? ''

  if (!clientId || !clientSecret) {
    console.error('[PayPal Webhook] Missing credentials for signature verification')
    return 'transient_error'
  }

  try {
    const apiBase = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenRes.ok) {
      console.error('[PayPal Webhook] OAuth token fetch failed', { status: tokenRes.status })
      return 'transient_error'
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string }

    const verifyRes = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: headers.transmissionId,
        transmission_time: headers.transmissionTime,
        cert_url: headers.certUrl,
        auth_algo: headers.authAlgo,
        transmission_sig: headers.transmissionSig,
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody) as unknown,
      }),
    })

    if (!verifyRes.ok) {
      console.error('[PayPal Webhook] Verify endpoint returned non-OK', { status: verifyRes.status })
      return 'transient_error'
    }

    const result = (await verifyRes.json()) as { verification_status: string }
    return result.verification_status === 'SUCCESS' ? 'verified' : 'forged'
  } catch (err) {
    console.error('[PayPal Webhook] Signature verification error', err)
    return 'transient_error'
  }
}

async function completeCart(cartId: string): Promise<boolean> {
  const medusaBase = process.env.MEDUSA_BACKEND_URL ?? 'http://medusa:9000'
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

  try {
    const res = await fetch(`${medusaBase}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': pubKey,
      },
    })

    if (res.ok) {
      const data = (await res.json()) as { type?: string; order?: { id: string } }
      if (data.type === 'order') {
        console.info('[PayPal Webhook] Cart completed → order created', {
          cartId,
          orderId: data.order?.id,
        })
        return true
      }
    }

    const errorText = await res.text().catch(() => '')
    console.warn('[PayPal Webhook] Cart complete returned non-OK', {
      cartId,
      status: res.status,
      body: errorText.slice(0, 200),
    })
    return false
  } catch (err) {
    console.error('[PayPal Webhook] completeCart network error', { cartId, err })
    return false
  }
}

export async function POST(req: NextRequest) {
  const isSandbox = process.env.NODE_ENV !== 'production'
  const rawBody = await req.text()

  const webhookHeaders: PayPalWebhookHeaders = {
    transmissionId: req.headers.get('paypal-transmission-id') ?? '',
    transmissionTime: req.headers.get('paypal-transmission-time') ?? '',
    certUrl: req.headers.get('paypal-cert-url') ?? '',
    transmissionSig: req.headers.get('paypal-transmission-sig') ?? '',
    authAlgo: req.headers.get('paypal-auth-algo') ?? '',
  }

  const verifyResult = await verifyWebhookSignature(webhookHeaders, rawBody, isSandbox)

  if (verifyResult === 'transient_error') {
    // Return 500 so PayPal retries the event — do not silently drop legitimate events
    console.error('[PayPal Webhook] Transient verification error — returning 500 for retry', {
      transmissionId: webhookHeaders.transmissionId,
    })
    return new NextResponse('Verification error', { status: 500 })
  }

  if (verifyResult === 'forged') {
    // Return 200 so PayPal does not retry a confirmed forgery
    console.error('[PayPal Webhook] Signature verification failed — confirmed forgery', {
      transmissionId: webhookHeaders.transmissionId,
    })
    return new NextResponse('OK', { status: 200 })
  }

  let event: {
    event_type?: string
    resource?: {
      id?: string
      custom_id?: string
      purchase_units?: Array<{ custom_id?: string; payments?: { captures?: Array<{ id: string; amount?: { value: string } }> } }>
    }
  }

  try {
    event = JSON.parse(rawBody) as typeof event
  } catch {
    console.error('[PayPal Webhook] Failed to parse body')
    return new NextResponse('OK', { status: 200 })
  }

  const eventType = event.event_type ?? ''

  if (isSandbox) {
    console.info('[PayPal Webhook] Received (sandbox)', {
      eventType,
      resourceId: event.resource?.id,
    })
  }

  if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    const cartId =
      event.resource?.purchase_units?.[0]?.custom_id ??
      event.resource?.custom_id ??
      ''

    const captureId = event.resource?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? ''
    const amount = event.resource?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? '0'

    console.info('[PayPal Webhook] PAYMENT.CAPTURE.COMPLETED', { cartId, captureId, amount })

    if (cartId) {
      await completeCart(cartId)
    } else {
      console.warn('[PayPal Webhook] PAYMENT.CAPTURE.COMPLETED — no cartId found in custom_id')
    }
  } else if (eventType === 'PAYMENT.CAPTURE.DENIED') {
    const cartId = event.resource?.purchase_units?.[0]?.custom_id ?? event.resource?.id ?? ''
    console.warn('[PayPal Webhook] PAYMENT.CAPTURE.DENIED', { cartId, resourceId: event.resource?.id })
    // TODO (Phase 5): log to Sentry when KI001 is resolved
  }

  return new NextResponse('OK', { status: 200 })
}
