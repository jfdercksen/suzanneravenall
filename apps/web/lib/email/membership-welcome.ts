import { createElement } from 'react'
import { sendEmail } from './send'
import MembershipWelcome from './templates/MembershipWelcome'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { MembershipEmailData } from './types'

export type { MembershipEmailData }

const REPLY_TO = 'sravenall@suzanneravenall.com'

export async function sendMembershipWelcomeEmail(data: MembershipEmailData): Promise<string> {
  const subject = data.firstName
    ? `Welcome to your ${data.tierLabel} membership, ${data.firstName}!`
    : `Welcome to your ${data.tierLabel} membership!`

  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject,
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(MembershipWelcome, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })
}
