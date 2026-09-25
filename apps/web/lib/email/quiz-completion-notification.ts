import { createElement } from 'react'
import { sendEmail } from './send'
import QuizCompletionNotification from './templates/QuizCompletionNotification'
import type { QuizCompletionEmailData } from './types'

export type { QuizCompletionEmailData }


export async function sendQuizCompletionNotificationEmail(
  data: QuizCompletionEmailData
): Promise<string> {
  return sendEmail({
    to: [process.env.QUIZ_NOTIFY_EMAIL ?? process.env.CONTACT_NOTIFY_EMAIL ?? 'hello@suzanneravenall.com'],
    replyTo: data.email,
    subject: `${data.firstName} ${data.lastName} completed: ${data.quizTitle}`,
    react: createElement(QuizCompletionNotification, data),
    text: buildPlainText(data),
  })
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
