import { createElement } from 'react'
import { sendEmail } from './send'
import OrderConfirmation, { BOOKING_LINK_REUSE_LINE, getNextSteps, portalInviteCopy } from '../../emails/OrderConfirmation'
import type { OrderEmailData } from './types'
import { companyVatNumber } from './company'
import { formatAmount } from './utils'
import { siteUrl } from './site-url'
import { DOWNLOAD_LINK_TTL_LABEL } from '../downloads/storage'

export type { OrderEmailData }

const REPLY_TO = 'bookings@studiobooking.co.za'

/** File name the buyer sees on the attached invoice. */
export function invoiceFilename(displayId: number): string {
  return `invoice-${displayId}.pdf`
}

/**
 * The invoice goes out as a PDF attachment when the stored file is available.
 * The signed download link from /api/invoices/generate expires after 7 days
 * and there is no portal page that lists invoices, so the link is only used
 * as a fallback when the PDF could not be read, and the copy then says how
 * long it lasts.
 */
export async function sendOrderConfirmationEmail({
  order,
  invoiceUrl,
  invoicePdf = null,
}: {
  order: OrderEmailData
  invoiceUrl: string | null
  invoicePdf?: Buffer | null
}): Promise<string> {
  const subject = `Your transformation begins - Order #${order.displayId}`
  const invoice: InvoiceDelivery = invoicePdf
    ? { kind: 'attached', filename: invoiceFilename(order.displayId) }
    : invoiceUrl
      ? { kind: 'link', url: invoiceUrl }
      : { kind: 'none' }
  const text = buildPlainText(order, invoice)

  return sendEmail({
    replyTo: REPLY_TO,
    to: [order.email],
    subject,
    react: createElement(OrderConfirmation, {
      ...order,
      invoiceUrl: invoice.kind === 'link' ? invoice.url : null,
      invoiceAttachmentName: invoice.kind === 'attached' ? invoice.filename : null,
    }),
    text,
    ...(invoicePdf
      ? { attachments: [{ filename: invoiceFilename(order.displayId), content: invoicePdf }] }
      : {}),
  })
}

type InvoiceDelivery =
  | { kind: 'attached'; filename: string }
  | { kind: 'link'; url: string }
  | { kind: 'none' }

/** "Acme (Pty) Ltd, VAT 4123456789": the company line in the order mail. */
export function billedToLine(business: NonNullable<OrderEmailData['business']>): string {
  return business.vatNumber ? `${business.companyName}, VAT ${business.vatNumber}` : business.companyName
}

function portalInviteLines(invite: NonNullable<OrderEmailData['portalInvite']>): string[] {
  const copy = portalInviteCopy(invite.kind)
  return [copy.heading.toUpperCase(), '='.repeat(copy.heading.length), copy.body, `${copy.button}: ${invite.url}`, '']
}

function buildPlainText(order: OrderEmailData, invoice: InvoiceDelivery): string {
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
    ...(order.calBookingUrl
      ? ['BOOK YOUR SESSION', '=================', `Choose a date and time: ${order.calBookingUrl}`, BOOKING_LINK_REUSE_LINE, '']
      : []),
    ...(order.downloads && order.downloads.length > 0
      ? [
          'YOUR DOWNLOADS',
          '==============',
          ...order.downloads.map((file) => `${file.title}: ${file.url}`),
          `Save the files to your device: the links work for ${DOWNLOAD_LINK_TTL_LABEL}.`,
          '',
        ]
      : []),
    ...(order.portalInvite ? portalInviteLines(order.portalInvite) : []),
    'ORDER SUMMARY',
    '=============',
    `Order: #${order.displayId}`,
    `Date: ${formattedDate}`,
    ...(order.business ? [`Billed to: ${billedToLine(order.business)}`] : []),
    '',
  ]

  for (const item of order.items) {
    const variant = item.variantTitle ? ` (${item.variantTitle})` : ''
    lines.push(
      `${item.title}${variant} x${item.quantity} - ${formatAmount(item.unitPrice, order.currency)}`
    )
  }

  // Not VAT registered by default (companyVatNumber() null): no VAT line,
  // no tax-invoice wording. Mirrors OrderConfirmation.tsx and InvoiceDocument.tsx.
  const vatRegistered = companyVatNumber() !== null

  lines.push('', `Subtotal: ${formatAmount(order.subtotal, order.currency)}`)
  if (order.discountTotal && order.discountTotal > 0) {
    lines.push(`Voucher / discount: -${formatAmount(order.discountTotal, order.currency)}`)
  }
  if (vatRegistered) {
    lines.push(`VAT (15%): ${formatAmount(order.taxTotal, order.currency)}`)
  }
  lines.push(`Total: ${formatAmount(order.total, order.currency)}`, '')

  lines.push(vatRegistered ? 'YOUR TAX INVOICE' : 'YOUR INVOICE', '================')
  if (invoice.kind === 'attached') {
    lines.push(
      `Your ${vatRegistered ? 'tax invoice' : 'invoice'} is attached to this email as a PDF (${invoice.filename}).`,
      ...(vatRegistered ? ['It is VAT compliant for South African tax purposes.'] : []),
      'Keep it for your records.',
      ''
    )
  } else if (invoice.kind === 'link') {
    lines.push(
      `Download: ${invoice.url}`,
      'This download link works for 7 days. Save a copy of the PDF for your records.',
      ...(vatRegistered ? ['This invoice is VAT compliant for South African tax purposes.'] : []),
      ''
    )
  } else {
    lines.push('If you need a copy of your invoice, reply to this email and we will send it to you.', '')
  }

  lines.push(
    'WHAT HAPPENS NEXT',
    '=================',
    // Same steps as the HTML version, per product type.
    ...getNextSteps(order.productType).map(({ step, text }) => `${Number(step)}. ${text}`),
    '',
    'QUESTIONS?',
    '==========',
    'Email: bookings@studiobooking.co.za',
    `Website: ${siteUrl()}/contact`,
    '',
    '---',
    'Dr Suzanne Ravenall · Ravenall Institute',
    'Johannesburg, South Africa',
    'Powered by Ai Dynamic Advisory'
  )

  return lines.join('\n')
}
