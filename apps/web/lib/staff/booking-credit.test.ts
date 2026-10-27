import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { RuleBookingRow, SessionRuleStore } from '@/lib/booking/session-rules'
import { handleBookingCredit } from './booking-credit'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))

const TOKEN = 'a'.repeat(43)
const NOW = new Date('2026-10-26T10:00:00Z')

function lateRow(overrides: Partial<RuleBookingRow> = {}): RuleBookingRow {
  return {
    booking_uid: 'bk_1',
    rescheduled_from_uid: null,
    attendee_email: 'johan+rules@example.com',
    attendee_name: 'Johan QA',
    event_slug: 'session-60',
    title: null,
    status: 'cancelled',
    start_time: '2026-10-28T08:00:00Z',
    end_time: '2026-10-28T09:00:00Z',
    over_limit_at: null,
    no_show_at: null,
    late_change_at: '2026-10-26T07:00:00Z',
    late_change_kind: 'cancelled',
    late_change_by_staff: false,
    credit_restored_at: null,
    ...overrides,
  }
}

function store(row: RuleBookingRow | null, changed = true): SessionRuleStore {
  return {
    get: vi.fn(),
    byStaffToken: vi.fn().mockResolvedValue(row),
    markLate: vi.fn(),
    setNoShow: vi.fn(),
    setCreditRestored: vi.fn().mockResolvedValue(changed),
    unflagReplacement: vi.fn().mockResolvedValue(undefined),
  }
}

function formPost(fields: Record<string, string>): NextRequest {
  return new NextRequest('http://web:3000/api/staff/booking-credit', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  })
}

describe('POST /api/staff/booking-credit (D024)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('gives the session back and returns to the page', async () => {
    const s = store(lateRow())
    const recheck = vi.fn()
    const res = await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => s, NOW, recheck)
    expect(recheck).not.toHaveBeenCalled()
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`/staff/booking/${TOKEN}?done=restored`)
    expect(s.setCreditRestored).toHaveBeenCalledWith(TOKEN, NOW)
  })

  it('a late move given back also frees its new booking from over_limit, again on a second click', async () => {
    const s = store(lateRow({ late_change_kind: 'rescheduled' }))
    await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => s, NOW)
    expect(s.unflagReplacement).toHaveBeenCalledWith('bk_1')
    const again = store(lateRow({ late_change_kind: 'rescheduled' }), false)
    await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => again, NOW)
    expect(again.unflagReplacement).toHaveBeenCalledWith('bk_1')
    const cancel = store(lateRow())
    await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => cancel, NOW)
    expect(cancel.unflagReplacement).not.toHaveBeenCalled()
  })

  it('refuses a link older than 60 days (404)', async () => {
    const s = store(lateRow({ late_change_at: '2026-08-01T07:00:00Z' }))
    expect((await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => s, NOW)).status).toBe(404)
    expect(s.setCreditRestored).not.toHaveBeenCalled()
  })

  it('counts it as used again and re-checks the package', async () => {
    const s = store(lateRow({ credit_restored_at: '2026-10-26T08:00:00Z' }))
    const recheck = vi.fn().mockResolvedValue('within')
    const res = await handleBookingCredit(formPost({ token: TOKEN, action: 'use' }), () => s, NOW, recheck)
    expect(res.headers.get('location')).toBe(`/staff/booking/${TOKEN}?done=used`)
    expect(s.setCreditRestored).toHaveBeenCalledWith(TOKEN, null)
    expect(recheck).toHaveBeenCalledWith('johan+rules@example.com', 'Johan')
  })

  it('says unchanged on a double click', async () => {
    const res = await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => store(lateRow(), false), NOW)
    expect(res.headers.get('location')).toBe(`/staff/booking/${TOKEN}?done=unchanged`)
  })

  it('accepts JSON as well', async () => {
    const req = new NextRequest('http://web:3000/api/staff/booking-credit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: TOKEN, action: 'restore' }),
    })
    expect((await handleBookingCredit(req, () => store(lateRow()), NOW)).status).toBe(303)
  })

  it('refuses a short token or an unknown action (400)', async () => {
    expect((await handleBookingCredit(formPost({ token: 'short', action: 'restore' }), () => store(lateRow()))).status).toBe(400)
    expect((await handleBookingCredit(formPost({ token: TOKEN, action: 'delete' }), () => store(lateRow()))).status).toBe(400)
    expect((await handleBookingCredit(formPost({ action: 'restore' }), () => store(lateRow()))).status).toBe(400)
  })

  it('answers 404 for an unknown token or a booking that was not a late change', async () => {
    expect((await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => store(null))).status).toBe(404)
    const notLate = store(lateRow({ late_change_at: null }))
    expect((await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => notLate)).status).toBe(404)
    expect(notLate.setCreditRestored).not.toHaveBeenCalled()
  })

  it('answers 500 without details when the database fails', async () => {
    const broken = store(lateRow())
    broken.byStaffToken = vi.fn().mockRejectedValue(new Error('relation "secret" does not exist'))
    const res = await handleBookingCredit(formPost({ token: TOKEN, action: 'restore' }), () => broken)
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('secret')
  })
})
