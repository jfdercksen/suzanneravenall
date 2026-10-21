import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The IP lookup (DB-IP database on the box) is stubbed: '' = location unknown.
let ipCountryValue = ''
vi.mock('@/lib/geoip', () => ({ ipCountry: () => ipCountryValue }))

import { GET, POST } from './route'

const ZAR = 'reg_zar_test'
const USD = 'reg_usd_test'

function get(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/region', { headers })
}

async function resolve(headers?: Record<string, string>) {
  const res = await GET(get(headers))
  return (await res.json()) as { regionId: string; currency: string; country: string | null; usdEnabled: boolean; auto: boolean }
}

function post(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/region', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('GET /api/region', () => {
  beforeEach(() => {
    ipCountryValue = ''
    process.env.NEXT_PUBLIC_MEDUSA_REGION_ID = ZAR
    process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID = USD
    delete process.env.MEDUSA_USD_REGION_ENABLED
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID
    delete process.env.MEDUSA_USD_REGION_ENABLED
  })

  it('serves USD to an en-US browser', async () => {
    expect(await resolve({ 'Accept-Language': 'en-US,en;q=0.9' })).toEqual({
      regionId: USD,
      currency: 'usd',
      country: null,
      usdEnabled: true,
      auto: true,
    })
  })

  it('serves ZAR to an en-ZA browser', async () => {
    const r = await resolve({ 'Accept-Language': 'en-ZA,en;q=0.9' })
    expect(r.regionId).toBe(ZAR)
    expect(r.currency).toBe('zar')
  })

  it('serves ZAR when there is nothing to go on', async () => {
    expect((await resolve()).regionId).toBe(ZAR)
  })

  it('honours the cookie over the browser language, and is no longer a guess', async () => {
    const r = await resolve({ 'Accept-Language': 'en-US', Cookie: 'sr_currency=zar' })
    expect(r.regionId).toBe(ZAR)
    expect(r.auto).toBe(false)
  })

  it('reports a middleware guess as auto', async () => {
    const r = await resolve({ 'Accept-Language': 'en-US', Cookie: 'sr_currency=usd; sr_currency_auto=1' })
    expect(r.currency).toBe('usd')
    expect(r.auto).toBe(true)
  })

  it('serves ZAR to everyone with the master switch off', async () => {
    process.env.MEDUSA_USD_REGION_ENABLED = 'false'
    const r = await resolve({ 'Accept-Language': 'en-US', Cookie: 'sr_currency=usd' })
    expect(r.regionId).toBe(ZAR)
    expect(r.usdEnabled).toBe(false)
  })

  it('still serves ZAR to a South African IP with USD on', async () => {
    ipCountryValue = 'ZA'
    expect((await resolve({ 'Accept-Language': 'en-US' })).regionId).toBe(ZAR)
  })

  it('falls back to ZAR when the USD region is unconfigured', async () => {
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID
    expect((await resolve({ 'Accept-Language': 'en-US' })).regionId).toBe(ZAR)
  })
})

describe('GET /api/region by IP location (Johan, 21 Oct)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEDUSA_REGION_ID = ZAR
    process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID = USD
    delete process.env.MEDUSA_USD_REGION_ENABLED
  })

  afterEach(() => {
    ipCountryValue = ''
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID
  })

  it('a South African IP gets ZAR, whatever the browser language or cookie', async () => {
    ipCountryValue = 'ZA'
    const r = await resolve({ 'Accept-Language': 'en-US', Cookie: 'sr_currency=usd' })
    expect(r).toEqual({ regionId: ZAR, currency: 'zar', country: 'ZA', usdEnabled: true, auto: false })
  })

  it.each(['US', 'GB', 'DE', 'AU', 'NA'])('an IP in %s gets USD, even with an en-ZA browser and a zar cookie', async (cc) => {
    ipCountryValue = cc
    const r = await resolve({ 'Accept-Language': 'en-ZA', Cookie: 'sr_currency=zar' })
    expect(r.regionId).toBe(USD)
    expect(r.currency).toBe('usd')
    expect(r.auto).toBe(false)
  })

  it('a forged CF-IPCountry header cannot buy in rand while Cloudflare is not in front', async () => {
    ipCountryValue = 'US'
    expect((await resolve({ 'CF-IPCountry': 'ZA' })).currency).toBe('usd')
  })

  it('behind Cloudflare (TRUST_CF_IPCOUNTRY=true) its header beats the IP database', async () => {
    process.env.TRUST_CF_IPCOUNTRY = 'true'
    ipCountryValue = 'US'
    expect((await resolve({ 'CF-IPCountry': 'ZA' })).currency).toBe('zar')
    delete process.env.TRUST_CF_IPCOUNTRY
  })

  it('a located visitor cannot pick the other currency with a POST', async () => {
    ipCountryValue = 'US'
    const res = await POST(post({ currency: 'zar' }))
    expect(await res.json()).toEqual({ regionId: USD, currency: 'usd' })
    expect(res.cookies.get('sr_currency')?.value).toBe('usd')
  })
})

describe('POST /api/region (time-zone correction, recovery link)', () => {
  beforeEach(() => {
    ipCountryValue = ''
    process.env.NEXT_PUBLIC_MEDUSA_REGION_ID = ZAR
    process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID = USD
    delete process.env.MEDUSA_USD_REGION_ENABLED
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID
    delete process.env.MEDUSA_USD_REGION_ENABLED
  })

  it('sets the currency cookie for a year and clears the auto flag', async () => {
    const res = await POST(post({ currency: 'usd' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ regionId: USD, currency: 'usd' })
    const cookie = res.cookies.get('sr_currency')
    expect(cookie?.value).toBe('usd')
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 365)
    expect(cookie?.sameSite).toBe('lax')
    expect(cookie?.path).toBe('/')
    expect(res.cookies.get('sr_currency_auto')?.value).toBe('')
  })

  it('switching back to ZAR returns the ZAR region', async () => {
    const res = await POST(post({ currency: 'zar' }))
    expect(await res.json()).toEqual({ regionId: ZAR, currency: 'zar' })
    expect(res.cookies.get('sr_currency')?.value).toBe('zar')
  })

  it('rejects anything but zar or usd', async () => {
    expect((await POST(post({ currency: 'eur' }))).status).toBe(400)
    expect((await POST(post({}))).status).toBe(400)
  })

  it('cannot choose USD while the master switch is off', async () => {
    process.env.MEDUSA_USD_REGION_ENABLED = 'false'
    const res = await POST(post({ currency: 'usd' }))
    expect(await res.json()).toEqual({ regionId: ZAR, currency: 'zar' })
  })
})
