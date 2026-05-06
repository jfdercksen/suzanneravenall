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

    if (sessionData?.status === 'authorized' || sessionData?.status === 'captured') {
      return { status: 'authorized', data: { ...input.data } }
    }

    return { status: 'pending', data: { ...input.data } }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const sessionData = input.data as unknown as PayPalSessionData

    if (!sessionData?.orderId) {
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

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const sessionData = input.data as unknown as PayPalSessionData

    if (!sessionData?.orderId) {
      return { data: { ...(input.data ?? {}) } }
    }

    try {
      const token = await this.getAccessToken()

      // Retrieve the capture ID from the order
      const orderRes = await fetch(
        `${this.apiBase}/v2/checkout/orders/${sessionData.orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!orderRes.ok) {
        console.error('[PayPal] refundPayment — could not retrieve order', {
          orderId: sessionData.orderId,
        })
        return { data: { ...(input.data ?? {}) } }
      }

      const order = (await orderRes.json()) as {
        purchase_units?: Array<{
          payments?: { captures?: Array<{ id: string }> }
        }>
      }

      const captureId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id

      if (!captureId) {
        console.warn('[PayPal] refundPayment — no capture ID found', { orderId: sessionData.orderId })
        return { data: { ...(input.data ?? {}) } }
      }

      const amountValue = input.amount ? (Number(input.amount) / 100).toFixed(2) : undefined

      const currencyCode = sessionData.currencyCode ?? 'ZAR'
      const refundBody = amountValue
        ? { amount: { value: amountValue, currency_code: currencyCode } }
        : {}

      const refundRes = await fetch(
        `${this.apiBase}/v2/payments/captures/${captureId}/refund`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(refundBody),
        }
      )

      if (!refundRes.ok) {
        const errBody = (await refundRes.text()).slice(0, 300)
        console.error('[PayPal] refundPayment failed', { captureId, status: refundRes.status, body: errBody })
      }

      const refundData = (await refundRes.json().catch(() => ({}))) as { id?: string }

      return {
        data: {
          ...(input.data ?? {}),
          refund_id: refundData.id,
        },
      }
    } catch (err) {
      console.error('[PayPal] refundPayment error', err)
      return { data: { ...(input.data ?? {}) } }
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
      const event = data.data as PayPalWebhookEvent

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
