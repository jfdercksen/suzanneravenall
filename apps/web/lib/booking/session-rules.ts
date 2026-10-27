import crypto from 'crypto'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { logError } from '@/lib/log'
import { siteUrl } from '@/lib/email/site-url'
import { sendSessionLateChangeEmail } from '@/lib/email/session-late-change'
import { sendStaffAlert } from '@/lib/integrations/staff-alert'
import { calBaseUrl, formatSastDate, formatSastTimes } from '@/lib/portal/appointments'
import { bookingSessionMinutes } from '@/lib/portal/session-credits'
import type { BookingEvent, RecordOutcome } from '@/lib/portal/session-bookings'
import { NOTICE_WORKING_HOURS, isLateChange, workingMinutesBetween } from './working-hours'

/**
 * Suzanne's session rules (her mail 24 Oct 2026, DECISIONS.md D024).
 *
 * 1. No-show: staff mark it in Cal.com (Bookings > Past > the attendee >
 *    Mark as no-show). Cal.com sends BOOKING_NO_SHOW_UPDATED; the booking gets
 *    no_show_at and keeps the session it used. Unmarking clears it.
 * 2. Notice: a client who cancels or moves a session with less than 48
 *    working hours to go (working-hours.ts) loses it. The booking that was
 *    cancelled or moved away gets late_change_at and keeps using its credit;
 *    the client is mailed and staff get an alert with a link to
 *    /staff/booking/<staff_token>, where one click gives the session back.
 *    Cal.com takes the "changed by" address from the link, so a client can
 *    type a staff address there. A late change under a staff address (the
 *    Cal.com organiser, or SESSION_STAFF_EMAILS) is therefore marked, given
 *    back at once, and staff are alerted with the link to count it as used if
 *    it was not them. The client gets no late mail for it.
 *
 * The notice rule runs only with AUTOMATION_SESSION_NOTICE=code (default off,
 * to go live with the Terms wording) and only logs under AUTOMATION_DRY_RUN.
 */

export interface RuleBookingRow {
  booking_uid: string
  rescheduled_from_uid: string | null
  attendee_email: string
  attendee_name: string | null
  event_slug: string | null
  title: string | null
  status: string
  start_time: string
  end_time: string
  over_limit_at: string | null
  no_show_at: string | null
  late_change_at: string | null
  late_change_kind: 'cancelled' | 'rescheduled' | null
  late_change_by_staff: boolean | null
  credit_restored_at: string | null
}

const RULE_COLUMNS =
  'booking_uid, rescheduled_from_uid, attendee_email, attendee_name, event_slug, title, status, start_time, end_time, over_limit_at, no_show_at, late_change_at, late_change_kind, late_change_by_staff, credit_restored_at'

export interface LateMark {
  at: Date
  kind: 'cancelled' | 'rescheduled'
  staffToken: string
  /** Made under a staff address: the session is given back at once */
  byStaff: boolean
}

export interface SessionRuleStore {
  get(uid: string): Promise<RuleBookingRow | null>
  byStaffToken(token: string): Promise<RuleBookingRow | null>
  /** UPDATE late_change_* WHERE uid AND late_change_at IS NULL; true when this call set it */
  markLate(uid: string, mark: LateMark): Promise<boolean>
  /** UPDATE no_show_at; true when a row with this uid exists */
  setNoShow(uid: string, at: Date | null): Promise<boolean>
  /** UPDATE credit_restored_at WHERE staff_token; true when this call changed it */
  setCreditRestored(staffToken: string, at: Date | null): Promise<boolean>
  /**
   * A late move given back: the booking it moved to was flagged over_limit
   * only because the lost session held the last credit, so it goes back to
   * rescheduled. UPDATE WHERE rescheduled_from_uid = uid AND status = over_limit.
   */
  unflagReplacement(uid: string): Promise<void>
}

function fail(step: string, error: { message: string; code?: string }): never {
  throw new Error(`session_bookings ${step} failed: ${error.code ?? ''} ${error.message}`.trim())
}

/** The service-role store. Each call fails (and the caller logs it) when the Supabase env is missing. */
export function supabaseRuleStore(): SessionRuleStore {
  const db = () => {
    const client = getServiceRoleClient()
    if (!client) throw new Error('Supabase service-role client is not configured')
    return client.from('session_bookings')
  }

  return {
    async get(uid) {
      const { data, error } = await db().select(RULE_COLUMNS).eq('booking_uid', uid).maybeSingle()
      if (error) fail('read', error)
      return (data as RuleBookingRow | null) ?? null
    },
    async byStaffToken(token) {
      const { data, error } = await db().select(RULE_COLUMNS).eq('staff_token', token).maybeSingle()
      if (error) fail('read', error)
      return (data as RuleBookingRow | null) ?? null
    },
    async markLate(uid, { at, kind, staffToken, byStaff }) {
      const { data, error } = await db()
        .update({
          late_change_at: at.toISOString(),
          late_change_kind: kind,
          late_change_by_staff: byStaff,
          staff_token: staffToken,
          credit_restored_at: byStaff ? at.toISOString() : null,
        })
        .eq('booking_uid', uid)
        .is('late_change_at', null)
        .select('booking_uid')
      if (error) fail('late-change update', error)
      return Array.isArray(data) && data.length > 0
    },
    async setNoShow(uid, at) {
      const { data, error } = await db()
        .update({ no_show_at: at ? at.toISOString() : null })
        .eq('booking_uid', uid)
        .select('booking_uid')
      if (error) fail('no-show update', error)
      return Array.isArray(data) && data.length > 0
    },
    async setCreditRestored(staffToken, at) {
      let query = db()
        .update({ credit_restored_at: at ? at.toISOString() : null })
        .eq('staff_token', staffToken)
      query = at ? query.is('credit_restored_at', null) : query.not('credit_restored_at', 'is', null)
      const { data, error } = await query.select('booking_uid')
      if (error) fail('credit update', error)
      return Array.isArray(data) && data.length > 0
    },
    async unflagReplacement(uid) {
      const { error } = await db()
        .update({ status: 'rescheduled', over_limit_at: null })
        .eq('rescheduled_from_uid', uid)
        .eq('status', 'over_limit')
      if (error) fail('over-limit undo', error)
    },
  }
}

type Obj = Record<string, unknown>

function obj(value: unknown): Obj | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Obj) : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Addresses whose changes are staff changes: the Cal.com organiser plus SESSION_STAFF_EMAILS. */
export function staffEmails(payload: Obj): Set<string> {
  const set = new Set(
    (process.env.SESSION_STAFF_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
  const organiser = str(obj(payload.organizer)?.email).toLowerCase()
  if (organiser) set.add(organiser)
  return set
}

/**
 * When the change happened: the delivery's createdAt (a retried delivery
 * arrives later than the change), else now. A time in the future is ignored.
 */
export function changeTime(body: unknown, now: Date): Date {
  const created = Date.parse(str(obj(body)?.createdAt))
  return Number.isFinite(created) && created <= now.getTime() + 5 * 60_000 ? new Date(created) : now
}

export interface RuleDeps {
  store: SessionRuleStore
  mailClient: typeof sendSessionLateChangeEmail
  alertStaff: typeof sendStaffAlert
  newToken(): string
}

export function defaultRuleDeps(): RuleDeps {
  return {
    store: supabaseRuleStore(),
    mailClient: sendSessionLateChangeEmail,
    alertStaff: sendStaffAlert,
    newToken: () => crypto.randomBytes(32).toString('base64url'),
  }
}

/** Where the restore link lives; the token is the only key. */
export function staffBookingUrl(token: string): string {
  return `${siteUrl()}/staff/booking/${encodeURIComponent(token)}`
}

/** AUTOMATION_SESSION_NOTICE: code applies the rule; off (default) does nothing. */
export function noticeRuleMode(): 'code' | 'dry-run' | 'off' {
  if ((process.env.AUTOMATION_SESSION_NOTICE ?? 'off').trim().toLowerCase() !== 'code') return 'off'
  return process.env.AUTOMATION_DRY_RUN === 'true' ? 'dry-run' : 'code'
}

/** Staff links stop working this long after the change. */
export const STAFF_LINK_DAYS = 60

export function staffLinkExpired(lateChangeAt: string | null, now: Date = new Date()): boolean {
  const at = Date.parse(lateChangeAt ?? '')
  return !Number.isFinite(at) || now.getTime() - at > STAFF_LINK_DAYS * 24 * 60 * 60_000
}

export type NoticeOutcome =
  | 'late'
  | 'in-time'
  | 'by-staff'
  | 'off'
  | 'dry-run'
  | 'already-marked'
  | 'not-counted'
  | 'not-a-session'
  | 'not-applicable'
  | 'unknown-booking'
  | 'failed'

/**
 * Applies the 48 working hours rule to a stored cancel or reschedule. Never
 * throws. Idempotent: the mark needs late_change_at to be empty, and the mails
 * follow only the call that set it, so a replayed delivery sends nothing.
 */
export async function applyNoticeRule(
  event: BookingEvent,
  outcome: RecordOutcome,
  changedAt: Date,
  deps: RuleDeps,
): Promise<NoticeOutcome> {
  const kind = outcome === 'cancelled' ? 'cancelled' : outcome === 'rescheduled' ? 'rescheduled' : null
  if (!kind) return 'not-applicable'
  const mode = noticeRuleMode()
  if (mode === 'off') return 'off'
  try {
    // A move puts the lost session on the booking it moved away from.
    let targetUid = event.uid
    if (kind === 'rescheduled') {
      const moved = await deps.store.get(event.uid)
      const from = moved?.rescheduled_from_uid ?? event.previousUid
      if (!from) return 'unknown-booking'
      targetUid = from
    }
    const row = await deps.store.get(targetUid)
    if (!row) return 'unknown-booking'
    if (bookingSessionMinutes(row.event_slug) === null) return 'not-a-session'
    // Past the package (J-07) or already a no-show: it holds no new session to lose.
    if (row.over_limit_at || row.status === 'over_limit' || row.no_show_at) return 'not-counted'
    if (row.late_change_at) return 'already-marked'

    const start = new Date(row.start_time)
    if (!isLateChange(changedAt, start)) return 'in-time'

    const changedBy = str(kind === 'cancelled' ? event.payload.cancelledBy : event.payload.rescheduledBy).toLowerCase()
    const byStaff = Boolean(changedBy) && staffEmails(event.payload).has(changedBy)
    if (mode === 'dry-run') {
      console.info(`[session-rules] dry run: ${row.booking_uid} late ${kind}${byStaff ? ' (staff address)' : ''}, nothing marked or sent`)
      return 'dry-run'
    }

    const token = deps.newToken()
    if (!(await deps.store.markLate(row.booking_uid, { at: changedAt, kind, staffToken: token, byStaff }))) return 'already-marked'
    if (byStaff) await alertStaffChange(row, kind, event, changedAt, token, deps)
    else await notifyLateChange(row, kind, event, changedAt, token, deps)
    console.info(`[session-rules] ${row.booking_uid}: late ${kind}${byStaff ? ' under a staff address, given back' : ''}`)
    return byStaff ? 'by-staff' : 'late'
  } catch (error) {
    logError('[session-rules] notice rule failed', error, { bookingUid: event.uid })
    return 'failed'
  }
}

function hoursLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

async function notifyLateChange(
  row: RuleBookingRow,
  kind: 'cancelled' | 'rescheduled',
  event: BookingEvent,
  changedAt: Date,
  token: string,
  deps: Pick<RuleDeps, 'mailClient' | 'alertStaff'>,
): Promise<void> {
  const dateLabel = formatSastDate(row.start_time)
  const timeLabel = formatSastTimes(row.start_time, row.end_time)
  const moved = kind === 'rescheduled'
  try {
    await deps.mailClient({
      email: row.attendee_email,
      firstName: (row.attendee_name ?? event.name)?.trim().split(/\s+/)[0] || null,
      kind,
      dateLabel,
      timeLabel,
      newDateLabel: moved ? formatSastDate(event.start) : null,
      newTimeLabel: moved ? formatSastTimes(event.start, event.end) : null,
      appointmentsUrl: `${siteUrl()}/portal/appointments`,
    })
  } catch (error) {
    logError('[session-rules] late-change client mail failed', error, { bookingUid: row.booking_uid })
  }
  const notice = workingMinutesBetween(changedAt, new Date(row.start_time))
  // The give-back link lives only in this alert: say so in the log when it did not go.
  const sent = await deps.alertStaff({
    to: process.env.SESSION_ALERT_EMAIL,
    key: `session-late-change:${row.booking_uid}`,
    subject: moved ? 'A client moved a session at short notice' : 'A client cancelled a session at short notice',
    lines: [
      `Session: ${dateLabel}, ${timeLabel}`,
      `Notice given: ${hoursLabel(notice)} of the ${NOTICE_WORKING_HOURS} working hours needed.`,
      'The session counts as used and the client has been told by mail.',
      `If this is an exceptional case, give the session back here (client details on the page): ${staffBookingUrl(token)}`,
      `The booking in Cal.com: ${calBaseUrl()}/booking/${encodeURIComponent(moved ? event.uid : row.booking_uid)}`,
    ],
  }).catch(() => 'failed' as const)
  if (sent !== 'sent' && sent !== 'throttled') {
    logError('[session-rules] late-change staff alert not sent; the give-back link is on the booking row', undefined, {
      bookingUid: row.booking_uid,
      outcome: sent,
    })
  }
}

/**
 * A late change under a staff address. Usually Shayna or Suzanne moving a
 * session; a client could type the address too, so staff confirm.
 */
async function alertStaffChange(
  row: RuleBookingRow,
  kind: 'cancelled' | 'rescheduled',
  event: BookingEvent,
  changedAt: Date,
  token: string,
  deps: Pick<RuleDeps, 'alertStaff'>,
): Promise<void> {
  const moved = kind === 'rescheduled'
  const sent = await deps
    .alertStaff({
      to: process.env.SESSION_ALERT_EMAIL,
      key: `session-staff-change:${row.booking_uid}`,
      subject: moved
        ? 'A session was moved at short notice under a staff address'
        : 'A session was cancelled at short notice under a staff address',
      lines: [
        `Session: ${formatSastDate(row.start_time)}, ${formatSastTimes(row.start_time, row.end_time)}`,
        `Notice given: ${hoursLabel(workingMinutesBetween(changedAt, new Date(row.start_time)))} of the ${NOTICE_WORKING_HOURS} working hours needed.`,
        'Cal.com says a staff address made this change, so the session was NOT counted as used and the client was not mailed.',
        `If neither you nor Suzanne made it, count the session as used here: ${staffBookingUrl(token)}`,
        `The booking in Cal.com: ${calBaseUrl()}/booking/${encodeURIComponent(moved ? event.uid : row.booking_uid)}`,
      ],
    })
    .catch(() => 'failed' as const)
  if (sent !== 'sent' && sent !== 'throttled') {
    logError('[session-rules] staff-change alert not sent', undefined, { bookingUid: row.booking_uid, outcome: sent })
  }
}

/** The attendee's no-show flag from a BOOKING_NO_SHOW_UPDATED body, or null when it is not one. */
export function parseNoShowEvent(body: unknown): { uid: string; noShow: boolean } | null {
  const root = obj(body)
  if (!root || str(root.triggerEvent) !== 'BOOKING_NO_SHOW_UPDATED') return null
  const p = obj(root.payload) ?? root
  const uid = str(p.bookingUid) || str(p.uid)
  if (!uid) return null
  const attendees = Array.isArray(p.attendees) ? p.attendees.map(obj).filter((a): a is Obj => a !== null) : []
  // Sessions are one to one: any attendee marked means the client did not come.
  const flags = attendees.map((a) => a.noShow).filter((v): v is boolean => typeof v === 'boolean')
  if (flags.length === 0) return null
  return { uid, noShow: flags.some(Boolean) }
}

export type NoShowOutcome = 'marked' | 'cleared' | 'unknown-booking' | 'invalid-payload' | 'failed'

/** Runs after the webhook answered Cal.com. Never throws. */
export async function runNoShowUpdate(
  body: unknown,
  store: () => SessionRuleStore = supabaseRuleStore,
  now: Date = new Date(),
): Promise<NoShowOutcome> {
  const parsed = parseNoShowEvent(body)
  if (!parsed) {
    console.warn('[session-rules] no-show event without booking uid or attendee flag; ignored')
    return 'invalid-payload'
  }
  try {
    const found = await store().setNoShow(parsed.uid, parsed.noShow ? changeTime(body, now) : null)
    const outcome = !found ? 'unknown-booking' : parsed.noShow ? 'marked' : 'cleared'
    // Cal.com does not resend after a 200: an unknown booking needs a human to re-mark it.
    if (!found) logError('[session-rules] no-show for a booking we do not have; re-mark it in Cal.com', undefined, { bookingUid: parsed.uid })
    else console.info(`[session-rules] no-show ${parsed.uid}: ${outcome}`)
    return outcome
  } catch (error) {
    logError('[session-rules] no-show update failed', error, { bookingUid: parsed.uid })
    return 'failed'
  }
}
