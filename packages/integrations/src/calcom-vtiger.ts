import { VtigerError, vtqlString, type VtigerClient, type VtigerRecord } from './vtiger'
import { findContactQuery } from './leads'

/**
 * Cal.com booking -> Vtiger contact + Event, ported from
 * infra/n8n/workflows/calcom-booking-to-vtiger.json (docs/n8n-migration-plan.md
 * section 3.6). Same module (Contacts), same dedupe (by email), same lead
 * source and pipeline stage, same booking UID marker in the description.
 *
 * Differences, all listed in packages/integrations/README.md: the activity is
 * an Event (n8n used the `Activities` element type, KI054 e) with a real
 * duration from startTime/endTime and assigned_user_id; existing contacts are
 * changed with `revise` and keep their mandatory fields (n8n's `update`
 * dropped them); a booking UID that already has an Event is not logged twice;
 * custom fields the instance does not have are left out instead of failing
 * the call (plan section 8 question 10).
 */

export const DISCOVERY_CALL_LEAD_SOURCE = 'Discovery Call'
export const DISCOVERY_CALL_STAGE = 'Discovery Call Booked'
export const BOOKING_UID_MARKER = 'Cal.com booking UID:'
/** Used when a booking carries no end time. Discovery calls are 30 minutes. */
export const DEFAULT_BOOKING_MINUTES = 30

/** Custom fields this flow writes to Contacts when the instance has them. */
export const CALCOM_CONTACT_CUSTOM_FIELDS = ['cf_pipeline_stage'] as const

export type CalcomBooking = {
  uid: string
  email: string
  firstName: string
  lastName: string
  title: string
  start: Date
  end: Date
  durationMinutes: number
}

type Obj = Record<string, unknown>

function obj(value: unknown): Obj | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Obj) : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function date(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Normalises a BOOKING_CREATED body. Handles both shapes the n8n node did:
 *   v1: { triggerEvent, payload: { uid, title, startTime, endTime, attendees: [{ email, name }] } }
 *   v2: { triggerEvent, payload: { bookingUid, eventTitle, start, end, bookerEmail, bookerName } }
 * plus a body without the `payload` wrapper. Null when email, start time or
 * booking UID is missing (n8n stopped on the first two; without a UID the
 * Event could never be found again, so a replay would duplicate it).
 */
export function parseCalcomBooking(body: unknown): CalcomBooking | null {
  const root = obj(body)
  if (!root) return null
  const p = obj(root.payload) ?? root

  const attendees = Array.isArray(p.attendees) ? p.attendees : []
  const attendee = obj(attendees[0])
  const email = (str(attendee?.email) || str(p.bookerEmail) || str(p.email)).toLowerCase()
  const name = str(attendee?.name) || str(p.bookerName) || str(p.name)
  const uid = str(p.uid) || str(p.bookingUid)
  const start = date(p.startTime ?? p.start)
  if (!email || !uid || !start) return null

  const parsedEnd = date(p.endTime ?? p.end)
  const end = parsedEnd && parsedEnd > start ? parsedEnd : new Date(start.getTime() + DEFAULT_BOOKING_MINUTES * 60_000)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60_000)

  const parts = name.split(/\s+/).filter(Boolean)
  const firstName = parts[0] ?? email.split('@')[0] ?? email
  const lastName = parts.slice(1).join(' ')
  const title = str(p.title) || str(p.eventTitle) || DISCOVERY_CALL_LEAD_SOURCE

  return { uid, email, firstName, lastName, title, start, end, durationMinutes }
}

/** Keeps only the custom fields the instance has. `fields` null = unknown (dry run): keep all. */
function withKnownCustomFields<T extends Obj>(element: T, fields: Set<string> | null): T {
  if (!fields) return element
  const out: Obj = {}
  for (const [k, v] of Object.entries(element)) {
    if (k.startsWith('cf_') && !fields.has(k)) continue
    out[k] = v
  }
  return out as T
}

/** n8n "Prepare: New Contact Payload", plus assigned_user_id and a mandatory lastname. */
export function newBookingContactElement(booking: CalcomBooking, userId: string) {
  return {
    email: booking.email,
    firstname: booking.firstName,
    lastname: booking.lastName || booking.firstName, // Vtiger: lastname is mandatory
    assigned_user_id: userId,
    leadsource: DISCOVERY_CALL_LEAD_SOURCE,
    cf_pipeline_stage: DISCOVERY_CALL_STAGE,
  }
}

/** n8n "Prepare: Pipeline Stage Update", with the mandatory fields carried along and lead source only if blank. */
export function bookingStageElement(existing: VtigerRecord, booking: CalcomBooking, userId: string): VtigerRecord {
  const raw: Obj = existing
  const s = (v: unknown) => (typeof v === 'string' ? v : undefined)
  return {
    id: existing.id,
    assigned_user_id: s(raw.assigned_user_id) ?? userId,
    firstname: s(raw.firstname) ?? booking.firstName,
    lastname: s(raw.lastname) || booking.lastName || booking.firstName,
    email: s(raw.email) ?? booking.email,
    leadsource: s(raw.leadsource) || DISCOVERY_CALL_LEAD_SOURCE,
    cf_pipeline_stage: DISCOVERY_CALL_STAGE,
  }
}

export function bookingMarker(uid: string): string {
  return `${BOOKING_UID_MARKER} ${uid}`
}

/** n8n "Prepare: Activity Payload" as an Event (KI054 e). Date and time in UTC. */
export function bookingEventElement(booking: CalcomBooking, contactId: string, userId: string) {
  const startIso = booking.start.toISOString()
  const endIso = booking.end.toISOString()
  return {
    activitytype: 'Call',
    subject: `Discovery Call - ${booking.title}`.slice(0, 255),
    description: bookingMarker(booking.uid),
    assigned_user_id: userId,
    contact_id: contactId,
    date_start: startIso.slice(0, 10),
    time_start: startIso.slice(11, 19),
    due_date: endIso.slice(0, 10),
    time_end: endIso.slice(11, 19),
    duration_hours: String(Math.floor(booking.durationMinutes / 60)),
    duration_minutes: String(booking.durationMinutes % 60),
    eventstatus: 'Planned',
  }
}

export function findBookingEventQuery(uid: string): string {
  return `SELECT id FROM Events WHERE description LIKE '%${vtqlString(bookingMarker(uid))}%' LIMIT 1;`
}

/** Progress across retries in one run, so a retry never creates a second contact or Event. */
export type BookingVtigerState = {
  contactId?: string
  contactCreated?: boolean
  eventId?: string
  /** True when the Event already existed (a replayed webhook). */
  replay?: boolean
  stageDone?: boolean
}

export type BookingVtigerResult = {
  contactId: string
  eventId: string
  created: boolean
  replay: boolean
  /** Custom fields this flow wanted to write that the instance does not have. */
  missingFields: string[]
}

const REVISE_UNSUPPORTED = new Set(['UNKNOWN_OPERATION', 'OPERATION_NOT_SUPPORTED', 'INVALID_OPERATION'])

/**
 * Finds or creates the contact, logs one Event for the booking (skipped when
 * an Event with this booking UID exists), then moves an existing contact to
 * the Discovery Call Booked stage (also on a replay). Throws on any Vtiger failure.
 */
export async function syncBookingToVtiger(
  client: VtigerClient,
  booking: CalcomBooking,
  state: BookingVtigerState = {},
): Promise<BookingVtigerResult> {
  const userId = await client.userId()
  // Unknown fields (describe failed) means: keep them all, as in dry run.
  const fields = await client.fieldNames('Contacts').catch(() => null)
  const missingFields = fields ? CALCOM_CONTACT_CUSTOM_FIELDS.filter((f) => !fields.has(f)) : []

  let existing: VtigerRecord | undefined
  if (!state.contactId) {
    const [row] = await client.query<VtigerRecord>(findContactQuery(booking.email))
    if (row && typeof row.id === 'string') {
      existing = row
      state.contactId = row.id
      state.contactCreated = false
    } else {
      state.contactId = (await client.create('Contacts', withKnownCustomFields(newBookingContactElement(booking, userId), fields))).id
      state.contactCreated = true
      state.stageDone = true // set on create
    }
  }

  if (!state.eventId) {
    const [prior] = await client.query<VtigerRecord>(findBookingEventQuery(booking.uid))
    if (prior && typeof prior.id === 'string') {
      state.eventId = prior.id
      state.replay = true
    } else {
      state.eventId = (await client.create('Events', bookingEventElement(booking, state.contactId, userId))).id
      state.replay = false
    }
  }

  // Not tied to `replay`: an Event that exists says nothing about the stage
  // (a lost create response, or a revise that failed on an earlier delivery).
  // The revise is idempotent, so a replay simply repeats it.
  if (!state.stageDone) {
    const current = existing ?? (await client.retrieve(state.contactId))
    const element = withKnownCustomFields(bookingStageElement(current, booking, userId), fields)
    try {
      await client.revise(element)
    } catch (err) {
      if (!(err instanceof VtigerError) || !REVISE_UNSUPPORTED.has(err.code)) throw err
      // Instance without `revise`: read-merge-update, so no field is dropped.
      await client.update({ ...current, ...element })
    }
    state.stageDone = true
  }

  return {
    contactId: state.contactId,
    eventId: state.eventId,
    created: state.contactCreated ?? false,
    replay: state.replay ?? false,
    missingFields,
  }
}

export type BookingSyncRunOptions = {
  /** Attempts in total. Default 4 (the first try plus 3 retries). */
  attempts?: number
  /** Wait before retry 1, 2, 3. Default 2 s, 10 s, 30 s. */
  delaysMs?: number[]
  sleep?: (ms: number) => Promise<void>
  onAttemptFailed?: (attempt: number, err: unknown) => void
}

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Runs syncBookingToVtiger with up to 3 retries and backoff, keeping the
 * progress between attempts. Throws the last error when every attempt failed.
 * "Not configured" is not retried.
 */
export async function syncBookingWithRetry(
  client: VtigerClient,
  booking: CalcomBooking,
  opts: BookingSyncRunOptions = {},
): Promise<BookingVtigerResult> {
  const attempts = Math.max(1, opts.attempts ?? 4)
  const delays = opts.delaysMs ?? [2_000, 10_000, 30_000]
  const sleep = opts.sleep ?? realSleep
  const state: BookingVtigerState = {}
  let lastErr: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await syncBookingToVtiger(client, booking, state)
    } catch (err) {
      lastErr = err
      opts.onAttemptFailed?.(attempt, err)
      if (err instanceof VtigerError && err.code === 'NOT_CONFIGURED') break
      if (attempt < attempts) await sleep(delays[Math.min(attempt - 1, delays.length - 1)] ?? 0)
    }
  }
  throw lastErr
}
