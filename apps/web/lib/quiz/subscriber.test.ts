import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSubscriberByToken, upsertSubscriber, markEmailSent, markCompleted } from './subscriber'
import type { SupabaseClient } from '@supabase/supabase-js'

function makeSupabaseMock(result: { data: unknown; error: unknown }) {
  // Thenable so a terminal `await chain.update(...).eq(...)` (no explicit
  // .single()/.maybeSingle()) resolves to `result`, same as a real
  // PostgrestFilterBuilder — while still exposing chain methods for calls
  // like .select().eq().eq().maybeSingle().
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  }
  const from = vi.fn(() => chain)
  return { from } as unknown as SupabaseClient
}

const BASE_ROW = {
  id: 'sub-1',
  quiz_slug: 'emotional-nervous-system-mastery',
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@example.com',
  access_token: 'a'.repeat(32),
  status: 'started' as const,
  answers: null,
  result_key: null,
  email_sent_at: null as string | null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('getSubscriberByToken', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('returns the row when found and no email_sent_at is set yet (TTL not started)', async () => {
    const supabase = makeSupabaseMock({ data: BASE_ROW, error: null })
    const row = await getSubscriberByToken(supabase, BASE_ROW.quiz_slug, BASE_ROW.access_token)
    expect(row).toEqual(BASE_ROW)
  })

  it('returns null when no row matches', async () => {
    const supabase = makeSupabaseMock({ data: null, error: null })
    const row = await getSubscriberByToken(supabase, 'x', 'y')
    expect(row).toBeNull()
  })

  it('returns the row when the token is within the 30-day TTL', async () => {
    const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const supabase = makeSupabaseMock({
      data: { ...BASE_ROW, email_sent_at: recent },
      error: null,
    })
    const row = await getSubscriberByToken(supabase, BASE_ROW.quiz_slug, BASE_ROW.access_token)
    expect(row).not.toBeNull()
  })

  it('returns null when the token is older than the 30-day TTL', async () => {
    const stale = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    const supabase = makeSupabaseMock({
      data: { ...BASE_ROW, email_sent_at: stale },
      error: null,
    })
    const row = await getSubscriberByToken(supabase, BASE_ROW.quiz_slug, BASE_ROW.access_token)
    expect(row).toBeNull()
  })

  it('throws when the query returns an error', async () => {
    const supabase = makeSupabaseMock({ data: null, error: { message: 'db down' } })
    await expect(getSubscriberByToken(supabase, 'x', 'y')).rejects.toThrow(
      '[quiz] getSubscriberByToken failed: db down',
    )
  })
})

describe('upsertSubscriber', () => {
  it('returns the subscriber id and a generated access token', async () => {
    const supabase = makeSupabaseMock({ data: { id: 'sub-42' }, error: null })
    const result = await upsertSubscriber(supabase, {
      quizSlug: 'emotional-nervous-system-mastery',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
    })
    expect(result.id).toBe('sub-42')
    expect(typeof result.accessToken).toBe('string')
    expect(result.accessToken.length).toBeGreaterThan(20)
  })

  it('throws when the upsert fails', async () => {
    const supabase = makeSupabaseMock({ data: null, error: { message: 'unique violation' } })
    await expect(
      upsertSubscriber(supabase, {
        quizSlug: 'emotional-nervous-system-mastery',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
      }),
    ).rejects.toThrow('[quiz] upsertSubscriber failed: unique violation')
  })
})

describe('markEmailSent / markCompleted', () => {
  it('markEmailSent resolves without throwing on success', async () => {
    const supabase = makeSupabaseMock({ data: null, error: null })
    await expect(markEmailSent(supabase, 'sub-1')).resolves.toBeUndefined()
  })

  it('markCompleted resolves without throwing on success', async () => {
    const supabase = makeSupabaseMock({ data: null, error: null })
    await expect(markCompleted(supabase, 'sub-1', { '1': 4 }, 'fight')).resolves.toBeUndefined()
  })

  it('markCompleted throws when the update fails', async () => {
    const supabase = makeSupabaseMock({ data: null, error: { message: 'write failed' } })
    await expect(markCompleted(supabase, 'sub-1', { '1': 4 }, 'fight')).rejects.toThrow(
      '[quiz] markCompleted failed: write failed',
    )
  })
})
