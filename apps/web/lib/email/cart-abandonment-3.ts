import { createElement } from 'react'
import { Resend } from 'resend'
import CartAbandonment3 from './templates/CartAbandonment3'
import { buildListUnsubscribeHeaders, buildUnsubscribeUrl } from './unsubscribe'
import type { CartEmailData } from './types'

export type { CartEmailData }

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'Dr Suzanne Ravenall <hello@suzanneravenall.com>'

export async function sendCartAbandonmentEmail3(data: CartEmailData): Promise<string> {
  const resend = new Resend(process.env.RESEND_API_KEY ?? '')
  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: [data.email],
    subject: 'Last chance to secure your place',
    headers: buildListUnsubscribeHeaders(data.email),
    react: createElement(CartAbandonment3, { ...data, unsubscribeUrl: buildUnsubscribeUrl(data.email) }),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  if (!result) throw new Error('Resend returned no result')

  return result.id
}
