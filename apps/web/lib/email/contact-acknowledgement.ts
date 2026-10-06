import { createElement } from 'react'
import { sendEmail } from './send'
import ContactAcknowledgement, { CONTACT_REPLY_PROMISE } from './templates/ContactAcknowledgement'
import type { ContactAcknowledgementEmailData } from './types'
import { COMPANY_CONTACT_EMAIL, COMPANY_PHONE, companyPhysicalAddress } from './company'
import { siteUrl } from './site-url'
import { ENQUIRY_OPTIONS } from '@/app/contact/enquiry'

export type { ContactAcknowledgementEmailData }

const REPLY_TO = COMPANY_CONTACT_EMAIL

export { CONTACT_REPLY_PROMISE }

/** First word of the name the visitor typed, e.g. "Alice" from "Alice van der Berg". */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name.trim()
}

/**
 * Only a real enquiry option is echoed back; "Other", an empty value or
 * anything the form does not offer reads as no enquiry type.
 */
export function enquiryLabel(enquiry: string | undefined | null): string | null {
  const value = enquiry?.trim()
  if (!value || value === 'Other') return null
  return (ENQUIRY_OPTIONS as readonly string[]).includes(value) ? value : null
}

export function contactAcknowledgementSubject(firstName: string): string {
  return `We received your message, ${firstName}`
}

export async function sendContactAcknowledgementEmail(data: ContactAcknowledgementEmailData): Promise<string> {
  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject: contactAcknowledgementSubject(data.firstName),
    react: createElement(ContactAcknowledgement, data),
    text: buildPlainText(data),
  })
}

function buildPlainText({ firstName, enquiry, message }: ContactAcknowledgementEmailData): string {
  return [
    `Thank you, ${firstName}`,
    '',
    enquiry ? `We received your message about ${enquiry}.` : 'We received your message.',
    CONTACT_REPLY_PROMISE,
    '',
    'YOUR MESSAGE',
    '============',
    message,
    '',
    'If you want to add anything, simply reply to this email.',
    '',
    'CONTACT US',
    '==========',
    `Email: ${COMPANY_CONTACT_EMAIL}`,
    `Phone: ${COMPANY_PHONE}`,
    `Website: ${siteUrl()}/contact`,
    '',
    'With warmth,',
    'Dr Suzanne Ravenall',
    '',
    '---',
    `Ravenall Institute · ${companyPhysicalAddress()}`,
  ].join('\n')
}
