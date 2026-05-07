import { createElement } from 'react'
import { Resend } from 'resend'
import OrderConfirmation from '../../emails/OrderConfirmation'
import type { OrderEmailData } from './types'
import { formatAmount } from './utils'

export type { OrderEmailData }

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM =
  process.env.RESEND_FROM_ADDRESS ?? 'Dr Suzanne Ravenall <noreply@suzanneravenall.com>'
const REPLY_TO = 'sravenall@suzanneravenall.com'

export async function sendOrderConfirmationEmail({
  order,
  invoiceUrl,
}: {
  order: OrderEmailData
  invoiceUrl: string | null
}): Promise<string> {
  const subject = `Your transformation begins — Order #${order.displayId}`
  const text = buildPlainText(order, invoiceUrl)

  const { data: result, error } = await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: [order.email],
    subject,
    react: createElement(OrderConfirmation, { ...order, invoiceUrl }),
    text,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  if (!result) throw new Error('Resend returned no result')

  return result.id
}

function buildPlainText(order: OrderEmailData, invoiceUrl: string | null): string {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const lines: string[] = [
    'Thank you for your order',
    '',
    `Dear ${order.firstName ?? 'valued customer'},`,
    '',
    "You've taken a powerful step towards transformation.",
    "We're honoured to be part of your journey.",
    '',
    'ORDER SUMMARY',
    '=============',
    `Order: #${order.displayId}`,
    `Date: ${formattedDate}`,
    '',
  ]

  for (const item of order.items) {
    const variant = item.variantTitle ? ` (${item.variantTitle})` : ''
    lines.push(
      `${item.title}${variant} x${item.quantity} — ${formatAmount(item.unitPrice, order.currency)}`
    )
  }

  lines.push(
    '',
    `Subtotal: ${formatAmount(order.subtotal, order.currency)}`,
    `VAT (15%): ${formatAmount(order.taxTotal, order.currency)}`,
    `Total: ${formatAmount(order.total, order.currency)}`,
    ''
  )

  if (invoiceUrl) {
    lines.push(
      'YOUR TAX INVOICE',
      '================',
      `Download: ${invoiceUrl}`,
      'This invoice is VAT compliant for South African tax purposes.',
      ''
    )
  }

  lines.push(
    'WHAT HAPPENS NEXT',
    '=================',
    '1. You will receive access details within 24 hours.',
    '2. Check your email for joining instructions.',
    "3. Reach out if you need anything — we're here.",
    '',
    'QUESTIONS?',
    '==========',
    'Email: sravenall@suzanneravenall.com',
    'Website: https://suzanneravenall.com/contact',
    '',
    '---',
    'Dr Suzanne Ravenall · Ravenall Institute',
    'Cape Town, South Africa',
    'Powered by Ai Dynamic Advisory'
  )

  return lines.join('\n')
}
