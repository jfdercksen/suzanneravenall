import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { POST } from './route'

const MEDUSA_BASE = 'http://medusa-test:9000'
const PUBLISHABLE_KEY = 'pk_test_123'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/checkout/free', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeRawRequest(rawBody: string): Request {
  return new Request('http://localhost/api/checkout/free', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: rawBody,
  })
}

const BASE_CART = {
  id: 'cart_1',
  email: 'buyer@example.com',
  total: 0,
  items: [{ id: 'item_1' }],
  promotions: [{ code: 'FREEBIE' }],
}

const ORDER_COMPLETE_RESPONSE = {
  type: 'order' as const,
  order: { id: 'order_1', display_id: 42, status: 'completed' },
}

interface FetchMockOptions {
  cart?: Record<string, unknown>
  cartStatus?: number
  cartOk?: boolean
  complete?: Record<string, unknown>
  completeStatus?: number
  completeOk?: boolean
}

// Builds a fetch mock that answers the cart GET and the /complete POST
// differently based on the requested URL, matching the two calls route.ts makes.
function makeFetchMock({
  cart = BASE_CART,
  cartStatus = 200,
  cartOk = true,
  complete = ORDER_COMPLETE_RESPONSE,
  completeStatus = 200,
  completeOk = true,
}: FetchMockOptions = {}) {
  return vi.fn(async (url: string | URL) => {
    const href = url.toString()
    if (href.includes('/complete')) {
      return {
        ok: completeOk,
        status: completeStatus,
        json: async () => complete,
      }
    }
    return {
      ok: cartOk,
      status: cartStatus,
      json: async () => ({ cart }),
    }
  })
}

describe('POST /api/checkout/free', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MEDUSA_BACKEND_URL = MEDUSA_BASE
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = PUBLISHABLE_KEY
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  })

  it('returns 400 for a body that is not valid JSON', async () => {
    vi.stubGlobal('fetch', makeFetchMock())
    const res = await POST(makeRawRequest('{not json') as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when cartId is missing', async () => {
    vi.stubGlobal('fetch', makeFetchMock())
    const res = await POST(makeRequest({}) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when cartId fails Zod validation (empty string)', async () => {
    vi.stubGlobal('fetch', makeFetchMock())
    const res = await POST(makeRequest({ cartId: '' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when cartId is not a string', async () => {
    vi.stubGlobal('fetch', makeFetchMock())
    const res = await POST(makeRequest({ cartId: 12345 }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 404 when the cart does not exist', async () => {
    const fetchMock = makeFetchMock({ cartStatus: 404, cartOk: false })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ cartId: 'cart_missing' }) as never)
    expect(res.status).toBe(404)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns 502 when the cart fetch responds with a non-ok, non-404 status', async () => {
    const fetchMock = makeFetchMock({ cartStatus: 500, cartOk: false })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(502)
  })

  it('returns 400 when the cart has no items', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cart: { ...BASE_CART, items: [] } }))
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Cart is empty' })
  })

  it('returns 400 when the cart has no email', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cart: { ...BASE_CART, email: null } }))
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Add your email address first' })
  })

  it('returns 400 when the cart has no promotion with a code', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cart: { ...BASE_CART, promotions: [] } }))
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'No voucher on this cart' })
  })

  it('returns 400 when the cart promotions array only has entries with a null code', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cart: { ...BASE_CART, promotions: [{ code: null }] } }))
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 409 when the cart total is not zero', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cart: { ...BASE_CART, total: 199500 } }))
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: 'This cart still has an amount to pay' })
  })

  it('returns the order on successful completion of a zero-total cart', async () => {
    vi.stubGlobal('fetch', makeFetchMock())
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      type: 'order',
      order: { id: 'order_1', display_id: 42, status: 'completed' },
    })
  })

  it('sends the complete request as a POST with the publishable key header', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    await POST(makeRequest({ cartId: 'cart_1' }) as never)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [completeUrl, completeInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    expect(completeUrl).toBe(`${MEDUSA_BASE}/store/carts/cart_1/complete`)
    expect(completeInit.method).toBe('POST')
    const headers = completeInit.headers as Record<string, string>
    expect(headers['x-publishable-api-key']).toBe(PUBLISHABLE_KEY)
  })

  it('returns 502 when Medusa completion responds with type "cart" (not an order)', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock({ complete: { type: 'cart', cart: { id: 'cart_1' } } }),
    )
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(502)
  })

  it('returns 502 when the Medusa completion request itself is non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock({ completeOk: false, completeStatus: 500, complete: { message: 'boom' } }),
    )
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(502)
  })

  it('returns 500 when fetch throws a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    )
    const res = await POST(makeRequest({ cartId: 'cart_1' }) as never)
    expect(res.status).toBe(500)
  })
})
