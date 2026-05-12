import { createElement } from 'react'
import { Resend } from 'resend'
import MembershipRenewalReminder from './templates/MembershipRenewalReminder'
import type { MembershipEmailData } from './types'

export type { MembershipEmailData }

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'Dr Suzanne Ravenall <hello@suzanneravenall.com>'
const REPLY_TO = 'sravenall@suzanneravenall.com'

export async function sendMembershipRenewalReminderEmail(data: MembershipEmailData): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')

  const resend = new Resend(apiKey)

  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: [data.email],
    replyTo: REPLY_TO,
    subject: 'Your membership renews in 7 days',
    react: createElement(MembershipRenewalReminder, data),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  if (!result) throw new Error('Resend returned no result')

  return result.id
}
