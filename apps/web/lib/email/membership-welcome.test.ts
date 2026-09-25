import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

vi.mock('./templates/MembershipWelcome', () => ({ default: () => null }))

import { sendMembershipWelcomeEmail } from './membership-welcome'
import type { MembershipEmailData } from './types'

const baseData: MembershipEmailData = {
  email: 'member@example.com',
  firstName: 'Alice',
  tier: 'gold',
  tierLabel: 'Gold',
  renewalDate: '2027-06-01',
  siteUrl: 'https://suzanneravenall.com',
}

describe('sendMembershipWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The send function fails loudly without an API key; stub it so tests
    // don't depend on the developer's local .env
    vi.stubEnv('BREVO_API_KEY', 'test_brevo_key')
    // Send functions now sign an unsubscribe link per recipient
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-unsubscribe-secret')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_welcome_001')

    const id = await sendMembershipWelcomeEmail(baseData)

    expect(id).toBe('email_welcome_001')
  })

  it('includes the first name and tier label in the subject when firstName is provided', async () => {
    mockSend.mockResolvedValue('email_welcome_002')

    await sendMembershipWelcomeEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Welcome to your Gold membership, Alice!',
        to: ['member@example.com'],
      }),
    )
  })

  it('uses generic subject when firstName is null', async () => {
    mockSend.mockResolvedValue('email_welcome_003')
    const dataWithoutName: MembershipEmailData = { ...baseData, firstName: null }

    await sendMembershipWelcomeEmail(dataWithoutName)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Welcome to your Gold membership!' }),
    )
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue('email_welcome_004')

    await sendMembershipWelcomeEmail({ ...baseData, email: 'other@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })

  it('includes the correct replyTo address', async () => {
    mockSend.mockResolvedValue('email_welcome_005')

    await sendMembershipWelcomeEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'sravenall@suzanneravenall.com' }),
    )
  })

  // FROM is a module-level constant captured once at import time via `?? fallback`.
  it('leaves the sender to the shared default in lib/email/send.ts', async () => {
    mockSend.mockResolvedValue('email_from_check')

    await sendMembershipWelcomeEmail(baseData)

    const call = mockSend.mock.calls[0]![0] as { from?: string }
    expect(call.from).toBeUndefined()
  })

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'rate limited'}`))

    await expect(sendMembershipWelcomeEmail(baseData)).rejects.toThrow('Brevo error: rate limited')
  })


  it('propagates a transport failure', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(sendMembershipWelcomeEmail(baseData)).rejects.toThrow('network failure')
  })

  it('subject uses the tierLabel field not the tier field', async () => {
    mockSend.mockResolvedValue('email_welcome_008')
    const silverData: MembershipEmailData = { ...baseData, tier: 'silver', tierLabel: 'Silver Circle' }

    await sendMembershipWelcomeEmail(silverData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Welcome to your Silver Circle membership, Alice!' }),
    )
  })
})
