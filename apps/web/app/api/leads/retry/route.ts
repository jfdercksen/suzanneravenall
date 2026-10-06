import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { leadsAutomationMode, retryUnsyncedLeads } from '@/lib/leads/capture'
import { logError } from '@/lib/log'

/**
 * POST /api/leads/retry - resend website leads that are saved in Supabase but
 * did not reach Vtiger (vtiger_status pending or failed). Internal only:
 * needs the x-webhook-secret header (INTERNAL_WEBHOOK_SECRET, falling back to
 * N8N_WEBHOOK_SECRET, which the web container already has). No cron yet; how
 * to run it is in packages/integrations/README.md.
 *
 * Body (optional): { "limit": 25 } - at most 100 rows per call.
 * Refuses while LEADS_AUTOMATION is not "code", so it can never race n8n.
 */

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

function secretsMatch(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  if (!secretsMatch(request.headers.get('x-webhook-secret') ?? '', secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mode = leadsAutomationMode()
  if (mode !== 'code') {
    return NextResponse.json(
      { error: `LEADS_AUTOMATION is "${mode}"; the retry only runs when it is "code".` },
      { status: 409 },
    )
  }

  let limit = DEFAULT_LIMIT
  try {
    const body = (await request.json()) as { limit?: unknown }
    if (typeof body.limit === 'number' && Number.isFinite(body.limit)) {
      limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(body.limit)))
    }
  } catch {
    // No or invalid body: use the default.
  }

  try {
    const summary = await retryUnsyncedLeads(limit)
    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    logError('[leads-retry] retry run failed', err)
    return NextResponse.json({ error: 'Retry failed', detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
