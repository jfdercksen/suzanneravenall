import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/email/send', () => ({ sendEmail }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))

import { ALERT_THROTTLE_MS, resetStaffAlerts, sendStaffAlert } from './staff-alert'

describe('sendStaffAlert', () => {
  beforeEach(() => {
    resetStaffAlerts()
    sendEmail.mockReset().mockResolvedValue('id')
    process.env.AUTOMATION_ALERT_EMAIL = 'ops@example.test'
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    delete process.env.AUTOMATION_ALERT_EMAIL
    vi.restoreAllMocks()
  })

  it('mails AUTOMATION_ALERT_EMAIL with an [ALERT] subject', async () => {
    expect(await sendStaffAlert({ key: 'k', subject: 'Thing broke', lines: ['Line one'], now: 0 })).toBe('sent')
    const mail = sendEmail.mock.calls[0]![0] as { to: string[]; subject: string; text: string }
    expect(mail.to).toEqual(['ops@example.test'])
    expect(mail.subject).toBe('[ALERT] Thing broke')
    expect(mail.text).toContain('Line one')
  })

  it('throttles per key for 15 minutes, then reports how many were held back', async () => {
    await sendStaffAlert({ key: 'k', subject: 's', lines: [], now: 0 })
    expect(await sendStaffAlert({ key: 'k', subject: 's', lines: [], now: 1_000 })).toBe('throttled')
    expect(await sendStaffAlert({ key: 'k', subject: 's', lines: [], now: 2_000 })).toBe('throttled')
    expect(await sendStaffAlert({ key: 'other', subject: 's', lines: [], now: 2_000 })).toBe('sent')
    expect(await sendStaffAlert({ key: 'k', subject: 's', lines: [], now: ALERT_THROTTLE_MS + 1 })).toBe('sent')
    const last = sendEmail.mock.calls.at(-1)![0] as { text: string }
    expect(last.text).toContain('2 more alert(s) of this kind were held back')
  })

  it('does nothing without a recipient', async () => {
    delete process.env.AUTOMATION_ALERT_EMAIL
    expect(await sendStaffAlert({ key: 'k', subject: 's', lines: [] })).toBe('no-recipient')
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('never throws when the mail fails', async () => {
    sendEmail.mockRejectedValue(new Error('Brevo down'))
    expect(await sendStaffAlert({ key: 'k', subject: 's', lines: [] })).toBe('failed')
  })
})
