import { createHmac, timingSafeEqual } from 'crypto'
import { AbstractPaymentProvider } from '@medusajs/framework/utils'
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from '@medusajs/framework/types'
import type { PayPalOptions, PayPalSessionData, PayPalWebhookEvent } from './types'

// The web app's capture route and PayPal webhook (apps/web/lib/paypal.ts,
// openCapturedSession) capture the PayPal order first, check the amount
// against the cart, then open this session with data { cart_id,
// paypal_order_id, capture_id, amount_cents, currency_code, capture_proof }.
// capture_proof is an HMAC of those values keyed with the PayPal client
// secret, which only our servers hold, so a session is marked captured only
// for a payment we verified, at the amount and in the currency the cart costs
// (D021; same pattern as the PayFast ITN proof, KI086).
function amountOf(amount: unknown): number {
  return amount && typeof amount === 'object' && 'numeric' in (amount as Record<string, unknown>)
    ? Number((amount as { numeric: unknown }).numeric)
    : Number(amount)
}

export function captureProofValid(
  data: Record<string, unknown> | undefined,
  amount: unknown,
  currencyCode: string,
  secret: string
): boolean {
  if (!data || !secret) return false
  const str = (key: string) => (typeof data[key] === 'string' ? (data[key] as string) : '')
  const cartId = str('cart_id')
  const orderId = str('paypal_order_id')
  const captureId = str('capture_id')
  const currency = str('currency_code').toUpperCase()
  const proof = str('capture_proof')
  const amountCents = Number(data['amount_cents'])
  if (!cartId || !captureId || !currency || !proof || !Number.isFinite(amountCents)) return false
  if (currency !== currencyCode.toUpperCase()) return false
  const amountNum = amountOf(amount)
  if (!Number.isFinite(amountNum) || Math.round(amountNum) !== Math.round(amountCents)) return false
  const expected = createHmac('sha256', secret)
    .update(`${cartId}:${orderId}:${captureId}:${amountCents}:${currency}`)
    .digest('hex')
  const a = Buffer.from(proof)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

class PayPalPaymentProvider extends AbstractPaymentProvider<PayPalOptions> {
  static identifier = 'paypal'

  constructor(container: Record<string, unknown>, options: PayPalOptions) {
    super(container, options)
    this.options_ = options
  }

  protected options_: PayPalOptions

  private get apiBase(): string {
    return this.options_.sandboxMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'
  }

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${this.options_.clientId}:${this.options_.clientSecret}`
    ).toString('base64')

    const res = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!res.ok) {
      throw new Error(`PayPal OAuth failed: ${res.status}`)
    }

    const data = (await res.json()) as { access_token: string }
    return data.access_token
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input
    const ctx = context as Record<string, unknown> | undefined
    const inputData = (input as { data?: Record<string, unknown> }).data

    // Already captured by the web app (see captureProofValid): record it, no
    // second PayPal order. The proof fields stay in the data so an
    // updatePayment re-check gives the same answer.
    if (captureProofValid(inputData, amount, currency_code, this.options_.clientSecret)) {
      const cartId = String(inputData?.['cart_id'])
      const sessionData: PayPalSessionData = {
        cartId,
        orderId: String(inputData?.['paypal_order_id'] ?? ''),
        captureId: String(inputData?.['capture_id']),
        approvalUrl: '',
        currencyCode: currency_code.toUpperCase(),
        status: 'captured',
      }
      return {
        id: `paypal_${cartId}`,
        data: { ...inputData, ...sessionData } as unknown as Record<string, unknown>,
      }
    }

    const cartId = (ctx?.['cart_id'] as string | undefined) ?? ''

    if (!cartId) {
      throw new Error('cart_id is required in payment context')
    }

    const itemName =
      ((ctx?.['item_name'] as string | undefined) ?? 'Dr. Suzanne Ravenall Programme').slice(
        0,
        127
      )

    const amountValue = (Number(amount) / 100).toFixed(2)
    const currencyCode = currency_code.toUpperCase()
    const returnUrl = `${this.options_.siteUrl}/checkout/confirmation?gateway=paypal&cartId=${cartId}`
    const cancelUrl = `${this.options_.siteUrl}/cart`

    try {
      const token = await this.getAccessToken()

      const res = await fetch(`${this.apiBase}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `medusa-${cartId}`,
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
              },
            },
          },
        }),
      })

      if (!res.ok) {
        const errBody = (await res.text()).slice(0, 300)
        throw new Error(`PayPal create order failed: ${res.status} ${errBody}`)
      }

      const order = (await res.json()) as {
        id: string
        links: Array<{ rel: string; href: string }>
      }

      const approvalLink = order.links.find((l) => l.rel === 'payer-action')
      if (!approvalLink) {
        throw new Error(`PayPal order ${order.id} returned no payer-action link`)
      }

      const sessionData: PayPalSessionData = {
        cartId,
        orderId: order.id,
        approvalUrl: approvalLink.href,
        currencyCode,
        status: 'pending',
      }

      return {
        id: `paypal_${cartId}`,
        data: sessionData as unknown as Record<string, unknown>,
      }
    } catch (err) {
      console.error('[PayPal] initiatePayment error', err)
      throw err
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return this.initiatePayment(input)
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const sessionData = input.data as unknown as PayPalSessionData

    // A session reads 'captured' only when initiatePayment saw a valid capture
    // proof, i.e. PayPal has already taken the money. Returning 'captured'
    // makes Medusa record the capture as part of authorisation, so the order
    // reads as paid instead of sitting at Authorized (the PayPal half of KI086).
    if (sessionData?.status === 'authorized' || sessionData?.status === 'captured') {
      return { status: 'captured', data: { ...input.data, status: 'captured' } }
    }

    return { status: 'pending', data: { ...input.data } }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const sessionData = input.data as unknown as PayPalSessionData

    // Captured before the session existed (the web capture route): nothing to
    // ask PayPal, and a second capture call would fail.
    if (!sessionData?.orderId || sessionData.status === 'captured') {
      return { data: { ...(input.data ?? {}), status: 'captured' } }
    }

    try {
      const token = await this.getAccessToken()

      const res = await fetch(
        `${this.apiBase}/v2/checkout/orders/${sessionData.orderId}/capture`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!res.ok) {
        const errBody = (await res.text()).slice(0, 300)
        throw new Error(`PayPal capture failed: ${res.status} ${errBody}`)
      }

      return {
        data: {
          ...(input.data ?? {}),
          status: 'captured',
        },
      }
    } catch (err) {
      console.error('[PayPal] capturePayment error', err)
      throw err
    }
  }

  // Throws whenever PayPal has not confirmed the refund: Medusa records a
  // refund only when this returns, and the old version returned on every
  // failure, so #419 (21 Oct) read "refunded" while PayPal still held the $20.
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const sessionData = input.data as unknown as PayPalSessionData

    if (!sessionData?.orderId && !sessionData?.captureId) {
      throw new Error('PayPal refund: the payment has no PayPal order or capture id')
    }

    const token = await this.getAccessToken()

    // Sessions opened by the web capture route carry the capture id; older
    // ones only the order, so look the capture up there.
    let captureId = sessionData.captureId
    if (!captureId) {
      const orderRes = await fetch(
        `${this.apiBase}/v2/checkout/orders/${sessionData.orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!orderRes.ok) {
        throw new Error(`PayPal refund: could not read order ${sessionData.orderId} (${orderRes.status})`)
      }
      const order = (await orderRes.json()) as {
        purchase_units?: Array<{ payments?: { captures?: Array<{ id: string }> } }>
      }
      captureId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id
      if (!captureId) {
        throw new Error(`PayPal refund: order ${sessionData.orderId} has no capture`)
      }
    }

    // Medusa passes a BigNumber ({ numeric }), not a number: Number() on it
    // gave NaN and PayPal refused "value":"NaN".
    const cents = input.amount === undefined || input.amount === null ? NaN : amountOf(input.amount)
    const refundBody = Number.isFinite(cents) && cents > 0
      ? { amount: { value: (cents / 100).toFixed(2), currency_code: (sessionData.currencyCode ?? 'USD').toUpperCase() } }
      : {}

    const refundRes = await fetch(`${this.apiBase}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // One refund per capture and amount, even if Medusa retries.
        'PayPal-Request-Id': `sr-refund-${captureId}-${Number.isFinite(cents) ? cents : 'full'}`,
      },
      body: JSON.stringify(refundBody),
    })

    if (!refundRes.ok) {
      const errBody = (await refundRes.text()).slice(0, 300)
      console.error('[PayPal] refundPayment failed', { captureId, status: refundRes.status, body: errBody })
      throw new Error(`PayPal refund failed (${refundRes.status})`)
    }

    const refundData = (await refundRes.json().catch(() => ({}))) as { id?: string; status?: string }
    return {
      data: {
        ...(input.data ?? {}),
        refund_id: refundData.id,
        refund_status: refundData.status,
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: { ...(input.data ?? {}), status: 'canceled' } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: { ...(input.data ?? {}), deleted: true } }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const session = input.data as unknown as PayPalSessionData
    switch (session?.status) {
      case 'authorized':
        return { status: 'authorized' }
      case 'captured':
        return { status: 'captured' }
      case 'failed':
        return { status: 'error' }
      case 'canceled':
        return { status: 'canceled' }
      default:
        return { status: 'pending' }
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload['payload']
  ): Promise<WebhookActionResult> {
    try {
      const event = data.data as unknown as PayPalWebhookEvent

      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const capture = event.resource.purchase_units?.[0]?.payments?.captures?.[0]
        const cartId = event.resource.purchase_units?.[0]?.custom_id ?? ''
        const amountValue = capture?.amount?.value ?? '0'

        console.info('[PayPal] Webhook PAYMENT.CAPTURE.COMPLETED', {
          cartId,
          captureId: capture?.id,
          amount: amountValue,
        })

        return {
          action: 'authorized',
          data: {
            session_id: `paypal_${cartId}`,
            amount: Math.round(parseFloat(amountValue) * 100),
          },
        }
      }

      if (event.event_type === 'PAYMENT.CAPTURE.DENIED') {
        console.warn('[PayPal] Webhook PAYMENT.CAPTURE.DENIED', { resource: event.resource.id })
        return {
          action: 'failed',
          data: { session_id: event.resource.id, amount: 0 },
        }
      }

      return { action: 'not_supported', data: { session_id: '', amount: 0 } }
    } catch (err) {
      console.error('[PayPal] getWebhookActionAndData error', err)
      return { action: 'failed', data: { session_id: '', amount: 0 } }
    }
  }
}

export default PayPalPaymentProvider
