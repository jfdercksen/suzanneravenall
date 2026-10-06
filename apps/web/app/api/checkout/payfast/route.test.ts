import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { POST } from './route'

const MEDUSA_BASE = 'http://medusa-test:9000'
const PUBLISHABLE_KEY = 'pk_test_123'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/checkout/payfast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const BASE_CART = {
  id: 'cart_1',
  email: 'buyer@example.com',
  total: 199500,
  currency_code: 'zar',
  items: [{ id: 'item_1' }],
  completed_at: null,
}

const BASE_BODY = {
  itemName: 'Programme',
  firstName: 'Thandi',
  lastName: 'Mokoena',
  email: 'buyer@example.com',
  cartId: 'cart_1',
}

function makeFetchMock({
  cart = BASE_CART as Record<string, unknown>,
  cartStatus = 200,
  cartOk = true,
} = {}) {
  return vi.fn(async () => ({
    ok: cartOk,
    status: cartStatus,
    json: async () => ({ cart }),
  }))
}

describe('POST /api/checkout/payfast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MEDUSA_BACKEND_URL = MEDUSA_BASE
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = PUBLISHABLE_KEY
    process.env.PAYFAST_MERCHANT_ID = '10000100'
    process.env.PAYFAST_MERCHANT_KEY = 'merchantkey'
    process.env.PAYFAST_PASSPHRASE = 'passphrase'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    delete process.env.PAYFAST_MERCHANT_ID
    delete process.env.PAYFAST_MERCHANT_KEY
    delete process.env.PAYFAST_PASSPHRASE
  })

  it('serves a guest (no session) with the amount and email taken from the cart', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(
      makeRequest({ ...BASE_BODY, amountInCents: 199500, email: 'other@example.com' }) as never,
    )
    expect(res.status).toBe(200)
    const data = (await res.json()) as { params: Record<string, string> }
    expect(data.params.amount).toBe('1995.00')
    expect(data.params.email_address).toBe('buyer@example.com')
    expect(data.params.m_payment_id).toBe('cart_1')
    expect(data.params.signature).toMatch(/^[a-f0-9]{32}$/)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${MEDUSA_BASE}/store/carts/cart_1`)
    expect((init.headers as Record<string, string>)['x-publishable-api-key']).toBe(PUBLISHABLE_KEY)
  })

  it('ignores a tampered amountInCents in the body', async () => {
    vi.stubGlobal('fetch', makeFetchMock())
    const res = await POST(makeRequest({ ...BASE_BODY, amountInCents: 100 }) as never)
    expect(res.status).toBe(200)
    const data = (await res.json()) as { params: Record<string, string> }
    expect(data.params.amount).toBe('1995.00')
  })

  it('works when the body carries no amount at all', async () => {
    vi.stubGlobal('fetch', makeFetchMock())
    const res = await POST(makeRequest(BASE_BODY) as never)
    expect(res.status).toBe(200)
  })

  it('returns 409 alreadyPlaced for a completed cart', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock({ cart: { ...BASE_CART, completed_at: '2026-10-06T10:00:00Z' } }),
    )
    const res = await POST(makeRequest(BASE_BODY) as never)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ alreadyPlaced: true })
  })

  it('returns 404 when the cart does not exist', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cartStatus: 404, cartOk: false }))
    const res = await POST(makeRequest(BASE_BODY) as never)
    expect(res.status).toBe(404)
  })

  it('returns 400 for an empty cart', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cart: { ...BASE_CART, items: [] } }))
    const res = await POST(makeRequest(BASE_BODY) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when the cart has no email', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cart: { ...BASE_CART, email: null } }))
    const res = await POST(makeRequest(BASE_BODY) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when the cart total is zero', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ cart: { ...BASE_CART, total: 0 } }))
    const res = await POST(makeRequest(BASE_BODY) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when firstName is missing', async () => {
    vi.stubGlobal('fetch', makeFetchMock())
    const res = await POST(makeRequest({ ...BASE_BODY, firstName: '' }) as never)
    expect(res.status).toBe(400)
  })
})
