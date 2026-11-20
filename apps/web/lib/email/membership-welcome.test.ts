import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({ sendEmail: mockSend }))

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import MembershipWelcome from './templates/MembershipWelcome'
import { formatRenewalDate, sendMembershipWelcomeEmail } from './membership-welcome'
import type { MembershipWelcomeData } from './types'

const baseData: MembershipWelcomeData = {
  email: 'member@example.com',
  firstName: 'Alice',
  levelTitle: 'Akashic Practitioner (Prdip) - Basic Membership',
  programmeName: 'Akashic Navigation',
  renewalDate: '20 November 2027',
  siteUrl: 'https://suzanneravenall.com',
}

describe('sendMembershipWelcomeEmail (KI128)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('BREVO_API_KEY', 'test_brevo_key')
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-unsubscribe-secret')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_welcome_001')
    expect(await sendMembershipWelcomeEmail(baseData)).toBe('email_welcome_001')
  })

  it('names the member and the level in the subject', async () => {
    mockSend.mockResolvedValue('id')
    await sendMembershipWelcomeEmail(baseData)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Alice, your Akashic Practitioner (Prdip) - Basic Membership is active', to: ['member@example.com'] }),
    )
  })

  it('uses a plain subject without a first name', async () => {
    mockSend.mockResolvedValue('id')
    await sendMembershipWelcomeEmail({ ...baseData, firstName: null })
    expect(mockSend.mock.calls[0][0].subject).toBe('Your Akashic Practitioner (Prdip) - Basic Membership is active')
  })

  it('formats the renewal date the way a South African member reads it', () => {
    expect(formatRenewalDate('2027-11-20T10:00:00.000Z')).toBe('20 November 2027')
  })
})

describe('MembershipWelcome template', () => {
  const html = (data: MembershipWelcomeData) => renderToStaticMarkup(createElement(MembershipWelcome, { ...data, unsubscribeUrl: 'https://u' }))

  it('shows the level, the programme and the end of the year, and says nothing renews by itself', () => {
    const out = html(baseData)
    expect(out).toContain('Akashic Practitioner (Prdip) - Basic Membership')
    expect(out).toContain('Akashic Navigation')
    expect(out).toContain('20 November 2027')
    expect(out).toContain('does not renew by itself')
  })

  it('shows no programme line for Lifestyle', () => {
    expect(html({ ...baseData, levelTitle: 'Lifestyle Membership', programmeName: null })).not.toContain('Programme:')
  })

  it('has no em dash and no old tier words', () => {
    const out = html(baseData)
    expect(out).not.toContain('\u2014')
    expect(out).not.toMatch(/Silver|Gold/)
  })
})
