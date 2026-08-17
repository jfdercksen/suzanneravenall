import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
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
    vi.stubEnv('RESEND_API_KEY', 'test_resend_key')
    // Send functions now sign an unsubscribe link per recipient
    vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-unsubscribe-secret')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_welcome_001' }, error: null })

    const id = await sendMembershipWelcomeEmail(baseData)

    expect(id).toBe('email_welcome_001')
  })

  it('includes the first name and tier label in the subject when firstName is provided', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_welcome_002' }, error: null })

    await sendMembershipWelcomeEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Welcome to your Gold membership, Alice!',
        to: ['member@example.com'],
      }),
    )
  })

  it('uses generic subject when firstName is null', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_welcome_003' }, error: null })
    const dataWithoutName: MembershipEmailData = { ...baseData, firstName: null }

    await sendMembershipWelcomeEmail(dataWithoutName)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Welcome to your Gold membership!' }),
    )
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_welcome_004' }, error: null })

    await sendMembershipWelcomeEmail({ ...baseData, email: 'other@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })

  it('includes the correct replyTo address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_welcome_005' }, error: null })

    await sendMembershipWelcomeEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'sravenall@suzanneravenall.com' }),
    )
  })

  // FROM is a module-level constant captured once at import time via `?? fallback`.
  // The fallback value is always used in the test environment (no RESEND_FROM_ADDRESS set),
  // which is what this test verifies. The env-var-override path is an infrastructure concern
  // that cannot be tested without module re-loading and is covered by the source code review.
  it('sends with a non-empty from address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_welcome_006' }, error: null })

    await sendMembershipWelcomeEmail(baseData)

    // The `await` above guarantees sendMembershipWelcomeEmail called mockSend — calls[0] exists
    const call = mockSend.mock.calls[0]![0] as { from: string }
    expect(call.from).toBeTruthy()
    expect(typeof call.from).toBe('string')
  })

  it('uses the default from address in test environment', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_welcome_007' }, error: null })

    await sendMembershipWelcomeEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Dr Suzanne Ravenall <hello@suzanneravenall.com>',
      }),
    )
  })

  it('throws when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'rate limited' } })

    await expect(sendMembershipWelcomeEmail(baseData)).rejects.toThrow('Resend error: rate limited')
  })

  it('throws when Resend returns null result and no error', async () => {
    mockSend.mockResolvedValue({ data: null, error: null })

    await expect(sendMembershipWelcomeEmail(baseData)).rejects.toThrow('Resend returned no result')
  })

  it('throws when the Resend SDK itself rejects', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(sendMembershipWelcomeEmail(baseData)).rejects.toThrow('network failure')
  })

  it('subject uses the tierLabel field not the tier field', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_welcome_008' }, error: null })
    const silverData: MembershipEmailData = { ...baseData, tier: 'silver', tierLabel: 'Silver Circle' }

    await sendMembershipWelcomeEmail(silverData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Welcome to your Silver Circle membership, Alice!' }),
    )
  })
})
