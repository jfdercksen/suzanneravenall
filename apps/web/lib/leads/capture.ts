import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { automationMode, syncLeadToVtiger, type AutomationMode } from '@suzanne/integrations'
import { getVtigerClient } from '@/lib/integrations/vtiger'
import { sendStaffAlert } from '@/lib/integrations/staff-alert'
import { logError } from '@/lib/log'
import {
  getLeadsClient,
  listUnsyncedLeads,
  markLeadFailed,
  markLeadSynced,
  saveLead,
  type LeadSyncStatus,
} from './store'

/**
 * Website lead capture (n8n migration step 3).
 *
 * Order of work, so a lead is never lost to one system being down:
 *   1. save our own copy in Supabase (public.leads)
 *   2. hand the lead to Vtiger (LEADS_AUTOMATION=code, the default) or to the
 *      old n8n webhook (LEADS_AUTOMATION=n8n), never both; `off` does neither
 *   3. mark the Supabase row synced, or leave it failed for /api/leads/retry
 *
 * `stored` is true when the lead landed in at least one place. Only
 * stored=false should become an error for the visitor.
 */

export const LEAD_SYNC_BUDGET_MS = 10_000
const N8N_TIMEOUT_MS = 10_000

export type LeadCaptureInput = {
  email: string
  firstName: string
  source: string
  quizResult: string | null
}

export type LeadCaptureOutcome = {
  stored: boolean
  mode: AutomationMode
  leadId: string | null
  crm: 'synced' | 'failed' | 'dry-run' | 'n8n' | 'n8n-failed' | 'off'
}

/** LEADS_AUTOMATION (AUTOMATION_LEADS, the plan's spelling, also accepted). Default: code. */
export function leadsAutomationMode(): AutomationMode {
  return automationMode(['LEADS_AUTOMATION', 'AUTOMATION_LEADS'], 'code')
}

function initialStatus(mode: AutomationMode): LeadSyncStatus {
  if (mode === 'code') return 'pending'
  if (mode === 'n8n') return 'n8n'
  return 'skipped'
}

export async function captureLead(input: LeadCaptureInput): Promise<LeadCaptureOutcome> {
  const mode = leadsAutomationMode()
  const supabase = getLeadsClient()

  const saved = await saveLead(
    supabase,
    { email: input.email, firstName: input.firstName, source: input.source, quizResult: input.quizResult },
    initialStatus(mode),
  )
  if (!saved.ok) {
    if (saved.reason === 'error') {
      logError('[lead-magnet] could not save the lead to Supabase', new Error(saved.message), { source: input.source })
    } else {
      // Expected until the leads migration is applied on the box.
      console.warn(`[lead-magnet] lead not saved to Supabase (${saved.reason}): ${saved.message}`)
    }
  }
  const leadId = saved.ok ? saved.id : null

  if (mode === 'off') {
    return { stored: saved.ok, mode, leadId, crm: 'off' }
  }

  if (mode === 'n8n') {
    try {
      await postToN8n(input)
      return { stored: true, mode, leadId, crm: 'n8n' }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[lead-magnet] n8n webhook failed: ${message}`)
      // Email is PII (POPIA) - never include in error context
      Sentry.captureException(err, { extra: { source: input.source } })
      if (leadId && supabase) await markLeadFailed(supabase, leadId, err, 0)
      await alertCrmFailure(saved.ok, input.source, err)
      return { stored: saved.ok, mode, leadId, crm: 'n8n-failed' }
    }
  }

  // mode === 'code'
  try {
    const client = getVtigerClient()
    const result = await syncLeadToVtiger(
      client,
      { email: input.email, firstName: input.firstName, source: input.source, quizResult: input.quizResult },
      { signal: AbortSignal.timeout(LEAD_SYNC_BUDGET_MS) },
    )
    if (client.dryRun) {
      // Nothing reached Vtiger: keep the row pending so a real run sends it later.
      return { stored: saved.ok, mode, leadId, crm: 'dry-run' }
    }
    if (leadId && supabase) await markLeadSynced(supabase, leadId, result, 1)
    return { stored: true, mode, leadId, crm: 'synced' }
  } catch (err) {
    logError('[lead-magnet] Vtiger sync failed', err, { source: input.source })
    if (leadId && supabase) await markLeadFailed(supabase, leadId, err, 1)
    await alertCrmFailure(saved.ok, input.source, err)
    return { stored: saved.ok, mode, leadId, crm: 'failed' }
  }
}

async function alertCrmFailure(savedToSupabase: boolean, source: string, err: unknown): Promise<void> {
  const reason = err instanceof Error ? err.message : String(err)
  if (savedToSupabase) {
    await sendStaffAlert({
      key: 'leads-crm',
      subject: 'Website lead did not reach Vtiger',
      lines: [
        `A website lead (form: ${source}) is saved in Supabase table "leads" but did not reach Vtiger.`,
        `Reason: ${reason.slice(0, 300)}`,
        'The visitor was told their details were received. Once Vtiger is back, run the lead retry (POST /api/leads/retry, see packages/integrations/README.md).',
      ],
    })
  } else {
    await sendStaffAlert({
      key: 'leads-lost',
      subject: 'Website lead LOST: Supabase and Vtiger both failed',
      lines: [
        `A website lead (form: ${source}) could not be saved anywhere. The visitor saw an error and was asked to try again.`,
        `CRM reason: ${reason.slice(0, 300)}`,
        'Check that the leads migration is applied and that Vtiger is reachable.',
      ],
    })
  }
}

/** The pre-migration path, unchanged: wait for the n8n lead webhook. */
async function postToN8n(input: LeadCaptureInput): Promise<void> {
  const base = (process.env.N8N_BASE_URL ?? 'http://n8n:5678').replace(/\/$/, '')
  // Path must match the webhook trigger node: path = "lead-magnet-submission"
  const res = await fetch(`${base}/webhook/lead-magnet-submission`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      firstName: input.firstName,
      source: input.source,
      quizResult: input.quizResult,
      timestamp: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`n8n responded ${res.status}`)
}

// ---------------------------------------------------------------------------
// Retry of unsynced rows
// ---------------------------------------------------------------------------

export type RetrySummary = {
  processed: number
  synced: number
  failed: number
  dryRun: boolean
}

/**
 * Sends up to `limit` pending/failed rows to Vtiger, oldest first, one at a
 * time. Dedupe by email in the sync means a contact is updated, not doubled.
 */
export async function retryUnsyncedLeads(
  limit: number,
  supabase: SupabaseClient | null = getLeadsClient(),
): Promise<RetrySummary> {
  if (!supabase) throw new Error('Supabase service role is not configured')
  const rows = await listUnsyncedLeads(supabase, limit)
  const client = getVtigerClient()
  const summary: RetrySummary = { processed: 0, synced: 0, failed: 0, dryRun: client.dryRun }

  for (const row of rows) {
    summary.processed += 1
    const attempts = (row.sync_attempts ?? 0) + 1
    try {
      const result = await syncLeadToVtiger(
        client,
        {
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          source: row.source,
          quizResult: row.quiz_result,
        },
        { signal: AbortSignal.timeout(LEAD_SYNC_BUDGET_MS * 2) },
      )
      if (!client.dryRun) await markLeadSynced(supabase, row.id, result, attempts)
      summary.synced += 1
    } catch (err) {
      logError('[leads-retry] Vtiger sync failed', err, { leadId: row.id, source: row.source })
      await markLeadFailed(supabase, row.id, err, attempts)
      summary.failed += 1
    }
  }
  return summary
}
