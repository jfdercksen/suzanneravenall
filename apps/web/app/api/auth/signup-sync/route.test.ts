import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoisted mock factories — must be declared before vi.mock() factories run
// ---------------------------------------------------------------------------
const {
  mockGetUser,
  mockFrom,
  mockCreateServerClient,
  mockCookiesGetAll,
} = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockCookiesGetAll = vi.fn().mockReturnValue([])

  // Table-level mock builder — supports .select().eq().single() / .maybeSingle()
  // and .insert().select().single() chains
  const makeTableChain = (result: { data: unknown; error: unknown }) => {
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
    }
    ;(chain.insert as ReturnType<typeof vi.fn>).mockReturnValue(chain)
    ;(chain.select as ReturnType<typeof vi.fn>).mockReturnValue(chain)
    return chain
  }

  const mockFrom = vi.fn(() => makeTableChain({ data: null, error: null }))

  // createServerClient is called twice per request:
  //   1st call — session client (anon key + cookie store)
  //   2nd call — admin client (service role key + empty cookies)
  const mockCreateServerClient = vi.fn()
    .mockImplementationOnce(() => ({
      auth: { getUser: mockGetUser },
    }))
    .mockImplementation(() => ({
      from: mockFrom,
    }))

  return { mockGetUser, mockFrom, mockCreateServerClient, mockCookiesGetAll }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: mockCookiesGetAll }),
}))

// ---------------------------------------------------------------------------
// Import route AFTER mocks are registered
// ---------------------------------------------------------------------------
import { POST } from './route'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const OTHER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
const FREE_TIER_ID = 'tier-uuid-free-0000-0000-000000000000'
const EXISTING_SUB_ID = 'sub-uuid-exist-0000-0000-000000000000'
const NEW_SUB_ID = 'sub-uuid-new00-0000-0000-000000000000'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/signup-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Reset createServerClient mock to return session client first, admin client second
function resetClientMock(sessionUser: { id: string } | null = { id: VALID_UUID }) {
  mockCreateServerClient.mockReset()
  mockCreateServerClient
    .mockImplementationOnce(() => ({
      auth: { getUser: mockGetUser },
    }))
    .mockImplementation(() => ({
      from: mockFrom,
    }))
  mockGetUser.mockResolvedValue({
    data: { user: sessionUser },
    error: sessionUser ? null : { message: 'Not authenticated' },
  })
}

// Configure per-table behaviour for the admin client's mockFrom
function setupHappyPath({
  freeTierError = null,
  freeTierData = { id: FREE_TIER_ID } as unknown,
  existingSubData = null as unknown,
  insertData = { id: NEW_SUB_ID } as unknown,
  insertError = null as unknown,
} = {}) {
  mockFrom.mockImplementation((tableName: string) => {
    if (tableName === 'membership_tiers') {
      const chain: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: freeTierData, error: freeTierError }),
      }
      return chain
    }
    if (tableName === 'member_subscriptions') {
      const chain: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: existingSubData, error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: insertData, error: insertError }),
      }
      ;(chain.insert as ReturnType<typeof vi.fn>).mockReturnValue(chain)
      ;(chain.select as ReturnType<typeof vi.fn>).mockReturnValue(chain)
      return chain
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) }
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/signup-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')
    resetClientMock()
  })

  // -------------------------------------------------------------------------
  // Environment variable checks
  // -------------------------------------------------------------------------

  describe('environment variable validation', () => {
    it('returns 500 when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(500)
      expect(await res.json()).toMatchObject({ error: 'Server configuration error' })
    })

    it('returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(500)
    })

    it('does not call createServerClient when env vars are missing', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

      await POST(makeRequest({ userId: VALID_UUID }))
      expect(mockCreateServerClient).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Session authentication
  // -------------------------------------------------------------------------

  describe('session authentication', () => {
    it('returns 401 when no session exists', async () => {
      resetClientMock(null)

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(401)
      expect(await res.json()).toMatchObject({ error: 'Unauthorized' })
    })

    it('returns 403 when authenticated userId does not match session userId', async () => {
      resetClientMock({ id: OTHER_UUID })
      setupHappyPath()

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(403)
      expect(await res.json()).toMatchObject({ error: 'Forbidden' })
    })

    it('proceeds when authenticated userId matches session userId', async () => {
      resetClientMock({ id: VALID_UUID })
      setupHappyPath()

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      // Reaches subscription logic — any 2xx is fine here
      expect([200, 201]).toContain(res.status)
    })
  })

  // -------------------------------------------------------------------------
  // Request body validation (checked after session auth)
  // -------------------------------------------------------------------------

  describe('request body validation', () => {
    it('returns 400 when body is not valid JSON', async () => {
      resetClientMock({ id: VALID_UUID })
      const req = new Request('http://localhost/api/auth/signup-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not valid json',
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      expect(await res.json()).toMatchObject({ error: 'Invalid request body' })
    })

    it('returns 400 when userId is missing from body', async () => {
      resetClientMock({ id: VALID_UUID })
      const res = await POST(makeRequest({}))
      expect(res.status).toBe(400)
      expect(await res.json()).toMatchObject({ error: 'Invalid userId' })
    })

    it('returns 400 when userId is not a valid UUID format', async () => {
      resetClientMock({ id: 'not-a-uuid' })
      const res = await POST(makeRequest({ userId: 'not-a-uuid' }))
      expect(res.status).toBe(400)
      expect(await res.json()).toMatchObject({ error: 'Invalid userId' })
    })

    it('returns 400 when userId is a number', async () => {
      resetClientMock({ id: VALID_UUID })
      const res = await POST(makeRequest({ userId: 12345 }))
      expect(res.status).toBe(400)
    })

    it('allows uppercase UUID (case-insensitive regex)', async () => {
      const upperUuid = VALID_UUID.toUpperCase()
      resetClientMock({ id: upperUuid })
      setupHappyPath()

      const res = await POST(makeRequest({ userId: upperUuid }))
      expect([200, 201]).toContain(res.status)
    })
  })

  // -------------------------------------------------------------------------
  // Free tier lookup
  // -------------------------------------------------------------------------

  describe('free tier lookup', () => {
    it('returns 500 when free membership tier is not found', async () => {
      resetClientMock({ id: VALID_UUID })
      setupHappyPath({ freeTierData: null, freeTierError: { message: 'No rows' } })

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(500)
      expect(await res.json()).toMatchObject({ error: 'Free membership tier not found' })
    })

    it('returns 500 when tier query returns null data without error', async () => {
      resetClientMock({ id: VALID_UUID })
      setupHappyPath({ freeTierData: null, freeTierError: null })

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(500)
    })
  })

  // -------------------------------------------------------------------------
  // Idempotency — existing subscription
  // -------------------------------------------------------------------------

  describe('idempotency (existing subscription)', () => {
    it('returns 200 when subscription already exists', async () => {
      resetClientMock({ id: VALID_UUID })
      setupHappyPath({ existingSubData: { id: EXISTING_SUB_ID } })

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(200)
      expect(await res.json()).toMatchObject({ subscriptionId: EXISTING_SUB_ID })
    })
  })

  // -------------------------------------------------------------------------
  // Happy path — new subscription created
  // -------------------------------------------------------------------------

  describe('new subscription creation', () => {
    it('returns 201 when user is authenticated and no subscription exists', async () => {
      resetClientMock({ id: VALID_UUID })
      setupHappyPath({ existingSubData: null, insertData: { id: NEW_SUB_ID } })

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(201)
      expect(await res.json()).toMatchObject({ subscriptionId: NEW_SUB_ID })
    })

    it('returns 500 when insert fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      resetClientMock({ id: VALID_UUID })
      setupHappyPath({
        existingSubData: null,
        insertData: null,
        insertError: { message: 'unique constraint violation' },
      })

      const res = await POST(makeRequest({ userId: VALID_UUID }))
      expect(res.status).toBe(500)
      expect(await res.json()).toMatchObject({ error: 'Failed to create subscription' })
      consoleSpy.mockRestore()
    })

    it('logs insert error to console.error on insert failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      resetClientMock({ id: VALID_UUID })
      setupHappyPath({
        existingSubData: null,
        insertData: null,
        insertError: { message: 'db write failed' },
      })

      await POST(makeRequest({ userId: VALID_UUID }))
      // KI017: the route now logs the full insert-error object (via lib/log's
      // logError, which also forwards it to Sentry), not just the message string.
      expect(consoleSpy).toHaveBeenCalledWith('[signup-sync] insert error:', { message: 'db write failed' })
      consoleSpy.mockRestore()
    })
  })
})
