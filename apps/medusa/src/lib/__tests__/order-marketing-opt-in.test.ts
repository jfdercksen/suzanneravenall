import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'
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

describe('src/subscribers holds subscribers only', () => {
  // Medusa loads every file in src/subscribers as a subscriber and logs
  // "is not a function. skipped." for a helper (seen on the box, 18 Nov).
  it('every non-test file there has a default export', () => {
    const dir = join(__dirname, '..', '..', 'subscribers')
    const files = readdirSync(dir).filter((f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      expect(readFileSync(join(dir, file), 'utf-8'), file).toMatch(/export default /)
    }
  })
})
