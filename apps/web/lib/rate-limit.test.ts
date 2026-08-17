import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRateLimiter, getClientIp, rateLimitResponse } from './rate-limit'

describe('createRateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 })
    for (let i = 0; i < 3; i++) {
      expect(limiter.check('203.0.113.1').limited).toBe(false)
    }
  })

  it('limits the request after the limit is reached and reports a positive retry-after', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 })
    for (let i = 0; i < 3; i++) limiter.check('203.0.113.2')

    const result = limiter.check('203.0.113.2')
    expect(result.limited).toBe(true)
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1)
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60)
  })

  it('resets the window after windowMs elapses', () => {
    vi.useFakeTimers()
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 })

    limiter.check('203.0.113.3')
    limiter.check('203.0.113.3')
    expect(limiter.check('203.0.113.3').limited).toBe(true)

    vi.advanceTimersByTime(60_001)
    expect(limiter.check('203.0.113.3').limited).toBe(false)
  })

  it('tracks IPs independently', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 })
    expect(limiter.check('203.0.113.4').limited).toBe(false)
    expect(limiter.check('203.0.113.4').limited).toBe(true)
    expect(limiter.check('203.0.113.5').limited).toBe(false)
  })

  it('counts retry-after down as the window ages', () => {
    vi.useFakeTimers()
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 })

    limiter.check('203.0.113.6')
    vi.advanceTimersByTime(45_000)
    const result = limiter.check('203.0.113.6')
    expect(result.limited).toBe(true)
    expect(result.retryAfterSeconds).toBe(15)
  })
})

describe('getClientIp', () => {
  it('uses the first x-forwarded-for entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '198.51.100.7, 10.0.0.1' })
    expect(getClientIp(headers)).toBe('198.51.100.7')
  })

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.8' })
    expect(getClientIp(headers)).toBe('198.51.100.8')
  })

  it('falls back to "unknown" when no headers are present', () => {
    expect(getClientIp(new Headers())).toBe('unknown')
  })
})

describe('rateLimitResponse', () => {
  it('returns a 429 with a Retry-After header and a friendly body', async () => {
    const res = rateLimitResponse(42)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
    expect(await res.json()).toMatchObject({
      error: 'Too many requests. Please wait a moment and try again.',
    })
  })
})
