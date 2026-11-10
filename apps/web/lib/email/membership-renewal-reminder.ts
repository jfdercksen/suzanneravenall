import { createElement } from 'react'
import { sendEmail } from './send'
import MembershipRenewalReminder from './templates/MembershipRenewalReminder'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { MembershipEmailData } from './types'

export type { MembershipEmailData }

const REPLY_TO = 'sravenall@suzanneravenall.com'

export async function sendMembershipRenewalReminderEmail(data: MembershipEmailData): Promise<string> {
  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject: 'Your membership renews in 7 days',
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(MembershipRenewalReminder, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })
}
