import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const reconcileCart = vi.fn()
const findStuckPayments = vi.fn()

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { PG_CONNECTION: '__pg_connection__' } }))
vi.mock('../../../../automations/runtime', () => ({ getAutomationQueue: () => ({ queue: true }) }))
vi.mock('../../../../automations/payment-reconcile', async (orig) => ({
  ...(await orig<typeof import('../../../../automations/payment-reconcile')>()),
  reconcileCart: (...args: unknown[]) => reconcileCart(...args),
  findStuckPayments: (...args: unknown[]) => findStuckPayments(...args),
}))

import { POST } from '../route'

const CART = 'cart_01M5EYB2TTWV99QPDH42NM6HXP'

function call(headers: Record<string, string>, body: unknown) {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  const req = { headers, body, scope: { resolve: () => ({ raw: vi.fn() }) } }
  return { req, res: { status, json }, json, status }
}

describe('POST /hooks/payment-reconcile', () => {
  const saved = { ...process.env }
  beforeEach(() => {
    process.env.INTERNAL_WEBHOOK_SECRET = 's3cret'
    delete process.env.AUTOMATION_PAYMENT_RECONCILE
    reconcileCart.mockReset().mockResolvedValue('recovered')
  })
  afterEach(() => {
    process.env = { ...saved }
  })

  it('returns the reconcile status for the cart', async () => {
    const c = call({ 'x-webhook-secret': 's3cret' }, { cart_id: CART })
    await POST(c.req as never, c.res as never)
    expect(c.json).toHaveBeenCalledWith({ status: 'recovered' })
    const { find } = reconcileCart.mock.calls[0][0] as { find: (ms: number) => Promise<unknown> }
    await find(0)
    expect(findStuckPayments).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ cartId: CART, minAgeMs: 0 }))
  })

  it('answers 500 when the shared secret is not configured', async () => {
    delete process.env.INTERNAL_WEBHOOK_SECRET
    delete process.env.N8N_WEBHOOK_SECRET
    const c = call({ 'x-webhook-secret': 'anything' }, { cart_id: CART })
    await POST(c.req as never, c.res as never)
    expect(c.status).toHaveBeenCalledWith(500)
    expect(reconcileCart).not.toHaveBeenCalled()
  })

  it('answers 401 for a missing or wrong secret', async () => {
    for (const headers of [{}, { 'x-webhook-secret': 'wrong' }]) {
      const c = call(headers, { cart_id: CART })
      await POST(c.req as never, c.res as never)
      expect(c.status).toHaveBeenCalledWith(401)
    }
    expect(reconcileCart).not.toHaveBeenCalled()
  })

  it('answers 400 for a missing or malformed cart id', async () => {
    for (const body of [{}, { cart_id: 'cart_x; drop' }, undefined]) {
      const c = call({ 'x-webhook-secret': 's3cret' }, body)
      await POST(c.req as never, c.res as never)
      expect(c.status).toHaveBeenCalledWith(400)
    }
  })

  it('holds when the automation is off, and answers 500 when the reconcile throws', async () => {
    process.env.AUTOMATION_PAYMENT_RECONCILE = 'off'
    const off = call({ 'x-webhook-secret': 's3cret' }, { cart_id: CART })
    await POST(off.req as never, off.res as never)
    expect(off.json).toHaveBeenCalledWith({ status: 'held' })

    delete process.env.AUTOMATION_PAYMENT_RECONCILE
    reconcileCart.mockRejectedValueOnce(new Error('db down'))
    const broken = call({ 'x-webhook-secret': 's3cret' }, { cart_id: CART })
    await POST(broken.req as never, broken.res as never)
    expect(broken.status).toHaveBeenCalledWith(500)
  })
})
