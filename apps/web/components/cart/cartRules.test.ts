import { describe, it, expect } from 'vitest'
import { isSubscriptionLine, lifetimeOverCapNote, maxQuantity, SUPPORT_PACKAGE_MAX, supportPackageUnit } from './cartRules'

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

describe('Bonus Lifetime Access cap (Johan, 18 Nov)', () => {
  const lifetime = { product_handle: 'bonus-lifetime-access-self-study-online', subtitle: 'Per programme level' }

  it('allows as many as the cart has qualifying programmes, and one without the count', () => {
    expect(maxQuantity(lifetime)).toBe(1)
    expect(maxQuantity(lifetime, { lifetimeAccessCap: 3 })).toBe(3)
    expect(maxQuantity(lifetime, { lifetimeAccessCap: 0 })).toBe(1)
  })

  it('leaves every other product on its own rule', () => {
    expect(maxQuantity({ product_handle: 'rapid-repatterning-session' }, { lifetimeAccessCap: 3 })).toBe(1)
    expect(maxQuantity({ product_handle: 'email-support' }, { lifetimeAccessCap: 3 })).toBe(SUPPORT_PACKAGE_MAX)
    expect(maxQuantity({ product_handle: 'the-latest-book-by-suzanne' }, { lifetimeAccessCap: 3 })).toBe(Infinity)
  })

  it('explains a quantity above the cap without changing it', () => {
    expect(lifetimeOverCapNote({ ...lifetime, quantity: 2 }, 1)).toMatch(/one programme level it covers, so you may want to lower this to 1/)
    expect(lifetimeOverCapNote({ ...lifetime, quantity: 3 }, 2)).toMatch(/2 programme levels it covers/)
    expect(lifetimeOverCapNote({ ...lifetime, quantity: 2 }, 2)).toBeNull()
    expect(lifetimeOverCapNote({ product_handle: 'email-support', quantity: 5 }, 1)).toBeNull()
  })
})
