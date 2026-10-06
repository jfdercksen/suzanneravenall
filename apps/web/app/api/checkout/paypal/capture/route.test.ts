import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/log', () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

import { logError } from '@/lib/log'
import { POST } from './route'

const MEDUSA_BASE = 'http://medusa-test:9000'
const ORDER_ID = 'ORDER123456789ABCD'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/checkout/paypal/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Answers PayPal OAuth, the PayPal capture, the Medusa cart GET and /complete.
function makeFetchMock({
  capturedValue = '49.00',
  capturedCurrency = 'USD',
  cartTotal = 4900,
  cartCurrency = 'usd',
  cartOk = true,
} = {}) {
  return vi.fn(async (url: string | URL) => {
    const href = url.toString()
    if (href.endsWith('/v1/oauth2/token')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'tok' }) }
    }
    if (href.endsWith('/capture')) {
      return {
        ok: true,
        status: 201,
        json: async () => ({
          id: ORDER_ID,
          status: 'COMPLETED',
          purchase_units: [
            {
              custom_id: 'cart_1',
              payments: {
                captures: [
                  {
                    id: 'CAP1',
                    status: 'COMPLETED',
                    amount: { value: capturedValue, currency_code: capturedCurrency },
                  },
                ],
              },
            },
          ],
        }),
      }
    }
    if (href.endsWith('/complete')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ type: 'order', order: { id: 'order_1' } }),
        text: async () => '',
      }
    }
    return {
      ok: cartOk,
      status: cartOk ? 200 : 500,
      json: async () => ({ cart: { id: 'cart_1', total: cartTotal, currency_code: cartCurrency } }),
    }
  })
}

function completeCalls(fetchMock: ReturnType<typeof makeFetchMock>) {
  return fetchMock.mock.calls.filter(([u]) => u.toString().endsWith('/complete'))
}

describe('POST /api/checkout/paypal/capture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MEDUSA_BACKEND_URL = MEDUSA_BASE
    process.env.PAYPAL_CLIENT_ID = 'client'
    process.env.PAYPAL_CLIENT_SECRET = 'secret'
    process.env.PAYPAL_SANDBOX = 'true'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.PAYPAL_CLIENT_ID
    delete process.env.PAYPAL_CLIENT_SECRET
    delete process.env.PAYPAL_SANDBOX
  })

  it('completes the cart when the captured amount and currency match the cart', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ orderId: ORDER_ID, cartId: 'cart_1' }) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ medusaOrderId: 'order_1' })
    expect(completeCalls(fetchMock)).toHaveLength(1)
    expect(completeCalls(fetchMock)[0]?.[0]).toBe(`${MEDUSA_BASE}/store/carts/cart_1/complete`)
  })

  it('does not complete the cart when the captured amount is less than the cart total', async () => {
    const fetchMock = makeFetchMock({ capturedValue: '1.00' })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ orderId: ORDER_ID, cartId: 'cart_1' }) as never)
    expect(res.status).toBe(409)
    expect(completeCalls(fetchMock)).toHaveLength(0)
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Amount mismatch'),
      undefined,
      expect.objectContaining({ cartId: 'cart_1', expected: 4900, received: 100 }),
    )
  })

  it('does not complete the cart when the captured currency differs', async () => {
    const fetchMock = makeFetchMock({ capturedCurrency: 'EUR' })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ orderId: ORDER_ID, cartId: 'cart_1' }) as never)
    expect(res.status).toBe(409)
    expect(completeCalls(fetchMock)).toHaveLength(0)
  })

  it('does not complete the cart when the cart cannot be loaded', async () => {
    const fetchMock = makeFetchMock({ cartOk: false })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ orderId: ORDER_ID, cartId: 'cart_1' }) as never)
    expect(res.status).toBe(502)
    expect(completeCalls(fetchMock)).toHaveLength(0)
    expect(logError).toHaveBeenCalled()
  })

  it('rejects a capture whose custom_id is a different cart', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeRequest({ orderId: ORDER_ID, cartId: 'cart_2' }) as never)
    expect(res.status).toBe(400)
    expect(completeCalls(fetchMock)).toHaveLength(0)
  })
})
