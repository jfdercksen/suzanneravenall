import { describe, it, expect } from 'vitest'
import {
  currencyFromAcceptLanguage,
  detectCurrency,
  regionIdFor,
  usdEnabled,
  visitorCountry,
  visitorCurrency,
} from './visitor-region'

const h = (entries: Record<string, string>) => new Headers(entries)
const env = {
  NEXT_PUBLIC_MEDUSA_REGION_ID: 'reg_zar',
  NEXT_PUBLIC_MEDUSA_REGION_USD_ID: 'reg_usd',
}

describe('Accept-Language detection table (D021)', () => {
  it.each([
    ['en-ZA,en;q=0.9', 'zar'],
    ['af-ZA', 'zar'],
    ['af', 'zar'],
    ['zu-ZA,en;q=0.8', 'zar'],
    ['xh', 'zar'],
    ['st', 'zar'],
    ['tn', 'zar'],
    ['ts', 'zar'],
    ['ss', 'zar'],
    ['ve', 'zar'],
    ['nr', 'zar'],
    ['nso-ZA', 'zar'],
    ['en_za', 'zar'],
    ['en-US,en;q=0.9', 'usd'],
    ['en-GB,en;q=0.9,en-ZA;q=0.5', 'zar'],
    ['en-GB', 'usd'],
    ['de-DE,de;q=0.9', 'usd'],
    ['fr', 'usd'],
    ['zh-Hans-CN', 'usd'],
    ['en', 'usd'],
    ['', 'zar'],
    ['*', 'zar'],
  ])('%s -> %s', (header, expected) => {
    expect(currencyFromAcceptLanguage(header)).toBe(expected)
  })

  it('no Accept-Language header at all is ZAR (crawlers, curl)', () => {
    expect(currencyFromAcceptLanguage(null)).toBe('zar')
    expect(detectCurrency(h({}))).toBe('zar')
  })
})

describe('Cloudflare geo header (trusted only behind Cloudflare)', () => {
  const cf = { TRUST_CF_IPCOUNTRY: 'true' }

  it('is ignored until TRUST_CF_IPCOUNTRY is set: a visitor can forge it', () => {
    expect(visitorCountry(h({ 'CF-IPCountry': 'ZA' }), {})).toBe('')
    expect(visitorCountry(h({ 'X-Geo-Country': 'ZA' }), cf)).toBe('')
    expect(detectCurrency(h({ 'CF-IPCountry': 'ZA', 'Accept-Language': 'en-US' }), {})).toBe('usd')
  })

  it('beats Accept-Language when trusted', () => {
    expect(detectCurrency(h({ 'CF-IPCountry': 'ZA', 'Accept-Language': 'en-US' }), cf)).toBe('zar')
    expect(detectCurrency(h({ 'CF-IPCountry': 'GB', 'Accept-Language': 'en-ZA' }), cf)).toBe('usd')
  })

  it('ignores Cloudflare unknown (XX) and Tor (T1) and falls through', () => {
    expect(visitorCountry(h({ 'CF-IPCountry': 'XX' }), cf)).toBe('')
    expect(detectCurrency(h({ 'CF-IPCountry': 'T1', 'Accept-Language': 'en-ZA' }), cf)).toBe('zar')
  })
})

describe('visitorCurrency', () => {
  it('the cookie wins over the headers', () => {
    expect(visitorCurrency(h({ 'Accept-Language': 'en-ZA' }), 'usd', env)).toBe('usd')
    expect(visitorCurrency(h({ 'Accept-Language': 'en-US' }), 'zar', env)).toBe('zar')
  })

  it('an unknown cookie value falls back to detection', () => {
    expect(visitorCurrency(h({ 'Accept-Language': 'en-US' }), 'eur', env)).toBe('usd')
  })

  it('master switch off means ZAR for everyone, whatever the cookie', () => {
    const off = { ...env, MEDUSA_USD_REGION_ENABLED: 'false' }
    expect(usdEnabled(off)).toBe(false)
    expect(visitorCurrency(h({ 'Accept-Language': 'en-US' }), 'usd', off)).toBe('zar')
    expect(regionIdFor('usd', off)).toBe('reg_zar')
  })

  it('USD is on by default when the USD region is configured', () => {
    expect(usdEnabled(env)).toBe(true)
    expect(regionIdFor('usd', env)).toBe('reg_usd')
    expect(regionIdFor('zar', env)).toBe('reg_zar')
  })

  it('no USD region configured means ZAR', () => {
    const noUsd = { NEXT_PUBLIC_MEDUSA_REGION_ID: 'reg_zar' }
    expect(usdEnabled(noUsd)).toBe(false)
    expect(visitorCurrency(h({ 'Accept-Language': 'en-US' }), undefined, noUsd)).toBe('zar')
  })
})

describe('location first (Johan, 21 Oct: South Africa = ZAR, everywhere else = USD)', () => {
  it('the IP country beats the cookie and the browser language', () => {
    expect(visitorCurrency(h({ 'Accept-Language': 'en-US' }), 'usd', env, 'ZA')).toBe('zar')
    expect(visitorCurrency(h({ 'Accept-Language': 'en-ZA' }), 'zar', env, 'US')).toBe('usd')
  })

  it('a trusted Cloudflare header beats the IP country; an untrusted one is ignored', () => {
    expect(visitorCurrency(h({ 'CF-IPCountry': 'ZA' }), undefined, { ...env, TRUST_CF_IPCOUNTRY: 'true' }, 'US')).toBe('zar')
    expect(visitorCurrency(h({ 'CF-IPCountry': 'ZA' }), undefined, env, 'US')).toBe('usd')
  })

  it('unknown location falls back to the cookie, then the browser language', () => {
    expect(visitorCurrency(h({ 'Accept-Language': 'en-US' }), 'zar', env, '')).toBe('zar')
    expect(visitorCurrency(h({ 'Accept-Language': 'en-US' }), undefined, env, null)).toBe('usd')
  })

  it('master switch off: ZAR even for a US IP', () => {
    expect(visitorCurrency(h({}), undefined, { ...env, MEDUSA_USD_REGION_ENABLED: 'false' }, 'US')).toBe('zar')
  })
})
