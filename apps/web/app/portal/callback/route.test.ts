import { describe, it, expect, vi, beforeEach } from 'vitest'

const { exchange, from } = vi.hoisted(() => ({ exchange: vi.fn(), from: vi.fn() }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { exchangeCodeForSession: exchange }, from }),
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

  describe('Guest row on sign-in (KI137)', () => {
    const insert = vi.fn()
    function tables(rows: { data: unknown; error: unknown }) {
      from.mockImplementation((table: string) => {
        if (table === 'membership_tiers') {
          return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'free-tier' }, error: null }) }) }) }
        }
        return { select: () => ({ eq: () => ({ limit: async () => rows }) }), insert }
      })
    }
    beforeEach(() => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'
      insert.mockReset().mockResolvedValue({ error: null })
      exchange.mockResolvedValue({
        data: { session: { access_token: token([{ method: 'otp', timestamp: 1 }]), user: { id: 'u1' } } },
        error: null,
      })
    })

    it('adds no Guest row for a member who already has two rows (Guest plus a paid level)', async () => {
      tables({ data: [{ id: 'row-1' }], error: null })
      await call('http://site/portal/callback?code=abc')
      expect(insert).not.toHaveBeenCalled()
    })

    it('adds one Guest row for a first sign-in', async () => {
      tables({ data: [], error: null })
      await call('http://site/portal/callback?code=abc')
      expect(insert).toHaveBeenCalledTimes(1)
      expect(insert.mock.calls[0][0]).toMatchObject({ user_id: 'u1', tier_id: 'free-tier', status: 'active' })
    })

    it('adds nothing when the lookup fails, and still signs the member in', async () => {
      tables({ data: null, error: { message: 'boom' } })
      const res = await call('http://site/portal/callback?code=abc')
      expect(insert).not.toHaveBeenCalled()
      expect(res.headers.get('location')).toBe('http://site/portal/dashboard')
    })
  })
})
