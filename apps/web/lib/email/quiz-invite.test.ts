import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('./send', () => ({
  sendEmail: mockSend,
}))

vi.mock('./templates/QuizInvite', () => ({ default: () => null }))

import { sendQuizInviteEmail } from './quiz-invite'
import type { QuizInviteEmailData } from './types'

const baseData: QuizInviteEmailData = {
  email: 'lead@example.com',
  firstName: 'Alice',
  quizTitle: 'Nervous System Pattern',
  link: 'https://suzanneravenall.com/explore/emotional-nervous-system-mastery/quiz?token=abc123',
}

describe('sendQuizInviteEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The send function fails loudly without an API key; stub it so tests
    // don't depend on the developer's local .env
    vi.stubEnv('BREVO_API_KEY', 'test_brevo_key')
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue('email_invite_001')

    const id = await sendQuizInviteEmail(baseData)

    expect(id).toBe('email_invite_001')
  })

  it('sends to the lead email with the quiz title in the subject', async () => {
    mockSend.mockResolvedValue('email_invite_002')

    await sendQuizInviteEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['lead@example.com'],
        subject: 'Nervous System Pattern - your diagnostic is ready',
      }),
    )
  })

  it('includes the correct replyTo address', async () => {
    mockSend.mockResolvedValue('email_invite_003')

    await sendQuizInviteEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'sravenall@suzanneravenall.com' }),
    )
  })

  it('propagates a provider error', async () => {
    mockSend.mockRejectedValue(new Error(`Brevo error: ${'rate limited'}`))

    await expect(sendQuizInviteEmail(baseData)).rejects.toThrow('Brevo error: rate limited')
  })


  it('propagates a missing-key error from the sender', async () => {
    mockSend.mockRejectedValue(new Error('BREVO_API_KEY is not configured'))

    await expect(sendQuizInviteEmail(baseData)).rejects.toThrow('BREVO_API_KEY is not configured')
  })
})
