import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCartStatus } from './cart-status'

const fetchMock = vi.fn()

describe('getCartStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa:9000/')
    vi.stubEnv('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY', 'pk_test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns open for a cart without completed_at', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ cart: { id: 'c1', completed_at: null } }) })

    expect(await getCartStatus('c1')).toBe('open')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://medusa:9000/store/carts/c1?fields=id,completed_at')
    expect((init.headers as Record<string, string>)['x-publishable-api-key']).toBe('pk_test')
  })

  it('returns completed when completed_at is set', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ cart: { id: 'c1', completed_at: '2026-09-29T07:52:58Z' } }) })

    expect(await getCartStatus('c1')).toBe('completed')
  })

  it('returns not_found on 404', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })

    expect(await getCartStatus('gone')).toBe('not_found')
  })

  it('returns unknown on any other failure', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    expect(await getCartStatus('c1')).toBe('unknown')

    fetchMock.mockRejectedValue(new Error('network'))
    expect(await getCartStatus('c1')).toBe('unknown')
  })

  it('encodes the cart id', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })

    await getCartStatus('a/b?c')

    expect((fetchMock.mock.calls[0] as [string])[0]).toContain('/store/carts/a%2Fb%3Fc?')
  })
})
