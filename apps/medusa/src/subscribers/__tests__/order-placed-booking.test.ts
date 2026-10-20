import { describe, it, expect, vi } from 'vitest'
import { orderSessionBookingUrl } from '../order-placed'

/**
 * KI079: every session order mail sent the buyer to the free discovery call.
 * The link now opens the session event that matches the bought length, with
 * the buyer's name and email filled in.
 */

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))
vi.mock('../../modules/memberships', () => ({ MEMBERSHIPS_MODULE: 'membershipsModule' }))
vi.mock('../../modules/memberships/service', () => ({ default: class {} }))
vi.mock('../../automations/runtime', () => ({
  getAutomationQueue: vi.fn(),
  staffAlerter: () => ({ send: vi.fn(), reset: () => undefined }),
  createDryRunQueue: vi.fn(),
}))

const BASE = 'http://169.239.180.49:3002/suzanneravenall'
const privateSessions = [{ handle: 'private-sessions' }]
const sessionItem = (handle: string, title: string, variant: string) => ({
  variant: { title: variant, product: { handle, title, categories: privateSessions } },
})
const buyer = { email: 'johan@aiautomations.co.za', first_name: 'Johan', last_name: 'QA Test' }

describe('orderSessionBookingUrl', () => {
  it('books a 90 minute variant on session-90 with the buyer filled in', () => {
    const url = orderSessionBookingUrl(
      { customer: buyer, items: [sessionItem('rapid-repatterning-session', 'Rapid Repatterning Session', '90 min online')] },
      BASE
    )
    expect(url).toBe(`${BASE}/session-90?name=Johan+QA+Test&email=johan%40aiautomations.co.za`)
  })

  it('never points a session order at the discovery call', () => {
    const url = orderSessionBookingUrl(
      { customer: buyer, items: [sessionItem('executive-coaching-30-mins', 'Executive Coaching Session', '30 min')] },
      BASE
    )
    expect(url).not.toContain('discovery-call')
    expect(url.startsWith(`${BASE}/session-30?`)).toBe(true)
  })

  it('books the 45 minute event for Exploring the Alpha Mind under a private-sessions sub-category', () => {
    const url = orderSessionBookingUrl(
      {
        customer: buyer,
        items: [
          {
            variant: {
              title: 'Package of 05',
              product: {
                handle: 'exploring-the-alpha-mind-45-minutes',
                title: 'Exploring the Alpha Mind',
                categories: [{ handle: 'exploring-the-alpha-mind', parent_category: { handle: 'private-sessions' } }],
              },
            },
          },
        ],
      },
      BASE
    )
    expect(url.startsWith(`${BASE}/session-45?`)).toBe(true)
  })

  it('picks the session line out of a mixed order', () => {
    const book = { variant: { title: 'Paperback', product: { handle: 'the-book', title: 'The Book', categories: [{ handle: 'books' }] } } }
    const url = orderSessionBookingUrl(
      { customer: buyer, items: [book, sessionItem('akashic-clearing-session', 'Akashic Coaching / Clearing Session', '90 min')] },
      BASE
    )
    expect(url.startsWith(`${BASE}/session-90?`)).toBe(true)
  })

  it('takes the name from the billing address when the customer has none', () => {
    const url = orderSessionBookingUrl(
      {
        customer: { email: 'guest@example.com' },
        billing_address: { first_name: 'Guest', last_name: 'Buyer' },
        items: [sessionItem('transformation-coaching-60-mins', 'Transformation Coaching Session', 'Package of 04')],
      },
      BASE
    )
    expect(url).toBe(`${BASE}/session-60?name=Guest+Buyer&email=guest%40example.com`)
  })
})
