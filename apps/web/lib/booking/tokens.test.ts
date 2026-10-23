import { describe, it, expect, vi, beforeEach } from 'vitest'

type Result = { data: unknown; error: { message: string; code?: string } | null }

// A Supabase query stand-in: records every call, resolves to the next queued result.
const h = vi.hoisted(() => {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const results: Result[] = []
  const builder: Record<string, unknown> = {}
  for (const method of ['from', 'upsert', 'select', 'eq', 'is', 'update', 'order', 'limit']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args })
      return builder
    }
  }
  builder.maybeSingle = () => {
    calls.push({ method: 'maybeSingle', args: [] })
    return Promise.resolve(results.shift())
  }
  builder.then = (resolve: (r: Result | undefined) => unknown) => resolve(results.shift())
  return { calls, results, builder, enabled: { value: true } }
})
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => (h.enabled.value ? h.builder : null) }))

import {
  BOOKING_TOKEN_PATTERN,
  bookingGateUrl,
  findBookingToken,
  generateBookingToken,
  issueBookingToken,
  serviceKeyOf,
  type BookingTokenRecord,
} from './tokens'

const INPUT = {
  orderId: 'order_01',
  displayId: 431,
  email: ' Johan+Limit1023@AiAutomations.co.za ',
  name: 'Johan QA Test',
  line: { productTitle: 'Private Session', productHandle: 'private-session', variantTitle: 'Package of 04 (60 min online)', quantity: 1 },
}

const STORED: BookingTokenRecord = {
  id: 'tok_1',
  token: 'b'.repeat(43),
  order_id: null,
  order_display_id: 431,
  customer_email: 'johan+limit1023@aiautomations.co.za',
  customer_name: 'Johan QA Test',
  service_key: 'Private Session|60',
  service_name: 'Private Session',
  product_handle: 'private-session',
  variant_title: 'Package of 04 (60 min online)',
  duration_minutes: 60,
  credits: 4,
  last_used_at: null,
  created_at: '2026-10-23T08:00:00.000Z',
}

beforeEach(() => {
  h.calls.length = 0
  h.results.length = 0
  h.enabled.value = true
  process.env.NEXT_PUBLIC_SITE_URL = 'http://169.239.180.49'
})

describe('booking token basics', () => {
  it('generates url-safe 43-character tokens that the gate accepts, never the same twice', () => {
    const a = generateBookingToken()
    expect(a).toMatch(BOOKING_TOKEN_PATTERN)
    expect(generateBookingToken()).not.toBe(a)
  })

  it('keys a pool by service and length', () => {
    expect(serviceKeyOf(INPUT.line)).toBe('Private Session|60')
    expect(serviceKeyOf({ productTitle: 'Alpha Mind', productHandle: 'alpha-mind', variantTitle: 'Single' })).toBe('Alpha Mind|45')
  })

  it('builds the link on the site origin', () => {
    expect(bookingGateUrl('x'.repeat(43))).toBe(`http://169.239.180.49/book/${'x'.repeat(43)}`)
  })
})

describe('issueBookingToken', () => {
  it('inserts a row with the credits of the package and a lower-case email', async () => {
    h.results.push({ data: [{ ...STORED, order_id: 'order_01' }], error: null })
    const record = await issueBookingToken(INPUT)
    expect(record.order_id).toBe('order_01')
    const upsert = h.calls.find((c) => c.method === 'upsert')
    expect(upsert?.args[0]).toMatchObject({
      order_id: 'order_01',
      order_display_id: 431,
      customer_email: 'johan+limit1023@aiautomations.co.za',
      service_key: 'Private Session|60',
      duration_minutes: 60,
      credits: 4,
    })
    expect(upsert?.args[1]).toEqual({ onConflict: 'order_display_id,service_key', ignoreDuplicates: true })
  })

  it('multiplies by the quantity', async () => {
    h.results.push({ data: [STORED], error: null })
    await issueBookingToken({ ...INPUT, line: { ...INPUT.line, quantity: 2 } })
    expect(h.calls.find((c) => c.method === 'upsert')?.args[0]).toMatchObject({ credits: 8 })
  })

  it('returns the existing row on a second ask and fills in the order id the first issuer lacked', async () => {
    h.results.push({ data: [], error: null }, { data: STORED, error: null }, { data: null, error: null })
    const record = await issueBookingToken(INPUT)
    expect(record.token).toBe(STORED.token)
    expect(record.order_id).toBe('order_01')
    expect(h.calls.some((c) => c.method === 'update' && (c.args[0] as { order_id?: string }).order_id === 'order_01')).toBe(true)
  })

  it('names the migration when the table is missing', async () => {
    h.results.push({ data: null, error: { code: 'PGRST205', message: 'Could not find the table' } })
    await expect(issueBookingToken(INPUT)).rejects.toThrow(/20261023090000_booking_limits/)
  })

  it('throws when Supabase is not configured', async () => {
    h.enabled.value = false
    await expect(issueBookingToken(INPUT)).rejects.toThrow(/not configured/)
  })
})

describe('findBookingToken', () => {
  it('does not query for a malformed token', async () => {
    await expect(findBookingToken('../etc')).resolves.toBeNull()
    expect(h.calls).toHaveLength(0)
  })

  it('returns the row behind a token', async () => {
    h.results.push({ data: STORED, error: null })
    await expect(findBookingToken(STORED.token)).resolves.toEqual(STORED)
  })
})
