import { NextResponse } from 'next/server'

/**
 * Shared fixed-window, per-IP, in-memory rate limiter (KI028).
 *
 * Extracted from the identical inline implementations that grew in
 * app/api/search/route.ts, app/api/quiz/subscribe/route.ts,
 * app/api/quiz/complete/route.ts and app/api/email/unsubscribe/route.ts.
 * The quiz routes and the /explore/[slug]/quiz page use this module;
 * search and unsubscribe still carry their own inline copies and can be
 * migrated here opportunistically.
 *
 * In-memory only — correct for this app's deployment (a single Next.js
 * container on one VPS). Counters reset on deploy/restart and are NOT
 * shared across instances: swap the Map for a Redis-backed store before
 * scaling horizontally.
 */

interface Entry {
  count: number
  resetAt: number
}

// Safety valve: once this many distinct IPs are tracked, expired entries are
// swept on the next check. Replaces the setInterval prune the inline copies
// used — no timer to leak in tests, and bounded memory under normal traffic.
const SWEEP_THRESHOLD = 10_000

export interface RateLimitResult {
  limited: boolean
  /** Seconds until the current window resets — the Retry-After value when limited. */
  retryAfterSeconds: number
}

export interface RateLimiter {
  check(ip: string): RateLimitResult
}

export function createRateLimiter(options: { limit: number; windowMs: number }): RateLimiter {
  const { limit, windowMs } = options
  const buckets = new Map<string, Entry>()

  function sweep(now: number): void {
    for (const [ip, entry] of buckets) {
      if (now > entry.resetAt) buckets.delete(ip)
    }
  }

  return {
    check(ip: string): RateLimitResult {
      const now = Date.now()
      if (buckets.size >= SWEEP_THRESHOLD) sweep(now)

      const entry = buckets.get(ip)
      if (!entry || now > entry.resetAt) {
        buckets.set(ip, { count: 1, resetAt: now + windowMs })
        return { limited: false, retryAfterSeconds: 0 }
      }

      if (entry.count >= limit) {
        return {
          limited: true,
          retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        }
      }

      entry.count++
      return { limited: false, retryAfterSeconds: 0 }
    },
  }
}

/**
 * Client IP resolution shared by every rate-limited route. Nginx sets
 * X-Forwarded-For in front of this app; the first entry is the client.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/** Standard 429 JSON response with a Retry-After header, for route handlers. */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}
