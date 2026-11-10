import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

vi.mock('./templates/MembershipRenewalReminder', () => ({ default: () => null }))

import { sendMembershipRenewalReminderEmail } from './membership-renewal-reminder'
import type { MembershipEmailData } from './types'

const baseData: MembershipEmailData = {
  email: 'member@example.com',
  firstName: 'Alice',
  tier: 'gold',
  tierLabel: 'Gold',
  renewalDate: '2027-06-01',
  siteUrl: 'https://suzanneravenall.com',
}

describe('sendMembershipRenewalReminderEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The send function fails loudly without an API key; stub it so tests
    // don't depend on the developer's local .env
    vi.stubEnv('BREVO_API_KEY', 'test_brevo_key')
    // Send functions now sign an unsubscribe link per recipient
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-unsubscribe-secret')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_renewal_001')

    const id = await sendMembershipRenewalReminderEmail(baseData)

    expect(id).toBe('email_renewal_001')
  })

  it('uses the fixed subject line regardless of firstName', async () => {
    mockSend.mockResolvedValue('email_renewal_002')

    await sendMembershipRenewalReminderEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Your membership renews in 7 days' }),
    )
  })

  it('uses the fixed subject line when firstName is null', async () => {
    mockSend.mockResolvedValue('email_renewal_003')
    const dataWithoutName: MembershipEmailData = { ...baseData, firstName: null }

    await sendMembershipRenewalReminderEmail(dataWithoutName)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Your membership renews in 7 days' }),
    )
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue('email_renewal_004')

    await sendMembershipRenewalReminderEmail({ ...baseData, email: 'other@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })

  it('includes the correct replyTo address', async () => {
    mockSend.mockResolvedValue('email_renewal_005')

    await sendMembershipRenewalReminderEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'sravenall@suzanneravenall.com' }),
    )
  })

  // FROM is a module-level constant captured once at import time via `?? fallback`.
  it('leaves the sender to the shared default in lib/email/send.ts', async () => {
    mockSend.mockResolvedValue('email_from_check')

    await sendMembershipRenewalReminderEmail(baseData)

    const call = mockSend.mock.calls[0]![0] as { from?: string }
    expect(call.from).toBeUndefined()
  })

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'invalid api key'}`))

    await expect(sendMembershipRenewalReminderEmail(baseData)).rejects.toThrow(
      'Brevo error: invalid api key',
    )
  })


  it('propagates a transport failure', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(sendMembershipRenewalReminderEmail(baseData)).rejects.toThrow('network failure')
  })

  it('works correctly when renewalDate is null', async () => {
    mockSend.mockResolvedValue('email_renewal_008')
    const dataWithoutRenewal: MembershipEmailData = { ...baseData, renewalDate: null }

    const id = await sendMembershipRenewalReminderEmail(dataWithoutRenewal)

    expect(id).toBe('email_renewal_008')
  })
})
