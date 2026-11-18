import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSubscriberByToken, upsertSubscriber, markEmailSent, markCompleted } from './subscriber'
import type { SupabaseClient } from '@supabase/supabase-js'
import { marketingRecord } from '@/lib/consent/marketing'
import { CONSENT_FORM_VERSION } from '@/lib/consent/quiz'

const NOW = new Date('2026-11-18T08:00:00.000Z')
const NO_CHOICE = marketingRecord({ optIn: false, channels: [] }, NOW)
const CONSENT = { consented_at: NOW.toISOString(), consent_form_version: CONSENT_FORM_VERSION }

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
      marketing: NO_CHOICE,
    })
    expect(result.id).toBe('sub-42')
    expect(typeof result.accessToken).toBe('string')
    expect(result.accessToken.length).toBeGreaterThan(20)
  })

  it('keeps the existing access token while it is within its TTL, so earlier emailed links still work', async () => {
    const existing = 'k'.repeat(43)
    const supabase = makeSupabaseMock({
      data: { id: 'sub-7', access_token: existing, email_sent_at: new Date().toISOString() },
      error: null,
    })
    const result = await upsertSubscriber(supabase, {
      quizSlug: 'emotional-nervous-system-mastery',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      marketing: NO_CHOICE,
    })
    expect(result.accessToken).toBe(existing)
  })

  it('issues a new token when the existing one has expired', async () => {
    const existing = 'k'.repeat(43)
    const supabase = makeSupabaseMock({
      data: { id: 'sub-7', access_token: existing, email_sent_at: '2020-01-01T00:00:00.000Z' },
      error: null,
    })
    const result = await upsertSubscriber(supabase, {
      quizSlug: 'emotional-nervous-system-mastery',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      marketing: NO_CHOICE,
    })
    expect(result.accessToken).not.toBe(existing)
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
        marketing: NO_CHOICE,
      }),
    ).rejects.toThrow('[quiz] upsertSubscriber failed: unique violation')
  })
})

describe('POPIA consent and opt-in storage', () => {
  function captureChain() {
    const calls: { upsert?: Record<string, unknown>; update?: Record<string, unknown> } = {}
    const result = { data: { id: 'sub-9' }, error: null }
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue(result),
      upsert: vi.fn((row: Record<string, unknown>) => {
        calls.upsert = row
        return chain
      }),
      update: vi.fn((row: Record<string, unknown>) => {
        calls.update = row
        return chain
      }),
      then: (resolve: (value: typeof result) => void) => resolve(result),
    }
    return { supabase: { from: vi.fn(() => chain) } as unknown as SupabaseClient, calls }
  }

  it('stores the gate opt-in with its channels, time and wording version, and clears an old consent', async () => {
    const { supabase, calls } = captureChain()
    await upsertSubscriber(supabase, {
      quizSlug: 'nervous-system',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      marketing: marketingRecord({ optIn: true, channels: ['sms', 'email'] }, NOW),
    })
    expect(calls.upsert).toMatchObject({
      marketing_opt_in: true,
      marketing_channels: ['email', 'sms'],
      marketing_choice_at: NOW.toISOString(),
      marketing_form_version: 'marketing-opt-in-v1-2026-11-18',
      consented_at: null,
      consent_form_version: null,
    })
  })

  it('leaves the stored opt-in alone when a cached page sends no choice', async () => {
    const { supabase, calls } = captureChain()
    await upsertSubscriber(supabase, { quizSlug: 'nervous-system', firstName: 'A', lastName: 'S', email: 'a@example.com', marketing: undefined })
    expect(calls.upsert).not.toHaveProperty('marketing_opt_in')
    expect(calls.upsert).not.toHaveProperty('marketing_choice_at')
  })

  it('stores the consent time and version with the answers', async () => {
    const { supabase, calls } = captureChain()
    await markCompleted(supabase, 'sub-9', { '1': 3 }, 'fight', CONSENT)
    expect(calls.update).toMatchObject({
      status: 'completed',
      answers: { '1': 3 },
      consented_at: NOW.toISOString(),
      consent_form_version: CONSENT_FORM_VERSION,
    })
    expect(CONSENT_FORM_VERSION).toMatch(/interim/)
  })
})

describe('markEmailSent / markCompleted', () => {
  it('markEmailSent resolves without throwing on success', async () => {
    const supabase = makeSupabaseMock({ data: null, error: null })
    await expect(markEmailSent(supabase, 'sub-1')).resolves.toBeUndefined()
  })

  it('markCompleted resolves without throwing on success', async () => {
    const supabase = makeSupabaseMock({ data: null, error: null })
    await expect(markCompleted(supabase, 'sub-1', { '1': 4 }, 'fight', CONSENT)).resolves.toBeUndefined()
  })

  it('markCompleted throws when the update fails', async () => {
    const supabase = makeSupabaseMock({ data: null, error: { message: 'write failed' } })
    await expect(markCompleted(supabase, 'sub-1', { '1': 4 }, 'fight', CONSENT)).rejects.toThrow(
      '[quiz] markCompleted failed: write failed',
    )
  })
})
