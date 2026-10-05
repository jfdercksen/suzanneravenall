import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

const VIBE_WEBHOOK_URL = (process.env.VIBE_MARKETING_WEBHOOK_URL ?? '').replace(/\/$/, '')
const N8N_BASE_URL = (process.env.N8N_BASE_URL ?? 'http://n8n:5678').replace(/\/$/, '')
const N8N_TIMEOUT_MS = 10_000
const DELIVERY_FAILED =
  'We could not save your details right now. Please try again in a moment.'

const LeadMagnetSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  source: z.string().max(200).optional(),
  // Set by the Explore diagnostic quizzes — the user's dominant pattern.
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
  // Fall back to the local-part of the email so the n8n workflow's firstName
  // validation always passes even when the form doesn't collect a name.
  const resolvedFirstName = firstName ?? email.split('@')[0]

  // B13: the n8n lead-magnet-to-vtiger workflow is where the lead is actually
  // stored, so wait for it. It used to be fire-and-forget behind an
  // unconditional 200, which told the visitor "we have your details" even
  // when the lead was lost. Now a failure returns a 502 the forms can show.
  // Path must match the webhook trigger node: path = "lead-magnet-submission"
  try {
    const n8nRes = await fetch(`${N8N_BASE_URL}/webhook/lead-magnet-submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName: resolvedFirstName,
        source: source ?? 'homepage',
        quizResult: quizResult ?? null,
        timestamp,
      }),
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    })
    if (!n8nRes.ok) {
      throw new Error(`n8n responded ${n8nRes.status}`)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[lead-magnet] n8n webhook failed: ${message}`)
    // Email is PII (POPIA) - never include in error context
    Sentry.captureException(err, { extra: { source } })
    return NextResponse.json({ error: DELIVERY_FAILED }, { status: 502 })
  }

  // Forward to Vibe Marketing - fire-and-forget, never blocks the response.
  // Secondary copy only: the lead is already stored by n8n above.
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
      // Email is PII (POPIA) — never include in error context
      Sentry.captureException(err, { extra: { source } })
    })
  }

  return NextResponse.json({ success: true, message: 'Thank you! We have your details and will be in touch.' })
}
