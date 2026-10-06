import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { captureLead } from '@/lib/leads/capture'
import { sendLeadWelcomeIfDue } from '@/lib/leads/welcome'

const VIBE_WEBHOOK_URL = (process.env.VIBE_MARKETING_WEBHOOK_URL ?? '').replace(/\/$/, '')
const DELIVERY_FAILED =
  'We could not save your details right now. Please try again in a moment.'

const LeadMagnetSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  source: z.string().max(200).optional(),
  // Set by the Explore diagnostic quizzes - the user's dominant pattern.
  // Each quiz declares its own category keys (see QuizCategory = string in
  // app/explore/quizzes/types.ts), so this can't be a fixed enum.
  quizResult: z.string().max(100).optional(),
})

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = LeadMagnetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 })
  }

  const { email, firstName, source, quizResult } = parsed.data
  const timestamp = new Date().toISOString()

  // B13: tell the visitor "we have your details" only when the lead is really
  // stored somewhere. captureLead saves our own copy in Supabase first, then
  // sends it to Vtiger (or to n8n, per LEADS_AUTOMATION). A CRM failure after
  // a successful save is staff's problem (alert + retry), not the visitor's.
  const storedSource = source ?? 'homepage'
  const outcome = await captureLead({
    email,
    // Fall back to the local-part of the email: the CRM needs a first name
    // even when the form does not collect one.
    firstName: firstName ?? email.split('@')[0] ?? email,
    source: storedSource,
    quizResult: quizResult ?? null,
  })

  if (!outcome.stored) {
    return NextResponse.json({ error: DELIVERY_FAILED }, { status: 502 })
  }

  // Welcome email for the form they used - fire-and-forget, never blocks the
  // response. sendLeadWelcomeIfDue never throws: it skips sources without
  // welcome copy, unsubscribed addresses and repeats within 24h, and logs
  // its own failures.
  void sendLeadWelcomeIfDue({
    email,
    firstName: firstName ?? null,
    source: storedSource,
    leadId: outcome.leadId,
  })

  // Forward to Vibe Marketing - fire-and-forget, never blocks the response.
  // Secondary copy only: the lead is already stored above.
  // Only fires when VIBE_MARKETING_WEBHOOK_URL is configured (graceful degradation).
  if (VIBE_WEBHOOK_URL) {
    void fetch(VIBE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName: firstName ?? null,
        source: source ?? null,
        quizResult: quizResult ?? null,
        timestamp,
        platform: 'suzanneravenall',
      }),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[lead-magnet] Vibe Marketing webhook failed: ${message}`)
      // Email is PII (POPIA) - never include in error context
      Sentry.captureException(err, { extra: { source } })
    })
  }

  return NextResponse.json({ success: true, message: 'Thank you! We have your details and will be in touch.' })
}
