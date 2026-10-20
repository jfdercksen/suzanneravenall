import { createHmac } from 'crypto'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@medusajs/framework/utils', () => ({
  AbstractPaymentProvider: class {
    constructor(_c: unknown, _o: unknown) {}
  },
}))

import PayFastPaymentProvider from '../provider'

const PASS = 'test-pass'
const provider = new PayFastPaymentProvider({}, {
  merchantId: 'm',
  merchantKey: 'k',
  passphrase: PASS,
  sandboxMode: true,
  siteUrl: 'http://site',
})
const proof = (cart: string, pf: string, cents: number, key = PASS) =>
  createHmac('sha256', key).update(`${cart}:${pf}:${cents}`).digest('hex')

async function statusFor(data: Record<string, unknown>, amount: unknown = 16500) {
  const out = await provider.initiatePayment({ amount, currency_code: 'zar', data, context: {} } as never)
  return (out.data as { status: string }).status
}

describe('PayFast provider session authorisation', () => {
  it('authorises with a valid ITN proof for the cart amount', async () => {
    expect(await statusFor({ cart_id: 'cart_1', pf_payment_id: '9', amount_cents: 16500, itn_proof: proof('cart_1', '9', 16500) })).toBe('authorized')
  })

  it('accepts a BigNumber-like amount', async () => {
    expect(
      await statusFor({ cart_id: 'cart_1', pf_payment_id: '9', amount_cents: 16500, itn_proof: proof('cart_1', '9', 16500) }, { numeric: 16500 })
    ).toBe('authorized')
  })

  it('stays pending without a proof', async () => {
    expect(await statusFor({ cart_id: 'cart_1' })).toBe('pending')
  })

  it('stays pending with a forged proof', async () => {
    expect(await statusFor({ cart_id: 'cart_1', pf_payment_id: '9', amount_cents: 16500, itn_proof: proof('cart_1', '9', 16500, 'guess') })).toBe('pending')
  })

  it('stays pending when the proof is for a different amount than the session', async () => {
    expect(await statusFor({ cart_id: 'cart_1', pf_payment_id: '9', amount_cents: 100, itn_proof: proof('cart_1', '9', 100) })).toBe('pending')
  })

  it('stays pending when the proof is for another cart', async () => {
    expect(await statusFor({ cart_id: 'cart_1', pf_payment_id: '9', amount_cents: 16500, itn_proof: proof('cart_2', '9', 16500) })).toBe('pending')
  })
})

describe('PayFast provider authorisation and capture (KI086)', () => {
  async function authorizeFor(data: Record<string, unknown>) {
    const session = await provider.initiatePayment({ amount: 16500, currency_code: 'zar', data, context: {} } as never)
    return provider.authorizePayment({ data: session.data, context: {} } as never)
  }

  it('reports a verified ITN payment as captured so Medusa records the capture', async () => {
    const out = await authorizeFor({ cart_id: 'cart_1', pf_payment_id: '9', amount_cents: 16500, itn_proof: proof('cart_1', '9', 16500) })
    expect(out.status).toBe('captured')
    expect((out.data as { status: string }).status).toBe('captured')
  })

  it('keeps an unverified session pending, so it is neither authorised nor captured', async () => {
    const out = await authorizeFor({ cart_id: 'cart_1' })
    expect(out.status).toBe('pending')
  })

  it('keeps a forged proof pending', async () => {
    const out = await authorizeFor({ cart_id: 'cart_1', pf_payment_id: '9', amount_cents: 16500, itn_proof: proof('cart_1', '9', 16500, 'guess') })
    expect(out.status).toBe('pending')
  })

  it('stays captured when authorisation runs again on already captured data', async () => {
    const out = await provider.authorizePayment({ data: { cartId: 'cart_1', status: 'captured' }, context: {} } as never)
    expect(out.status).toBe('captured')
  })

  it('reads captured session data back as captured', async () => {
    expect(await provider.getPaymentStatus({ data: { status: 'captured' } } as never)).toEqual({ status: 'captured' })
  })
})

describe('PayFast provider updatePayment (KI086)', () => {
  it('re-checks the proof, so an update with a forged proof never reaches captured', async () => {
    const out = await provider.updatePayment({
      amount: 16500,
      currency_code: 'zar',
      data: { cart_id: 'cart_1', pf_payment_id: '9', amount_cents: 16500, itn_proof: proof('cart_1', '9', 16500, 'guess'), status: 'captured' },
      context: {},
    } as never)
    expect((out.data as { status: string }).status).toBe('pending')
    const auth = await provider.authorizePayment({ data: out.data, context: {} } as never)
    expect(auth.status).toBe('pending')
  })
})
