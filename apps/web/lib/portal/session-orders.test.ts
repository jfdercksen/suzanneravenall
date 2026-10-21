import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/log', () => ({ logError: vi.fn() }))
vi.mock('@/lib/medusa/admin-client', () => ({ medusaAdminFetch: vi.fn() }))
vi.mock('@/lib/medusa/get-customer-id', () => ({ getMedusaCustomerIds: vi.fn() }))

import { orderGivesSessions, sessionLinesOf, type MedusaSessionOrder } from './session-orders'

const SESSION_PRODUCT = {
  title: 'Resonance Repatterning / Coaching Session',
  handle: 'resonance-repatterning-sessions',
  categories: [{ handle: 'resonance-repatterning', parent_category: { handle: 'private-sessions' } }],
}
const COURSE_PRODUCT = {
  title: 'Getting Unstuck',
  handle: 'getting-unstuck',
  categories: [{ handle: 'rp-self-paced' }],
}

function order(overrides: Partial<MedusaSessionOrder> = {}): MedusaSessionOrder {
  return {
    id: 'order_1',
    status: 'pending',
    payment_status: 'captured',
    total: 220000,
    created_at: '2026-10-21T08:00:00Z',
    items: [
      { quantity: 1, variant: { title: 'Package of 04 (60 min online)', product: SESSION_PRODUCT } },
      { quantity: 1, variant: { title: 'Self Study', product: COURSE_PRODUCT } },
    ],
    ...overrides,
  }
}

describe('orderGivesSessions', () => {
  it.each(['captured', 'authorized', 'partially_refunded'])('counts a %s order', (payment_status) => {
    expect(orderGivesSessions(order({ payment_status }))).toBe(true)
  })

  it('counts a voucher order that came to R0', () => {
    expect(orderGivesSessions(order({ payment_status: 'not_paid', total: 0 }))).toBe(true)
  })

  it.each([
    ['cancelled', { status: 'canceled' }],
    ['refunded', { payment_status: 'refunded' }],
    ['unpaid', { payment_status: 'not_paid' }],
  ])('does not count a %s order', (_label, overrides) => {
    expect(orderGivesSessions(order(overrides as Partial<MedusaSessionOrder>))).toBe(false)
  })
})

describe('sessionLinesOf', () => {
  it('keeps only session lines of orders that count', () => {
    const lines = sessionLinesOf([order(), order({ id: 'order_2', status: 'canceled' })])
    expect(lines).toEqual([
      {
        productTitle: 'Resonance Repatterning / Coaching Session',
        productHandle: 'resonance-repatterning-sessions',
        variantTitle: 'Package of 04 (60 min online)',
        quantity: 1,
        purchasedAt: '2026-10-21T08:00:00Z',
      },
    ])
  })
})
