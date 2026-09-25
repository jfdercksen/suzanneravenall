import { createElement } from 'react'
import { sendEmail } from './send'
import MembershipExpired from './templates/MembershipExpired'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { MembershipEmailData } from './types'

export type { MembershipEmailData }

const REPLY_TO = 'sravenall@suzanneravenall.com'

export async function sendMembershipExpiredEmail(data: MembershipEmailData): Promise<string> {
  const subject = data.firstName
    ? `${data.firstName}, your membership has expired`
    : 'Your membership has expired'

  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject,
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(MembershipExpired, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })
}
