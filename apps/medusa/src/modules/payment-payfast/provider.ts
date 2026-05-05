import { createHash } from 'crypto'
import { AbstractPaymentProvider } from '@medusajs/framework/utils'
import type {
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  ProviderWebhookPayload,
  WebhookActionResult,
} from '@medusajs/framework/types'
import type { PayFastOptions, PayFastSessionData, PayFastITN } from './types'

// PayFast payment actions (Medusa v2 enum values)
const PaymentActions = {
  AUTHORIZED: 'authorized',
  FAILED: 'failed',
  NOT_SUPPORTED: 'not_supported',
} as const

// Payment session statuses (Medusa v2 enum values)
const PaymentSessionStatus = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  CANCELED: 'canceled',
  REQUIRES_MORE: 'requires_more',
  ERROR: 'error',
} as const

// MD5 of alpha-sorted URL-encoded key=value pairs, with passphrase appended
function buildSignature(params: Record<string, string>, passphrase: string): string {
  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&')

  const withPassphrase = passphrase
    ? `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    : queryString

  return createHash('md5').update(withPassphrase).digest('hex')
}

function verifyITNSignature(itn: Record<string, string>, passphrase: string): boolean {
  const { signature, ...params } = itn
  const expected = buildSignature(params, passphrase)
  return signature === expected
}

class PayFastPaymentProvider extends AbstractPaymentProvider<PayFastOptions> {
  static identifier = 'payfast'

  constructor(container: Record<string, unknown>, options: PayFastOptions) {
    super(container, options)
    this.options_ = options
  }

  protected options_: PayFastOptions

  async initiatePayment(
    data: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code, context } = data

    if (currency_code.toLowerCase() !== 'zar') {
      return {
        error: 'PayFast only supports ZAR payments',
        code: 'unsupported_currency',
      }
    }

    const cartId = (context?.cart_id as string | undefined) ?? ''
    if (!cartId) {
      return { error: 'cart_id is required in payment context', code: 'missing_cart_id' }
    }

    const amountFormatted = (amount / 100).toFixed(2)
    const itemName =
      ((context?.item_name as string | undefined) ?? 'Dr. Suzanne Ravenall Programme').slice(
        0,
        255
      )

    const params: Record<string, string> = {
      merchant_id: this.options_.merchantId,
      merchant_key: this.options_.merchantKey,
      return_url: `${this.options_.siteUrl}/checkout/confirmation`,
      cancel_url: `${this.options_.siteUrl}/cart`,
      notify_url: `${this.options_.siteUrl}/api/webhooks/payfast`,
      m_payment_id: cartId,
      amount: amountFormatted,
      item_name: itemName,
    }

    const signature = buildSignature(params, this.options_.passphrase)

    const sessionData: PayFastSessionData = {
      cartId,
      params: { ...params, signature },
      endpoint: this.options_.sandboxMode
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process',
      status: 'pending',
    }

    return {
      id: `payfast_${cartId}`,
      data: sessionData as unknown as Record<string, unknown>,
    }
  }

  async updatePayment(
    data: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    // Re-initiate with updated amount
    return this.initiatePayment(data)
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    _context: Record<string, unknown>
  ): Promise<
    PaymentProviderError | { status: string; data: Record<string, unknown> }
  > {
    const sessionData = paymentSessionData as PayFastSessionData

    // Authorized when ITN has confirmed the payment (status set by getWebhookActionAndData)
    if (sessionData.status === 'authorized') {
      return {
        status: PaymentSessionStatus.AUTHORIZED,
        data: { ...paymentSessionData },
      }
    }

    return {
      status: PaymentSessionStatus.PENDING,
      data: { ...paymentSessionData },
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    // PayFast captures immediately on COMPLETE ITN — nothing to do server-side
    return {
      ...paymentSessionData,
      status: 'captured',
    }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    _refundAmount: number
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    // PayFast refunds are initiated via the PayFast merchant portal
    // Automatic refund API is available on PayFast Pro accounts only
    return {
      error: 'PayFast refunds must be initiated via the PayFast merchant portal',
      code: 'manual_refund_required',
    }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return {
      ...paymentSessionData,
      status: 'canceled',
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return { ...paymentSessionData, deleted: true }
  }

  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<string> {
    const session = paymentSessionData as PayFastSessionData
    switch (session.status) {
      case 'authorized':
        return PaymentSessionStatus.AUTHORIZED
      case 'captured':
        return PaymentSessionStatus.CAPTURED
      case 'failed':
        return PaymentSessionStatus.ERROR
      case 'canceled':
        return PaymentSessionStatus.CANCELED
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return paymentSessionData
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload['payload']
  ): Promise<WebhookActionResult> {
    try {
      const itn = data.data as PayFastITN

      if (!verifyITNSignature(itn as unknown as Record<string, string>, this.options_.passphrase)) {
        console.error('[PayFast] ITN signature verification failed', { m_payment_id: itn.m_payment_id })
        return {
          action: PaymentActions.FAILED as string,
          data: { session_id: itn.m_payment_id },
        } as unknown as WebhookActionResult
      }

      if (itn.payment_status === 'COMPLETE') {
        console.info('[PayFast] ITN COMPLETE', {
          cartId: itn.m_payment_id,
          pfPaymentId: itn.pf_payment_id,
          amountGross: itn.amount_gross,
        })

        return {
          action: PaymentActions.AUTHORIZED as string,
          data: {
            session_id: itn.m_payment_id,
            amount: Math.round(parseFloat(itn.amount_gross) * 100),
          },
        } as unknown as WebhookActionResult
      }

      return {
        action: PaymentActions.FAILED as string,
        data: { session_id: itn.m_payment_id },
      } as unknown as WebhookActionResult
    } catch (err) {
      console.error('[PayFast] getWebhookActionAndData error', err)
      return { action: PaymentActions.FAILED as string } as unknown as WebhookActionResult
    }
  }
}

export default PayFastPaymentProvider
