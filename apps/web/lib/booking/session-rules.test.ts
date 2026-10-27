import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BookingEvent } from '@/lib/portal/session-bookings'
import {
  applyNoticeRule,
  changeTime,
  parseNoShowEvent,
  runNoShowUpdate,
  type RuleBookingRow,
  type RuleDeps,
  type SessionRuleStore,
} from './session-rules'

vi.mock('@/lib/email/site-url', () => ({ siteUrl: () => 'https://site.test' }))

const sast = (local: string) => new Date(`${local}+02:00`)
const TOKEN = 't'.repeat(43)

function row(overrides: Partial<RuleBookingRow> = {}): RuleBookingRow {
  return {
    booking_uid: 'bk_1',
    rescheduled_from_uid: null,
    attendee_email: 'johan+rules@example.com',
    attendee_name: 'Johan QA',
    event_slug: 'session-60',
    title: 'Session (60 min)',
    status: 'cancelled',
    start_time: sast('2026-10-28T10:00:00').toISOString(),
    end_time: sast('2026-10-28T11:00:00').toISOString(),
    over_limit_at: null,
    no_show_at: null,
    late_change_at: null,
    late_change_kind: null,
    late_change_by_staff: false,
    credit_restored_at: null,
    ...overrides,
  }
}

function memoryStore(rows: RuleBookingRow[]): SessionRuleStore & { rows: Map<string, RuleBookingRow & { staff_token?: string }> } {
  const map = new Map<string, RuleBookingRow & { staff_token?: string }>(rows.map((r) => [r.booking_uid, { ...r }]))
  return {
    rows: map,
    async get(uid) {
      return map.get(uid) ?? null
    },
    async byStaffToken(token) {
      return [...map.values()].find((r) => r.staff_token === token) ?? null
    },
    async markLate(uid, { at, kind, staffToken, byStaff }) {
      const r = map.get(uid)
      if (!r || r.late_change_at) return false
      Object.assign(r, {
        late_change_at: at.toISOString(),
        late_change_kind: kind,
        late_change_by_staff: byStaff,
        staff_token: staffToken,
        credit_restored_at: byStaff ? at.toISOString() : null,
      })
      return true
    },
    async unflagReplacement(uid) {
      for (const r of map.values()) {
        if (r.rescheduled_from_uid === uid && r.status === 'over_limit') Object.assign(r, { status: 'rescheduled', over_limit_at: null })
      }
    },
    async setNoShow(uid, at) {
      const r = map.get(uid)
      if (!r) return false
      r.no_show_at = at ? at.toISOString() : null
      return true
    },
    async setCreditRestored(token, at) {
      const r = [...map.values()].find((x) => x.staff_token === token)
      if (!r || Boolean(r.credit_restored_at) === Boolean(at)) return false
      r.credit_restored_at = at ? at.toISOString() : null
      return true
    },
  }
}

function deps(store: SessionRuleStore): RuleDeps & { mailClient: ReturnType<typeof vi.fn>; alertStaff: ReturnType<typeof vi.fn> } {
  return {
    store,
    mailClient: vi.fn().mockResolvedValue('msg_1'),
    alertStaff: vi.fn().mockResolvedValue('sent'),
    newToken: () => TOKEN,
  }
}

function event(overrides: Partial<BookingEvent> = {}): BookingEvent {
  return {
    trigger: 'BOOKING_CANCELLED',
    uid: 'bk_1',
    previousUid: null,
    previousCalId: null,
    email: 'johan+rules@example.com',
    name: 'Johan QA',
    slug: 'session-60',
    title: null,
    durationMinutes: 60,
    start: sast('2026-10-28T10:00:00').toISOString(),
    end: sast('2026-10-28T11:00:00').toISOString(),
    calId: null,
    location: null,
    payload: { cancelledBy: 'johan+rules@example.com', organizer: { email: 'host@example.com' } },
    ...overrides,
  }
}

// Mon 26 Oct 09:00 SAST to Wed 28 Oct 10:00: 8 + 9 + 2 = 19 working hours.
const LATE = sast('2026-10-26T09:00:00')
// Mon 19 Oct 09:00 to Wed 28 Oct 10:00: well over 48.
const EARLY = sast('2026-10-19T09:00:00')

describe('applyNoticeRule', () => {
  beforeEach(() => vi.stubEnv('AUTOMATION_SESSION_NOTICE', 'code'))
  afterEach(() => vi.unstubAllEnvs())

  it('does nothing unless AUTOMATION_SESSION_NOTICE=code, and only logs in a dry run', async () => {
    const store = memoryStore([row()])
    const d = deps(store)
    vi.stubEnv('AUTOMATION_SESSION_NOTICE', 'off')
    expect(await applyNoticeRule(event(), 'cancelled', LATE, d)).toBe('off')
    vi.stubEnv('AUTOMATION_SESSION_NOTICE', 'code')
    vi.stubEnv('AUTOMATION_DRY_RUN', 'true')
    expect(await applyNoticeRule(event(), 'cancelled', LATE, d)).toBe('dry-run')
    expect(store.rows.get('bk_1')?.late_change_at).toBeNull()
    expect(d.mailClient).not.toHaveBeenCalled()
    expect(d.alertStaff).not.toHaveBeenCalled()
  })

  it('marks a late cancel, mails the client and alerts staff with the give-back link', async () => {
    vi.stubEnv('SESSION_ALERT_EMAIL', 'johan+shayna@example.com')
    const store = memoryStore([row()])
    const d = deps(store)
    expect(await applyNoticeRule(event(), 'cancelled', LATE, d)).toBe('late')
    expect(store.rows.get('bk_1')).toMatchObject({ late_change_kind: 'cancelled', staff_token: TOKEN })
    expect(d.mailClient).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'johan+rules@example.com', firstName: 'Johan', kind: 'cancelled', newDateLabel: null }),
    )
    const alert = d.alertStaff.mock.calls[0]![0] as { to: string; lines: string[]; subject: string }
    expect(alert.to).toBe('johan+shayna@example.com')
    expect(alert.subject).toMatch(/cancelled a session at short notice/)
    expect(alert.lines.join('\n')).toContain(`https://site.test/staff/booking/${TOKEN}`)
    expect(alert.lines.join('\n')).toContain('19 h of the 48 working hours')
    // POPIA: the alert carries no client address; the staff page shows it.
    expect(alert.lines.join('\n')).not.toContain('johan+rules@example.com')
  })

  it('leaves a cancel with enough notice alone', async () => {
    const store = memoryStore([row()])
    const d = deps(store)
    expect(await applyNoticeRule(event(), 'cancelled', EARLY, d)).toBe('in-time')
    expect(store.rows.get('bk_1')?.late_change_at).toBeNull()
    expect(d.mailClient).not.toHaveBeenCalled()
  })

  it('puts a late move on the booking it moved away from and names the new time', async () => {
    const store = memoryStore([
      row({ status: 'booked' }),
      row({ booking_uid: 'bk_2', rescheduled_from_uid: 'bk_1', status: 'rescheduled', start_time: sast('2026-11-04T10:00:00').toISOString() }),
    ])
    const d = deps(store)
    const moved = event({
      trigger: 'BOOKING_RESCHEDULED',
      uid: 'bk_2',
      previousUid: 'bk_1',
      start: sast('2026-11-04T10:00:00').toISOString(),
      end: sast('2026-11-04T11:00:00').toISOString(),
      payload: { rescheduledBy: 'johan+rules@example.com' },
    })
    expect(await applyNoticeRule(moved, 'rescheduled', LATE, d)).toBe('late')
    expect(store.rows.get('bk_1')?.late_change_kind).toBe('rescheduled')
    expect(store.rows.get('bk_2')?.late_change_at).toBeNull()
    expect(d.mailClient).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rescheduled', newDateLabel: 'Wed, 04 November 2026' }))
  })

  it('gives back a late change under a staff address at once and asks staff to confirm (the address can be typed by anyone)', async () => {
    const store = memoryStore([row()])
    const d = deps(store)
    const organiser = event({ payload: { cancelledBy: 'HOST@example.com', organizer: { email: 'host@example.com' } } })
    expect(await applyNoticeRule(organiser, 'cancelled', LATE, d)).toBe('by-staff')
    expect(store.rows.get('bk_1')).toMatchObject({ late_change_by_staff: true, credit_restored_at: LATE.toISOString(), staff_token: TOKEN })
    expect(d.mailClient).not.toHaveBeenCalled()
    const alert = d.alertStaff.mock.calls[0]![0] as { subject: string; lines: string[] }
    expect(alert.subject).toMatch(/under a staff address/)
    expect(alert.lines.join('\n')).toContain(`count the session as used here: https://site.test/staff/booking/${TOKEN}`)

    vi.stubEnv('SESSION_STAFF_EMAILS', 'shayna@example.com, other@example.com')
    const listed = deps(memoryStore([row()]))
    expect(await applyNoticeRule(event({ payload: { cancelledBy: 'shayna@example.com' } }), 'cancelled', LATE, listed)).toBe('by-staff')
  })

  it('a staff change with enough notice is left alone like any other', async () => {
    const d = deps(memoryStore([row()]))
    expect(await applyNoticeRule(event({ payload: { cancelledBy: 'host@example.com', organizer: { email: 'host@example.com' } } }), 'cancelled', EARLY, d)).toBe('in-time')
    expect(d.alertStaff).not.toHaveBeenCalled()
  })

  it('treats a change with no named author as the client', async () => {
    const d = deps(memoryStore([row()]))
    expect(await applyNoticeRule(event({ payload: {} }), 'cancelled', LATE, d)).toBe('late')
  })

  it('skips bookings that held no session: over the package, a no-show, not a session event', async () => {
    expect(await applyNoticeRule(event(), 'cancelled', LATE, deps(memoryStore([row({ over_limit_at: LATE.toISOString() })])))).toBe('not-counted')
    expect(await applyNoticeRule(event(), 'cancelled', LATE, deps(memoryStore([row({ no_show_at: LATE.toISOString() })])))).toBe('not-counted')
    expect(await applyNoticeRule(event(), 'cancelled', LATE, deps(memoryStore([row({ event_slug: 'discovery-call' })])))).toBe('not-a-session')
  })

  it('sends nothing twice on a replayed delivery', async () => {
    const store = memoryStore([row()])
    const d = deps(store)
    await applyNoticeRule(event(), 'cancelled', LATE, d)
    expect(await applyNoticeRule(event(), 'cancelled', LATE, d)).toBe('already-marked')
    expect(d.mailClient).toHaveBeenCalledTimes(1)
    expect(d.alertStaff).toHaveBeenCalledTimes(1)
  })

  it('still alerts staff when the client mail fails, and never throws', async () => {
    const d = deps(memoryStore([row()]))
    d.mailClient.mockRejectedValue(new Error('brevo down'))
    expect(await applyNoticeRule(event(), 'cancelled', LATE, d)).toBe('late')
    expect(d.alertStaff).toHaveBeenCalledTimes(1)

    const broken = deps(memoryStore([]))
    broken.store.get = vi.fn().mockRejectedValue(new Error('db down'))
    expect(await applyNoticeRule(event(), 'cancelled', LATE, broken)).toBe('failed')
  })

  it('ignores outcomes other than a cancel or a move', async () => {
    expect(await applyNoticeRule(event(), 'created', LATE, deps(memoryStore([row()])))).toBe('not-applicable')
  })
})

describe('changeTime', () => {
  const now = new Date('2026-10-26T10:00:00Z')
  it('uses the delivery createdAt, not a future one', () => {
    expect(changeTime({ createdAt: '2026-10-26T09:00:00Z' }, now)).toEqual(new Date('2026-10-26T09:00:00Z'))
    expect(changeTime({ createdAt: '2026-10-27T09:00:00Z' }, now)).toBe(now)
    expect(changeTime({}, now)).toBe(now)
  })
})

describe('no-show', () => {
  const body = (noShow: boolean) => ({
    triggerEvent: 'BOOKING_NO_SHOW_UPDATED',
    createdAt: '2026-10-26T09:00:00Z',
    payload: { message: 'x', bookingUid: 'bk_1', bookingId: 7, attendees: [{ email: 'johan+rules@example.com', noShow }] },
  })

  it('parses the Cal.com no-show payload', () => {
    expect(parseNoShowEvent(body(true))).toEqual({ uid: 'bk_1', noShow: true })
    expect(parseNoShowEvent(body(false))).toEqual({ uid: 'bk_1', noShow: false })
    expect(parseNoShowEvent({ triggerEvent: 'BOOKING_CREATED', payload: {} })).toBeNull()
    expect(parseNoShowEvent({ triggerEvent: 'BOOKING_NO_SHOW_UPDATED', payload: { bookingUid: 'bk_1' } })).toBeNull()
  })

  it('marks and clears the booking', async () => {
    const store = memoryStore([row({ status: 'booked' })])
    const now = new Date('2026-10-26T10:00:00Z')
    expect(await runNoShowUpdate(body(true), () => store, now)).toBe('marked')
    expect(store.rows.get('bk_1')?.no_show_at).toBe('2026-10-26T09:00:00.000Z')
    expect(await runNoShowUpdate(body(false), () => store, now)).toBe('cleared')
    expect(store.rows.get('bk_1')?.no_show_at).toBeNull()
  })

  it('reports an unknown booking and a database failure without throwing', async () => {
    expect(await runNoShowUpdate(body(true), () => memoryStore([]))).toBe('unknown-booking')
    const broken = memoryStore([])
    broken.setNoShow = vi.fn().mockRejectedValue(new Error('db down'))
    expect(await runNoShowUpdate(body(true), () => broken)).toBe('failed')
    expect(await runNoShowUpdate({ triggerEvent: 'BOOKING_NO_SHOW_UPDATED' })).toBe('invalid-payload')
  })
})
