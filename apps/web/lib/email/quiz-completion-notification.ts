import { createElement } from 'react'
import { Resend } from 'resend'
import QuizCompletionNotification from './templates/QuizCompletionNotification'
import type { QuizCompletionEmailData } from './types'

export type { QuizCompletionEmailData }

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'Dr Suzanne Ravenall <hello@suzanneravenall.com>'
const NOTIFY_EMAIL =
  process.env.QUIZ_NOTIFY_EMAIL ?? process.env.CONTACT_NOTIFY_EMAIL ?? 'hello@suzanneravenall.com'

export async function sendQuizCompletionNotificationEmail(
  data: QuizCompletionEmailData
): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')

  const resend = new Resend(apiKey)

  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: [NOTIFY_EMAIL],
    replyTo: data.email,
    subject: `${data.firstName} ${data.lastName} completed: ${data.quizTitle}`,
    react: createElement(QuizCompletionNotification, data),
    text: buildPlainText(data),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  if (!result) throw new Error('Resend returned no result')

  return result.id
}

function buildPlainText(data: QuizCompletionEmailData): string {
  const lines: string[] = [
    `${data.firstName} ${data.lastName} completed the ${data.quizTitle} diagnostic`,
    data.email,
    '',
    'RESULT',
    '======',
    data.resultTitle,
    data.resultSubtitle,
    '',
    'FULL ANSWERS',
    '============',
  ]

  data.questions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question.text}`, `   ${question.answerLabel}`)
  })

  lines.push('', `Reply to this email to respond to ${data.firstName}.`)

  return lines.join('\n')
}
