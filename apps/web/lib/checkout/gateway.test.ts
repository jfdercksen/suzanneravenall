import { describe, it, expect } from 'vitest'
import { paymentGatewayFor } from './gateway'

describe('paymentGatewayFor (D021)', () => {
  it.each([
    ['zar', 'payfast'],
    ['ZAR', 'payfast'],
    ['usd', 'paypal'],
    ['USD', 'paypal'],
    [null, 'payfast'],
    [undefined, 'payfast'],
  ])('%s cart pays with %s', (currency, gateway) => {
    expect(paymentGatewayFor(currency)).toBe(gateway)
  })
})
