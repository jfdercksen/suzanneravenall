import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

vi.mock('./templates/QuizCompletionNotification', () => ({ default: () => null }))

import { sendQuizCompletionNotificationEmail } from './quiz-completion-notification'
import type { QuizCompletionEmailData } from './types'

const baseData: QuizCompletionEmailData = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'lead@example.com',
  quizTitle: 'Nervous System Pattern',
  resultTitle: 'The Hyper-Alert Achiever',
  resultSubtitle: 'Your Pattern: The Hyper-Alert Achiever',
  questions: [
    { text: 'I feel "on edge" or alert even when nothing is wrong', answerLabel: 'Often' },
    { text: 'I find it difficult to switch off or relax fully', answerLabel: 'Almost Always' },
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

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'rate limited'}`))

    await expect(sendQuizCompletionNotificationEmail(baseData)).rejects.toThrow(
      'Brevo error: rate limited',
    )
  })

})
