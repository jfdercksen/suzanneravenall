import { createElement } from 'react'
import { sendEmail } from './send'
import QuizReport from './templates/QuizReport'
import type { QuizReportEmailData } from './types'

export type { QuizReportEmailData }

const REPLY_TO = 'sravenall@suzanneravenall.com'

export async function sendQuizReportEmail(data: QuizReportEmailData): Promise<string> {
  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject: `Your ${data.quizTitle} report: ${data.resultTitle}`,
    react: createElement(QuizReport, data),
    text: buildPlainText(data),
  })
}

function buildPlainText(data: QuizReportEmailData): string {
  return [
    `${data.firstName}, here is your full report for: ${data.quizTitle}`,
    '',
    data.resultTitle,
    data.resultSubtitle,
    '',
    'MIRROR',
    data.mirror,
    '',
    "WHAT'S REALLY HAPPENING",
    data.mechanism,
    '',
    'IF THIS CONTINUES',
    ...data.impact.map((line) => `- ${line}`),
    '',
    'THE SHIFT',
    ...data.shift.map((line) => `- ${line}`),
    '',
    `${data.ctaLabel}: ${data.ctaLink}`,
    '',
    'With warmth,',
    'Dr Suzanne Ravenall',
    '',
    '---',
    'Ravenall Institute · Johannesburg, South Africa',
  ].join('\n')
}
