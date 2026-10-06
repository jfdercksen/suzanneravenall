import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/log', () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

import { POST } from './route'

const MEDUSA_BASE = 'http://medusa-test:9000'
const PUBLISHABLE_KEY = 'pk_test_123'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/checkout/paypal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const BASE_CART = {
  id: 'cart_1',
  email: 'buyer@example.com',
  total: 4900,
  currency_code: 'usd',
  items: [{ id: 'item_1' }],
  completed_at: null,
}

const BASE_BODY = {
  itemName: 'Programme',
  cartId: 'cart_1',
}

// Answers the Medusa cart GET, the PayPal OAuth call and the create-order call.
function makeFetchMock({
  cart = BASE_CART as Record<string, unknown>,
  cartStatus = 200,
  cartOk = true,
} = {}) {
  return vi.fn(async (url: string | URL, _init?: RequestInit) => {
    const href = url.toString()
    if (href.endsWith('/v1/oauth2/token')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'tok' }) }
    }
    if (href.endsWith('/v2/checkout/orders')) {
      return {
        ok: true,
        status: 201,
        json: async () => ({
          id: 'ORDER123456789ABCD',
          status: 'PAYER_ACTION_REQUIRED',
          links: [{ rel: 'payer-action', href: 'https://paypal.test/approve', method: 'GET' }],
        }),
      }
    }
    return { ok: cartOk, status: cartStatus, json: async () => ({ cart }) }
  })
}

type FetchMock = ReturnType<typeof makeFetchMock>

function orderBody(fetchMock: FetchMock) {
  const call = fetchMock.mock.calls.find(([u]) => u.toString().endsWith('/v2/checkout/orders'))
  if (!call) return null
  return JSON.parse(String(call[1]?.body)) as {
    purchase_units: Array<{ custom_id: string; amount: { currency_code: string; value: string } }>
  }
}

describe('POST /api/checkout/paypal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MEDUSA_BACKEND_URL = MEDUSA_BASE
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = PUBLISHABLE_KEY
    process.env.PAYPAL_CLIENT_ID = 'client'
    process.env.PAYPAL_CLIENT_SECRET = 'secret'
    process.env.PAYPAL_SANDBOX = 'true'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    delete process.env.PAYPAL_CLIENT_ID
    delete process.env.PAYPAL_CLIENT_SECRET
    delete process.env.PAYPAL_SANDBOX
  })

  it('builds the PayPal amount and currency from the cart', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest(BASE_BODY) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ approvalUrl: 'https://paypal.test/approve' })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${MEDUSA_BASE}/store/carts/cart_1`)
    expect((init.headers as Record<string, string>)['x-publishable-api-key']).toBe(PUBLISHABLE_KEY)

    const unit = orderBody(fetchMock)?.purchase_units[0]
    expect(unit?.amount).toEqual({ currency_code: 'USD', value: '49.00' })
    expect(unit?.custom_id).toBe('cart_1')
  })

  it('ignores a tampered amountInCents and currencyCode in the body', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(
      makeRequest({ ...BASE_BODY, amountInCents: 100, currencyCode: 'EUR' }) as never,
    )
    expect(res.status).toBe(200)
    expect(orderBody(fetchMock)?.purchase_units[0]?.amount).toEqual({
      currency_code: 'USD',
      value: '49.00',
    })
  })

  it('rejects a ZAR cart with 400 and never creates a PayPal order', async () => {
    const fetchMock = makeFetchMock({ cart: { ...BASE_CART, currency_code: 'zar', total: 199500 } })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(
      makeRequest({ ...BASE_BODY, amountInCents: 199500, currencyCode: 'ZAR' }) as never,
    )
    expect(res.status).toBe(400)
    const data = (await res.json()) as { error: string; unsupportedCurrency?: boolean }
    expect(data.unsupportedCurrency).toBe(true)
    expect(data.error).toContain('ZAR')
    expect(orderBody(fetchMock)).toBeNull()
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
})
