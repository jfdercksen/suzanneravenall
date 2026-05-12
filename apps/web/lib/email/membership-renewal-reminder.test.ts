import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
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
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_renewal_001' }, error: null })

    const id = await sendMembershipRenewalReminderEmail(baseData)

    expect(id).toBe('email_renewal_001')
  })

  it('uses the fixed subject line regardless of firstName', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_renewal_002' }, error: null })

    await sendMembershipRenewalReminderEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Your membership renews in 7 days' }),
    )
  })

  it('uses the fixed subject line when firstName is null', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_renewal_003' }, error: null })
    const dataWithoutName: MembershipEmailData = { ...baseData, firstName: null }

    await sendMembershipRenewalReminderEmail(dataWithoutName)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Your membership renews in 7 days' }),
    )
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_renewal_004' }, error: null })

    await sendMembershipRenewalReminderEmail({ ...baseData, email: 'other@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })

  it('includes the correct replyTo address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_renewal_005' }, error: null })

    await sendMembershipRenewalReminderEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'sravenall@suzanneravenall.com' }),
    )
  })

  // FROM is a module-level constant captured once at import time via `?? fallback`.
  // The fallback value is always used in the test environment (no RESEND_FROM_ADDRESS set),
  // which is what this test verifies. The env-var-override path is an infrastructure concern
  // that cannot be tested without module re-loading and is covered by the source code review.
  it('sends with a non-empty from address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_renewal_006' }, error: null })

    await sendMembershipRenewalReminderEmail(baseData)

    const call = mockSend.mock.calls[0][0] as { from: string }
    expect(call.from).toBeTruthy()
    expect(typeof call.from).toBe('string')
  })

  it('uses the default from address in test environment', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_renewal_007' }, error: null })

    await sendMembershipRenewalReminderEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Dr Suzanne Ravenall <hello@suzanneravenall.com>',
      }),
    )
  })

  it('throws when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'invalid api key' } })

    await expect(sendMembershipRenewalReminderEmail(baseData)).rejects.toThrow(
      'Resend error: invalid api key',
    )
  })

  it('throws when Resend returns null result and no error', async () => {
    mockSend.mockResolvedValue({ data: null, error: null })

    await expect(sendMembershipRenewalReminderEmail(baseData)).rejects.toThrow(
      'Resend returned no result',
    )
  })

  it('throws when the Resend SDK itself rejects', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(sendMembershipRenewalReminderEmail(baseData)).rejects.toThrow('network failure')
  })

  it('works correctly when renewalDate is null', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_renewal_008' }, error: null })
    const dataWithoutRenewal: MembershipEmailData = { ...baseData, renewalDate: null }

    const id = await sendMembershipRenewalReminderEmail(dataWithoutRenewal)

    expect(id).toBe('email_renewal_008')
  })
})
