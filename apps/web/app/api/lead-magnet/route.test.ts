import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'

// ---------------------------------------------------------------------------
// Hoisted mock factories - must be declared before vi.mock() factories run
// ---------------------------------------------------------------------------
const { mockCaptureException } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const N8N_URL = 'http://n8n.test:5678/webhook/lead-magnet-submission'
const VIBE_URL = 'https://vibe.example.com/webhook'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/lead-magnet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeRawRequest(rawBody: string): Request {
  return new Request('http://localhost/api/lead-magnet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: rawBody,
  })
}

function okResponse(): Response {
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

type FetchCall = [string, RequestInit]

function callsTo(spy: MockInstance<typeof fetch>, url: string): FetchCall[] {
  return (spy.mock.calls as unknown as FetchCall[]).filter(([calledUrl]) => calledUrl === url)
}

/** The single call made to `url`; fails the test if there is not exactly one. */
function onlyCallTo(spy: MockInstance<typeof fetch>, url: string): FetchCall {
  const calls = callsTo(spy, url)
  expect(calls).toHaveLength(1)
  return calls[0] as FetchCall
}

function sentBody(call: FetchCall): Record<string, unknown> {
  return JSON.parse(call[1].body as string) as Record<string, unknown>
}

// The route reads N8N_BASE_URL and VIBE_MARKETING_WEBHOOK_URL into module-level
// constants at load time, so each group re-imports the module after setting env.
async function loadRoute(): Promise<(req: Request) => Promise<Response>> {
  vi.resetModules()
  const mod = await import('./route')
  return mod.POST
}

// ---------------------------------------------------------------------------
// Group A - n8n (the lead store), VIBE_MARKETING_WEBHOOK_URL unset
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet - n8n lead store', () => {
  let POST: (req: Request) => Promise<Response>
  let fetchSpy: MockInstance<typeof fetch>
  let consoleSpy: MockInstance<typeof console.error>

  beforeEach(async () => {
    vi.clearAllMocks()
    delete process.env.VIBE_MARKETING_WEBHOOK_URL
    process.env.N8N_BASE_URL = 'http://n8n.test:5678/'
    POST = await loadRoute()
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse())
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
    delete process.env.N8N_BASE_URL
  })

  describe('happy path', () => {
    it('returns 200 with success:true once n8n accepts the lead', async () => {
      const res = await POST(makeRequest({ email: 'user@example.com' }))

      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
    })

    it('posts the lead to the n8n webhook (trailing slash stripped) and waits for it', async () => {
      await POST(makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'newsletter' }))

      const call = onlyCallTo(fetchSpy, N8N_URL)
      expect(call[1].method).toBe('POST')
      const body = sentBody(call)
      expect(body.email).toBe('user@example.com')
      expect(body.firstName).toBe('Alice')
      expect(body.source).toBe('newsletter')
      expect(body.quizResult).toBeNull()
      expect(typeof body.timestamp).toBe('string')
    })

    it('falls back to the email local-part for firstName and "homepage" for source', async () => {
      await POST(makeRequest({ email: 'jane.doe@example.com' }))

      const body = sentBody(onlyCallTo(fetchSpy, N8N_URL))
      expect(body.firstName).toBe('jane.doe')
      expect(body.source).toBe('homepage')
    })

    it('forwards quizResult when provided', async () => {
      await POST(makeRequest({ email: 'user@example.com', quizResult: 'freeze' }))

      expect(sentBody(onlyCallTo(fetchSpy, N8N_URL)).quizResult).toBe('freeze')
    })

    it('does NOT call the Vibe webhook when VIBE_MARKETING_WEBHOOK_URL is not set', async () => {
      await POST(makeRequest({ email: 'user@example.com' }))

      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('n8n failure (B13: the lead must not be reported as saved)', () => {
    it('returns 502 with an error message when n8n responds non-2xx', async () => {
      fetchSpy.mockResolvedValue(new Response('not found', { status: 404 }))

      const res = await POST(makeRequest({ email: 'user@example.com' }))
      const json = await res.json()

      expect(res.status).toBe(502)
      expect(json.success).toBeUndefined()
      expect(typeof json.error).toBe('string')
    })

    it('returns 502 when the n8n request throws (network error or timeout)', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'))

      const res = await POST(makeRequest({ email: 'user@example.com' }))

      expect(res.status).toBe(502)
    })

    it('reports the failure to Sentry without the email address (POPIA)', async () => {
      const networkError = new Error('ECONNREFUSED')
      fetchSpy.mockRejectedValue(networkError)

      await POST(makeRequest({ email: 'user@example.com', source: 'footer' }))

      expect(mockCaptureException).toHaveBeenCalledWith(networkError, { extra: { source: 'footer' } })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[lead-magnet] n8n webhook failed: ECONNREFUSED'),
      )
    })

    it('handles a non-Error rejection value', async () => {
      fetchSpy.mockRejectedValue('string error')

      const res = await POST(makeRequest({ email: 'user@example.com' }))

      expect(res.status).toBe(502)
    })
  })

  describe('email validation', () => {
    it.each([
      ['missing', { firstName: 'Alice' }],
      ['without @', { email: 'notanemail' }],
      ['without a domain', { email: 'user@' }],
      ['without a local part', { email: '@example.com' }],
      ['with spaces', { email: 'user @example.com' }],
      ['a number', { email: 42 }],
      ['null', { email: null }],
      ['an empty body', {}],
    ])('returns 422 when the email is %s', async (_label, body) => {
      const res = await POST(makeRequest(body))

      expect(res.status).toBe(422)
      expect((await res.json()).error).toBe('Please enter a valid email address.')
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('accepts subdomains and plus addressing', async () => {
      const res = await POST(makeRequest({ email: 'user+tag@mail.example.co.za' }))

      expect(res.status).toBe(200)
    })
  })

  describe('malformed request body', () => {
    it.each([
      ['invalid JSON', '{not valid json'],
      ['plain text', 'hello world'],
      ['empty', ''],
    ])('returns 400 when the body is %s', async (_label, raw) => {
      const res = await POST(makeRawRequest(raw))

      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('Invalid request body.')
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })
})

// ---------------------------------------------------------------------------
// Group B - VIBE_MARKETING_WEBHOOK_URL set (secondary, fire-and-forget copy)
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet - Vibe Marketing forwarding', () => {
  let POST: (req: Request) => Promise<Response>
  let fetchSpy: MockInstance<typeof fetch>
  let consoleSpy: MockInstance<typeof console.error>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.N8N_BASE_URL = 'http://n8n.test:5678'
    process.env.VIBE_MARKETING_WEBHOOK_URL = `${VIBE_URL}/`
    POST = await loadRoute()
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse())
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
    delete process.env.N8N_BASE_URL
    delete process.env.VIBE_MARKETING_WEBHOOK_URL
  })

  it('sends the lead to Vibe (trailing slash stripped) with the expected payload', async () => {
    const res = await POST(
      makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'homepage' }),
    )

    expect(res.status).toBe(200)
    await vi.waitFor(() => expect(callsTo(fetchSpy, VIBE_URL)).toHaveLength(1))
    const call = onlyCallTo(fetchSpy, VIBE_URL)
    expect(call[1].method).toBe('POST')
    expect(call[1].headers).toMatchObject({ 'Content-Type': 'application/json' })
    const body = sentBody(call)
    expect(body.email).toBe('user@example.com')
    expect(body.firstName).toBe('Alice')
    expect(body.source).toBe('homepage')
    expect(body.platform).toBe('suzanneravenall')
    expect(typeof body.timestamp).toBe('string')
  })

  it('sends null firstName and source to Vibe when they are not provided', async () => {
    await POST(makeRequest({ email: 'user@example.com' }))

    await vi.waitFor(() => expect(callsTo(fetchSpy, VIBE_URL)).toHaveLength(1))
    const body = sentBody(onlyCallTo(fetchSpy, VIBE_URL))
    expect(body.firstName).toBeNull()
    expect(body.source).toBeNull()
  })

  it('still returns 200 when only the Vibe call fails, and reports it to Sentry', async () => {
    const vibeError = new Error('timeout')
    fetchSpy.mockImplementation(async (url) =>
      String(url) === VIBE_URL ? Promise.reject(vibeError) : okResponse(),
    )

    const res = await POST(makeRequest({ email: 'user@example.com', source: 'footer' }))

    expect(res.status).toBe(200)
    await vi.waitFor(() => expect(mockCaptureException).toHaveBeenCalledTimes(1))
    expect(mockCaptureException).toHaveBeenCalledWith(vibeError, { extra: { source: 'footer' } })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[lead-magnet] Vibe Marketing webhook failed: timeout'),
    )
  })

  it('does not call Vibe when n8n fails', async () => {
    fetchSpy.mockResolvedValue(new Response('error', { status: 500 }))

    const res = await POST(makeRequest({ email: 'user@example.com' }))

    expect(res.status).toBe(502)
    expect(callsTo(fetchSpy, VIBE_URL)).toHaveLength(0)
  })
})
