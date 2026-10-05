import { describe, it, expect } from 'vitest'
import { isSubscriptionLine, maxQuantity } from './cartRules'

describe('maxQuantity (site check C19)', () => {
  it('caps sessions, programmes, support packages and downloads at one', () => {
    expect(maxQuantity({ product_handle: 'rapid-repatterning-session', subtitle: '60 min online' })).toBe(1)
    expect(maxQuantity({ product_handle: 'resonance-repatterning-program-1-fundamentals-live-via-zoom' })).toBe(1)
    expect(maxQuantity({ product_handle: 'quantum-healing-codes-ebook-audio-download' })).toBe(1)
    expect(maxQuantity({ product_handle: null })).toBe(1)
  })

  it('lets a physical book be bought in more than one copy', () => {
    expect(maxQuantity({ product_handle: 'the-latest-book-by-suzanne' })).toBe(Infinity)
  })
})

describe('isSubscriptionLine', () => {
  it('is false for one-off sessions and once-paid monthly packages', () => {
    expect(isSubscriptionLine({ product_handle: 'rapid-repatterning-session', subtitle: '60 min online' })).toBe(false)
    expect(isSubscriptionLine({ product_handle: 'vip-package', subtitle: 'Per month' })).toBe(false)
  })

  it('is true for a membership or subscription product', () => {
    expect(isSubscriptionLine({ product_handle: 'gold-membership', subtitle: 'Monthly' })).toBe(true)
    expect(isSubscriptionLine({ product_handle: 'x', subtitle: 'Subscription' })).toBe(true)
  })
})
