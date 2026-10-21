import { NextResponse, type NextRequest } from 'next/server'
import { isEmailConfigured } from '@/lib/email/send'
import { rejectUnlessInternal } from '@/lib/intake/internal-auth'
import { runIntakeReminders } from '@/lib/intake/service'
import { IntakeStoreError } from '@/lib/intake/store'
import { logError } from '@/lib/log'

/**
 * POST /api/intake/reminders - internal, from Medusa's intake-reminders job
 * (hourly). Sends the intake reminders that are due (day 1, 3, 5, then every
 * 3 days, at most 6, never once the form is in), and retries first mails and
 * team mails that failed earlier. No body.
 *
 * 200 { firstMails, reminders, teamMails, failed, skipped }; 401 bad secret;
 * 503 table or mail provider missing; 500 anything else.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const rejected = rejectUnlessInternal(request)
  if (rejected) return rejected
  if (!isEmailConfigured()) return NextResponse.json({ error: 'Email is not configured' }, { status: 503 })

  try {
    return NextResponse.json(await runIntakeReminders())
  } catch (err) {
    logError('[intake] reminder run failed', err)
    const missing = err instanceof IntakeStoreError && err.missingTable
    return NextResponse.json({ error: missing ? 'Intake table missing' : 'Reminder run failed' }, { status: missing ? 503 : 500 })
  }
}
