import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMemberTier, requireAccess } from './check-access'

// Mock next/navigation redirect — must be hoisted before any imports use it
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    // Simulate Next.js redirect by throwing so requireAccess stops executing,
    // matching real Next.js behaviour where redirect() throws a NEXT_REDIRECT error.
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))

import { redirect } from 'next/navigation'

// ---------------------------------------------------------------------------
// Supabase mock factory
// ---------------------------------------------------------------------------

function makeSupabaseMock({
  user = null as { id: string } | null,
  subscription = null as { membership_tiers: { slug: string } | null } | null,
} = {}) {
  const queryChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: subscription, error: null }),
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockReturnValue(queryChain),
    _queryChain: queryChain,
  }
}

// ---------------------------------------------------------------------------
// getMemberTier
// ---------------------------------------------------------------------------

describe('getMemberTier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns "free" when user is unauthenticated (getUser returns null user)', async () => {
    const supabase = makeSupabaseMock({ user: null })
    const tier = await getMemberTier(supabase as any)
    expect(tier).toBe('free')
    // Should not query the database at all when there is no user
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns "free" when user exists but has no active subscription', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: null,
    })
    const tier = await getMemberTier(supabase as any)
    expect(tier).toBe('free')
  })

  it('returns "silver" when user has an active silver subscription', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: { membership_tiers: { slug: 'silver' } },
    })
    const tier = await getMemberTier(supabase as any)
    expect(tier).toBe('silver')
  })

  it('returns "gold" when user has an active gold subscription', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: { membership_tiers: { slug: 'gold' } },
    })
    const tier = await getMemberTier(supabase as any)
    expect(tier).toBe('gold')
  })

  it('returns "practitioner" when user has an active practitioner subscription', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: { membership_tiers: { slug: 'practitioner' } },
    })
    const tier = await getMemberTier(supabase as any)
    expect(tier).toBe('practitioner')
  })

  it('returns "free" when subscription has an unrecognised slug', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: { membership_tiers: { slug: 'unknown-plan' } },
    })
    const tier = await getMemberTier(supabase as any)
    expect(tier).toBe('free')
  })

  it('queries member_subscriptions with the correct user id', async () => {
    const userId = 'user-abc'
    const supabase = makeSupabaseMock({
      user: { id: userId },
      subscription: null,
    })
    await getMemberTier(supabase as any)
    expect(supabase.from).toHaveBeenCalledWith('member_subscriptions')
    expect(supabase._queryChain.eq).toHaveBeenCalledWith('user_id', userId)
    expect(supabase._queryChain.eq).toHaveBeenCalledWith('status', 'active')
  })
})

// ---------------------------------------------------------------------------
// requireAccess
// ---------------------------------------------------------------------------

describe('requireAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls redirect("/portal/login") when user is null', async () => {
    const supabase = makeSupabaseMock({ user: null })
    await expect(
      requireAccess(supabase as any, 'resources_assessments')
    ).rejects.toThrow('NEXT_REDIRECT:/portal/login')
    expect(redirect).toHaveBeenCalledWith('/portal/login')
  })

  it('includes encoded fromPath in login redirect when user is null', async () => {
    const supabase = makeSupabaseMock({ user: null })
    await expect(
      requireAccess(supabase as any, 'resources_assessments', '/portal/resources')
    ).rejects.toThrow('NEXT_REDIRECT:/portal/login?redirect=%2Fportal%2Fresources')
    expect(redirect).toHaveBeenCalledWith(
      '/portal/login?redirect=%2Fportal%2Fresources'
    )
  })

  it('calls redirect("/portal/upgrade") when authenticated user lacks access', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: null, // free tier — no access to resources_assessments
    })
    await expect(
      requireAccess(supabase as any, 'resources_assessments')
    ).rejects.toThrow('NEXT_REDIRECT:/portal/upgrade')
    expect(redirect).toHaveBeenCalledWith('/portal/upgrade')
  })

  it('includes encoded fromPath in upgrade redirect when tier lacks access', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: null, // free tier
    })
    await expect(
      requireAccess(supabase as any, 'live_session_recordings', '/portal/videos')
    ).rejects.toThrow('NEXT_REDIRECT:/portal/upgrade?from=%2Fportal%2Fvideos')
    expect(redirect).toHaveBeenCalledWith(
      '/portal/upgrade?from=%2Fportal%2Fvideos'
    )
  })

  it('returns the tier when access is granted (silver accessing resources_assessments)', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: { membership_tiers: { slug: 'silver' } },
    })
    const tier = await requireAccess(supabase as any, 'resources_assessments')
    expect(tier).toBe('silver')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('returns the tier when access is granted (gold accessing live_session_recordings)', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: { membership_tiers: { slug: 'gold' } },
    })
    const tier = await requireAccess(supabase as any, 'live_session_recordings')
    expect(tier).toBe('gold')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('returns the tier when access is granted (practitioner accessing certification_materials)', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: { membership_tiers: { slug: 'practitioner' } },
    })
    const tier = await requireAccess(supabase as any, 'certification_materials')
    expect(tier).toBe('practitioner')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('allows free user to access resources_basic without redirect', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: null,
    })
    const tier = await requireAccess(supabase as any, 'resources_basic')
    expect(tier).toBe('free')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('does not append fromPath query param to login redirect when fromPath is omitted', async () => {
    const supabase = makeSupabaseMock({ user: null })
    await expect(
      requireAccess(supabase as any, 'resources_assessments')
    ).rejects.toThrow('NEXT_REDIRECT:/portal/login')
    expect(redirect).toHaveBeenCalledWith('/portal/login')
    const call = (redirect as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(call).not.toContain('?')
  })

  it('does not append fromPath query param to upgrade redirect when fromPath is omitted', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-123' },
      subscription: null,
    })
    await expect(
      requireAccess(supabase as any, 'resources_assessments')
    ).rejects.toThrow('NEXT_REDIRECT:/portal/upgrade')
    expect(redirect).toHaveBeenCalledWith('/portal/upgrade')
    const call = (redirect as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(call).not.toContain('?')
  })
})
