import { describe, it, expect } from 'vitest'
import { outstandingCapture, planOrderCancel, toAmount, type CancelPlanOrder, type CancelPlanPayment } from '../cancel-plan'

const order = (payments: CancelPlanPayment[] | null): CancelPlanOrder => ({
  id: 'order_1',
  payment_collections: [{ payments }],
})

describe('planOrderCancel', () => {
  it('keeps a captured PayFast payment captured', () => {
    const plan = planOrderCancel(order([{ id: 'pay_1', provider_id: 'pp_payfast_payfast', captures: [{ amount: 165 }], refunds: [] }]))
    expect(plan).toEqual({ kind: 'keep-payfast-capture', payfastOutstanding: 165, uncapturedPaymentIds: [] })
  })

  it('reads BigNumber-like amounts', () => {
    const plan = planOrderCancel(order([{ id: 'pay_1', provider_id: 'pp_payfast_payfast', captures: [{ amount: { numeric: 165 } }] }]))
    expect(plan).toMatchObject({ kind: 'keep-payfast-capture', payfastOutstanding: 165 })
  })

  it('uses the core cancel for an uncaptured PayFast payment', () => {
    expect(planOrderCancel(order([{ id: 'pay_1', provider_id: 'pp_payfast_payfast', captures: [] }]))).toEqual({ kind: 'core' })
  })

  it('uses the core cancel once the PayFast capture is fully refunded', () => {
    const plan = planOrderCancel(order([{ id: 'pay_1', provider_id: 'pp_payfast_payfast', captures: [{ amount: 165 }], refunds: [{ amount: 165 }] }]))
    expect(plan).toEqual({ kind: 'core' })
  })

  it('flags only the balance left after a partial refund', () => {
    const plan = planOrderCancel(order([{ id: 'pay_1', provider_id: 'pp_payfast_payfast', captures: [{ amount: 165 }], refunds: [{ amount: 65 }] }]))
    expect(plan).toMatchObject({ kind: 'keep-payfast-capture', payfastOutstanding: 100 })
  })

  it('uses the core cancel for PayPal, whose refunds are real', () => {
    expect(planOrderCancel(order([{ id: 'pay_1', provider_id: 'pp_paypal_paypal', captures: [{ amount: 50 }] }]))).toEqual({ kind: 'core' })
  })

  it('uses the core cancel for an order with no payments', () => {
    expect(planOrderCancel({ id: 'order_1' })).toEqual({ kind: 'core' })
    expect(planOrderCancel(order(null))).toEqual({ kind: 'core' })
  })

  it('refuses when another provider also holds a captured payment', () => {
    const plan = planOrderCancel(order([
      { id: 'pay_1', provider_id: 'pp_payfast_payfast', captures: [{ amount: 100 }] },
      { id: 'pay_2', provider_id: 'pp_paypal_paypal', captures: [{ amount: 20 }] },
    ]))
    expect(plan.kind).toBe('refuse')
  })

  it('lists uncaptured payments for cancellation next to the kept capture', () => {
    const plan = planOrderCancel(order([
      { id: 'pay_1', provider_id: 'pp_payfast_payfast', captures: [{ amount: 100 }] },
      { id: 'pay_2', provider_id: 'pp_payfast_payfast', captures: [] },
    ]))
    expect(plan).toMatchObject({ kind: 'keep-payfast-capture', uncapturedPaymentIds: ['pay_2'] })
  })
})

describe('amount helpers', () => {
  it('treats junk as zero and never goes negative', () => {
    expect(toAmount('abc')).toBe(0)
    expect(toAmount(null)).toBe(0)
    expect(outstandingCapture({ id: 'p', captures: [{ amount: 10 }], refunds: [{ amount: 30 }] })).toBe(0)
  })
})
