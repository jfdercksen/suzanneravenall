import { createElement } from 'react'
import { Resend } from 'resend'
import CartAbandonment1 from './templates/CartAbandonment1'
import type { CartEmailData } from './types'

export type { CartEmailData }

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'Dr Suzanne Ravenall <hello@suzanneravenall.com>'

export async function sendCartAbandonmentEmail1(data: CartEmailData): Promise<string> {
  const resend = new Resend(process.env.RESEND_API_KEY ?? '')
  const subject = data.firstName
    ? `You left something behind, ${data.firstName}`
    : 'You left something behind'

  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: [data.email],
    subject,
    react: createElement(CartAbandonment1, data),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  if (!result) throw new Error('Resend returned no result')

  return result.id
}
