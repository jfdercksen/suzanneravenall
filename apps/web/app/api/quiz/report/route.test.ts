import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockCaptureException,
  mockQuizBySlug,
  mockGetServiceRoleClient,
  mockGetSubscriberByToken,
  mockSendQuizReportEmail,
} = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockQuizBySlug: vi.fn(),
  mockGetServiceRoleClient: vi.fn(),
  mockGetSubscriberByToken: vi.fn(),
  mockSendQuizReportEmail: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({ captureException: mockCaptureException }))
vi.mock('@/app/explore/quizzes', () => ({ quizBySlug: mockQuizBySlug }))
vi.mock('@/lib/quiz/subscriber', () => ({
  getServiceRoleClient: mockGetServiceRoleClient,
  getSubscriberByToken: mockGetSubscriberByToken,
}))
vi.mock('@/lib/email/quiz-report', () => ({
  sendQuizReportEmail: mockSendQuizReportEmail,
}))

import { POST } from './route'

const QUIZ = {
  slug: 'emotional-nervous-system-mastery',
  title: 'Nervous System Pattern',
  subtitle: '',
  intro: '',
  questions: [],
  categories: ['fight', 'mixed'],
  results: {
    fight: {
      title: 'The Hyper-Alert Achiever',
      subtitle: 'sub',
      mirror: 'mirror text',
      mechanism: 'mechanism text',
      impact: ['impact 1'],
      shift: ['shift 1'],
      cta: 'Book Your Nervous System Reset',
    },
  },
}

const SUBSCRIBER = {
  id: 'sub-1',
  quiz_slug: QUIZ.slug,
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@example.com',
  access_token: 'a'.repeat(32),
  status: 'completed' as const,
  answers: { '1': 3 },
  result_key: 'fight',
  email_sent_at: null,
  created_at: '',
  updated_at: '',
}

// Distinct IP per test so the module-level rate-limit map doesn't leak state.
let ipCounter = 0
function nextIp(): string {
  ipCounter += 1
  return `198.51.100.${ipCounter}`
}

function makeRequest(body: unknown, ip = nextIp()): Request {
  return new Request('http://localhost/api/quiz/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

// Each call gets its own diagnostic link: the route limits per token.
let tokenCounter = 0
const VALID = () => ({ quizSlug: QUIZ.slug, accessToken: `tok${String(++tokenCounter).padStart(29, '0')}` })

describe('POST /api/quiz/report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('BREVO_API_KEY', 'test_brevo_key')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://suzanneravenall.com')
    mockQuizBySlug.mockReturnValue(QUIZ)
    mockGetServiceRoleClient.mockReturnValue({})
    mockGetSubscriberByToken.mockResolvedValue(SUBSCRIBER)
    mockSendQuizReportEmail.mockResolvedValue('msg_1')
  })

  it('emails the stored result to the stored address', async () => {
    const res = await POST(makeRequest(VALID()) as never)

    expect(res.status).toBe(200)
    expect(mockSendQuizReportEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        firstName: 'Alice',
        resultTitle: 'The Hyper-Alert Achiever',
        mirror: 'mirror text',
        ctaLink: 'https://suzanneravenall.com/contact',
      })
    )
  })

  it('ignores an email address supplied in the request', async () => {
    await POST(makeRequest({ ...VALID(), email: 'attacker@example.com' }) as never)

    expect(mockSendQuizReportEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alice@example.com' })
    )
  })

  it('returns 404 for an unknown token and sends nothing', async () => {
    mockGetSubscriberByToken.mockResolvedValue(null)

    const res = await POST(makeRequest(VALID()) as never)

    expect(res.status).toBe(404)
    expect(mockSendQuizReportEmail).not.toHaveBeenCalled()
  })

  it('returns 409 when the diagnostic is not completed yet', async () => {
    mockGetSubscriberByToken.mockResolvedValue({ ...SUBSCRIBER, status: 'started', result_key: null })

    const res = await POST(makeRequest(VALID()) as never)

    expect(res.status).toBe(409)
    expect(mockSendQuizReportEmail).not.toHaveBeenCalled()
  })

  it('returns 500, not a false success, when the send fails', async () => {
    mockSendQuizReportEmail.mockRejectedValue(new Error('Brevo error: boom'))

    const res = await POST(makeRequest(VALID()) as never)

    expect(res.status).toBe(500)
    expect(mockCaptureException).toHaveBeenCalled()
  })

  it('returns 500 when email is not configured', async () => {
    vi.stubEnv('BREVO_API_KEY', '')

    const res = await POST(makeRequest(VALID()) as never)

    expect(res.status).toBe(500)
    expect(mockSendQuizReportEmail).not.toHaveBeenCalled()
  })

  it('returns 422 on a malformed body', async () => {
    const res = await POST(makeRequest({ quizSlug: QUIZ.slug }) as never)

    expect(res.status).toBe(422)
  })
})
