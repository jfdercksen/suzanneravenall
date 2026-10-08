import { createElement } from 'react'
import { sendEmail } from './send'
import LeadWelcome from './templates/LeadWelcome'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import { LEAD_WELCOME_CONTENT, leadWelcomeNext } from './lead-welcome-content'
import { COMPANY_CONTACT_EMAIL, companyPhysicalAddress } from './company'
import { siteUrl } from './site-url'
import type { LeadWelcomeEmailData } from './types'

export type { LeadWelcomeEmailData }

const REPLY_TO = COMPANY_CONTACT_EMAIL

/**
 * Welcome email after a lead form sign-up. A marketing email: it carries the
 * unsubscribe link and RFC 8058 headers, and the caller (lib/leads/welcome.ts)
 * checks the suppression list before calling this.
 */
export async function sendLeadWelcomeEmail(data: LeadWelcomeEmailData): Promise<string> {
  const content = LEAD_WELCOME_CONTENT[data.source]
  const unsubscribeUrl = buildUnsubscribeUrl(data.email)

  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject: content.subject,
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(LeadWelcome, { ...data, unsubscribeUrl }),
    text: buildPlainText(data, unsubscribeUrl),
  })
}

function buildPlainText({ firstName, source, watchAt }: LeadWelcomeEmailData, unsubscribeUrl: string): string {
  const content = LEAD_WELCOME_CONTENT[source]
  return [
    content.heading,
    '',
    firstName ? `Hi ${firstName},` : 'Hi there,',
    '',
    ...content.intro.flatMap((paragraph) => [paragraph, '']),
    'WHAT HAPPENS NEXT',
    '=================',
    leadWelcomeNext(source, watchAt),
    '',
    `${content.link.label}: ${siteUrl()}${content.link.path}`,
    '',
    'With warmth,',
    'Dr Suzanne Ravenall',
    '',
    '---',
    `You are receiving this because ${content.reason}.`,
    `Unsubscribe: ${unsubscribeUrl}`,
    `Ravenall Institute · ${companyPhysicalAddress()}`,
  ].join('\n')
}
