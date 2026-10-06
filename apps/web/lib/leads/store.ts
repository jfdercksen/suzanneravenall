import type { SupabaseClient } from '@supabase/supabase-js'
import { maskEmails } from '@suzanne/integrations'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'

/**
 * Our own copy of every website lead (table public.leads, migration
 * supabase/migrations/20261006120000_leads.sql). Written before Vtiger is
 * called, so a Vtiger outage never loses a lead; rows that did not reach
 * Vtiger stay 'pending' / 'failed' for POST /api/leads/retry.
 *
 * Every function degrades instead of throwing: the table may not exist yet on
 * a box where the migration has not been applied, and the lead route must
 * keep working then (Vtiger alone holds the lead).
 */

export const LEADS_TABLE = 'leads'

export type LeadSyncStatus = 'pending' | 'synced' | 'failed' | 'n8n' | 'skipped'

export type LeadRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  source: string
  quiz_result: string | null
  vtiger_status: LeadSyncStatus
  sync_attempts: number
  created_at: string
}

export type SaveLeadResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'not_configured' | 'missing_table' | 'error'; message: string }

type PgError = { code?: string; message?: string } | null | undefined

/** True for "the table is not there": Postgres 42P01 or PostgREST's schema-cache miss. */
export function isMissingTableError(error: PgError): boolean {
  if (!error) return false
  if (error.code === '42P01' || error.code === 'PGRST205') return true
  return /does not exist|could not find the table/i.test(error.message ?? '')
}

/** Error text safe to store and log: emails masked, length capped. */
export function safeErrorText(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err)
  return maskEmails(text).slice(0, 500)
}

export function getLeadsClient(): SupabaseClient | null {
  return getServiceRoleClient()
}

export async function saveLead(
  supabase: SupabaseClient | null,
  lead: { email: string; firstName: string | null; lastName?: string | null; source: string; quizResult: string | null },
  status: LeadSyncStatus,
): Promise<SaveLeadResult> {
  if (!supabase) {
    return { ok: false, reason: 'not_configured', message: 'Supabase service role is not configured' }
  }
  try {
    const { data, error } = await supabase
      .from(LEADS_TABLE)
      .insert({
        email: lead.email.toLowerCase().trim(),
        first_name: lead.firstName,
        last_name: lead.lastName ?? null,
        source: lead.source,
        quiz_result: lead.quizResult,
        vtiger_status: status,
      })
      .select('id')
      .single()
    if (error || !data) {
      return {
        ok: false,
        reason: isMissingTableError(error) ? 'missing_table' : 'error',
        message: error?.message ?? 'insert returned no row',
      }
    }
    return { ok: true, id: (data as { id: string }).id }
  } catch (err) {
    return { ok: false, reason: 'error', message: safeErrorText(err) }
  }
}

export async function markLeadSynced(
  supabase: SupabaseClient,
  id: string,
  result: { contactId: string; eventId: string },
  attempts: number,
): Promise<boolean> {
  const now = new Date().toISOString()
  return updateRow(supabase, id, {
    vtiger_status: 'synced',
    vtiger_contact_id: result.contactId,
    vtiger_event_id: result.eventId,
    sync_attempts: attempts,
    last_sync_error: null,
    last_sync_attempt_at: now,
    synced_at: now,
  })
}

export async function markLeadFailed(
  supabase: SupabaseClient,
  id: string,
  err: unknown,
  attempts: number,
): Promise<boolean> {
  return updateRow(supabase, id, {
    vtiger_status: 'failed',
    sync_attempts: attempts,
    last_sync_error: safeErrorText(err),
    last_sync_attempt_at: new Date().toISOString(),
  })
}

/** Rows that still have to reach Vtiger, oldest first. */
export async function listUnsyncedLeads(supabase: SupabaseClient, limit: number): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .select('id, email, first_name, last_name, source, quiz_result, vtiger_status, sync_attempts, created_at')
    .in('vtiger_status', ['pending', 'failed'])
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`[leads] listing unsynced leads failed: ${error.message}`)
  return (data as LeadRow[] | null) ?? []
}

async function updateRow(supabase: SupabaseClient, id: string, values: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await supabase.from(LEADS_TABLE).update(values).eq('id', id)
    if (error) {
      console.warn(`[leads] could not update lead ${id}: ${error.message}`)
      return false
    }
    return true
  } catch (err) {
    console.warn(`[leads] could not update lead ${id}: ${safeErrorText(err)}`)
    return false
  }
}
