import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({ gate: vi.fn() }))
vi.mock('@/lib/booking/order-link', () => ({ orderGateLink: h.gate }))

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
    h.gate.mockReset().mockResolvedValue(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  })

  it('reports completed with the order number when Medusa has turned the cart into an order', async () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () =>
        url.includes('/store/order-by-cart/')
          ? { display_id: 70 }
          : { cart: { id: CART_ID, completed_at: '2026-10-05T10:00:00Z' } },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(makeRequest(CART_ID))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'completed', orderNumber: 70 })
    expect(fetchMock).toHaveBeenCalledWith(`${MEDUSA_BASE}/store/carts/${CART_ID}`, expect.anything())
    expect(fetchMock).toHaveBeenCalledWith(`${MEDUSA_BASE}/store/order-by-cart/${CART_ID}`, expect.anything())
  })

  it('still reports completed when the order number cannot be read', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('/store/order-by-cart/')
        ? { ok: false, status: 404, json: async () => ({}) }
        : { ok: true, status: 200, json: async () => ({ cart: { id: CART_ID, completed_at: '2026-10-05T10:00:00Z' } }) },
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(makeRequest(CART_ID))
    expect(await res.json()).toEqual({ status: 'completed', orderNumber: null })
  })

  it('lists the order lines with their variant and the product type the mail uses (KI060, KI065)', async () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => {
        if (url.includes('/store/order-by-cart/')) return { display_id: 71 }
        if (url.includes('/store/products?')) {
          return {
            products: [
              {
                id: 'prod_rr1',
                handle: 'rr-program-1-live-via-zoom',
                metadata: null,
                categories: [{ handle: 'rp-live' }],
                variants: [{ id: 'variant_live', metadata: { thinkific_course_id: '1349879' } }],
              },
            ],
          }
        }
        return {
          cart: {
            id: CART_ID,
            completed_at: '2026-10-05T10:00:00Z',
            items: [
              { title: 'Program 1', variant_title: 'Live via Zoom', quantity: 1, product_id: 'prod_rr1', variant_id: 'variant_live', product_handle: 'rr-program-1-live-via-zoom' },
            ],
          },
        }
      },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(makeRequest(CART_ID))
    expect(await res.json()).toEqual({
      status: 'completed',
      orderNumber: 71,
      items: [{ title: 'Program 1', variant: 'Live via Zoom', quantity: 1, preorder: false }],
      productType: 'live-course',
      bookingUrl: null,
    })
    const productsCall = fetchMock.mock.calls.map(([u]) => u).find((u) => u.includes('/store/products?'))
    expect(productsCall).toContain('id%5B%5D=prod_rr1')
  })

  it('marks a pre-order line and still answers when the products cannot be read (KI067)', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('/store/products?')
        ? { ok: false, status: 500, json: async () => ({}) }
        : {
            ok: true,
            status: 200,
            json: async () =>
              url.includes('/store/order-by-cart/')
                ? { display_id: 72 }
                : {
                    cart: {
                      id: CART_ID,
                      completed_at: '2026-10-05T10:00:00Z',
                      items: [{ title: 'The Breakthrough Trilogy', variant_title: 'Default', quantity: 2, product_id: 'prod_book', product_handle: 'the-latest-book-by-suzanne' }],
                    },
                  },
          },
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(makeRequest(CART_ID))
    expect(await res.json()).toEqual({
      status: 'completed',
      orderNumber: 72,
      items: [{ title: 'The Breakthrough Trilogy', variant: null, quantity: 2, preorder: true }],
      productType: 'other',
      bookingUrl: null,
    })
  })

  it('gives a session order the matching Cal.com session event with the buyer filled in (KI079)', async () => {
    process.env.CALCOM_SESSION_BOOKING_URL = 'http://cal-test:3002/suzanneravenall'
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => {
        if (url.includes('/store/order-by-cart/')) return { display_id: 73 }
        if (url.includes('/store/products?')) {
          return {
            products: [
              {
                id: 'prod_rrs',
                handle: 'rapid-repatterning-session',
                metadata: null,
                categories: [{ handle: 'private-sessions' }],
                variants: [{ id: 'variant_90', metadata: null }],
              },
            ],
          }
        }
        return {
          cart: {
            id: CART_ID,
            completed_at: '2026-10-20T10:00:00Z',
            email: 'johan@aiautomations.co.za',
            billing_address: { first_name: 'Johan', last_name: 'QA Test' },
            items: [
              { title: 'Rapid Repatterning Session', product_title: 'Rapid Repatterning Session', variant_title: '90 min online', quantity: 1, product_id: 'prod_rrs', variant_id: 'variant_90' },
            ],
          },
        }
      },
    }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const res = await GET(makeRequest(CART_ID))
      const body = await res.json()
      expect(body.productType).toBe('session')
      expect(body.bookingUrl).toBe(
        'http://cal-test:3002/suzanneravenall/session-90?name=Johan+QA+Test&email=johan%40aiautomations.co.za'
      )
      // J-07: once the order number is known, the per-order link replaces it.
      expect(h.gate).toHaveBeenCalledWith({
        displayId: 73,
        line: { productTitle: 'Rapid Repatterning Session', productHandle: 'rapid-repatterning-session', variantTitle: '90 min online', quantity: 1 },
        name: 'Johan QA Test',
        email: 'johan@aiautomations.co.za',
      })
      h.gate.mockResolvedValueOnce('http://site/book/' + 'a'.repeat(43))
      const gated = await (await GET(makeRequest(CART_ID))).json()
      expect(gated.bookingUrl).toBe('http://site/book/' + 'a'.repeat(43))
      expect(gated.gate).toBeUndefined()
    } finally {
      delete process.env.CALCOM_SESSION_BOOKING_URL
    }
  })

  it('reports pending for a cart that is not an order yet', async () => {
    mockMedusa(200, { cart: { id: CART_ID, completed_at: null } })
    const res = await GET(makeRequest(CART_ID))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'pending', orderNumber: null })
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
