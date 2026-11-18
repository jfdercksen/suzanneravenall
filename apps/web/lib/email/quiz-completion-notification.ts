import { createElement } from 'react'
import { sendEmail } from './send'
import { staffSubmissionUrl } from '@/lib/staff/links'
import QuizCompletionNotification from './templates/QuizCompletionNotification'
import type { QuizCompletionEmailData } from './types'

export type { QuizCompletionEmailData }


export async function sendQuizCompletionNotificationEmail(
  data: QuizCompletionEmailData
): Promise<string> {
  return sendEmail({
    // `||`: docker-compose passes an unset variable as an empty string.
    to: [process.env.QUIZ_NOTIFY_EMAIL || process.env.CONTACT_NOTIFY_EMAIL || 'hello@suzanneravenall.com'],
    replyTo: data.email,
    subject: `${data.firstName} ${data.lastName} completed: ${data.quizTitle}`,
    react: createElement(QuizCompletionNotification, {
      ...data,
      answersUrl: staffSubmissionUrl('quiz', data.submissionId),
    }),
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
    'The answers are not in this email. They can include health and wellbeing information, so they stay in the website database and are never sent by email.',
    '',
    'Read them on the staff page (log in with your staff CMS account):',
    staffSubmissionUrl('quiz', data.submissionId),
    '',
    `Reply to this email to respond to ${data.firstName}.`,
  ]

  return lines.join('\n')
}
