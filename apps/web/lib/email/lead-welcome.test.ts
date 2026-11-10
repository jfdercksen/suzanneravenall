import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({ sendEmail: mockSend }))

import { sendLeadWelcomeEmail } from './lead-welcome'
import { LEAD_WELCOME_CONTENT, leadWelcomeSource } from './lead-welcome-content'
import type { LeadWelcomeSource } from './types'

const SOURCES = Object.keys(LEAD_WELCOME_CONTENT) as LeadWelcomeSource[]

describe('sendLeadWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue('msg-welcome')
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-secret')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://suzanneravenall.com')
  })

  afterEach(() => vi.unstubAllEnvs())

  it.each(SOURCES)('%s: subject, reply-to, unsubscribe headers and a plain-text part', async (source) => {
    await sendLeadWelcomeEmail({ email: 'user@example.com', firstName: 'Alice', source })

    const arg = mockSend.mock.calls[0]![0]
    const content = LEAD_WELCOME_CONTENT[source]
    expect(arg.to).toEqual(['user@example.com'])
    expect(arg.replyTo).toBe('sravenall@suzanneravenall.com')
    expect(arg.subject).toBe(content.subject)
    expect(arg.headers['List-Unsubscribe']).toMatch(/^<https:\/\/suzanneravenall\.com\/api\/email\/unsubscribe\?token=/)
    expect(arg.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    expect(arg.react.props.unsubscribeUrl).toMatch(/^https:\/\/suzanneravenall\.com\/unsubscribe\?token=/)

    const text: string = arg.text
    expect(text).toContain('Hi Alice,')
    expect(text).toContain(content.next)
    expect(text).toContain(`${content.link.label}: https://suzanneravenall.com${content.link.path}`)
    expect(text).toContain('Unsubscribe: https://suzanneravenall.com/unsubscribe?token=')
    expect(text).not.toMatch(/\u2014/)
  })

  it('greets "Hi there," when the form collected no name', async () => {
    await sendLeadWelcomeEmail({ email: 'user@example.com', firstName: null, source: 'homepage' })
    expect(mockSend.mock.calls[0]![0].text).toContain('Hi there,')
  })

  it('homepage copy repeats the page promise about The Breakthrough Trilogy', async () => {
    await sendLeadWelcomeEmail({ email: 'user@example.com', firstName: null, source: 'homepage' })
    const text: string = mockSend.mock.calls[0]![0].text
    expect(text).toContain('The Breakthrough Trilogy is on pre-order.')
    expect(text).toContain('We will let you know the moment it is released.')
    expect(text).toContain('https://suzanneravenall.com/book')
  })

  it('fails loudly without the unsubscribe secret (caller logs it)', async () => {
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', '')
    await expect(
      sendLeadWelcomeEmail({ email: 'user@example.com', firstName: null, source: 'newsletter' }),
    ).rejects.toThrow('EMAIL_UNSUBSCRIBE_SECRET is not configured')
    expect(mockSend).not.toHaveBeenCalled()
  })
})

describe('leadWelcomeSource', () => {
  it('maps the five forms, and a missing source to homepage', () => {
    expect(leadWelcomeSource('masterclass')).toBe('masterclass')
    expect(leadWelcomeSource('community')).toBe('community')
    expect(leadWelcomeSource('newsletter')).toBe('newsletter')
    expect(leadWelcomeSource('assessments-notify')).toBe('assessments-notify')
    expect(leadWelcomeSource('homepage')).toBe('homepage')
    expect(leadWelcomeSource(undefined)).toBe('homepage')
    expect(leadWelcomeSource('')).toBe('homepage')
  })

  it('returns null for quiz sources and anything unknown', () => {
    expect(leadWelcomeSource('relationship-patterns')).toBeNull()
    expect(leadWelcomeSource('constructor')).toBeNull()
  })
})

describe('welcome copy', () => {
  it('has no em dashes and only site-relative links', () => {
    for (const content of Object.values(LEAD_WELCOME_CONTENT)) {
      expect(JSON.stringify(content)).not.toMatch(/\u2014/)
      expect(content.link.path.startsWith('/')).toBe(true)
    }
  })
})
