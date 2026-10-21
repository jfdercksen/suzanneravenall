import { createHmac } from 'crypto'
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@medusajs/framework/utils', () => ({
  AbstractPaymentProvider: class {
    constructor(_c: unknown, _o: unknown) {}
  },
}))

import PayPalPaymentProvider from '../provider'

const SECRET = 'test-secret'
const provider = new PayPalPaymentProvider({}, {
  clientId: 'id',
  clientSecret: SECRET,
  sandboxMode: true,
  siteUrl: 'http://site',
  webhookId: '',
})

const proof = (cart: string, order: string, capture: string, cents: number, cur: string, key = SECRET) =>
  createHmac('sha256', key).update(`${cart}:${order}:${capture}:${cents}:${cur}`).digest('hex')

const valid = {
  cart_id: 'cart_1',
  paypal_order_id: 'ORDER1',
  capture_id: 'CAP1',
  amount_cents: 55500,
  currency_code: 'USD',
  capture_proof: proof('cart_1', 'ORDER1', 'CAP1', 55500, 'USD'),
}

async function initiate(data: Record<string, unknown>, amount: unknown = 55500, currency = 'usd') {
  return provider.initiatePayment({ amount, currency_code: currency, data, context: {} } as never)
}

afterEach(() => vi.unstubAllGlobals())

describe('PayPal provider: captured session from the web capture route (D021)', () => {
  it('marks a session captured for a valid proof, without calling PayPal', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const out = await initiate(valid)
    expect((out.data as { status: string }).status).toBe('captured')
    expect((out.data as { captureId: string }).captureId).toBe('CAP1')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a BigNumber-like amount', async () => {
    const out = await initiate(valid, { numeric: 55500 })
    expect((out.data as { status: string }).status).toBe('captured')
  })

  it.each([
    ['a forged proof', { ...valid, capture_proof: proof('cart_1', 'ORDER1', 'CAP1', 55500, 'USD', 'guess') }, 55500, 'usd'],
    ['a proof for another amount than the cart', valid, 100, 'usd'],
    ['a proof in another currency than the cart', valid, 55500, 'zar'],
    ['no proof at all', { cart_id: 'cart_1' }, 55500, 'usd'],
  ])('refuses %s (falls through and needs a cart context)', async (_label, data, amount, currency) => {
    vi.stubGlobal('fetch', vi.fn())
    await expect(initiate(data, amount, currency)).rejects.toThrow('cart_id is required')
  })

  it('authorises a captured session as captured, so the order reads as paid', async () => {
    const out = await provider.authorizePayment({ data: { status: 'captured' } } as never)
    expect(out.status).toBe('captured')
  })

  it('leaves a session pending while PayPal has not taken the money', async () => {
    const out = await provider.authorizePayment({ data: { status: 'pending' } } as never)
    expect(out.status).toBe('pending')
  })

  it('does not capture a second time at PayPal', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const out = await provider.capturePayment({ data: { orderId: 'ORDER1', status: 'captured' } } as never)
    expect((out.data as { status: string }).status).toBe('captured')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refunds against the stored capture id without looking the order up', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/v1/oauth2/token')) return { ok: true, json: async () => ({ access_token: 't' }) }
      return { ok: true, json: async () => ({ id: 'REF1' }), text: async () => '' }
    })
    vi.stubGlobal('fetch', fetchMock)
    const out = await provider.refundPayment({ amount: 55500, data: { orderId: 'ORDER1', captureId: 'CAP1', currencyCode: 'USD' } } as never)
    expect((out.data as { refund_id: string }).refund_id).toBe('REF1')
    const urls = fetchMock.mock.calls.map((c) => String(c[0]))
    expect(urls.some((u) => u.includes('/v2/payments/captures/CAP1/refund'))).toBe(true)
    expect(urls.some((u) => u.includes('/v2/checkout/orders/'))).toBe(false)
  })
})
