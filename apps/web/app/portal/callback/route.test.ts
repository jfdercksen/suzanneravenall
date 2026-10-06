import { describe, it, expect, vi, beforeEach } from 'vitest'

const exchange = vi.hoisted(() => vi.fn())
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { exchangeCodeForSession: exchange } }),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}))

import { GET } from './route'

function token(amr: unknown): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${b64({ alg: 'HS256' })}.${b64({ sub: 'u1', amr })}.sig`
}

function call(url: string) {
  const u = new URL(url)
  return GET({ url, nextUrl: u } as never)
}

describe('GET /portal/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SITE_URL = 'http://site'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://sb'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('sends a password-reset login to the new-password page', async () => {
    exchange.mockResolvedValue({
      data: { session: { access_token: token([{ method: 'recovery', timestamp: 1 }]), user: { id: 'u1' } } },
      error: null,
    })
    const res = await call('http://site/portal/callback?code=abc&type=recovery')
    expect(res.headers.get('location')).toBe('http://site/portal/reset-password')
  })

  it('sends a normal login to next, ignoring a forged type=recovery', async () => {
    exchange.mockResolvedValue({
      data: { session: { access_token: token([{ method: 'otp', timestamp: 1 }]), user: { id: 'u1' } } },
      error: null,
    })
    const res = await call('http://site/portal/callback?code=abc&type=recovery&next=/portal/videos')
    expect(res.headers.get('location')).toBe('http://site/portal/videos')
  })

  it('falls back to the dashboard when the token cannot be read', async () => {
    exchange.mockResolvedValue({
      data: { session: { access_token: 'not-a-jwt', user: { id: 'u1' } } },
      error: null,
    })
    const res = await call('http://site/portal/callback?code=abc')
    expect(res.headers.get('location')).toBe('http://site/portal/dashboard')
  })
})
