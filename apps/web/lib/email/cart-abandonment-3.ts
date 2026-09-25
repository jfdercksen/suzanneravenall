import { createElement } from 'react'
import { sendEmail } from './send'
import CartAbandonment3 from './templates/CartAbandonment3'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { CartEmailData } from './types'

export type { CartEmailData }

export async function sendCartAbandonmentEmail3(data: CartEmailData): Promise<string> {
  return sendEmail({
    to: [data.email],
    subject: 'Last chance to secure your place',
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(CartAbandonment3, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })
}
