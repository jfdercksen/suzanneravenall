import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { quizBySlug } from '@/app/explore/quizzes'
import { getServiceRoleClient, getSubscriberByToken } from '@/lib/quiz/subscriber'
import { isEmailConfigured } from '@/lib/email/send'
import { sendQuizReportEmail } from '@/lib/email/quiz-report'
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const ReportSchema = z.object({
  quizSlug: z.string().trim().min(1).max(200),
  accessToken: z.string().trim().min(20).max(128),
})

const SEND_FAILED = 'We could not send your report right now. Please try again in a moment.'

// Every successful call sends an email, so it is limited PER DIAGNOSTIC LINK
// (5 reports per token per 10 minutes). The per-IP limit is only a flood
// guard: offices and mobile networks share one address (client QA 5 Oct).
const ipGuard = createRateLimiter({ limit: 120, windowMs: 600_000 })
const tokenLimiter = createRateLimiter({ limit: 5, windowMs: 600_000 })

/**
 * Emails the subscriber their own full report ("Email Me the Full Report").
 * The address and the result both come from the stored subscriber row, never
 * from the request, so the access token is the only thing a caller controls.
 */
export async function POST(request: NextRequest) {
  const ipCheck = ipGuard.check(getClientIp(request.headers))
  if (ipCheck.limited) return rateLimitResponse(ipCheck.retryAfterSeconds)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = ReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 422 })
  }

  const { quizSlug, accessToken } = parsed.data

  const tokenCheck = tokenLimiter.check(accessToken)
  if (tokenCheck.limited) return rateLimitResponse(tokenCheck.retryAfterSeconds)

  const quiz = quizBySlug(quizSlug)
  if (!quiz) {
    return NextResponse.json({ error: 'This diagnostic is not available.' }, { status: 404 })
  }

  const supabase = getServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const subscriber = await getSubscriberByToken(supabase, quizSlug, accessToken)
  if (!subscriber) {
    return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 404 })
  }

  // The completion call is fire-and-forget from the results screen, so a very
  // fast click can land here before the result is stored.
  const result = subscriber.result_key ? quiz.results[subscriber.result_key] : undefined
  if (subscriber.status !== 'completed' || !result) {
    return NextResponse.json({ error: SEND_FAILED }, { status: 409 })
  }

  if (!isEmailConfigured()) {
    console.error('[quiz/report] BREVO_API_KEY not set - report not sent')
    return NextResponse.json({ error: SEND_FAILED }, { status: 500 })
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://suzanneravenall.com').replace(/\/$/, '')

  try {
    await sendQuizReportEmail({
      email: subscriber.email,
      firstName: subscriber.first_name,
      quizTitle: quiz.title,
      resultTitle: result.title,
      resultSubtitle: result.subtitle,
      mirror: result.mirror,
      mechanism: result.mechanism,
      impact: result.impact,
      shift: result.shift,
      ctaLabel: result.cta,
      ctaLink: `${siteUrl}/contact#book`,
    })
  } catch (err) {
    console.error('[quiz/report] report email failed:', err instanceof Error ? err.message : err)
    Sentry.captureException(err)
    return NextResponse.json({ error: SEND_FAILED }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
