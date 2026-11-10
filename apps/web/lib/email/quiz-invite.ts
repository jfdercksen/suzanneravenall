import { createElement } from 'react'
import { sendEmail } from './send'
import QuizInvite from './templates/QuizInvite'
import type { QuizInviteEmailData } from './types'

export type { QuizInviteEmailData }

const REPLY_TO = 'sravenall@suzanneravenall.com'

/** e.g. "6 Oct 2026, 09:14 (SAST)". */
export function formatRequestedAt(date: Date): string {
  const text = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  return `${text} (SAST)`
}

export async function sendQuizInviteEmail(data: QuizInviteEmailData, now: Date = new Date()): Promise<string> {
  // A repeat request sends the same link again (client QA 5 Oct). Without a
  // per-send line Gmail sees identical messages in one thread and shows them
  // as "...", which reads as a blank email; the ref header stops the threading.
  const withTime: QuizInviteEmailData = { ...data, requestedAt: data.requestedAt ?? formatRequestedAt(now) }
  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject: `${data.quizTitle} - your diagnostic is ready`,
    react: createElement(QuizInvite, withTime),
    text: buildPlainText(withTime),
    headers: { 'X-Entity-Ref-ID': `quiz-invite-${now.getTime()}` },
  })
}

function buildPlainText({ firstName, quizTitle, link, requestedAt }: QuizInviteEmailData): string {
  return [
    `${firstName}, your diagnostic is ready`,
    '',
    `Your diagnostic: ${quizTitle}`,
    '',
    'This short, focused assessment reveals the pattern quietly shaping this part of your life, and what to do about it.',
    '',
    `Start the diagnostic: ${link}`,
    '',
    'Takes about 2 minutes. Your result is shown to you immediately after your last answer.',
    '',
    ...(requestedAt ? [`Requested ${requestedAt}. If you asked more than once, every copy of this link works.`, ''] : []),
    'With warmth,',
    'Dr Suzanne Ravenall',
    '',
    '---',
    'Ravenall Institute · Johannesburg, South Africa',
  ].join('\n')
}
