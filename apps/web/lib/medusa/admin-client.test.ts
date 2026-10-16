import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { medusaAdminFetch, resetMedusaAdminAuthCache, isMedusaAdminConfigured } from './admin-client'

vi.mock('@/lib/log', () => ({ logError: vi.fn(), logWarn: vi.fn() }))

import { logError } from '@/lib/log'

const fetchMock = vi.fn()

function response(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function headerOf(callIndex: number, name: string): string | null {
  const call = fetchMock.mock.calls[callIndex] as [string, RequestInit] | undefined
  if (!call) throw new Error(`fetch call ${callIndex} missing`)
  return new Headers(call[1].headers).get(name)
}

describe('medusaAdminFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMedusaAdminAuthCache()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa:9000/')
    vi.stubEnv('MEDUSA_API_KEY', '')
    vi.stubEnv('MEDUSA_API_TOKEN', '')
    vi.stubEnv('MEDUSA_ADMIN_EMAIL', '')
    vi.stubEnv('MEDUSA_ADMIN_PASSWORD', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns null and logs when no credentials are configured', async () => {
    expect(isMedusaAdminConfigured()).toBe(false)
    expect(await medusaAdminFetch('/customers')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('no admin credentials'))
  })

  it('uses a secret API key as Basic auth without logging in', async () => {
    vi.stubEnv('MEDUSA_API_KEY', 'sk_live_abc')
    fetchMock.mockResolvedValue(response(200, { customers: [] }))

    const res = await medusaAdminFetch('/customers?limit=1')

    expect(res?.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe('http://medusa:9000/admin/customers?limit=1')
    expect(headerOf(0, 'Authorization')).toBe(
      `Basic ${Buffer.from('sk_live_abc:').toString('base64')}`,
    )
  })

  it('treats an sk_ value in MEDUSA_API_TOKEN as a secret key too', async () => {
    vi.stubEnv('MEDUSA_API_TOKEN', 'sk_from_old_var')
    fetchMock.mockResolvedValue(response(200))

    await medusaAdminFetch('orders')

    expect((fetchMock.mock.calls[0] as [string])[0]).toBe('http://medusa:9000/admin/orders')
    expect(headerOf(0, 'Authorization')).toMatch(/^Basic /)
  })

  it('ignores a non-sk_ MEDUSA_API_TOKEN (the v1 token) and falls back to the password login', async () => {
    vi.stubEnv('MEDUSA_API_TOKEN', 'stale-v1-token')
    vi.stubEnv('MEDUSA_ADMIN_EMAIL', 'admin@example.com')
    vi.stubEnv('MEDUSA_ADMIN_PASSWORD', 'pw')
    fetchMock.mockResolvedValueOnce(response(200, { token: 'jwt-1' })).mockResolvedValueOnce(response(200))

    await medusaAdminFetch('/customers')

    expect((fetchMock.mock.calls[0] as [string])[0]).toBe('http://medusa:9000/auth/user/emailpass')
    expect(headerOf(1, 'Authorization')).toBe('Bearer jwt-1')
  })

  it('logs in with email and password once and caches the token across calls', async () => {
    vi.stubEnv('MEDUSA_ADMIN_EMAIL', 'admin@example.com')
    vi.stubEnv('MEDUSA_ADMIN_PASSWORD', 'pw')
    fetchMock
      .mockResolvedValueOnce(response(200, { token: 'jwt-1' }))
      .mockResolvedValueOnce(response(200, { customers: [] }))
      .mockResolvedValueOnce(response(200, { orders: [] }))

    await medusaAdminFetch('/customers')
    await medusaAdminFetch('/orders')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    const [loginUrl, loginInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(loginUrl).toBe('http://medusa:9000/auth/user/emailpass')
    expect(loginInit.method).toBe('POST')
    expect(JSON.parse(loginInit.body as string)).toEqual({ email: 'admin@example.com', password: 'pw' })
    expect(headerOf(1, 'Authorization')).toBe('Bearer jwt-1')
    expect(headerOf(2, 'Authorization')).toBe('Bearer jwt-1')
  })

  it('re-logs in once and retries when a cached token answers 401', async () => {
    vi.stubEnv('MEDUSA_ADMIN_EMAIL', 'admin@example.com')
    vi.stubEnv('MEDUSA_ADMIN_PASSWORD', 'pw')
    fetchMock
      .mockResolvedValueOnce(response(200, { token: 'jwt-old' }))
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200, { token: 'jwt-new' }))
      .mockResolvedValueOnce(response(200, { customers: [{ id: 'cus_1' }] }))

    const res = await medusaAdminFetch('/customers')

    expect(res?.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(headerOf(1, 'Authorization')).toBe('Bearer jwt-old')
    expect(headerOf(3, 'Authorization')).toBe('Bearer jwt-new')
  })

  it('does not retry a 401 when using a secret key', async () => {
    vi.stubEnv('MEDUSA_API_KEY', 'sk_bad')
    fetchMock.mockResolvedValue(response(401))

    const res = await medusaAdminFetch('/customers')

    expect(res?.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns null and logs when the login is rejected', async () => {
    vi.stubEnv('MEDUSA_ADMIN_EMAIL', 'admin@example.com')
    vi.stubEnv('MEDUSA_ADMIN_PASSWORD', 'wrong')
    fetchMock.mockResolvedValue(response(401))

    expect(await medusaAdminFetch('/customers')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith('[medusa/admin-client] admin login failed', undefined, { status: 401 })
  })

  it('backs off after a rejected login instead of retrying on the next call', async () => {
    vi.stubEnv('MEDUSA_ADMIN_EMAIL', 'admin@example.com')
    vi.stubEnv('MEDUSA_ADMIN_PASSWORD', 'wrong')
    fetchMock.mockResolvedValue(response(401))

    expect(await medusaAdminFetch('/customers')).toBeNull()
    expect(await medusaAdminFetch('/customers')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns null and logs when the login throws', async () => {
    vi.stubEnv('MEDUSA_ADMIN_EMAIL', 'admin@example.com')
    vi.stubEnv('MEDUSA_ADMIN_PASSWORD', 'pw')
    const boom = new Error('network')
    fetchMock.mockRejectedValue(boom)

    expect(await medusaAdminFetch('/customers')).toBeNull()
    expect(logError).toHaveBeenCalledWith('[medusa/admin-client] admin login threw', boom)
  })

  it('shares one in-flight login between concurrent calls', async () => {
    vi.stubEnv('MEDUSA_ADMIN_EMAIL', 'admin@example.com')
    vi.stubEnv('MEDUSA_ADMIN_PASSWORD', 'pw')
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/auth/user/emailpass') ? response(200, { token: 'jwt-1' }) : response(200),
    )

    await Promise.all([medusaAdminFetch('/customers'), medusaAdminFetch('/orders')])

    const loginCalls = fetchMock.mock.calls.filter(([url]) => (url as string).endsWith('/auth/user/emailpass'))
    expect(loginCalls).toHaveLength(1)
  })

  it('keeps caller headers and disables the data cache', async () => {
    vi.stubEnv('MEDUSA_API_KEY', 'sk_x')
    fetchMock.mockResolvedValue(response(200))

    await medusaAdminFetch('/orders', { headers: { 'X-Trace': 'abc' } })

    const init = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
    expect(init.cache).toBe('no-store')
    expect(headerOf(0, 'X-Trace')).toBe('abc')
  })
})
