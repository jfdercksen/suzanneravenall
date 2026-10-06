import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeFakeSupabase, type FakeLeadRow } from './__fixtures__/fake-supabase'

const h = vi.hoisted(() => ({
  supabase: null as unknown,
  send: vi.fn(),
  configured: vi.fn(),
  unsubscribed: vi.fn(),
  logError: vi.fn(),
}))

vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => h.supabase }))
vi.mock('@/lib/email/lead-welcome', () => ({ sendLeadWelcomeEmail: h.send }))
vi.mock('@/lib/email/send', () => ({ isEmailConfigured: h.configured }))
vi.mock('@/lib/email/suppression', () => ({ isEmailUnsubscribed: h.unsubscribed }))
vi.mock('@/lib/log', () => ({ logError: h.logError }))

import { sendLeadWelcomeIfDue, WELCOME_DEDUPE_WINDOW_MS } from './welcome'

const NOW = new Date('2026-10-06T12:00:00.000Z')

function row(id: string, msAgo: number, extra: Partial<FakeLeadRow> = {}): FakeLeadRow {
  return {
    id,
    email: 'user@example.com',
    source: 'masterclass',
    vtiger_status: 'synced',
    created_at: new Date(NOW.getTime() - msAgo).toISOString(),
    ...extra,
  }
}

const input = { email: 'User@Example.com', firstName: 'Alice', source: 'masterclass', leadId: 'new' }

let warnSpy: ReturnType<typeof vi.spyOn>

describe('sendLeadWelcomeIfDue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.configured.mockReturnValue(true)
    h.unsubscribed.mockResolvedValue(false)
    h.send.mockResolvedValue('msg-welcome')
    h.supabase = makeFakeSupabase({ rows: [row('new', 0)] }).client
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => warnSpy.mockRestore())

  it('sends the welcome for the first submission', async () => {
    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('sent')
    expect(h.send).toHaveBeenCalledWith({ email: 'User@Example.com', firstName: 'Alice', source: 'masterclass' })
  })

  it('maps no source / "homepage" to the homepage welcome', async () => {
    h.supabase = makeFakeSupabase({ rows: [row('new', 0, { source: 'homepage' })] }).client
    expect(await sendLeadWelcomeIfDue({ ...input, source: 'homepage', firstName: null }, NOW)).toBe('sent')
    expect(h.send).toHaveBeenCalledWith({ email: 'User@Example.com', firstName: null, source: 'homepage' })
  })

  it.each(['relationship-patterns', 'freeze-quiz', 'footer'])('sends nothing for source "%s"', async (source) => {
    expect(await sendLeadWelcomeIfDue({ ...input, source }, NOW)).toBe('no-welcome-for-source')
    expect(h.send).not.toHaveBeenCalled()
  })

  it('respects the suppression list', async () => {
    h.unsubscribed.mockResolvedValue(true)
    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('unsubscribed')
    expect(h.unsubscribed).toHaveBeenCalledWith('User@Example.com')
    expect(h.send).not.toHaveBeenCalled()
  })

  it('does not resend when the same address used the same form within 24h', async () => {
    h.supabase = makeFakeSupabase({ rows: [row('earlier', 60 * 60 * 1000), row('new', 0)] }).client
    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('recently-sent')
    expect(h.send).not.toHaveBeenCalled()
  })

  it('sends again after 24h', async () => {
    h.supabase = makeFakeSupabase({ rows: [row('old', WELCOME_DEDUPE_WINDOW_MS + 1000), row('new', 0)] }).client
    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('sent')
  })

  it('a different form within 24h still gets its own welcome', async () => {
    h.supabase = makeFakeSupabase({ rows: [row('nl', 1000, { source: 'newsletter' }), row('new', 0)] }).client
    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('sent')
  })

  it('skips when the row could not be saved but an earlier one exists', async () => {
    h.supabase = makeFakeSupabase({ rows: [row('earlier', 1000)] }).client
    expect(await sendLeadWelcomeIfDue({ ...input, leadId: null }, NOW)).toBe('recently-sent')
  })

  it('sends when the leads table cannot be read (one possible duplicate beats silence)', async () => {
    h.supabase = makeFakeSupabase({ selectError: { code: 'PGRST205', message: 'missing table' } }).client
    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('sent')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('sends when Supabase is not configured', async () => {
    h.supabase = null
    expect(await sendLeadWelcomeIfDue({ ...input, leadId: null }, NOW)).toBe('sent')
  })

  it('never throws: a send failure is logged without the address', async () => {
    h.send.mockRejectedValue(new Error('Brevo error: invalid email user@example.com'))

    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('failed')
    expect(h.logError).toHaveBeenCalledWith('[lead-welcome] welcome email failed', expect.any(Error), { source: 'masterclass' })
    expect(JSON.stringify(h.logError.mock.calls)).not.toContain('user@example.com')
    expect((h.logError.mock.calls[0]![1] as Error).message).not.toContain('user@example.com')
  })

  it('never throws when the suppression lookup throws', async () => {
    h.unsubscribed.mockRejectedValue(new Error('boom'))
    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('failed')
  })

  it('does not send when mail is not configured, and logs it', async () => {
    h.configured.mockReturnValue(false)
    expect(await sendLeadWelcomeIfDue(input, NOW)).toBe('email-not-configured')
    expect(h.send).not.toHaveBeenCalled()
    expect(h.logError).toHaveBeenCalled()
  })
})
