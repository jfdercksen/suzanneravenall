import { createElement } from 'react'
import { sendEmail } from './send'
import QuizInvite from './templates/QuizInvite'
import type { QuizInviteEmailData } from './types'

export type { QuizInviteEmailData }

const REPLY_TO = 'sravenall@suzanneravenall.com'

export async function sendQuizInviteEmail(data: QuizInviteEmailData): Promise<string> {
  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject: `${data.quizTitle} - your diagnostic is ready`,
    react: createElement(QuizInvite, data),
    text: buildPlainText(data),
  })
}

function buildPlainText({ firstName, quizTitle, link }: QuizInviteEmailData): string {
  return [
    `${firstName}, your diagnostic is ready`,
    '',
    `You're about to take the ${quizTitle} diagnostic - a short, focused assessment that reveals the pattern quietly shaping this part of your life, and what to do about it.`,
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
