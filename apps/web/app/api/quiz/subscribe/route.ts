import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { quizBySlug } from '@/app/explore/quizzes'
import { getServiceRoleClient, markEmailSent, upsertSubscriber } from '@/lib/quiz/subscriber'
import { sendQuizInviteEmail } from '@/lib/email/quiz-invite'
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'

const SubscribeSchema = z.object({
  quizSlug: z.string().trim().min(1).max(200),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
})

// 5 requests per IP per 10-minute window — stricter than search's 20/60s
// since every hit here sends an email (KI028; shared limiter, in-memory,
// single-container deployment).
const limiter = createRateLimiter({ limit: 5, windowMs: 600_000 })

export async function POST(request: NextRequest) {
  const { limited, retryAfterSeconds } = limiter.check(getClientIp(request.headers))
  if (limited) return rateLimitResponse(retryAfterSeconds)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = SubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter your first name, last name and a valid email address.' },
      { status: 422 }
    )
  }

  const { quizSlug, firstName, lastName, email } = parsed.data

  const quiz = quizBySlug(quizSlug)
  if (!quiz) {
    return NextResponse.json({ error: 'This diagnostic is not available.' }, { status: 404 })
  }

  const supabase = getServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let subscriberId: string
  let accessToken: string
  try {
    const result = await upsertSubscriber(supabase, { quizSlug, firstName, lastName, email })
    subscriberId = result.id
    accessToken = result.accessToken
  } catch (err) {
    // Don't log the raw driver message here — a unique-constraint error on
    // (email, quiz_slug) embeds the email address in its text. Sentry still
    // captures the full exception server-side for debugging.
    console.error('[quiz/subscribe] upsert failed')
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  const link = `${SITE_URL}/explore/${quizSlug}/quiz?token=${accessToken}`

  try {
    await sendQuizInviteEmail({ email, firstName, quizTitle: quiz.title, link })
    await markEmailSent(supabase, subscriberId)
  } catch (err) {
    console.error('[quiz/subscribe] invite email failed:', err instanceof Error ? err.message : err)
    Sentry.captureException(err)
    return NextResponse.json(
      { error: "We couldn't send your link — please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
