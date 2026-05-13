import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

const VIBE_WEBHOOK_URL = (process.env.VIBE_MARKETING_WEBHOOK_URL ?? '').replace(/\/$/, '')

const LeadMagnetSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  source: z.string().max(200).optional(),
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

  const { email, firstName, source } = parsed.data

  // Forward to Vibe Marketing — fire-and-forget, never blocks the response.
  // Only fires when VIBE_MARKETING_WEBHOOK_URL is configured (graceful degradation).
  if (VIBE_WEBHOOK_URL) {
    void fetch(VIBE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName: firstName ?? null,
        source: source ?? null,
        timestamp: new Date().toISOString(),
        platform: 'suzanneravenall',
      }),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[lead-magnet] Vibe Marketing webhook failed: ${message}`)
      // Email is PII (POPIA) — never include in error context
      Sentry.captureException(err, { extra: { source } })
    })
  }

  // TODO (Task 1.7): integrate with Resend once the account is verified.
  // Email is intentionally not logged here — email addresses are PII (POPIA).
  // Returning 202 Accepted to signal the request is queued but not yet processed.
  return NextResponse.json(
    { success: true, message: 'Received — integration pending.' },
    { status: 202 }
  )
}
