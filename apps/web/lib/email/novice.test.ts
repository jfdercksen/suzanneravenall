import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./send', () => ({ sendEmail: vi.fn().mockResolvedValue('msg-1') }))

import { sendEmail } from './send'
import { MEMBER_SUPPORT_EMAIL, noviceTeamAddress, sendNoviceChangesRequestedEmail, sendNoviceDocumentsEmail } from './novice'

describe('Novice mails use the one support address (Suzanne, 24 Nov 2026: "just use support@")', () => {
  beforeEach(() => {
    vi.mocked(sendEmail).mockClear()
    delete process.env.CONTACT_NOTIFY_EMAIL
  })

  it('member support is support@ravenallinstitute.com', () => {
    expect(MEMBER_SUPPORT_EMAIL).toBe('support@ravenallinstitute.com')
  })

  it('the upload list and the feedback mail reply to support@', async () => {
    await sendNoviceDocumentsEmail({ email: 'member@example.com', firstName: 'Thandi', sku: 'S0214' })
    await sendNoviceChangesRequestedEmail({ email: 'member@example.com', firstName: 'Thandi', sku: 'S0227', note: 'Please add your Session Log.' })
    for (const call of vi.mocked(sendEmail).mock.calls) {
      expect(call[0].replyTo).toBe('support@ravenallinstitute.com')
      expect(JSON.stringify(call[0])).not.toMatch(/membersupport@|certification@/)
    }
  })

  it('the team inbox falls back to support@ when CONTACT_NOTIFY_EMAIL is unset', () => {
    expect(noviceTeamAddress()).toBe('support@ravenallinstitute.com')
  })
})
