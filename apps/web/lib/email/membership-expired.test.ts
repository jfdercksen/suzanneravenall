import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module hoisting so the variable is available inside
// the vi.mock factory (which itself is hoisted to the top of the file).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
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
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_001' }, error: null })

    const id = await sendMembershipExpiredEmail(baseData)

    expect(id).toBe('email_expired_001')
  })

  it('includes the first name in the subject when firstName is provided', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_002' }, error: null })

    await sendMembershipExpiredEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Alice, your membership has expired',
        to: ['member@example.com'],
      }),
    )
  })

  it('uses generic subject when firstName is null', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_003' }, error: null })
    const dataWithoutName: MembershipEmailData = { ...baseData, firstName: null }

    await sendMembershipExpiredEmail(dataWithoutName)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Your membership has expired' }),
    )
  })

  it('sends to the correct email address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_004' }, error: null })

    await sendMembershipExpiredEmail({ ...baseData, email: 'other@example.com' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['other@example.com'] }),
    )
  })

  it('includes the correct replyTo address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_005' }, error: null })

    await sendMembershipExpiredEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'sravenall@suzanneravenall.com' }),
    )
  })

  // FROM is a module-level constant captured once at import time via `?? fallback`.
  // The fallback value is always used in the test environment (no RESEND_FROM_ADDRESS set),
  // which is what this test verifies. The env-var-override path is an infrastructure concern
  // that cannot be tested without module re-loading and is covered by the source code review.
  it('sends with a non-empty from address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_006' }, error: null })

    await sendMembershipExpiredEmail(baseData)

    // The `await` above guarantees sendMembershipExpiredEmail called mockSend — calls[0] exists
    const call = mockSend.mock.calls[0]![0] as { from: string }
    expect(call.from).toBeTruthy()
    expect(typeof call.from).toBe('string')
  })

  it('uses the default from address in test environment', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_007' }, error: null })

    await sendMembershipExpiredEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Dr Suzanne Ravenall <hello@suzanneravenall.com>',
      }),
    )
  })

  it('throws when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'rate limited' } })

    await expect(sendMembershipExpiredEmail(baseData)).rejects.toThrow('Resend error: rate limited')
  })

  it('throws when Resend returns null result and no error', async () => {
    mockSend.mockResolvedValue({ data: null, error: null })

    await expect(sendMembershipExpiredEmail(baseData)).rejects.toThrow('Resend returned no result')
  })

  it('throws when the Resend SDK itself rejects', async () => {
    mockSend.mockRejectedValue(new Error('network failure'))

    await expect(sendMembershipExpiredEmail(baseData)).rejects.toThrow('network failure')
  })

  it('subject uses the firstName field not the tierLabel field', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_008' }, error: null })
    const namedData: MembershipEmailData = { ...baseData, firstName: 'Bob', tierLabel: 'Practitioner' }

    await sendMembershipExpiredEmail(namedData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Bob, your membership has expired' }),
    )
  })

  it('works correctly when renewalDate is null', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_expired_009' }, error: null })
    const dataWithoutRenewal: MembershipEmailData = { ...baseData, renewalDate: null }

    const id = await sendMembershipExpiredEmail(dataWithoutRenewal)

    expect(id).toBe('email_expired_009')
  })
})
