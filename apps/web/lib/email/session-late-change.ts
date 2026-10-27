import { createElement } from 'react'
import { sendEmail } from './send'
import SessionLateChange, {
  LATE_CHANGE_EXCEPTION_LINE,
  NOTICE_RULE_LINE,
  lateChangeIntro,
  newTimeLine,
} from './templates/SessionLateChange'
import type { SessionLateChangeEmailData } from './types'
import { COMPANY_CONTACT_EMAIL } from './company'

export type { SessionLateChangeEmailData }

export function sessionLateChangeSubject(dateLabel: string): string {
  return `Your session on ${dateLabel}: less than 48 working hours notice`
}

/** The client mail after a late cancellation or move (D024). Cal.com still sends its own mail too. */
export async function sendSessionLateChangeEmail(data: SessionLateChangeEmailData): Promise<string> {
  return sendEmail({
    to: [data.email],
    replyTo: COMPANY_CONTACT_EMAIL,
    subject: sessionLateChangeSubject(data.dateLabel),
    react: createElement(SessionLateChange, data),
    text: buildPlainText(data),
  })
}

export function buildPlainText(data: SessionLateChangeEmailData): string {
  const moved = newTimeLine(data)
  return [
    `About your session, ${data.firstName ?? 'there'}`,
    '',
    `The session: ${data.dateLabel}, ${data.timeLabel}`,
    '',
    lateChangeIntro(data.kind),
    NOTICE_RULE_LINE,
    ...(moved ? ['', moved] : []),
    '',
    LATE_CHANGE_EXCEPTION_LINE,
    '',
    `Your sessions: ${data.appointmentsUrl}`,
    `Questions? Reply to this email or write to ${COMPANY_CONTACT_EMAIL}.`,
    '',
    'With warmth,',
    'Dr Suzanne Ravenall',
  ].join('\n')
}
