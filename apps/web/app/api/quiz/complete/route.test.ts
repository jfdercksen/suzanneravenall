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

const validBody = {
  quizSlug: 'emotional-nervous-system-mastery',
  accessToken: 'a'.repeat(32),
  answers: { '1': 4, '2': 0 },
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
    const res = await POST(makeRequest({ ...validBody, accessToken: 'short' }) as never)
    expect(res.status).toBe(422)
  })

  it('returns 422 when an answer value is out of range', async () => {
    const res = await POST(makeRequest({ ...validBody, answers: { '1': 9 } }) as never)
    expect(res.status).toBe(422)
  })

  it('returns 422 when the answers object has too many keys', async () => {
    const tooMany = Object.fromEntries(Array.from({ length: 61 }, (_, i) => [String(i), 1]))
    const res = await POST(makeRequest({ ...validBody, answers: tooMany }) as never)
    expect(res.status).toBe(422)
  })

  it('filters out answer keys that are not real question IDs before persisting', async () => {
    const res = await POST(
      makeRequest({ ...validBody, answers: { '1': 4, '2': 0, '999': 3 } }) as never,
    )
    expect(res.status).toBe(200)
    expect(mockMarkCompleted).toHaveBeenCalledWith(
      expect.anything(),
      'sub-1',
      { '1': 4, '2': 0 },
      expect.any(String),
    )
  })

  it('returns 404 when the quiz is not registered', async () => {
    mockQuizBySlug.mockReturnValue(undefined)
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(404)
  })

  it('returns 500 when Supabase env is not configured', async () => {
    mockGetServiceRoleClient.mockReturnValue(null)
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(500)
  })

  it('returns 404 when the token does not match any subscriber', async () => {
    mockGetSubscriberByToken.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'Invalid or expired link.' })
  })

  it('re-derives the result server-side rather than trusting a client value', async () => {
    // q1 (fight)=4, q2 (flight)=0 -> fight wins regardless of any client claim
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ resultKey: 'fight' })
    expect(mockMarkCompleted).toHaveBeenCalledWith(
      expect.anything(),
      'sub-1',
      validBody.answers,
      'fight',
    )
  })

  it('sends the completion notification with mapped answer labels', async () => {
    await POST(makeRequest(validBody) as never)
    expect(mockSendQuizCompletionNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        resultTitle: 'The Hyper-Alert Achiever',
        questions: [
          { text: 'I feel on edge', answerLabel: 'Almost Always' },
          { text: 'I overthink', answerLabel: 'Never' },
        ],
      }),
    )
  })

  it('still returns success even if the notification email fails (fire-and-forget)', async () => {
    mockSendQuizCompletionNotificationEmail.mockRejectedValue(new Error('resend down'))
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(200)
  })

  it('returns 500 when markCompleted throws', async () => {
    mockMarkCompleted.mockRejectedValue(new Error('db error'))
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(500)
    expect(mockCaptureException).toHaveBeenCalled()
  })

  it('returns the stored result without re-marking or re-notifying when already completed', async () => {
    mockGetSubscriberByToken.mockResolvedValue({
      ...SUBSCRIBER,
      status: 'completed',
      result_key: 'flight',
    })
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ resultKey: 'flight' })
    expect(mockMarkCompleted).not.toHaveBeenCalled()
    expect(mockSendQuizCompletionNotificationEmail).not.toHaveBeenCalled()
  })

  it('rate-limits after 5 requests from the same IP within the window', async () => {
    const ip = '203.0.113.50'
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(validBody, ip) as never)
      expect(res.status).toBe(200)
    }
    const limited = await POST(makeRequest(validBody, ip) as never)
    expect(limited.status).toBe(429)
  })
})
