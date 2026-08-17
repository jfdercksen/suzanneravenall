import { createElement } from 'react'
import { Resend } from 'resend'
import CartAbandonment2 from './templates/CartAbandonment2'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { CartEmailData } from './types'

export type { CartEmailData }

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'Dr Suzanne Ravenall <hello@suzanneravenall.com>'

export async function sendCartAbandonmentEmail2(data: CartEmailData): Promise<string> {
  const resend = new Resend(process.env.RESEND_API_KEY ?? '')
  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: [data.email],
    subject: 'Your transformation is one step away',
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(CartAbandonment2, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  if (!result) throw new Error('Resend returned no result')

  return result.id
}
