import { describe, it, expect } from 'vitest'
import { visitorCountry, visitorWantsUsd } from './visitor-region'

const h = (entries: Record<string, string>) => new Headers(entries)
const on = { MEDUSA_USD_REGION_ENABLED: 'true' }

describe('visitor region', () => {
  it('no geo header means ZAR, even with USD switched on (review site, 6 Oct "$555" cards)', () => {
    expect(visitorCountry(h({}))).toBe('')
    expect(visitorWantsUsd(h({}), on)).toBe(false)
  })

  it('South Africa is ZAR', () => {
    expect(visitorWantsUsd(h({ 'CF-IPCountry': 'ZA' }), on)).toBe(false)
  })

  it('a known foreign country is USD only when USD is switched on', () => {
    expect(visitorWantsUsd(h({ 'CF-IPCountry': 'gb' }), on)).toBe(true)
    expect(visitorWantsUsd(h({ 'CF-IPCountry': 'GB' }), {})).toBe(false)
  })

  it('ignores Cloudflare unknown (XX) and Tor (T1) and falls through to the next header', () => {
    expect(visitorCountry(h({ 'CF-IPCountry': 'XX', 'X-Geo-Country': 'US' }))).toBe('US')
    expect(visitorWantsUsd(h({ 'CF-IPCountry': 'T1' }), on)).toBe(false)
  })
})
