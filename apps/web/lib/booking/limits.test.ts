import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  findBookingToken: vi.fn(),
  logError: vi.fn(),
}))
vi.mock('./tokens', () => ({ findBookingToken: h.findBookingToken }))
vi.mock('@/lib/log', () => ({ logError: h.logError }))
vi.mock('@/lib/portal/session-orders', () => ({ fetchMemberSessionLines: vi.fn() }))
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => null }))
vi.mock('@/lib/email/booking-over-limit', () => ({ sendBookingOverLimitEmail: vi.fn() }))
vi.mock('@/lib/integrations/staff-alert', () => ({ sendStaffAlert: vi.fn() }))

import {
  calcomUrlForToken,
  checkBookingLimit,
  decideGate,
  tokenAsLine,
  tokenFromPayload,
  type LimitDeps,
  type OverLimitDeps,
} from './limits'
import type { BookingTokenRecord } from './tokens'
import type { BookingEvent } from '@/lib/portal/session-bookings'
import type { PurchasedSessionLine } from '@/lib/portal/session-credits'

const TOKEN = 'a'.repeat(43)
const EMAIL = 'johan+limit1023@aiautomations.co.za'

function record(overrides: Partial<BookingTokenRecord> = {}): BookingTokenRecord {
  return {
    id: 'tok_1',
    token: TOKEN,
    order_id: 'order_1',
    order_display_id: 431,
    customer_email: EMAIL,
    customer_name: 'Johan QA Test',
    service_key: 'Private Session|60',
    service_name: 'Private Session',
    product_handle: 'private-session',
    variant_title: 'Package of 04 (60 min online)',
    duration_minutes: 60,
    credits: 4,
    last_used_at: null,
    created_at: '2026-10-23T08:00:00.000Z',
    ...overrides,
  }
}

const PACKAGE_LINE: PurchasedSessionLine = {
  productTitle: 'Private Session',
  productHandle: 'private-session',
  variantTitle: 'Package of 04 (60 min online)',
  quantity: 1,
  purchasedAt: '2026-10-23T08:00:00.000Z',
}

let seq = 0
function row(status = 'booked', createdAt?: string, slug = 'session-60') {
  seq += 1
  return {
    booking_uid: `bk_${seq}`,
    rescheduled_from_uid: null as string | null,
    event_slug: slug,
    status,
    start_time: '2026-11-10T08:00:00.000Z',
    created_at: createdAt ?? new Date(Date.UTC(2026, 9, 23, 9, seq)).toISOString(),
  }
}

function deps(lines: PurchasedSessionLine[] | null, rows: ReturnType<typeof row>[]): LimitDeps {
  return { lines: vi.fn().mockResolvedValue(lines), bookings: vi.fn().mockResolvedValue(rows) }
}

beforeEach(() => {
  seq = 0
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SITE_URL = 'http://169.239.180.49'
  process.env.NEXT_PUBLIC_CAL_URL = 'http://169.239.180.49:3002'
  delete process.env.CALCOM_SESSION_BOOKING_URL
})

describe('calcomUrlForToken', () => {
  it('opens the event of the right length with the buyer filled in and the token as booking metadata', () => {
    const url = new URL(calcomUrlForToken(record()))
    expect(url.origin + url.pathname).toBe('http://169.239.180.49:3002/suzanneravenall/session-60')
    expect(url.searchParams.get('email')).toBe(EMAIL)
    expect(url.searchParams.get('name')).toBe('Johan QA Test')
    expect(url.searchParams.get('metadata[bt]')).toBe(TOKEN)
  })

  it('books a fixed-length product on its own length', () => {
    const url = calcomUrlForToken(record({ product_handle: 'alpha-mind-session', variant_title: 'Package of 03', duration_minutes: 45 }))
    expect(url).toContain('/session-45?')
  })
})

describe('tokenAsLine', () => {
  it('keeps the minutes, drops the package words and carries the credits as quantity', () => {
    const line = tokenAsLine(record({ credits: 8 }))
    expect(line.variantTitle).toBe('(60 min online)')
    expect(line.quantity).toBe(8)
  })
})

describe('decideGate', () => {
  it('refuses an unknown token', async () => {
    h.findBookingToken.mockResolvedValue(null)
    await expect(decideGate(TOKEN, deps([PACKAGE_LINE], []))).resolves.toEqual({ kind: 'invalid' })
  })

  it('sends the client on to Cal.com while sessions are left', async () => {
    h.findBookingToken.mockResolvedValue(record())
    const decision = await decideGate(TOKEN, deps([PACKAGE_LINE], [row(), row(), row()]))
    expect(decision).toMatchObject({ kind: 'open', remaining: 1, total: 4, tokenId: 'tok_1' })
    if (decision.kind === 'open') expect(decision.url).toContain('metadata%5Bbt%5D=')
  })

  it('says the package is fully booked at zero', async () => {
    h.findBookingToken.mockResolvedValue(record())
    await expect(decideGate(TOKEN, deps([PACKAGE_LINE], [row(), row(), row(), row()]))).resolves.toEqual({ kind: 'full', total: 4 })
  })

  it('gives a cancelled session back', async () => {
    h.findBookingToken.mockResolvedValue(record())
    const decision = await decideGate(TOKEN, deps([PACKAGE_LINE], [row(), row(), row('cancelled'), row()]))
    expect(decision).toMatchObject({ kind: 'open', remaining: 1 })
  })

  it('does not count an over-limit booking', async () => {
    h.findBookingToken.mockResolvedValue(record())
    const decision = await decideGate(TOKEN, deps([PACKAGE_LINE], [row(), row(), row(), row('over_limit')]))
    expect(decision).toMatchObject({ kind: 'open', remaining: 1 })
  })

  it('counts a reschedule once', async () => {
    h.findBookingToken.mockResolvedValue(record())
    const moved = { ...row(), status: 'rescheduled', rescheduled_from_uid: 'bk_1' }
    const decision = await decideGate(TOKEN, deps([PACKAGE_LINE], [row(), moved]))
    expect(decision).toMatchObject({ kind: 'open', remaining: 3 })
  })

  it('falls back to the order line alone when Medusa cannot be read, and logs it', async () => {
    h.findBookingToken.mockResolvedValue(record())
    const decision = await decideGate(TOKEN, deps(null, [row(), row()]))
    expect(decision).toMatchObject({ kind: 'open', remaining: 2, total: 4 })
    expect(h.logError).toHaveBeenCalled()
  })

  it('still finds the pool when the product was renamed after the order', async () => {
    h.findBookingToken.mockResolvedValue(record({ service_name: 'Old Name' }))
    await expect(decideGate(TOKEN, deps([PACKAGE_LINE], [row()]))).resolves.toMatchObject({ kind: 'open', remaining: 3 })
  })

  it('is full when the order no longer gives sessions (refunded)', async () => {
    h.findBookingToken.mockResolvedValue(record())
    await expect(decideGate(TOKEN, deps([], []))).resolves.toEqual({ kind: 'full', total: 4 })
  })
})

function event(overrides: Partial<BookingEvent> = {}): BookingEvent {
  return {
    trigger: 'BOOKING_CREATED',
    uid: 'bk_new',
    previousUid: null,
    previousCalId: null,
    email: EMAIL,
    name: 'Johan QA Test',
    slug: 'session-60',
    title: 'Session (60 min)',
    durationMinutes: 60,
    start: '2026-11-12T08:00:00.000Z',
    end: '2026-11-12T09:00:00.000Z',
    calId: 5,
    location: null,
    payload: {},
    ...overrides,
  }
}

function overDeps(lines: PurchasedSessionLine[] | null, rows: ReturnType<typeof row>[], changed = true): OverLimitDeps {
  return {
    ...deps(lines, rows),
    markOverLimit: vi.fn().mockResolvedValue(changed),
    mailClient: vi.fn().mockResolvedValue('mail_1'),
    alertStaff: vi.fn().mockResolvedValue('sent'),
  }
}

describe('checkBookingLimit', () => {
  const newest = (status = 'booked') => ({ ...row(status, '2026-10-23T12:00:00.000Z'), booking_uid: 'bk_new' })

  it('leaves a booking within the package alone', async () => {
    const d = overDeps([PACKAGE_LINE], [row(), row(), row(), newest()])
    await expect(checkBookingLimit(event(), EMAIL, d)).resolves.toBe('within')
    expect(d.markOverLimit).not.toHaveBeenCalled()
  })

  it('flags the fifth booking of a package of four, mails the client and alerts staff', async () => {
    const d = overDeps([PACKAGE_LINE], [row(), row(), row(), row(), newest()])
    await expect(checkBookingLimit(event(), EMAIL, d, new Date('2026-10-23T12:00:01Z'))).resolves.toBe('over-limit')
    expect(d.markOverLimit).toHaveBeenCalledWith('bk_new', new Date('2026-10-23T12:00:01Z'))
    expect(d.mailClient).toHaveBeenCalledWith(
      expect.objectContaining({
        email: EMAIL,
        firstName: 'Johan',
        hasPackage: true,
        buyMoreUrl: 'http://169.239.180.49/services',
        appointmentsUrl: 'http://169.239.180.49/portal/appointments',
      }),
    )
    const alert = vi.mocked(d.alertStaff).mock.calls[0]?.[0]
    expect(alert?.key).toBe('booking-over-limit:bk_new')
    expect(alert?.lines.join('\n')).toContain('http://169.239.180.49:3002/booking/bk_new')
    // POPIA: no address in the staff alert.
    expect(alert?.lines.join('\n')).not.toContain('@')
  })

  it('flags the newest booking even when it is for an earlier date', async () => {
    const early = { ...newest(), start_time: '2026-10-25T08:00:00.000Z' }
    const d = overDeps([PACKAGE_LINE], [row(), row(), row(), row(), early])
    await expect(checkBookingLimit(event(), EMAIL, d)).resolves.toBe('over-limit')
    expect(d.markOverLimit).toHaveBeenCalledWith('bk_new', expect.any(Date))
  })

  it('flags the uncovered booking even when the check runs for an older one (out-of-order commits)', async () => {
    // bk_new committed first and was checked alone; this is the check of the
    // older booking, which now sees both and is itself covered.
    const older = { ...row('booked', '2026-10-23T11:59:59.000Z'), booking_uid: 'bk_old' }
    const d = overDeps([PACKAGE_LINE], [row(), row(), row(), older, newest()])
    await expect(checkBookingLimit(event({ uid: 'bk_old' }), EMAIL, d)).resolves.toBe('within')
    expect(d.markOverLimit).toHaveBeenCalledWith('bk_new', expect.any(Date))
    expect(d.mailClient).toHaveBeenCalledWith(expect.objectContaining({ dateLabel: 'Tue, 10 November 2026' }))
  })

  it('flags a rescheduled over-limit booking again', async () => {
    const moved = { ...newest('rescheduled'), rescheduled_from_uid: 'bk_x' }
    const d = overDeps([PACKAGE_LINE], [row(), row(), row(), row(), moved])
    await expect(checkBookingLimit(event({ trigger: 'BOOKING_RESCHEDULED' }), EMAIL, d)).resolves.toBe('over-limit')
  })

  it('tells a client with no purchase that no session was found', async () => {
    const d = overDeps([], [newest()])
    await checkBookingLimit(event(), EMAIL, d)
    expect(d.mailClient).toHaveBeenCalledWith(expect.objectContaining({ hasPackage: false }))
  })

  it('sends nothing on a replay (the row is already over_limit)', async () => {
    const d = overDeps([PACKAGE_LINE], [row(), row(), row(), row(), newest()], false)
    await expect(checkBookingLimit(event(), EMAIL, d)).resolves.toBe('over-limit')
    expect(d.mailClient).not.toHaveBeenCalled()
    expect(d.alertStaff).not.toHaveBeenCalled()
  })

  it('ignores events that are not paid sessions', async () => {
    const d = overDeps([PACKAGE_LINE], [])
    await expect(checkBookingLimit(event({ slug: 'discovery-call' }), EMAIL, d)).resolves.toBe('not-a-session')
    expect(d.lines).not.toHaveBeenCalled()
  })

  it('asks staff instead of flagging when Medusa cannot be read', async () => {
    const d = overDeps(null, [newest()])
    await expect(checkBookingLimit(event(), EMAIL, d)).resolves.toBe('unknown')
    expect(d.markOverLimit).not.toHaveBeenCalled()
    expect(d.alertStaff).toHaveBeenCalledWith(expect.objectContaining({ key: 'booking-limit-unknown:bk_new' }))
  })

  it('still alerts staff when the client mail fails', async () => {
    const d = overDeps([PACKAGE_LINE], [row(), row(), row(), row(), newest()])
    vi.mocked(d.mailClient).mockRejectedValue(new Error('Brevo down'))
    await expect(checkBookingLimit(event(), EMAIL, d)).resolves.toBe('over-limit')
    expect(d.alertStaff).toHaveBeenCalled()
  })

  it('never throws', async () => {
    const d = overDeps([PACKAGE_LINE], [])
    vi.mocked(d.bookings).mockRejectedValue(new Error('db down'))
    await expect(checkBookingLimit(event(), EMAIL, d)).resolves.toBe('failed')
  })
})

describe('tokenFromPayload', () => {
  it('reads the gate token from the booking metadata', () => {
    expect(tokenFromPayload({ metadata: { bt: TOKEN, videoCallUrl: 'x' } })).toBe(TOKEN)
    expect(tokenFromPayload({ metadata: {} })).toBeNull()
    expect(tokenFromPayload({})).toBeNull()
  })
})
