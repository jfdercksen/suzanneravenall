import { describe, it, expect } from 'vitest'

import { formatPrice } from './cart-context'

describe('formatPrice', () => {
  it('formats ZAR', () => {
    expect(formatPrice(16500, 'zar').replace(/\u00a0/g, ' ')).toBe('R165,00')
  })

  it('formats USD', () => {
    expect(formatPrice(16500, 'usd')).toBe('$165.00')
  })

  // Medusa omits per-line subtotal/total unless asked for by name. Before the
  // guard this rendered the literal string "RNaN" beside every cart line.
  it.each([undefined, null, NaN])('renders zero rather than NaN for %s', (bad) => {
    expect(formatPrice(bad as unknown as number, 'zar')).not.toContain('NaN')
  })
})
