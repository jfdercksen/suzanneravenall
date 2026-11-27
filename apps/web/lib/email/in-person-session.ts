import { createElement } from 'react'
import { sendEmail } from './send'
import InPersonSessionNotice, {
  IN_PERSON_NOTICE_ACTION,
  IN_PERSON_NOTICE_FOOTER,
  inPersonDetailRows,
  inPersonLineText,
  type InPersonSessionNoticeData,
} from './templates/InPersonSessionNotice'

export type { InPersonSessionNoticeData }

/** Last resort when no notify address is set; the team inbox the intake mails use. */
export const IN_PERSON_FALLBACK_EMAIL = 'support@ravenallinstitute.com'

/**
 * Who arranges in-person sessions: IN_PERSON_NOTIFY_EMAIL, else
 * CONTACT_NOTIFY_EMAIL, else support. Read per call so a test can change it.
 */
export function inPersonTeamAddress(): string {
  return (
    process.env.IN_PERSON_NOTIFY_EMAIL?.trim() ||
    process.env.CONTACT_NOTIFY_EMAIL?.trim() ||
    IN_PERSON_FALLBACK_EMAIL
  )
}

export function inPersonNoticeSubject(data: Pick<InPersonSessionNoticeData, 'customerName' | 'email' | 'reference'>): string {
  return `In-person session to arrange: ${data.customerName ?? data.email ?? 'client'}, ${data.reference}`
}

function plainText(data: InPersonSessionNoticeData): string {
  return [
    'In-person session to arrange',
    '',
    ...inPersonDetailRows(data).map(([k, v]) => `${k}: ${v}`),
    '',
    'Bought:',
    ...data.lines.map((line) => `- ${inPersonLineText(line)}`),
    '',
    IN_PERSON_NOTICE_ACTION,
    '',
    '---',
    IN_PERSON_NOTICE_FOOTER,
  ].join('\n')
}

/** Mails the team about an in-person purchase. Returns the Brevo message id; throws on failure. */
export async function sendInPersonSessionNotice(data: InPersonSessionNoticeData): Promise<string> {
  return sendEmail({
    to: [inPersonTeamAddress()],
    ...(data.email ? { replyTo: data.email } : {}),
    subject: inPersonNoticeSubject(data),
    react: createElement(InPersonSessionNotice, data),
    text: plainText(data),
  })
}
