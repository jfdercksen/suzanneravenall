// Which gateway takes a cart (D021). It follows the cart currency, never the
// billing country: PayFast settles only in rand, and PayPal cannot take rand.
export type PaymentGateway = 'payfast' | 'paypal'

export function paymentGatewayFor(currencyCode: string | null | undefined): PaymentGateway {
  return (currencyCode ?? 'zar').toLowerCase() === 'zar' ? 'payfast' : 'paypal'
}
