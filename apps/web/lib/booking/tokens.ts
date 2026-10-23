import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sessionDurationMinutes, type SessionDuration, type SessionLine } from '@suzanne/integrations'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { isMissingTableError } from '@/lib/leads/store'
import { siteUrl } from '@/lib/email/site-url'
import { sessionsPerUnit } from '@/lib/portal/session-credits'

/**
 * public.booking_tokens (supabase/migrations/20261023090000_booking_limits.sql,
 * DECISIONS.md D022): the per-order booking link /book/<token> that replaces
 * the reusable Cal.com page in the order mail and on the confirmation page.
 * Service role only. One row per (order, session service); issuing is
 * idempotent, so the mail route and the confirmation page can both ask for
 * the link and get the same one.
 */

export const BOOKING_TOKEN_TABLE = 'booking_tokens'

/** base64url of 32 random bytes is 43 characters. */
export const BOOKING_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export interface BookingTokenRecord {
  id: string
  token: string
  order_id: string | null
  order_display_id: number
  customer_email: string
  customer_name: string | null
  service_key: string
  service_name: string
  product_handle: string | null
  variant_title: string | null
  duration_minutes: SessionDuration
  credits: number
  last_used_at: string | null
  created_at: string
}

export interface IssueBookingTokenInput {
  orderId?: string | null
  displayId: number
  email: string
  name?: string | null
  line: SessionLine & { quantity?: number | null }
}

export class BookingTokenStoreError extends Error {
  constructor(
    message: string,
    readonly missingTable = false,
  ) {
    super(message)
    this.name = 'BookingTokenStoreError'
  }
}

type PgError = { code?: string; message: string }

function client(): SupabaseClient {
  const supabase = getServiceRoleClient()
  if (!supabase) throw new BookingTokenStoreError('Supabase service-role client is not configured')
  return supabase
}

function fail(action: string, error: PgError): never {
  if (isMissingTableError(error)) {
    throw new BookingTokenStoreError(`table ${BOOKING_TOKEN_TABLE} is missing: apply 20261023090000_booking_limits.sql`, true)
  }
  throw new BookingTokenStoreError(`${action} failed: ${error.message}`)
}

/** The service a session line was bought for: product title, as on the portal. */
export function serviceNameOf(line: SessionLine): string {
  return line.productTitle?.trim() || line.variantTitle?.trim() || 'Private session'
}

/** "<service>|<minutes>": the credit pool a line belongs to. */
export function serviceKeyOf(line: SessionLine): string {
  return `${serviceNameOf(line)}|${sessionDurationMinutes(line)}`
}

export function generateBookingToken(): string {
  return randomBytes(32).toString('base64url')
}

/** The link the mail and the confirmation page show. */
export function bookingGateUrl(token: string): string {
  return `${siteUrl()}/book/${token}`
}

/** The row for (order, service), created on first ask. Throws BookingTokenStoreError. */
export async function issueBookingToken(input: IssueBookingTokenInput): Promise<BookingTokenRecord> {
  const supabase = client()
  const quantity = input.line.quantity && input.line.quantity > 0 ? input.line.quantity : 1
  const row = {
    token: generateBookingToken(),
    order_id: input.orderId ?? null,
    order_display_id: input.displayId,
    customer_email: input.email.trim().toLowerCase(),
    customer_name: input.name?.trim() || null,
    service_key: serviceKeyOf(input.line),
    service_name: serviceNameOf(input.line),
    product_handle: input.line.productHandle ?? null,
    variant_title: input.line.variantTitle ?? null,
    duration_minutes: sessionDurationMinutes(input.line),
    credits: sessionsPerUnit(input.line.variantTitle) * quantity,
  }

  const { data, error } = await supabase
    .from(BOOKING_TOKEN_TABLE)
    .upsert(row, { onConflict: 'order_display_id,service_key', ignoreDuplicates: true })
    .select('*')
  if (error) fail('insert', error)
  const inserted = Array.isArray(data) ? (data[0] as BookingTokenRecord | undefined) : undefined
  if (inserted) return inserted

  const { data: existing, error: readError } = await supabase
    .from(BOOKING_TOKEN_TABLE)
    .select('*')
    .eq('order_display_id', row.order_display_id)
    .eq('service_key', row.service_key)
    .maybeSingle()
  if (readError) fail('read after duplicate', readError)
  if (!existing) throw new BookingTokenStoreError('duplicate key but no row for (order, service)')
  const record = existing as BookingTokenRecord
  // The confirmation page issues without the order id and from the cart's
  // email; the mail (order id, the order's customer email: the address the
  // Medusa orders are found under) is canonical and corrects both.
  if (row.order_id && (record.order_id !== row.order_id || record.customer_email !== row.customer_email)) {
    const { error: updateError } = await supabase
      .from(BOOKING_TOKEN_TABLE)
      .update({ order_id: row.order_id, customer_email: row.customer_email })
      .eq('id', record.id)
    if (updateError) fail('set order id', updateError)
    record.order_id = row.order_id
    record.customer_email = row.customer_email
  }
  return record
}

/** The row behind a /book link, or null for an unknown or malformed token. */
export async function findBookingToken(token: string): Promise<BookingTokenRecord | null> {
  if (!BOOKING_TOKEN_PATTERN.test(token)) return null
  const { data, error } = await client().from(BOOKING_TOKEN_TABLE).select('*').eq('token', token).maybeSingle()
  if (error) fail('read', error)
  return (data as BookingTokenRecord | null) ?? null
}

/** Every link issued to this address, oldest first (the portal's Book Now). */
export async function listBookingTokensForEmail(email: string): Promise<BookingTokenRecord[]> {
  const { data, error } = await client()
    .from(BOOKING_TOKEN_TABLE)
    .select('*')
    .eq('customer_email', email.trim().toLowerCase())
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) fail('list', error)
  return (data ?? []) as BookingTokenRecord[]
}

/** Notes that the gate sent the client on to Cal.com. Never throws. */
export async function touchBookingToken(id: string, now: Date = new Date()): Promise<void> {
  try {
    await client().from(BOOKING_TOKEN_TABLE).update({ last_used_at: now.toISOString() }).eq('id', id)
  } catch {
    // Bookkeeping only.
  }
}
