import { describe, it, expect, vi } from 'vitest'



import { orderMarketingOptIn } from '../order-marketing-opt-in'

describe('orderMarketingOptIn (POPIA, KI122)', () => {
  it('is true only for the checkout opt-in with a known channel', () => {
    expect(orderMarketingOptIn({ marketing_opt_in: 'true', marketing_channels: 'email,sms' })).toBe(true)
    expect(orderMarketingOptIn({ marketing_opt_in: 'true', marketing_channels: 'whatsapp' })).toBe(true)
  })

  it('is false for an unticked box, no choice, a ticked box without a channel and odd values', () => {
    expect(orderMarketingOptIn({ marketing_opt_in: 'false', marketing_channels: '' })).toBe(false)
    expect(orderMarketingOptIn({})).toBe(false)
    expect(orderMarketingOptIn(null)).toBe(false)
    expect(orderMarketingOptIn(undefined)).toBe(false)
    expect(orderMarketingOptIn({ marketing_opt_in: 'true' })).toBe(false)
    expect(orderMarketingOptIn({ marketing_opt_in: 'true', marketing_channels: 'fax' })).toBe(false)
    expect(orderMarketingOptIn({ marketing_opt_in: true, marketing_channels: 'email' })).toBe(false)
  })
})
