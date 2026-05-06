export interface PayPalOptions {
  clientId: string
  clientSecret: string
  sandboxMode: boolean
  siteUrl: string
  webhookId: string
}

export interface PayPalSessionData {
  cartId: string
  orderId: string
  approvalUrl: string
  currencyCode: string
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'canceled'
}

export interface PayPalWebhookEvent {
  event_type: string
  resource: {
    id: string
    status: string
    purchase_units?: Array<{
      reference_id?: string
      custom_id?: string
      payments?: {
        captures?: Array<{
          id: string
          status: string
          amount: { value: string; currency_code: string }
        }>
      }
    }>
  }
}
