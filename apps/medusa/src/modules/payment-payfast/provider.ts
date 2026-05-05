import { createHash } from 'crypto'
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
import type { PayFastOptions, PayFastSessionData, PayFastITN } from './types'

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
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input

    if (currency_code.toLowerCase() !== 'zar') {
      throw new Error('PayFast only supports ZAR payments')
    }

    // context is typed as PaymentProviderContext which may not have cart_id/item_name
    // at the type level, but they are passed at runtime — use index access
    const ctx = context as Record<string, unknown> | undefined
    const cartId = (ctx?.['cart_id'] as string | undefined) ?? ''
    if (!cartId) {
      throw new Error('cart_id is required in payment context')
    }

    const amountFormatted = (Number(amount) / 100).toFixed(2)
    const itemName =
      ((ctx?.['item_name'] as string | undefined) ?? 'Dr. Suzanne Ravenall Programme').slice(
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
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Re-initiate with updated data
    return this.initiatePayment(input)
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const sessionData = input.data as unknown as PayFastSessionData

    // Authorized when ITN has confirmed the payment (status set by getWebhookActionAndData)
    if (sessionData?.status === 'authorized') {
      return {
        status: 'authorized',
        data: { ...input.data },
      }
    }

    return {
      status: 'pending',
      data: { ...input.data },
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // PayFast captures immediately on COMPLETE ITN — nothing to do server-side
    return {
      data: {
        ...(input.data ?? {}),
        status: 'captured',
      },
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    // PayFast refunds are initiated via the PayFast merchant portal
    // Automatic refund API is available on PayFast Pro accounts only
    return {
      data: {
        ...(input.data ?? {}),
        refund_note: 'PayFast refunds must be initiated via the PayFast merchant portal',
      },
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    return {
      data: {
        ...(input.data ?? {}),
        status: 'canceled',
      },
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return { data: { ...(input.data ?? {}), deleted: true } }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const session = input.data as unknown as PayFastSessionData
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

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload['payload']
  ): Promise<WebhookActionResult> {
    try {
      const itn = data.data as PayFastITN

      if (!verifyITNSignature(itn as unknown as Record<string, string>, this.options_.passphrase)) {
        console.error('[PayFast] ITN signature verification failed', { m_payment_id: itn.m_payment_id })
        return {
          action: 'failed',
          data: { session_id: itn.m_payment_id, amount: 0 },
        }
      }

      if (itn.payment_status === 'COMPLETE') {
        console.info('[PayFast] ITN COMPLETE', {
          cartId: itn.m_payment_id,
          pfPaymentId: itn.pf_payment_id,
          amountGross: itn.amount_gross,
        })

        return {
          action: 'authorized',
          data: {
            session_id: itn.m_payment_id,
            amount: Math.round(parseFloat(itn.amount_gross) * 100),
          },
        }
      }

      return {
        action: 'failed',
        data: { session_id: itn.m_payment_id, amount: 0 },
      }
    } catch (err) {
      console.error('[PayFast] getWebhookActionAndData error', err)
      return { action: 'failed', data: { session_id: '', amount: 0 } }
    }
  }
}

export default PayFastPaymentProvider
