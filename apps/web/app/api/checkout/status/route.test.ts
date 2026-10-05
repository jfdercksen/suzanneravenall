import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from './route'

const MEDUSA_BASE = 'http://medusa-test:9000'
const CART_ID = 'cart_01JABCDEFGHJKMNPQRSTVWXYZ0'

function makeRequest(cartId?: string): NextRequest {
  const qs = cartId === undefined ? '' : `?cartId=${encodeURIComponent(cartId)}`
  return new NextRequest(`http://localhost/api/checkout/status${qs}`)
}

function mockMedusa(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('GET /api/checkout/status', () => {
  beforeEach(() => {
    process.env.MEDUSA_BACKEND_URL = MEDUSA_BASE
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = 'pk_test_123'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  })

  it('reports completed when Medusa has turned the cart into an order', async () => {
    const fetchMock = mockMedusa(200, { cart: { id: CART_ID, completed_at: '2026-10-05T10:00:00Z' } })
    const res = await GET(makeRequest(CART_ID))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'completed' })
    expect(fetchMock).toHaveBeenCalledWith(`${MEDUSA_BASE}/store/carts/${CART_ID}`, expect.anything())
  })

  it('reports pending for a cart that is not an order yet', async () => {
    mockMedusa(200, { cart: { id: CART_ID, completed_at: null } })
    const res = await GET(makeRequest(CART_ID))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'pending' })
  })

  it('answers 404 for a cart Medusa does not know', async () => {
    mockMedusa(404, { message: 'not found' })
    const res = await GET(makeRequest(CART_ID))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ status: 'not_found' })
  })

  it.each([undefined, '', 'fake', 'cart_../../admin', 'order_01JABCDEFGHJKMNPQRSTVWXYZ0'])(
    'rejects a missing or malformed cart id (%s) without calling Medusa',
    async (cartId) => {
      const fetchMock = mockMedusa(200, {})
      const res = await GET(makeRequest(cartId))
      expect(res.status).toBe(404)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('answers 502 when Medusa is unavailable', async () => {
    mockMedusa(500, {})
    const res = await GET(makeRequest(CART_ID))
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ status: 'unknown' })
  })
})
