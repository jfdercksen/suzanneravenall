import { createElement } from 'react'
import { sendEmail } from './send'
import MembershipWelcome from './templates/MembershipWelcome'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { MembershipWelcomeData } from './types'

export type { MembershipWelcomeData }

const REPLY_TO = 'sravenall@suzanneravenall.com'

/** "20 November 2027" in South African time, the way the member reads a date. */
export function formatRenewalDate(iso: string): string {
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' }).format(new Date(iso))
}

export async function sendMembershipWelcomeEmail(data: MembershipWelcomeData): Promise<string> {
  const subject = data.firstName
    ? `${data.firstName}, your ${data.levelTitle} is active`
    : `Your ${data.levelTitle} is active`

  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject,
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(MembershipWelcome, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })
}
