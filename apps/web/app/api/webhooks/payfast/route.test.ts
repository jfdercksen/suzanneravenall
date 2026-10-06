import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/log', () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

import { logError } from '@/lib/log'
import { POST } from './route'
import { payfastSignature } from '@/lib/payfast-signature'

const MEDUSA_BASE = 'http://medusa-test:9000'
const PASSPHRASE = 'test-passphrase'

// Same helper as the route, so the test ITN passes the signature check.
const sign = (params: Record<string, string>) => payfastSignature(params, PASSPHRASE)

function makeItn(amountGross: string, status = 'COMPLETE'): Request {
  const params: Record<string, string> = {
    m_payment_id: 'cart_1',
    pf_payment_id: '123456',
    payment_status: status,
    amount_gross: amountGross,
  }
  const body = new URLSearchParams({ ...params, signature: sign(params) }).toString()
  return new Request('http://localhost/api/webhooks/payfast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-forwarded-for': '127.0.0.1',
    },
    body,
  })
}

// Answers the PayFast validate call, the Medusa cart GET and the /complete POST.
interface FakeResponse {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}

function makeFetchMock({ cartTotal = 199500, cartOk = true } = {}) {
  return vi.fn(async (url: string | URL): Promise<FakeResponse> => {
    const href = url.toString()
    if (href.includes('payfast.co.za')) {
      return { ok: true, status: 200, text: async () => 'VALID' }
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
      json: async () => ({ cart: { id: 'cart_1', total: cartTotal, currency_code: 'zar' } }),
    }
  })
}

function completeCalls(fetchMock: ReturnType<typeof makeFetchMock>) {
  return fetchMock.mock.calls.filter(([u]) => u.toString().endsWith('/complete'))
}

describe('POST /api/webhooks/payfast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MEDUSA_BACKEND_URL = MEDUSA_BASE
    process.env.PAYFAST_PASSPHRASE = PASSPHRASE
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.PAYFAST_PASSPHRASE
  })

  it('completes the cart when amount_gross matches the cart total', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeItn('1995.00') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(1)
    expect(completeCalls(fetchMock)[0]?.[0]).toBe(`${MEDUSA_BASE}/store/carts/cart_1/complete`)
  })

  it('does not complete the cart when amount_gross is less than the cart total', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeItn('1.00') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(0)
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Amount mismatch'),
      undefined,
      expect.objectContaining({ cartId: 'cart_1', expected: 199500, received: 100 }),
    )
  })

  it('does not complete the cart when the cart cannot be loaded', async () => {
    const fetchMock = makeFetchMock({ cartOk: false })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeItn('1995.00') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(0)
  })

  it('does not load or complete anything for a non-COMPLETE status', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(makeItn('1995.00', 'CANCELLED') as never)
    expect(res.status).toBe(200)
    expect(completeCalls(fetchMock)).toHaveLength(0)
  })

  it('ignores an ITN with a bad signature', async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const req = new Request('http://localhost/api/webhooks/payfast', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: 'm_payment_id=cart_1&payment_status=COMPLETE&amount_gross=1995.00&signature=bad',
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('PayFast ITN source IP', () => {
  it('drops an ITN from an address outside the PayFast ranges', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const req = makeItn('1995.00')
    req.headers.set('x-forwarded-for', '8.8.8.8')
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
