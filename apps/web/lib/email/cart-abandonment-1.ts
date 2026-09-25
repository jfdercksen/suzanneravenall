import { createElement } from 'react'
import { sendEmail } from './send'
import CartAbandonment1 from './templates/CartAbandonment1'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { CartEmailData } from './types'

export type { CartEmailData }

export async function sendCartAbandonmentEmail1(data: CartEmailData): Promise<string> {
  const subject = data.firstName
    ? `You left something behind, ${data.firstName}`
    : 'You left something behind'

  return sendEmail({
    to: [data.email],
    subject,
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(CartAbandonment1, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })
}
