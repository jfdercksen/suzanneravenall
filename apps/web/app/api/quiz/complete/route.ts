import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { quizBySlug } from '@/app/explore/quizzes'
import { getServiceRoleClient, getSubscriberByToken, markCompleted } from '@/lib/quiz/subscriber'
import { computeResult } from '@/lib/quiz/scoring'
import { labelForValue } from '@/lib/quiz/scale'
import { sendQuizCompletionNotificationEmail } from '@/lib/email/quiz-completion-notification'

const CompleteSchema = z.object({
  quizSlug: z.string().trim().min(1).max(200),
  accessToken: z.string().trim().min(20).max(128),
  // Capped well above any real quiz's question count — bounds payload size
  // for an endpoint that does work before the access token is verified.
  answers: z
    .record(z.string(), z.number().int().min(0).max(4))
    .refine((val) => Object.keys(val).length <= 60, {
      message: 'Too many answers submitted.',
    }),
})

// Simple in-memory rate limiter: 5 requests per IP per 10-minute window —
// this route sends Suzanne a notification email on every successful call.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 600_000 })
    return false
  }

  if (entry.count >= 5) return true
  entry.count++
  return false
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}, 300_000)

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = CompleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 422 })
  }

  const { quizSlug, accessToken, answers } = parsed.data

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

  // Already completed (e.g. the user revisited their emailed link, or an
  // email-scanner prefetched it) — return the stored result without
  // re-writing answers or re-notifying Suzanne.
  if (subscriber.status === 'completed' && subscriber.result_key) {
    return NextResponse.json({ success: true, resultKey: subscriber.result_key })
  }

  // Keep only answers for this quiz's real questions — bounds what gets
  // persisted/emailed and ignores any extraneous keys in the payload.
  const validQuestionIds = new Set(quiz.questions.map((question) => question.id))
  const filteredAnswers = Object.fromEntries(
    Object.entries(answers).filter(([id]) => validQuestionIds.has(Number(id)))
  )

  // Re-derive the result server-side — never trust a client-supplied result key.
  const numericAnswers = Object.fromEntries(
    Object.entries(filteredAnswers).map(([id, value]) => [Number(id), value])
  )
  const resultKey = computeResult(quiz, numericAnswers)

  try {
    await markCompleted(supabase, subscriber.id, filteredAnswers, resultKey)
  } catch (err) {
    console.error('[quiz/complete] markCompleted failed:', err instanceof Error ? err.message : err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  const result = quiz.results[resultKey]

  // Fire-and-forget: the user's result is already rendered client-side from
  // local state regardless of this call's outcome.
  void sendQuizCompletionNotificationEmail({
    firstName: subscriber.first_name,
    lastName: subscriber.last_name,
    email: subscriber.email,
    quizTitle: quiz.title,
    resultTitle: result.title,
    resultSubtitle: result.subtitle,
    questions: quiz.questions.map((question) => ({
      text: question.text,
      answerLabel: labelForValue(filteredAnswers[String(question.id)] ?? 0),
    })),
  }).catch((err: unknown) => {
    console.error(
      '[quiz/complete] notification email failed:',
      err instanceof Error ? err.message : err
    )
    Sentry.captureException(err)
  })

  return NextResponse.json({ success: true, resultKey })
}
