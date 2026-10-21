import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/utils/supabase/middleware', () => ({
  createClient: () => ({
    supabase: { auth: { getUser: async () => ({ data: { user: null } }) } },
    supabaseResponse: NextResponse.next(),
  }),
}))

import { middleware } from './middleware'

function visit(path: string, headers: Record<string, string> = {}) {
  return middleware(new NextRequest(`http://localhost${path}`, { headers }))
}

describe('middleware currency guess (D021)', () => {
  it.each([
    ['en-US,en;q=0.9', 'usd'],
    ['en-ZA,en;q=0.9', 'zar'],
    ['af', 'zar'],
    ['de-DE', 'usd'],
  ])('a first visit with Accept-Language %s stores %s as a guess', async (lang, currency) => {
    const res = await visit('/shop', { 'Accept-Language': lang })
    expect(res.cookies.get('sr_currency')?.value).toBe(currency)
    expect(res.cookies.get('sr_currency_auto')?.value).toBe('1')
    expect(res.cookies.get('sr_currency')?.sameSite).toBe('lax')
  })

  it('leaves an existing choice alone', async () => {
    const res = await visit('/shop', { 'Accept-Language': 'en-US', Cookie: 'sr_currency=zar' })
    expect(res.cookies.get('sr_currency')).toBeUndefined()
  })

  it('marks the cookie Secure behind an https proxy', async () => {
    const res = await visit('/shop', { 'Accept-Language': 'en-US', 'x-forwarded-proto': 'https' })
    expect(res.cookies.get('sr_currency')?.secure).toBe(true)
  })

  it.each(['/api/webhooks/paypal', '/api/region', '/images/hero.webp'])('sets nothing on %s', async (path) => {
    const res = await visit(path, { 'Accept-Language': 'en-US' })
    expect(res.cookies.get('sr_currency')).toBeUndefined()
  })
})
