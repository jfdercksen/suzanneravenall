import type { SupabaseClient } from '@supabase/supabase-js'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { isMissingTableError } from '@/lib/leads/store'
import type { IntakeAnswers, IntakeRecord } from './types'

/**
 * public.intake_submissions (supabase/migrations/20261021120000_intake_submissions.sql),
 * service role only: the table has no RLS policies by design, so the
 * service-role client is the only way in. Every function throws
 * IntakeStoreError on a database failure so the routes answer 5xx and the
 * caller (Medusa) retries.
 *
 * Every mail is CLAIMED before it is sent (a conditional update that only one
 * caller can win) and given back if the send fails, so overlapping callers
 * never send the same mail twice. A crash between claim and send loses that
 * one mail: at most once, by choice.
 */

export const INTAKE_TABLE = 'intake_submissions'

/** A row whose mails failed this often is left alone (and staff are told once). */
export const MAX_SEND_FAILURES = 5

export class IntakeStoreError extends Error {
  constructor(
    message: string,
    readonly missingTable = false,
  ) {
    super(message)
    this.name = 'IntakeStoreError'
  }
}

type PgError = { code?: string; message: string } | null

function client(): SupabaseClient {
  const supabase = getServiceRoleClient()
  if (!supabase) throw new IntakeStoreError('Supabase service-role client is not configured')
  return supabase
}

function fail(action: string, error: NonNullable<PgError>): never {
  if (isMissingTableError(error)) {
    throw new IntakeStoreError(`table ${INTAKE_TABLE} is missing: apply 20261021120000_intake_submissions.sql`, true)
  }
  throw new IntakeStoreError(`${action} failed: ${error.message}`)
}

function changed(data: unknown): boolean {
  return Array.isArray(data) && data.length > 0
}

export interface NewIntakeRecord {
  token: string
  order_id: string
  order_display_id: string | null
  customer_email: string
  first_name: string | null
  last_name: string | null
  service_key: string
  service_name: string
  form_id: string
  form_key: string
  purchased_at: string
  next_reminder_at: string
  expires_at: string
}

/** The row for (order, service), inserting it when it is new. `created` is false on a replay. */
export async function upsertIntakeRecord(row: NewIntakeRecord): Promise<{ record: IntakeRecord; created: boolean }> {
  const supabase = client()
  const { data, error } = await supabase.from(INTAKE_TABLE).insert(row).select('*').maybeSingle()
  if (!error && data) return { record: data as IntakeRecord, created: true }
  if (error && error.code !== '23505') fail('insert', error)

  const { data: existing, error: readError } = await supabase
    .from(INTAKE_TABLE)
    .select('*')
    .eq('order_id', row.order_id)
    .eq('service_key', row.service_key)
    .maybeSingle()
  if (readError) fail('read after duplicate', readError)
  if (!existing) throw new IntakeStoreError('duplicate key but no row for (order, service)')
  return { record: existing as IntakeRecord, created: false }
}

/** Takes the first mail for this row; false when it already went or another caller is sending it. */
export async function claimIntakeSend(id: string, now: Date): Promise<boolean> {
  const { data, error } = await client()
    .from(INTAKE_TABLE)
    .update({ intake_sent_at: now.toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .is('intake_sent_at', null)
    .select('id')
  if (error) fail('claim intake send', error)
  return changed(data)
}

/** Gives the first mail back after a failed send. */
export async function releaseIntakeSend(id: string): Promise<void> {
  const { error } = await client().from(INTAKE_TABLE).update({ intake_sent_at: null }).eq('id', id)
  if (error) fail('release intake send', error)
}

/** Counts a failed send; returns the new count. */
export async function recordSendFailure(id: string, previous: number): Promise<number> {
  const next = previous + 1
  const { error } = await client().from(INTAKE_TABLE).update({ send_failures: next }).eq('id', id).eq('send_failures', previous)
  if (error) fail('record send failure', error)
  return next
}

export async function getIntakeByToken(token: string): Promise<IntakeRecord | null> {
  const { data, error } = await client().from(INTAKE_TABLE).select('*').eq('token', token).maybeSingle()
  if (error) fail('read by token', error)
  return (data as IntakeRecord | null) ?? null
}

/**
 * Pending rows whose first mail never went (Brevo refused it, or Medusa gave
 * up retrying), created before `olderThan` so the hourly run never races the
 * order route that is sending it now.
 */
export async function listUnsentIntakes(olderThan: Date, now: Date, limit = 50): Promise<IntakeRecord[]> {
  const { data, error } = await client()
    .from(INTAKE_TABLE)
    .select('*')
    .eq('status', 'pending')
    .is('intake_sent_at', null)
    .lt('send_failures', MAX_SEND_FAILURES)
    .lt('created_at', olderThan.toISOString())
    .gt('expires_at', now.toISOString())
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) fail('list unsent intakes', error)
  return (data as IntakeRecord[] | null) ?? []
}

/** Pending rows whose reminder is due, oldest first. */
export async function listDueReminders(now: Date, limit = 50): Promise<IntakeRecord[]> {
  const { data, error } = await client()
    .from(INTAKE_TABLE)
    .select('*')
    .eq('status', 'pending')
    .not('intake_sent_at', 'is', null)
    .lt('send_failures', MAX_SEND_FAILURES)
    .lte('next_reminder_at', now.toISOString())
    .gt('expires_at', now.toISOString())
    .order('next_reminder_at', { ascending: true })
    .limit(limit)
  if (error) fail('list due reminders', error)
  return (data as IntakeRecord[] | null) ?? []
}

/**
 * Takes reminder number `n` for this row. The update only matches while the
 * row is still pending with n-1 sent, so two runs (or a retry) can never both
 * send reminder n: the dedupe per (record, reminder number).
 */
export async function claimReminder(id: string, n: number, next: Date | null, now: Date): Promise<boolean> {
  const { data, error } = await client()
    .from(INTAKE_TABLE)
    .update({
      reminders_sent: n,
      next_reminder_at: next ? next.toISOString() : null,
      last_reminder_at: now.toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .eq('reminders_sent', n - 1)
    .select('id')
  if (error) fail('claim reminder', error)
  return changed(data)
}

/** Closes an order's open forms (the order was cancelled). Returns how many were closed. */
export async function cancelOrderIntakes(orderId: string, now: Date): Promise<number> {
  const { data, error } = await client()
    .from(INTAKE_TABLE)
    .update({ status: 'cancelled', cancelled_at: now.toISOString(), next_reminder_at: null })
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .select('id')
  if (error) fail('cancel', error)
  return Array.isArray(data) ? data.length : 0
}

/** Ends a reminder sequence without sending (the schedule was shortened under it). */
export async function endReminders(id: string): Promise<void> {
  const { error } = await client().from(INTAKE_TABLE).update({ next_reminder_at: null }).eq('id', id).eq('status', 'pending')
  if (error) fail('end reminders', error)
}

/** Gives reminder `n` back after a failed send, so the next run tries it again. */
export async function releaseReminder(id: string, n: number, dueAt: string | null, lastAt: string | null): Promise<void> {
  const { error } = await client()
    .from(INTAKE_TABLE)
    .update({ reminders_sent: n - 1, next_reminder_at: dueAt, last_reminder_at: lastAt })
    .eq('id', id)
    .eq('status', 'pending')
    .eq('reminders_sent', n)
  if (error) fail('release reminder', error)
}

/**
 * Saves the answers and closes the form. Matches only a pending, unexpired
 * row, so a double submit saves once; null means it was already in or expired.
 */
export async function completeIntake(token: string, answers: IntakeAnswers, now: Date): Promise<IntakeRecord | null> {
  const { data, error } = await client()
    .from(INTAKE_TABLE)
    .update({ status: 'completed', answers, completed_at: now.toISOString(), next_reminder_at: null })
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', now.toISOString())
    .select('*')
  if (error) fail('complete', error)
  return changed(data) ? ((data as IntakeRecord[])[0] ?? null) : null
}

/**
 * Completed forms whose team mail has not gone yet, older than `olderThan`
 * so the hourly run leaves the submit route's own send alone.
 */
export async function listTeamPending(olderThan: Date, limit = 20): Promise<IntakeRecord[]> {
  const { data, error } = await client()
    .from(INTAKE_TABLE)
    .select('*')
    .eq('status', 'completed')
    .is('team_notified_at', null)
    .lt('send_failures', MAX_SEND_FAILURES)
    .lt('completed_at', olderThan.toISOString())
    .order('completed_at', { ascending: true })
    .limit(limit)
  if (error) fail('list team pending', error)
  return (data as IntakeRecord[] | null) ?? []
}

/** Takes the team mail for this row; false when it already went or is being sent. */
export async function claimTeamNotify(id: string, now: Date): Promise<boolean> {
  const { data, error } = await client()
    .from(INTAKE_TABLE)
    .update({ team_notified_at: now.toISOString() })
    .eq('id', id)
    .is('team_notified_at', null)
    .select('id')
  if (error) fail('claim team mail', error)
  return changed(data)
}

/** Gives the team mail back after a failed send. */
export async function releaseTeamNotify(id: string): Promise<void> {
  const { error } = await client().from(INTAKE_TABLE).update({ team_notified_at: null }).eq('id', id)
  if (error) fail('release team mail', error)
}
