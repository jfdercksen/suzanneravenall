import { createElement } from 'react'
import { Resend } from 'resend'
import QuizInvite from './templates/QuizInvite'
import type { QuizInviteEmailData } from './types'

export type { QuizInviteEmailData }

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'Dr Suzanne Ravenall <hello@suzanneravenall.com>'
const REPLY_TO = 'sravenall@suzanneravenall.com'

export async function sendQuizInviteEmail(data: QuizInviteEmailData): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')

  const resend = new Resend(apiKey)

  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: [data.email],
    replyTo: REPLY_TO,
    subject: `${data.quizTitle} — your diagnostic is ready`,
    react: createElement(QuizInvite, data),
    text: buildPlainText(data),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  if (!result) throw new Error('Resend returned no result')

  return result.id
}

function buildPlainText({ firstName, quizTitle, link }: QuizInviteEmailData): string {
  return [
    `${firstName}, your diagnostic is ready`,
    '',
    `You're about to take the ${quizTitle} diagnostic — a short, focused assessment that reveals the pattern quietly shaping this part of your life, and what to do about it.`,
    '',
    `Start the diagnostic: ${link}`,
    '',
    'Takes about 2 minutes. Your result is shown to you immediately after your last answer.',
    '',
    'With warmth,',
    'Dr Suzanne Ravenall',
    '',
    '---',
    'Ravenall Institute · Cape Town, South Africa',
  ].join('\n')
}
