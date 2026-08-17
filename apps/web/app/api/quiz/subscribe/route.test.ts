import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCaptureException, mockQuizBySlug, mockGetServiceRoleClient, mockUpsertSubscriber, mockMarkEmailSent, mockSendQuizInviteEmail } =
  vi.hoisted(() => ({
    mockCaptureException: vi.fn(),
    mockQuizBySlug: vi.fn(),
    mockGetServiceRoleClient: vi.fn(),
    mockUpsertSubscriber: vi.fn(),
    mockMarkEmailSent: vi.fn(),
    mockSendQuizInviteEmail: vi.fn(),
  }))

vi.mock('@sentry/nextjs', () => ({ captureException: mockCaptureException }))
vi.mock('@/app/explore/quizzes', () => ({ quizBySlug: mockQuizBySlug }))
vi.mock('@/lib/quiz/subscriber', () => ({
  getServiceRoleClient: mockGetServiceRoleClient,
  upsertSubscriber: mockUpsertSubscriber,
  markEmailSent: mockMarkEmailSent,
}))
vi.mock('@/lib/email/quiz-invite', () => ({ sendQuizInviteEmail: mockSendQuizInviteEmail }))

import { POST } from './route'

const QUIZ = {
  slug: 'emotional-nervous-system-mastery',
  title: 'Nervous System Pattern',
  subtitle: '',
  intro: '',
  questions: [],
  categories: ['a'],
  results: {},
}

// Each test uses a distinct default IP so the module-level rate-limit map
// (shared across tests in this file, since the module loads once) doesn't
// leak state between unrelated test cases.
let ipCounter = 0
function nextIp(): string {
  ipCounter += 1
  return `203.0.113.${ipCounter}`
}

function makeRequest(body: unknown, ip = nextIp()): NextRequestLike {
  return new Request('http://localhost/api/quiz/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  }) as unknown as NextRequestLike
}

type NextRequestLike = Request

const validBody = {
  quizSlug: 'emotional-nervous-system-mastery',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
}

describe('POST /api/quiz/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuizBySlug.mockReturnValue(QUIZ)
    mockGetServiceRoleClient.mockReturnValue({})
    mockUpsertSubscriber.mockResolvedValue({ id: 'sub-1', accessToken: 'a'.repeat(32) })
    mockMarkEmailSent.mockResolvedValue(undefined)
    mockSendQuizInviteEmail.mockResolvedValue('email-1')
  })

  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/quiz/subscribe', {
      method: 'POST',
      body: '{not json',
    }) as unknown as NextRequestLike
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 422 when email is invalid', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'not-an-email' }) as never)
    expect(res.status).toBe(422)
  })

  it('returns 422 when firstName is missing', async () => {
    const res = await POST(makeRequest({ ...validBody, firstName: '' }) as never)
    expect(res.status).toBe(422)
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
    expect(await res.json()).toMatchObject({ error: 'Server configuration error' })
  })

  it('returns 200 and sends the invite email on success', async () => {
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(200)
    expect(mockSendQuizInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alice@example.com', firstName: 'Alice', quizTitle: QUIZ.title }),
    )
    expect(mockMarkEmailSent).toHaveBeenCalledWith(expect.anything(), 'sub-1')
  })

  it('includes the access token in the emailed link', async () => {
    await POST(makeRequest(validBody) as never)
    const call = mockSendQuizInviteEmail.mock.calls[0][0] as { link: string }
    expect(call.link).toContain('token=' + 'a'.repeat(32))
    expect(call.link).toContain('/explore/emotional-nervous-system-mastery/quiz')
  })

  it('returns 500 when upsertSubscriber throws', async () => {
    mockUpsertSubscriber.mockRejectedValue(new Error('db error'))
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(500)
    expect(mockCaptureException).toHaveBeenCalled()
  })

  it('returns 500 when the invite email fails to send', async () => {
    mockSendQuizInviteEmail.mockRejectedValue(new Error('resend down'))
    const res = await POST(makeRequest(validBody) as never)
    expect(res.status).toBe(500)
    expect(await res.json()).toMatchObject({ error: "We couldn't send your link — please try again." })
  })

  it('rate-limits after 5 requests from the same IP within the window, with a Retry-After header', async () => {
    const ip = '198.51.100.9'
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(validBody, ip) as never)
      expect(res.status).toBe(200)
    }
    const limited = await POST(makeRequest(validBody, ip) as never)
    expect(limited.status).toBe(429)
    const retryAfter = Number(limited.headers.get('Retry-After'))
    expect(retryAfter).toBeGreaterThanOrEqual(1)
    expect(retryAfter).toBeLessThanOrEqual(600)
  })

  it('allows requests again after the 10-minute window resets', async () => {
    vi.useFakeTimers()
    try {
      const ip = '198.51.100.10'
      for (let i = 0; i < 5; i++) {
        const res = await POST(makeRequest(validBody, ip) as never)
        expect(res.status).toBe(200)
      }
      expect((await POST(makeRequest(validBody, ip) as never)).status).toBe(429)

      vi.advanceTimersByTime(600_001)
      expect((await POST(makeRequest(validBody, ip) as never)).status).toBe(200)
    } finally {
      vi.useRealTimers()
    }
  })
})
