import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUnsubscribeToken } from '@/lib/email/unsubscribe'

// vi.hoisted so the mock fn exists before the vi.mock factory runs
const { mockRecordUnsubscribe } = vi.hoisted(() => ({ mockRecordUnsubscribe: vi.fn() }))

vi.mock('@/lib/email/suppression', () => ({
  recordUnsubscribe: mockRecordUnsubscribe,
}))

import { POST } from './route'

const SECRET = 'test-unsubscribe-secret'

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/email/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // unique IP per test run keeps the in-memory rate limiter out of the way
      'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`,
    },
    body: JSON.stringify(body),
  })
}

function oneClickRequest(token: string): Request {
  return new Request(
    `http://localhost/api/email/unsubscribe?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-forwarded-for': `10.0.1.${Math.floor(Math.random() * 250)}`,
      },
      body: 'List-Unsubscribe=One-Click',
    }
  )
}

// The route reads request.nextUrl (NextRequest); plain Request lacks it, so
// shim it from the standard url.
function asNextRequest(req: Request): any {
  return Object.assign(req, { nextUrl: new URL(req.url) })
}

describe('POST /api/email/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', SECRET)
  })

  it('unsubscribes a valid JSON-body token and records the lowercased email', async () => {
    mockRecordUnsubscribe.mockResolvedValue(undefined)
    const token = createUnsubscribeToken('Shopper@Example.com')

    const res = await POST(asNextRequest(jsonRequest({ token })))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(mockRecordUnsubscribe).toHaveBeenCalledWith('shopper@example.com', 'link')
  })

  it('unsubscribes via RFC 8058 one-click POST with token in the query string', async () => {
    mockRecordUnsubscribe.mockResolvedValue(undefined)
    const token = createUnsubscribeToken('shopper@example.com')

    const res = await POST(asNextRequest(oneClickRequest(token)))

    expect(res.status).toBe(200)
    expect(mockRecordUnsubscribe).toHaveBeenCalledWith('shopper@example.com', 'link')
  })

  it('returns 400 for a missing token', async () => {
    const res = await POST(asNextRequest(jsonRequest({})))

    expect(res.status).toBe(400)
    expect(mockRecordUnsubscribe).not.toHaveBeenCalled()
  })

  it('returns 400 for a tampered token', async () => {
    const token = createUnsubscribeToken('shopper@example.com')
    const res = await POST(asNextRequest(jsonRequest({ token: `${token}x` })))

    expect(res.status).toBe(400)
    expect(mockRecordUnsubscribe).not.toHaveBeenCalled()
  })

  it('returns 500 when recording the unsubscribe fails', async () => {
    mockRecordUnsubscribe.mockRejectedValue(new Error('db down'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const token = createUnsubscribeToken('shopper@example.com')

    const res = await POST(asNextRequest(jsonRequest({ token })))

    expect(res.status).toBe(500)
    consoleSpy.mockRestore()
  })
})
