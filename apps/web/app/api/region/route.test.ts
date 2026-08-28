import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'

import { GET } from './route'

const ZAR = 'reg_zar_test'
const USD = 'reg_usd_test'

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new Request('http://localhost/api/region', { headers }) as unknown as NextRequest
}

async function resolve(headers?: Record<string, string>) {
  const res = await GET(makeRequest(headers))
  return (await res.json()) as { regionId: string; country: string | null }
}

describe('GET /api/region', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEDUSA_REGION_ID = ZAR
    process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID = USD
    delete process.env.MEDUSA_USD_REGION_ENABLED
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID
    delete process.env.MEDUSA_USD_REGION_ENABLED
  })

  // The regression that made the whole catalogue un-buyable: no CDN sits in
  // front of the site, so no geo header is ever sent, and the old code read
  // that silence as "international" and issued a USD cart.
  it('serves ZAR when no geo header is present', async () => {
    expect(await resolve()).toEqual({ regionId: ZAR, country: null })
  })

  it('serves ZAR to a South African visitor', async () => {
    expect((await resolve({ 'CF-IPCountry': 'ZA' })).regionId).toBe(ZAR)
  })

  it('serves ZAR to an international visitor while USD is disabled', async () => {
    expect((await resolve({ 'CF-IPCountry': 'US' })).regionId).toBe(ZAR)
  })

  it('serves USD to an international visitor once USD is enabled', async () => {
    process.env.MEDUSA_USD_REGION_ENABLED = 'true'
    expect((await resolve({ 'CF-IPCountry': 'US' })).regionId).toBe(USD)
  })

  it('still serves ZAR to a South African visitor when USD is enabled', async () => {
    process.env.MEDUSA_USD_REGION_ENABLED = 'true'
    expect((await resolve({ 'CF-IPCountry': 'ZA' })).regionId).toBe(ZAR)
  })

  // Cloudflare sends XX for anonymised IPs and T1 for Tor. Neither is a country.
  it.each(['XX', 'T1'])('treats %s as unknown, not as international', async (code) => {
    process.env.MEDUSA_USD_REGION_ENABLED = 'true'
    const result = await resolve({ 'CF-IPCountry': code })
    expect(result).toEqual({ regionId: ZAR, country: null })
  })

  it('is case and whitespace tolerant', async () => {
    process.env.MEDUSA_USD_REGION_ENABLED = 'true'
    expect((await resolve({ 'CF-IPCountry': ' za ' })).regionId).toBe(ZAR)
  })

  it('falls back to ZAR when the USD region is enabled but unconfigured', async () => {
    process.env.MEDUSA_USD_REGION_ENABLED = 'true'
    delete process.env.NEXT_PUBLIC_MEDUSA_REGION_USD_ID
    expect((await resolve({ 'CF-IPCountry': 'US' })).regionId).toBe(ZAR)
  })
})
