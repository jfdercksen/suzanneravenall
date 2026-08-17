import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'
import { recordUnsubscribe } from '@/lib/email/suppression'
import { logError } from '@/lib/log'

/**
 * POST /api/email/unsubscribe — adds the token's email to the marketing
 * suppression list (public.email_unsubscribes).
 *
 * Accepts the HMAC-signed token two ways:
 *   - ?token=... query param — used by RFC 8058 one-click unsubscribe
 *     (List-Unsubscribe-Post): mail clients POST here with a form body we
 *     never need to read.
 *   - JSON body { token } — used by the /unsubscribe confirmation page.
 *
 * No auth beyond the token itself: possession of a validly-signed token is
 * proof the link came from an email we sent to that address.
 */

// Light in-memory rate limit (10 per IP per 10 min) — same pattern as
// /api/quiz/subscribe. The token is signed so this is purely anti-flood.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 600_000 })
    return false
  }

  if (entry.count >= 10) return true
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

  let token = request.nextUrl.searchParams.get('token') ?? ''
  if (!token) {
    try {
      const body = (await request.json()) as { token?: unknown }
      if (typeof body?.token === 'string') token = body.token
    } catch {
      // Not JSON (e.g. one-click form body) — token must come from the query.
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const email = verifyUnsubscribeToken(token)
  if (!email) {
    return NextResponse.json({ error: 'This unsubscribe link is not valid.' }, { status: 400 })
  }

  try {
    await recordUnsubscribe(email, 'link')
  } catch (err) {
    logError('[email/unsubscribe] failed:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
