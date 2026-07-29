import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
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
  })

  it('returns the emailId string on success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_invite_001' }, error: null })

    const id = await sendQuizInviteEmail(baseData)

    expect(id).toBe('email_invite_001')
  })

  it('sends to the lead email with the quiz title in the subject', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_invite_002' }, error: null })

    await sendQuizInviteEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['lead@example.com'],
        subject: 'Nervous System Pattern — your diagnostic is ready',
      }),
    )
  })

  it('includes the correct replyTo address', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_invite_003' }, error: null })

    await sendQuizInviteEmail(baseData)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'sravenall@suzanneravenall.com' }),
    )
  })

  it('throws when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'rate limited' } })

    await expect(sendQuizInviteEmail(baseData)).rejects.toThrow('Resend error: rate limited')
  })

  it('throws when Resend returns null result and no error', async () => {
    mockSend.mockResolvedValue({ data: null, error: null })

    await expect(sendQuizInviteEmail(baseData)).rejects.toThrow('Resend returned no result')
  })

  it('throws when RESEND_API_KEY is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    await expect(sendQuizInviteEmail(baseData)).rejects.toThrow('RESEND_API_KEY is not configured')

    vi.unstubAllEnvs()
  })
})
