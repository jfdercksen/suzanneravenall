import { createElement } from 'react'
import { sendEmail } from './send'
import CartAbandonment2 from './templates/CartAbandonment2'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { CartEmailData } from './types'

export type { CartEmailData }

export async function sendCartAbandonmentEmail2(data: CartEmailData): Promise<string> {
  return sendEmail({
    to: [data.email],
    subject: 'Your transformation is one step away',
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(CartAbandonment2, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })
}
