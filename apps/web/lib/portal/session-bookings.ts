import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log'
import { checkBookingLimit, TOKEN_METADATA_KEY, type LimitOutcome } from '@/lib/booking/limits'
import { applyNoticeRule, changeTime, defaultRuleDeps, type NoticeOutcome } from '@/lib/booking/session-rules'

/**
 * Cal.com webhook -> public.session_bookings (I-13, /portal/appointments).
 *
 * The Cal.com image on the review box has no REST API, so the member's
 * appointments come only from the webhook. One row per session: a reschedule
 * adds the new Cal.com uid pointing at the old one, and readers hide the old
 * row, so a moved session never counts twice against the member's paid
 * sessions. Every event is idempotent on the booking uid; a replay changes
 * nothing.
 */

export const BOOKING_TRIGGERS = ['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'] as const
export type BookingTrigger = (typeof BOOKING_TRIGGERS)[number]

/** over_limit: past the client's paid sessions, uses no credit (J-07). */
export type SessionBookingStatus = 'booked' | 'rescheduled' | 'cancelled' | 'over_limit'

export interface SessionBookingRow {
  booking_uid: string
  rescheduled_from_uid: string | null
  attendee_email: string
  attendee_name: string | null
  event_slug: string | null
  title: string | null
  duration_minutes: number | null
  start_time: string
  end_time: string
  status: SessionBookingStatus
  cal_booking_id: number | null
  location: string | null
  raw_payload: Record<string, unknown>
  cancelled_at: string | null
}

export interface BookingEvent {
  trigger: BookingTrigger
  uid: string
  /** The uid a reschedule replaced, when Cal.com names it */
  previousUid: string | null
  /** The numeric id a reschedule replaced, when Cal.com names only that */
  previousCalId: number | null
  email: string
  name: string | null
  slug: string | null
  title: string | null
  durationMinutes: number | null
  start: string
  end: string
  calId: number | null
  location: string | null
  payload: Record<string, unknown>
}

/**
 * What the record step needs from the database; Supabase in production, a map
 * in tests. Every write is a single idempotent statement and none replaces a
 * row, so retried or out-of-order deliveries cannot undo each other.
 */
export interface SessionBookingStore {
  get(uid: string): Promise<SessionBookingRow | null>
  /** True when some row says it replaced this uid (a reschedule) */
  wasRescheduledFrom(uid: string): Promise<boolean>
  /** The uid of the booking with this Cal.com id, other than `exceptUid` */
  uidByCalId(calId: number, exceptUid: string): Promise<string | null>
  /** INSERT ... ON CONFLICT (booking_uid) DO NOTHING */
  insertIfAbsent(row: SessionBookingRow): Promise<void>
  /** UPDATE status = cancelled, cancelled_at = at WHERE uid AND status <> cancelled */
  markCancelled(uid: string, at: string): Promise<void>
  /** UPDATE rescheduled_from_uid = from WHERE uid AND rescheduled_from_uid IS NULL */
  setRescheduledFrom(uid: string, from: string): Promise<void>
}

export type RecordOutcome =
  | 'created'
  | 'updated'
  | 'rescheduled'
  | 'cancelled'
  | 'ignored-replay'
  | 'invalid-payload'

type Obj = Record<string, unknown>

function obj(value: unknown): Obj | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Obj) : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function int(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : null
}

function iso(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function isTrigger(value: string): value is BookingTrigger {
  return (BOOKING_TRIGGERS as readonly string[]).includes(value)
}

// A link the member can open: the video call URL first, then a location that
// is itself a URL. Cal.com's internal values ("integrations:daily") are dropped.
function locationOf(p: Obj): string | null {
  const meta = obj(p.metadata)
  for (const candidate of [meta?.videoCallUrl, p.videoCallUrl, p.location]) {
    const value = str(candidate)
    if (/^https?:\/\//i.test(value)) return value
  }
  return null
}

/**
 * The booking in a Cal.com webhook body (v1 field names first, then v2), or
 * null when the trigger is not one of the three or the uid, attendee email or
 * start time is missing.
 */
export function parseBookingEvent(body: unknown): BookingEvent | null {
  const root = obj(body)
  if (!root) return null
  const trigger = str(root.triggerEvent)
  if (!isTrigger(trigger)) return null
  const p = obj(root.payload) ?? root

  const attendee = obj(Array.isArray(p.attendees) ? p.attendees[0] : null)
  const email = (str(attendee?.email) || str(p.bookerEmail) || str(p.email)).toLowerCase()
  const uid = str(p.uid) || str(p.bookingUid)
  const start = iso(p.startTime ?? p.start)
  if (!email || !uid || !start) return null

  const parsedEnd = iso(p.endTime ?? p.end)
  const length = int(p.length) ?? int(p.duration)
  const end =
    parsedEnd && parsedEnd >= start
      ? parsedEnd
      : new Date(new Date(start).getTime() + (length ?? 60) * 60_000).toISOString()
  const durationMinutes = length ?? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)

  const previousUid = str(p.rescheduleUid) || str(p.fromReschedule) || null

  return {
    trigger,
    uid,
    previousUid: previousUid && previousUid !== uid ? previousUid : null,
    previousCalId: int(p.rescheduleId),
    email,
    name: str(attendee?.name) || str(p.bookerName) || null,
    // v1 carries the event type slug as `type`; v2 as `eventTypeSlug`.
    slug: str(p.type) || str(p.eventTypeSlug) || null,
    title: str(p.title) || str(p.eventTitle) || null,
    durationMinutes: durationMinutes > 0 ? durationMinutes : null,
    start,
    end,
    calId: int(p.bookingId) ?? int(p.id),
    location: locationOf(p),
    payload: p,
  }
}

function rowFrom(event: BookingEvent, status: SessionBookingStatus, previous: SessionBookingRow | null): SessionBookingRow {
  return {
    booking_uid: event.uid,
    rescheduled_from_uid: event.previousUid,
    attendee_email: event.email,
    attendee_name: event.name ?? previous?.attendee_name ?? null,
    event_slug: event.slug ?? previous?.event_slug ?? null,
    title: event.title ?? previous?.title ?? null,
    duration_minutes: event.durationMinutes ?? previous?.duration_minutes ?? null,
    start_time: event.start,
    end_time: event.end,
    status,
    cal_booking_id: event.calId ?? previous?.cal_booking_id ?? null,
    location: event.location ?? previous?.location ?? null,
    raw_payload: event.payload,
    cancelled_at: status === 'cancelled' ? new Date().toISOString() : null,
  }
}

/**
 * Applies one webhook event. Rows are never deleted or replaced:
 * - CREATED inserts the booking if its uid is new; a replay, or a create that
 *   arrives after its cancel, changes nothing.
 * - RESCHEDULED inserts the new uid pointing at the uid it replaced
 *   (rescheduled_from_uid). The old row stays as the record that it moved, and
 *   readers hide every row another row points at (liveBookings), so a session
 *   counts once however often it moves.
 * - CANCELLED marks the row cancelled (inserting it first when the create was
 *   never seen); a cancel of a uid that was rescheduled away is the old half
 *   of a reschedule and is ignored.
 */
export async function recordBookingEvent(store: SessionBookingStore, event: BookingEvent): Promise<RecordOutcome> {
  if (await store.wasRescheduledFrom(event.uid)) return 'ignored-replay'

  if (event.trigger === 'BOOKING_CANCELLED') {
    const existing = await store.get(event.uid)
    if (existing?.status === 'cancelled') return 'ignored-replay'
    const row = rowFrom(event, 'cancelled', existing)
    if (!existing) await store.insertIfAbsent(row)
    // Also covers a CREATED that won the race between the read and the insert.
    await store.markCancelled(event.uid, row.cancelled_at ?? new Date().toISOString())
    return 'cancelled'
  }

  const previousUid =
    event.previousUid ?? (event.previousCalId ? await store.uidByCalId(event.previousCalId, event.uid) : null)
  if (event.trigger === 'BOOKING_RESCHEDULED' || previousUid) {
    const existing = await store.get(event.uid)
    if (existing) {
      // A replay, or the cancel of the new booking got here first: only make
      // sure the link to the replaced booking is there.
      if (previousUid) await store.setRescheduledFrom(event.uid, previousUid)
      return 'ignored-replay'
    }
    // Carry the old row's details (slug, title) when the payload lacks them.
    const previous = previousUid ? await store.get(previousUid) : null
    await store.insertIfAbsent({ ...rowFrom(event, 'rescheduled', previous), rescheduled_from_uid: previousUid })
    if (previousUid) await store.setRescheduledFrom(event.uid, previousUid)
    return 'rescheduled'
  }

  const existing = await store.get(event.uid)
  if (existing) return 'ignored-replay'
  await store.insertIfAbsent(rowFrom(event, 'booked', null))
  return 'created'
}

const SELECT_COLUMNS =
  'booking_uid, rescheduled_from_uid, attendee_email, attendee_name, event_slug, title, duration_minutes, start_time, end_time, status, cal_booking_id, location, raw_payload, cancelled_at'

/** The service-role store. Null (logged) when the Supabase env is missing. */
export function supabaseBookingStore(): SessionBookingStore | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    logError('[session-bookings] Supabase env vars are not set')
    return null
  }
  const db = createClient(url, key, { auth: { persistSession: false } }).from('session_bookings')

  function fail(step: string, error: { message: string; code?: string }): never {
    throw new Error(`session_bookings ${step} failed: ${error.code ?? ''} ${error.message}`.trim())
  }

  return {
    async get(uid) {
      const { data, error } = await db.select(SELECT_COLUMNS).eq('booking_uid', uid).maybeSingle()
      if (error) fail('read', error)
      return (data as SessionBookingRow | null) ?? null
    },
    async wasRescheduledFrom(uid) {
      const { count, error } = await db
        .select('id', { count: 'exact', head: true })
        .eq('rescheduled_from_uid', uid)
      if (error) fail('read', error)
      return (count ?? 0) > 0
    },
    async uidByCalId(calId, exceptUid) {
      const { data, error } = await db
        .select('booking_uid')
        .eq('cal_booking_id', calId)
        .neq('booking_uid', exceptUid)
        .limit(1)
        .maybeSingle()
      if (error) fail('read', error)
      return (data as { booking_uid: string } | null)?.booking_uid ?? null
    },
    async insertIfAbsent(row) {
      const { error } = await db.upsert(row, { onConflict: 'booking_uid', ignoreDuplicates: true })
      if (error) fail('insert', error)
    },
    async markCancelled(uid, at) {
      const { error } = await db
        .update({ status: 'cancelled', cancelled_at: at })
        .eq('booking_uid', uid)
        .neq('status', 'cancelled')
      if (error) fail('update', error)
    },
    async setRescheduledFrom(uid, from) {
      const { error } = await db
        .update({ rescheduled_from_uid: from })
        .eq('booking_uid', uid)
        .is('rescheduled_from_uid', null)
      if (error) fail('update', error)
    },
  }
}

function withoutGateToken(payload: Record<string, unknown>): Record<string, unknown> {
  const meta = payload.metadata
  if (!meta || typeof meta !== 'object' || Array.isArray(meta) || !(TOKEN_METADATA_KEY in meta)) return payload
  const rest = { ...(meta as Record<string, unknown>) }
  delete rest[TOKEN_METADATA_KEY]
  return { ...payload, metadata: rest }
}

/**
 * Runs after the webhook has answered Cal.com. Never throws: a failure is
 * logged with the booking uid only (no email, POPIA). A cancel or move is
 * checked against the 48 working hours notice rule (D024, lib/booking/session-rules.ts),
 * then a new or moved session booking against the paid sessions (J-07,
 * lib/booking/limits.ts). The notice rule runs first, so a session lost to a
 * late move holds its credit before the new booking is counted.
 */
export async function runSessionBookingRecord(
  body: unknown,
  store: SessionBookingStore | null = supabaseBookingStore(),
  limitCheck: (event: BookingEvent, creditEmail: string) => Promise<LimitOutcome> = checkBookingLimit,
  noticeRule: (event: BookingEvent, outcome: RecordOutcome, changedAt: Date) => Promise<NoticeOutcome> = (e, o, at) =>
    applyNoticeRule(e, o, at, defaultRuleDeps()),
): Promise<RecordOutcome | 'failed'> {
  const parsed = parseBookingEvent(body)
  if (!parsed) {
    console.warn('[session-bookings] booking event without uid, attendee email or start time; not stored')
    return 'invalid-payload'
  }
  if (!store) return 'failed'
  // The gate token stays out of raw_payload: it is a live booking credential.
  // A booking always counts against the address typed at Cal.com, never the
  // link's buyer: moving it onto the buyer would let anyone holding a link
  // (bought under someone else's address) spend that person's sessions.
  const event: BookingEvent = { ...parsed, payload: withoutGateToken(parsed.payload) }
  try {
    const outcome = await recordBookingEvent(store, event)
    console.info(`[session-bookings] ${event.trigger} ${event.uid}: ${outcome}`)
    if (outcome === 'cancelled' || outcome === 'rescheduled') await noticeRule(event, outcome, changeTime(body, new Date()))
    // A reschedule is checked too, so a moved over_limit booking cannot take a credit.
    if (outcome === 'created' || outcome === 'rescheduled') await limitCheck(event, event.email)
    return outcome
  } catch (error) {
    logError('[session-bookings] booking could not be stored', error, { bookingUid: event.uid, trigger: event.trigger })
    return 'failed'
  }
}
