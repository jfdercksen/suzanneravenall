import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/log', () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

import { logError } from '@/lib/log'
import { POST } from './route'

const MEDUSA_BASE = 'http://medusa-test:9000'

// A PAYMENT.CAPTURE.COMPLETED event: the resource is the capture itself.
function makeEvent(value: string, currency = 'USD', eventType = 'PAYMENT.CAPTURE.COMPLETED'): Request {
  return new Request('http://localhost/api/webhooks/paypal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'paypal-transmission-id': 't1',
      'paypal-transmission-time': '2026-10-06T10:00:00Z',
      'paypal-cert-url': 'https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT',
      'paypal-transmission-sig': 'sig',
      'paypal-auth-algo': 'SHA256withRSA',
    },
    body: JSON.stringify({
      event_type: eventType,
      resource: {
        id: 'CAP1',
        custom_id: 'cart_1',
        amount: { value, currency_code: currency },
      },
    }),
  })
}

// Answers PayPal OAuth, signature verification, the Medusa cart GET and /complete.
function makeFetchMock({ cartTotal = 4900, cartCurrency = 'usd', cartOk = true, completedAt = null as string | null, sessionOk = true } = {}) {
  return vi.fn(async (url: string | URL, _init?: RequestInit) => {
    const href = url.toString()
    if (href.endsWith('/store/payment-collections')) {
      return { ok: true, status: 200, json: async () => ({ payment_collection: { id: 'paycol_1' } }) }
    }
    if (href.endsWith('/payment-sessions')) {
      return { ok: sessionOk, status: sessionOk ? 200 : 400, json: async () => ({}), text: async () => '' }
    }
    if (href.endsWith('/v1/oauth2/token')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'tok' }) }
    }
    if (href.endsWith('/verify-webhook-signature')) {
      return { ok: true, status: 200, json: async () => ({ verification_status: 'SUCCESS' }) }
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
      json: async () => ({ cart: { id: 'cart_1', total: cartTotal, currency_code: cartCurrency, completed_at: completedAt } }),
    }
  })
}

function completeCalls(fetchMock: ReturnType<typeof makeFetchMock>) {
  return fetchMock.mock.calls.filter(([u]) => u.toString().endsWith('/complete'))
}

describe('POST /api/webhooks/paypal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MEDUSA_BACKEND_URL = MEDUSA_BASE
    process.env.PAYPAL_CLIENT_ID = 'client'
    process.env.PAYPAL_CLIENT_SECRET = 'secret'
    process.env.PAYPAL_WEBHOOK_ID = 'WH1'
    // The test cert URL is the sandbox host, as on the review box.
    process.env.PAYPAL_SANDBOX = 'true'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.PAYPAL_CLIENT_ID
    delete process.env.PAYPAL_CLIENT_SECRET
    delete process.env.PAYPAL_WEBHOOK_ID
    delete process.env.PAYPAL_SANDBOX
  })

  it('completes the cart when the captured amount matches the cart total', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeEvent('49.00') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(1)
    expect(completeCalls(fetchMock)[0]?.[0]).toBe(`${MEDUSA_BASE}/store/carts/cart_1/complete`)
    // A captured PayPal session is opened first, so Medusa has a paid session (D021).
    const sessions = fetchMock.mock.calls.filter(([u]) => u.toString().endsWith('/payment-sessions'))
    expect(sessions).toHaveLength(1)
    expect(JSON.parse(String(sessions[0]?.[1]?.body))).toMatchObject({
      provider_id: 'pp_paypal_paypal',
      data: { cart_id: 'cart_1', capture_id: 'CAP1', amount_cents: 4900, currency_code: 'USD' },
    })
  })

  it('asks PayPal to retry when the order could not be placed', async () => {
    const fetchMock = makeFetchMock({ sessionOk: false })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeEvent('49.00') as never)
    expect(res.status).toBe(500)
    expect(completeCalls(fetchMock)).toHaveLength(0)
  })

  it('leaves a cart the capture route already completed alone', async () => {
    const fetchMock = makeFetchMock({ completedAt: '2026-10-21T08:00:00Z' })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeEvent('49.00') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(0)
  })

  it('does not complete the cart when the captured amount is less than the cart total', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeEvent('1.00') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(0)
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Amount mismatch'),
      undefined,
      expect.objectContaining({ cartId: 'cart_1', expected: 4900, received: 100 }),
    )
  })

  it('does not complete the cart when the captured currency differs', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeEvent('49.00', 'EUR') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(0)
  })

  it('does not complete the cart when the cart cannot be loaded, and asks PayPal to retry', async () => {
    const fetchMock = makeFetchMock({ cartOk: false })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeEvent('49.00') as never)
    expect(res.status).toBe(500)
    expect(completeCalls(fetchMock)).toHaveLength(0)
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('could not be loaded'),
      undefined,
      expect.objectContaining({ cartId: 'cart_1' }),
    )
  })

  it('does not load or complete anything for a denied capture', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeEvent('49.00', 'USD', 'PAYMENT.CAPTURE.DENIED') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(0)
  })
})
