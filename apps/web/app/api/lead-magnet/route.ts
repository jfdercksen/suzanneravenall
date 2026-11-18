import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { captureLead } from '@/lib/leads/capture'
import { sendLeadWelcomeIfDue } from '@/lib/leads/welcome'
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { formatWatchAt } from '@/lib/masterclass'
import { marketingRecord } from '@/lib/consent/marketing'
import { MarketingChoiceSchema } from '@/lib/consent/schema'

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
  // Masterclass "Watch Later" (as on the current site): the visitor's date
  // and time, echoed in the welcome email.
  watchDate: z.string().max(10).optional(),
  watchTime: z.string().max(5).optional(),
  // POPIA marketing opt-in (unticked by default). Absent from pages cached
  // before it existed: stored as not opted in.
  marketing: MarketingChoiceSchema.optional(),
})

// Each submission can send a welcome email to the typed address.
const ipGuard = createRateLimiter({ limit: 20, windowMs: 600_000 })

export async function POST(request: Request) {
  const ipCheck = ipGuard.check(getClientIp(request.headers))
  if (ipCheck.limited) return rateLimitResponse(ipCheck.retryAfterSeconds)
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

  const { email, firstName, source, quizResult, watchDate, watchTime, marketing } = parsed.data
  let watchAt: string | null = null
  if (watchDate || watchTime) {
    watchAt = formatWatchAt(watchDate ?? '', watchTime ?? '')
    if (!watchAt) {
      return NextResponse.json({ error: 'Please choose a valid date and time to watch.' }, { status: 422 })
    }
  }
  const now = new Date()
  const timestamp = now.toISOString()
  const marketingChoice = marketingRecord(marketing, now)

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
    marketing: marketingChoice,
  })

  if (!outcome.stored) {
    return NextResponse.json({ error: DELIVERY_FAILED }, { status: 502 })
  }

  // Welcome email for the form they used - fire-and-forget, never blocks the
  // response. It is what the visitor asked for (the download, the watch
  // link, the release notice), so it goes whether or not they opted in.
  // Anything after it is marketing and goes to opted-in leads only (POPIA). sendLeadWelcomeIfDue never throws: it skips sources without
  // welcome copy, unsubscribed addresses and repeats within 24h, and logs
  // its own failures.
  void sendLeadWelcomeIfDue({
    email,
    firstName: firstName ?? null,
    source: storedSource,
    leadId: outcome.leadId,
    watchAt,
  })

  // Forward to Vibe Marketing - fire-and-forget, never blocks the response.
  // Secondary copy only: the lead is already stored above.
  // Only fires when VIBE_MARKETING_WEBHOOK_URL is configured (graceful degradation).
  // Vibe Marketing is a marketing system, so only opted-in leads go there
  // (POPIA, Suzanne's rules of 8 Nov 2026), with the channels they chose.
  // Only once our own leads row (the proof of the opt-in) is saved: a lead
  // that reached Vtiger alone is not sent.
  if (VIBE_WEBHOOK_URL && marketingChoice.marketing_opt_in && outcome.leadId) {
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
        marketingOptIn: true,
        marketingChannels: marketingChoice.marketing_channels,
        marketingChoiceAt: marketingChoice.marketing_choice_at,
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
