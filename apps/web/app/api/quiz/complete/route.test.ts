import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockCaptureException,
  mockQuizBySlug,
  mockGetServiceRoleClient,
  mockGetSubscriberByToken,
  mockMarkCompleted,
  mockSendQuizCompletionNotificationEmail,
} = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockQuizBySlug: vi.fn(),
  mockGetServiceRoleClient: vi.fn(),
  mockGetSubscriberByToken: vi.fn(),
  mockMarkCompleted: vi.fn(),
  mockSendQuizCompletionNotificationEmail: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({ captureException: mockCaptureException }))
vi.mock('@/app/explore/quizzes', () => ({ quizBySlug: mockQuizBySlug }))
vi.mock('@/lib/quiz/subscriber', () => ({
  getServiceRoleClient: mockGetServiceRoleClient,
  getSubscriberByToken: mockGetSubscriberByToken,
  markCompleted: mockMarkCompleted,
}))
vi.mock('@/lib/email/quiz-completion-notification', () => ({
  sendQuizCompletionNotificationEmail: mockSendQuizCompletionNotificationEmail,
}))

import { POST } from './route'
import { CONSENT_FORM_VERSION } from '@/lib/consent/quiz'

const QUIZ = {
  slug: 'emotional-nervous-system-mastery',
  title: 'Nervous System Pattern',
  subtitle: '',
  intro: '',
  questions: [
    { id: 1, text: 'I feel on edge', category: 'fight' },
    { id: 2, text: 'I overthink', category: 'flight' },
  ],
  categories: ['fight', 'flight', 'mixed'],
  results: {
    fight: { title: 'The Hyper-Alert Achiever', subtitle: 'sub', mirror: '', mechanism: '', impact: [], shift: [], cta: '' },
    flight: { title: 'The Anxious Anticipator', subtitle: 'sub', mirror: '', mechanism: '', impact: [], shift: [], cta: '' },
    mixed: { title: 'The Regulated Responder', subtitle: 'sub', mirror: '', mechanism: '', impact: [], shift: [], cta: '' },
  },
}

const SUBSCRIBER = {
  id: 'sub-1',
  quiz_slug: 'emotional-nervous-system-mastery',
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@example.com',
  access_token: 'a'.repeat(32),
  status: 'started' as const,
  answers: null,
  result_key: null,
  email_sent_at: null,
  created_at: '',
  updated_at: '',
}

// Each test uses a distinct default IP so the module-level rate-limit map
// (shared across tests in this file, since the module loads once) doesn't
// leak state between unrelated test cases.
let ipCounter = 0
function nextIp(): string {
  ipCounter += 1
  return `198.51.100.${ipCounter}`
}

function makeRequest(body: unknown, ip = nextIp()): Request {
  return new Request('http://localhost/api/quiz/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

// Each call gets its own diagnostic link: the route limits per token, which
// would otherwise leak between unrelated test cases.
let tokenCounter = 0
function validBody(accessToken = `tok${String(++tokenCounter).padStart(29, '0')}`) {
  return {
    quizSlug: 'emotional-nervous-system-mastery',
    accessToken,
    answers: { '1': 4, '2': 0 },
    consent: true,
  }
}

describe('POST /api/quiz/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuizBySlug.mockReturnValue(QUIZ)
    mockGetServiceRoleClient.mockReturnValue({})
    mockGetSubscriberByToken.mockResolvedValue(SUBSCRIBER)
    mockMarkCompleted.mockResolvedValue(undefined)
    mockSendQuizCompletionNotificationEmail.mockResolvedValue('email-1')
  })

  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/quiz/complete', { method: 'POST', body: '{not json' })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 422 when accessToken is too short', async () => {
    const res = await POST(makeRequest({ ...validBody(), accessToken: 'short' }) as never)
    expect(res.status).toBe(422)
  })

  it('returns 422 when an answer value is out of range', async () => {
    const res = await POST(makeRequest({ ...validBody(), answers: { '1': 9 } }) as never)
    expect(res.status).toBe(422)
  })

  it('returns 422 when the answers object has too many keys', async () => {
    const tooMany = Object.fromEntries(Array.from({ length: 61 }, (_, i) => [String(i), 1]))
    const res = await POST(makeRequest({ ...validBody(), answers: tooMany }) as never)
    expect(res.status).toBe(422)
  })

  it('filters out answer keys that are not real question IDs before persisting', async () => {
    const res = await POST(
      makeRequest({ ...validBody(), answers: { '1': 4, '2': 0, '999': 3 } }) as never,
    )
    expect(res.status).toBe(200)
    expect(mockMarkCompleted).toHaveBeenCalledWith(
      expect.anything(),
      'sub-1',
      { '1': 4, '2': 0 },
      expect.any(String),
      expect.objectContaining({ consent_form_version: CONSENT_FORM_VERSION }),
    )
  })

  it('returns 404 when the quiz is not registered', async () => {
    mockQuizBySlug.mockReturnValue(undefined)
    const res = await POST(makeRequest(validBody()) as never)
    expect(res.status).toBe(404)
  })

  it('returns 500 when Supabase env is not configured', async () => {
    mockGetServiceRoleClient.mockReturnValue(null)
    const res = await POST(makeRequest(validBody()) as never)
    expect(res.status).toBe(500)
  })

  it('returns 404 when the token does not match any subscriber', async () => {
    mockGetSubscriberByToken.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody()) as never)
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'Invalid or expired link.' })
  })

  it('re-derives the result server-side rather than trusting a client value', async () => {
    // q1 (fight)=4, q2 (flight)=0 -> fight wins regardless of any client claim
    const res = await POST(makeRequest(validBody()) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ resultKey: 'fight' })
    expect(mockMarkCompleted).toHaveBeenCalledWith(
      expect.anything(),
      'sub-1',
      validBody().answers,
      'fight',
      expect.anything(),
    )
  })

  it('tells staff who completed which quiz and the result, never the answers (POPIA)', async () => {
    await POST(makeRequest(validBody()) as never)
    expect(mockSendQuizCompletionNotificationEmail).toHaveBeenCalledWith({
      // The row id: the mail links to /staff/submissions/quiz/<id> (KI125).
      submissionId: 'sub-1',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      quizTitle: expect.any(String),
      resultTitle: 'The Hyper-Alert Achiever',
      resultSubtitle: expect.any(String),
    })
    const sent = JSON.stringify(mockSendQuizCompletionNotificationEmail.mock.calls[0])
    expect(sent).not.toContain('I feel on edge')
    expect(sent).not.toContain('Almost Always')
  })

  it('refuses a submission without the consent tick and stores nothing', async () => {
    for (const consent of [undefined, false, 'yes']) {
      const res = await POST(makeRequest({ ...validBody(), consent }) as never)
      expect(res.status).toBe(422)
    }
    expect(mockMarkCompleted).not.toHaveBeenCalled()
    expect(mockSendQuizCompletionNotificationEmail).not.toHaveBeenCalled()
  })

  it('stores the consent time and the interim consent version with the answers', async () => {
    const before = Date.now()
    await POST(makeRequest(validBody()) as never)
    const consent = mockMarkCompleted.mock.calls[0]![4] as { consented_at: string; consent_form_version: string }
    expect(consent.consent_form_version).toBe(CONSENT_FORM_VERSION)
    expect(consent.consent_form_version).toMatch(/interim/)
    expect(Date.parse(consent.consented_at)).toBeGreaterThanOrEqual(before - 1000)
  })

  it('still returns success even if the notification email fails (fire-and-forget)', async () => {
    mockSendQuizCompletionNotificationEmail.mockRejectedValue(new Error('resend down'))
    const res = await POST(makeRequest(validBody()) as never)
    expect(res.status).toBe(200)
  })

  it('returns 500 when markCompleted throws', async () => {
    mockMarkCompleted.mockRejectedValue(new Error('db error'))
    const res = await POST(makeRequest(validBody()) as never)
    expect(res.status).toBe(500)
    expect(mockCaptureException).toHaveBeenCalled()
  })

  it('returns the stored result without re-marking or re-notifying when already completed', async () => {
    mockGetSubscriberByToken.mockResolvedValue({
      ...SUBSCRIBER,
      status: 'completed',
      result_key: 'flight',
    })
    const res = await POST(makeRequest(validBody()) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ resultKey: 'flight' })
    expect(mockMarkCompleted).not.toHaveBeenCalled()
    expect(mockSendQuizCompletionNotificationEmail).not.toHaveBeenCalled()
  })

  it('limits one diagnostic link to 10 completions per 10 minutes, with a Retry-After header', async () => {
    const token = 'b'.repeat(32)
    for (let i = 0; i < 10; i++) {
      expect((await POST(makeRequest(validBody(token)) as never)).status).toBe(200)
    }
    const limited = await POST(makeRequest(validBody(token)) as never)
    expect(limited.status).toBe(429)
    const retryAfter = Number(limited.headers.get('Retry-After'))
    expect(retryAfter).toBeGreaterThanOrEqual(1)
    expect(retryAfter).toBeLessThanOrEqual(600)
  })

  it('lets many visitors behind one shared address complete (office, mobile network)', async () => {
    const ip = '203.0.113.50'
    for (let i = 0; i < 120; i++) {
      expect((await POST(makeRequest(validBody(), ip) as never)).status).toBe(200)
    }
    expect((await POST(makeRequest(validBody(), ip) as never)).status).toBe(429)
  })

  it('allows the same link again after the 10-minute window resets', async () => {
    vi.useFakeTimers()
    try {
      const token = 'c'.repeat(32)
      for (let i = 0; i < 10; i++) {
        expect((await POST(makeRequest(validBody(token)) as never)).status).toBe(200)
      }
      expect((await POST(makeRequest(validBody(token)) as never)).status).toBe(429)

      vi.advanceTimersByTime(600_001)
      expect((await POST(makeRequest(validBody(token)) as never)).status).toBe(200)
    } finally {
      vi.useRealTimers()
    }
  })
})
