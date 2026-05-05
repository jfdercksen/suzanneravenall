export interface PayFastOptions {
  merchantId: string
  merchantKey: string
  passphrase: string
  sandboxMode: boolean
  siteUrl: string
}

// Data stored on the Medusa payment session
export interface PayFastSessionData {
  cartId: string
  params: Record<string, string>
  endpoint: string
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'canceled'
}

// PayFast ITN payload fields
export interface PayFastITN {
  m_payment_id: string
  pf_payment_id: string
  payment_status: 'COMPLETE' | 'FAILED' | 'PENDING'
  item_name: string
  amount_gross: string
  amount_fee: string
  amount_net: string
  signature: string
  [key: string]: string
}
