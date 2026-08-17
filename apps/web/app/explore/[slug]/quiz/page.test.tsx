import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockCaptureException,
  mockHeaders,
  mockTopicBySlug,
  mockQuizBySlug,
  mockGetServiceRoleClient,
  mockGetSubscriberByToken,
  mockMarkStarted,
} = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockHeaders: vi.fn(),
  mockTopicBySlug: vi.fn(),
  mockQuizBySlug: vi.fn(),
  mockGetServiceRoleClient: vi.fn(),
  mockGetSubscriberByToken: vi.fn(),
  mockMarkStarted: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({ captureException: mockCaptureException }))
vi.mock('next/headers', () => ({ headers: mockHeaders }))
vi.mock('@/app/explore/topics', () => ({ topics: [], topicBySlug: mockTopicBySlug }))
vi.mock('@/app/explore/quizzes', () => ({ quizBySlug: mockQuizBySlug }))
vi.mock('@/lib/quiz/subscriber', () => ({
  getServiceRoleClient: mockGetServiceRoleClient,
  getSubscriberByToken: mockGetSubscriberByToken,
  markStarted: mockMarkStarted,
}))
vi.mock('@/components/quiz/QuizGate', () => ({ default: () => null }))

import QuizPage from './page'

const QUIZ = {
  slug: 'emotional-nervous-system-mastery',
  title: 'Nervous System Pattern',
  subtitle: '',
  intro: '',
  questions: [{ id: 1, text: 'q', category: 'a' }],
  categories: ['a'],
  results: {},
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

// The page's rate-limit map is module-level and shared across this file's
// tests (the module loads once) — each test uses its own IP so state never
// leaks between unrelated cases. Mirrors the API route tests' pattern.
function setIp(ip: string) {
  mockHeaders.mockResolvedValue(new Headers({ 'x-forwarded-for': ip }))
}

function makeProps(token?: string) {
  return {
    params: Promise.resolve({ slug: 'emotional-nervous-system-mastery' }),
    searchParams: Promise.resolve(token ? { token } : {}),
  }
}

const TOKEN = 'a'.repeat(32)

type PageElement = { props: { initialMode?: string } }

describe('GET /explore/[slug]/quiz (page)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTopicBySlug.mockReturnValue({ slug: 'emotional-nervous-system-mastery', title: 'Nervous System' })
    mockQuizBySlug.mockReturnValue(QUIZ)
    mockGetServiceRoleClient.mockReturnValue({})
    mockGetSubscriberByToken.mockResolvedValue(SUBSCRIBER)
    mockMarkStarted.mockResolvedValue(undefined)
    setIp('192.0.2.250')
  })

  it('performs the token lookup and renders the quiz for each of 30 requests under the limit', async () => {
    setIp('192.0.2.1')
    for (let i = 0; i < 30; i++) {
      const el = (await QuizPage(makeProps(TOKEN) as never)) as PageElement
      expect(el.props.initialMode).toBe('quiz')
    }
    expect(mockGetSubscriberByToken).toHaveBeenCalledTimes(30)
  })

  it('skips the DB lookup and renders the rate-limited screen once over the limit', async () => {
    setIp('192.0.2.2')
    for (let i = 0; i < 30; i++) {
      await QuizPage(makeProps(TOKEN) as never)
    }
    mockGetSubscriberByToken.mockClear()

    const el = (await QuizPage(makeProps(TOKEN) as never)) as PageElement
    expect(el.props.initialMode).toBe('rateLimited')
    expect(mockGetSubscriberByToken).not.toHaveBeenCalled()
  })

  it('allows lookups again after the 60-second window resets', async () => {
    vi.useFakeTimers()
    try {
      setIp('192.0.2.3')
      for (let i = 0; i < 30; i++) {
        await QuizPage(makeProps(TOKEN) as never)
      }
      const limited = (await QuizPage(makeProps(TOKEN) as never)) as PageElement
      expect(limited.props.initialMode).toBe('rateLimited')

      vi.advanceTimersByTime(60_001)
      const el = (await QuizPage(makeProps(TOKEN) as never)) as PageElement
      expect(el.props.initialMode).toBe('quiz')
    } finally {
      vi.useRealTimers()
    }
  })

  it('limits per IP, not globally', async () => {
    setIp('192.0.2.4')
    for (let i = 0; i < 31; i++) {
      await QuizPage(makeProps(TOKEN) as never)
    }

    setIp('192.0.2.5')
    const el = (await QuizPage(makeProps(TOKEN) as never)) as PageElement
    expect(el.props.initialMode).toBe('quiz')
  })

  it('renders the gate for untokened requests without consuming the rate limit', async () => {
    const el = (await QuizPage(makeProps() as never)) as PageElement
    expect(el.props.initialMode).toBe('gate')
    expect(mockHeaders).not.toHaveBeenCalled()
    expect(mockGetSubscriberByToken).not.toHaveBeenCalled()
  })

  it('still renders the invalid screen for a bad token when under the limit', async () => {
    setIp('192.0.2.6')
    mockGetSubscriberByToken.mockResolvedValue(null)
    const el = (await QuizPage(makeProps(TOKEN) as never)) as PageElement
    expect(el.props.initialMode).toBe('invalid')
  })
})
