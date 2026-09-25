import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

vi.mock('./templates/MembershipExpired', () => ({ default: () => null }))

import { sendMembershipExpiredEmail } from './membership-expired'
import type { MembershipEmailData } from './types'

const baseData: MembershipEmailData = {
  email: 'member@example.com',
  firstName: 'Alice',
  tier: 'gold',
  tierLabel: 'Gold',
  renewalDate: '2026-01-01',
  siteUrl: 'https://suzanneravenall.com',
}

describe('sendMembershipExpiredEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The send function fails loudly without an API key; stub it so tests
    // don't depend on the developer's local .env
    vi.stubEnv('BREVO_API_KEY', 'test_brevo_key')
    // Send functions now sign an unsubscribe link per recipient
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-unsubscribe-secret')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_expired_001')

    const id = await sendMembershipExpiredEmail(baseData)

    expect(id).toBe('email_expired_001')
  })

  it('includes the first name in the subject when firstName is provided', async () => {
    mockSend.mockResolvedValue('email_expired_002')

    await sendMembershipExpiredEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Alice, your membership has expired',
        to: ['member@example.com'],
      }),
    )
  })

  it('uses generic subject when firstName is null', async () => {
    mockSend.mockResolvedValue('email_expired_003')
    const dataWithoutName: MembershipEmailData = { ...baseData, firstName: null }

    await sendMembershipExpiredEmail(dataWithoutName)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Your membership has expired' }),
    )
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue('email_expired_004')

    await sendMembershipExpiredEmail({ ...baseData, email: 'other@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })

  it('includes the correct replyTo address', async () => {
    mockSend.mockResolvedValue('email_expired_005')

    await sendMembershipExpiredEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'sravenall@suzanneravenall.com' }),
    )
  })

  // FROM is a module-level constant captured once at import time via `?? fallback`.
  it('leaves the sender to the shared default in lib/email/send.ts', async () => {
    mockSend.mockResolvedValue('email_from_check')

    await sendMembershipExpiredEmail(baseData)

    const call = mockSend.mock.calls[0]![0] as { from?: string }
    expect(call.from).toBeUndefined()
  })

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'rate limited'}`))

    await expect(sendMembershipExpiredEmail(baseData)).rejects.toThrow('Brevo error: rate limited')
  })


  it('propagates a transport failure', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(sendMembershipExpiredEmail(baseData)).rejects.toThrow('network failure')
  })

  it('subject uses the firstName field not the tierLabel field', async () => {
    mockSend.mockResolvedValue('email_expired_008')
    const namedData: MembershipEmailData = { ...baseData, firstName: 'Bob', tierLabel: 'Practitioner' }

    await sendMembershipExpiredEmail(namedData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Bob, your membership has expired' }),
    )
  })

  it('works correctly when renewalDate is null', async () => {
    mockSend.mockResolvedValue('email_expired_009')
    const dataWithoutRenewal: MembershipEmailData = { ...baseData, renewalDate: null }

    const id = await sendMembershipExpiredEmail(dataWithoutRenewal)

    expect(id).toBe('email_expired_009')
  })
})
