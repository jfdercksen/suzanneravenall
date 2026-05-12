import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoisted mock factories — must be declared before vi.mock() factories run
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

// ---------------------------------------------------------------------------
// NOTE on VIBE_WEBHOOK_URL module-level constant
// ---------------------------------------------------------------------------
// The route captures VIBE_MARKETING_WEBHOOK_URL at module load time into a
// module-level constant.  To test both branches (set vs. unset) we must force
// the module to re-evaluate for each group using vi.resetModules() + a fresh
// dynamic import inside beforeEach (not a static top-level import).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Group A — VIBE_MARKETING_WEBHOOK_URL is NOT set (graceful degradation)
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet — VIBE_MARKETING_WEBHOOK_URL unset', () => {
  let POST: (req: Request) => Promise<Response>
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.clearAllMocks()
    delete process.env.VIBE_MARKETING_WEBHOOK_URL

    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  // -------------------------------------------------------------------------
  // Happy path — valid email only
  // -------------------------------------------------------------------------

  describe('happy path', () => {
    it('returns 202 when only a valid email is provided', async () => {
      const res = await POST(makeRequest({ email: 'user@example.com' }))

      expect(res.status).toBe(202)
    })

    it('returns success:true in response body', async () => {
      const res = await POST(makeRequest({ email: 'user@example.com' }))
      const json = await res.json()

      expect(json.success).toBe(true)
    })

    it('does NOT call fetch when VIBE_MARKETING_WEBHOOK_URL is not set', async () => {
      await POST(makeRequest({ email: 'user@example.com' }))

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('does NOT call fetch even when firstName and source are provided', async () => {
      await POST(
        makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'homepage' }),
      )

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Invalid email
  // -------------------------------------------------------------------------

  describe('email validation', () => {
    it('returns 422 when email is missing from body', async () => {
      const res = await POST(makeRequest({ firstName: 'Alice' }))

      expect(res.status).toBe(422)
    })

    it('returns 422 with validation error message when email is missing', async () => {
      const res = await POST(makeRequest({ firstName: 'Alice' }))
      const json = await res.json()

      expect(json.error).toBe('Please enter a valid email address.')
    })

    it('returns 422 when email has no @ symbol', async () => {
      const res = await POST(makeRequest({ email: 'notanemail' }))

      expect(res.status).toBe(422)
    })

    it('returns 422 when email has no domain part', async () => {
      const res = await POST(makeRequest({ email: 'user@' }))

      expect(res.status).toBe(422)
    })

    it('returns 422 when email has no local part', async () => {
      const res = await POST(makeRequest({ email: '@example.com' }))

      expect(res.status).toBe(422)
    })

    it('returns 422 when email contains spaces', async () => {
      const res = await POST(makeRequest({ email: 'user @example.com' }))

      expect(res.status).toBe(422)
    })

    it('returns 422 when email is a number instead of string', async () => {
      const res = await POST(makeRequest({ email: 42 }))

      expect(res.status).toBe(422)
    })

    it('returns 422 when email is null', async () => {
      const res = await POST(makeRequest({ email: null }))

      expect(res.status).toBe(422)
    })

    it('returns 422 when body is an empty object', async () => {
      const res = await POST(makeRequest({}))

      expect(res.status).toBe(422)
    })

    it('returns 202 for a valid email with subdomains and plus addressing', async () => {
      const res = await POST(makeRequest({ email: 'user+tag@mail.example.co.za' }))

      expect(res.status).toBe(202)
    })
  })

  // -------------------------------------------------------------------------
  // Invalid JSON body
  // -------------------------------------------------------------------------

  describe('malformed request body', () => {
    it('returns 400 when body is not valid JSON', async () => {
      const res = await POST(makeRawRequest('{not valid json'))

      expect(res.status).toBe(400)
    })

    it('returns 400 with error message when body is not valid JSON', async () => {
      const res = await POST(makeRawRequest('{not valid json'))
      const json = await res.json()

      expect(json.error).toBe('Invalid request body.')
    })

    it('returns 400 when body is plain text', async () => {
      const res = await POST(makeRawRequest('hello world'))

      expect(res.status).toBe(400)
    })

    it('returns 400 when body is empty string', async () => {
      const res = await POST(makeRawRequest(''))

      expect(res.status).toBe(400)
    })
  })
})

// ---------------------------------------------------------------------------
// Group B — VIBE_MARKETING_WEBHOOK_URL is set
// ---------------------------------------------------------------------------
describe('POST /api/lead-magnet — VIBE_MARKETING_WEBHOOK_URL set', () => {
  let POST: (req: Request) => Promise<Response>
  let fetchSpy: ReturnType<typeof vi.spyOn>

  const VIBE_URL = 'https://vibe.example.com/webhook'

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.VIBE_MARKETING_WEBHOOK_URL = VIBE_URL

    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    delete process.env.VIBE_MARKETING_WEBHOOK_URL
  })

  // -------------------------------------------------------------------------
  // Vibe webhook is fired
  // -------------------------------------------------------------------------

  describe('Vibe Marketing webhook forwarding', () => {
    it('returns 202 when a valid email, firstName, and source are provided', async () => {
      const res = await POST(
        makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'homepage' }),
      )

      expect(res.status).toBe(202)
    })

    it('calls fetch with the Vibe webhook URL', async () => {
      await POST(makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'homepage' }))
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

      const [calledUrl] = fetchSpy.mock.calls[0] as [string, ...unknown[]]
      expect(calledUrl).toBe(VIBE_URL)
    })

    it('sends a POST request to Vibe with the correct payload shape', async () => {
      await POST(makeRequest({ email: 'user@example.com', firstName: 'Alice', source: 'homepage' }))
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(options.method).toBe('POST')
      expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' })

      const sentBody = JSON.parse(options.body as string) as Record<string, unknown>
      expect(sentBody.email).toBe('user@example.com')
      expect(sentBody.firstName).toBe('Alice')
      expect(sentBody.source).toBe('homepage')
      expect(sentBody.platform).toBe('suzanneravenall')
      expect(typeof sentBody.timestamp).toBe('string')
    })

    it('nullifies firstName and source when they are not provided', async () => {
      await POST(makeRequest({ email: 'user@example.com' }))
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const sentBody = JSON.parse(options.body as string) as Record<string, unknown>
      expect(sentBody.firstName).toBeNull()
      expect(sentBody.source).toBeNull()
    })

    it('strips trailing slash from VIBE_MARKETING_WEBHOOK_URL before calling fetch', async () => {
      // Re-load module with a trailing-slash URL to verify the .replace() logic
      fetchSpy.mockRestore()
      delete process.env.VIBE_MARKETING_WEBHOOK_URL
      process.env.VIBE_MARKETING_WEBHOOK_URL = 'https://vibe.example.com/webhook/'

      vi.resetModules()
      const mod2 = await import('./route')
      const POST2 = mod2.POST

      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )

      await POST2(makeRequest({ email: 'user@example.com' }))
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

      const [calledUrl] = fetchSpy.mock.calls[0] as [string, ...unknown[]]
      expect(calledUrl).toBe('https://vibe.example.com/webhook')
    })

    it('still returns 202 when Vibe fetch throws a network error', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const res = await POST(makeRequest({ email: 'user@example.com' }))

      expect(res.status).toBe(202)
      consoleSpy.mockRestore()
    })

    it('calls Sentry.captureException when Vibe fetch throws', async () => {
      const networkError = new Error('ECONNREFUSED')
      fetchSpy.mockRejectedValue(networkError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await POST(makeRequest({ email: 'user@example.com', source: 'footer' }))
      await vi.waitFor(() => expect(mockCaptureException).toHaveBeenCalledTimes(1))

      expect(mockCaptureException).toHaveBeenCalledWith(
        networkError,
        expect.objectContaining({ extra: { source: 'footer' } }),
      )
      consoleSpy.mockRestore()
    })

    it('logs the error message to console.error when Vibe fetch throws', async () => {
      fetchSpy.mockRejectedValue(new Error('timeout'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await POST(makeRequest({ email: 'user@example.com' }))
      await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalledTimes(1))

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[lead-magnet] Vibe Marketing webhook failed: timeout'),
      )
      consoleSpy.mockRestore()
    })

    it('still returns 202 when Vibe fetch throws a non-Error value', async () => {
      fetchSpy.mockRejectedValue('string error')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const res = await POST(makeRequest({ email: 'user@example.com' }))

      expect(res.status).toBe(202)
      consoleSpy.mockRestore()
    })
  })
})
