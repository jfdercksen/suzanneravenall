import { createElement } from 'react'
import { sendEmail } from './send'
import BookingOverLimit, { OVER_LIMIT_CANCEL_LINE, overLimitIntro } from './templates/BookingOverLimit'
import type { BookingOverLimitEmailData } from './types'
import { COMPANY_CONTACT_EMAIL } from './company'

export type { BookingOverLimitEmailData }

export function bookingOverLimitSubject(dateLabel: string): string {
  return `About your booking on ${dateLabel}`
}

/** The client mail for a booking past their paid sessions (J-07). */
export async function sendBookingOverLimitEmail(data: BookingOverLimitEmailData): Promise<string> {
  return sendEmail({
    to: [data.email],
    replyTo: COMPANY_CONTACT_EMAIL,
    subject: bookingOverLimitSubject(data.dateLabel),
    react: createElement(BookingOverLimit, data),
    text: buildPlainText(data),
  })
}

export function buildPlainText(data: BookingOverLimitEmailData): string {
  return [
    `About your booking, ${data.firstName ?? 'there'}`,
    '',
    `The booking: ${data.dateLabel}, ${data.timeLabel}`,
    '',
    overLimitIntro(data.hasPackage),
    OVER_LIMIT_CANCEL_LINE,
    '',
    'WOULD YOU LIKE MORE SESSIONS?',
    '=============================',
    'Buy another session or package and you will receive a new booking link straight away.',
    `Buy more sessions: ${data.buyMoreUrl}`,
    '',
    `Your booked sessions: ${data.appointmentsUrl}`,
    `Questions? Reply to this email or write to ${COMPANY_CONTACT_EMAIL}.`,
    '',
    'With warmth,',
    'Dr Suzanne Ravenall',
  ].join('\n')
}
