import { describe, it, expect } from 'vitest'
import { isSubscriptionLine, maxQuantity, SUPPORT_PACKAGE_MAX, supportPackageUnit } from './cartRules'

describe('maxQuantity (site check C19)', () => {
  it('caps sessions, programmes and downloads at one', () => {
    expect(maxQuantity({ product_handle: 'rapid-repatterning-session', subtitle: '60 min online' })).toBe(1)
    expect(maxQuantity({ product_handle: 'resonance-repatterning-program-1-fundamentals-live-via-zoom' })).toBe(1)
    expect(maxQuantity({ product_handle: 'quantum-healing-codes-ebook-audio-download' })).toBe(1)
    expect(maxQuantity({ product_handle: null })).toBe(1)
  })

  it('lets a physical book be bought in more than one copy', () => {
    expect(maxQuantity({ product_handle: 'the-latest-book-by-suzanne' })).toBe(Infinity)
  })

  it('lets a support package be bought for several months or sessions (KI068)', () => {
    expect(maxQuantity({ product_handle: 'email-support', subtitle: 'Per month' })).toBe(SUPPORT_PACKAGE_MAX)
    expect(maxQuantity({ product_handle: 'vip-package', subtitle: 'Per month' })).toBe(SUPPORT_PACKAGE_MAX)
    expect(maxQuantity({ product_handle: 'coaching-support-package', subtitle: 'Per session' })).toBe(SUPPORT_PACKAGE_MAX)
  })
})

describe('supportPackageUnit', () => {
  it('names the unit the buyer chooses a number of', () => {
    expect(supportPackageUnit('email-support')).toBe('month')
    expect(supportPackageUnit('coaching-support-package')).toBe('session')
    expect(supportPackageUnit('rapid-repatterning-session')).toBeNull()
    expect(supportPackageUnit(null)).toBeNull()
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
