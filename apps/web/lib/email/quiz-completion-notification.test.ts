import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

import { render } from '@react-email/components'
import { sendQuizCompletionNotificationEmail } from './quiz-completion-notification'
import type { QuizCompletionEmailData } from './types'

const baseData: QuizCompletionEmailData = {
  submissionId: '6f1c2a4e-1b2c-4d3e-8f90-123456789abc',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'lead@example.com',
  quizTitle: 'Nervous System Pattern',
  resultTitle: 'The Hyper-Alert Achiever',
  resultSubtitle: 'Your Pattern: The Hyper-Alert Achiever',
  answers: [
    { question: 'I feel "on edge" even when nothing is wrong', answer: 'Often (3 of 4)' },
    { question: 'I replay conversations <at night>', answer: 'Never (0 of 4)' },
  ],
}

describe('sendQuizCompletionNotificationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The send function fails loudly without an API key; stub it so tests
    // don't depend on the developer's local .env
    vi.stubEnv('BREVO_API_KEY', 'test_brevo_key')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_notify_001')

    const id = await sendQuizCompletionNotificationEmail(baseData)

    expect(id).toBe('email_notify_001')
  })

  it('sends to the default notify address with the lead as replyTo', async () => {
    mockSend.mockResolvedValue('email_notify_002')

    await sendQuizCompletionNotificationEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['hello@suzanneravenall.com'],
        replyTo: 'lead@example.com',
        subject: 'Alice Smith completed: Nervous System Pattern',
      }),
    )
  })

  // NOTIFY_EMAIL is a module-level constant captured once at import time via
  // `?? fallback` chains - the env-var-override path can't be exercised
  // without module re-loading (same reasoning as membership-welcome.test.ts's
  // FROM constant) and is covered by source code review instead.

  it('names who, the quiz, the result and every answer with its question (Suzanne, 20 Nov)', async () => {
    mockSend.mockResolvedValue('email_notify_003')
    await sendQuizCompletionNotificationEmail(baseData)
    const call = mockSend.mock.calls[0]![0] as { text: string; react: Parameters<typeof render>[0] }
    const html = await render(call.react)
    for (const part of [call.text, html]) {
      expect(part).toContain('Alice Smith')
      expect(part).toContain('lead@example.com')
      expect(part).toContain('Nervous System Pattern')
      expect(part).toContain('The Hyper-Alert Achiever')
      expect(part).toContain('Often (3 of 4)')
      expect(part).toContain('Never (0 of 4)')
      expect(part).toContain('keep this mail within the team')
      expect(part).not.toContain('The answers are not in this email')
      expect(part).not.toContain('\u2014')
    }
    expect(call.text).toContain('1. I feel "on edge" even when nothing is wrong\n   Often (3 of 4)')
    // React escapes the question text in the HTML part.
    expect(html).toContain('I replay conversations &lt;at night&gt;')
    expect(html).not.toContain('<at night>')
  })

  it('links both parts straight to the staff page for this submission (KI125)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://169.239.180.49')
    mockSend.mockResolvedValue('email_notify_004')
    await sendQuizCompletionNotificationEmail(baseData)
    const call = mockSend.mock.calls[0]![0] as { text: string; react: Parameters<typeof render>[0] }
    const url = 'http://169.239.180.49/staff/submissions/quiz/6f1c2a4e-1b2c-4d3e-8f90-123456789abc'
    expect(call.text).toContain(`The website keeps a copy on the staff page (log in with your staff CMS account):\n${url}`)
    const html = await render(call.react)
    expect(html).toContain(`href="${url}"`)
    expect(html).toContain('open it on the staff page')
    vi.unstubAllEnvs()
  })

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'rate limited'}`))

    await expect(sendQuizCompletionNotificationEmail(baseData)).rejects.toThrow(
      'Brevo error: rate limited',
    )
  })

})
