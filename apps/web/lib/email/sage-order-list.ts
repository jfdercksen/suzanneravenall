import { createElement } from 'react'
import { z } from 'zod'
import { sendEmail } from './send'
import SageOrderList from './templates/SageOrderList'

/**
 * The bookkeeper's daily order list (Sage plan, 26 Nov 2026). Medusa's
 * sage-order-list job builds the payload and POSTs it to
 * /api/email/sage-order-list; this file validates it, builds the subject, the
 * plain text and the CSV, and sends the mail. Internal: staff only, customer
 * details inside.
 */

const text = (max: number) => z.string().max(max)

const itemSchema = z.object({
  productTitle: text(300),
  variantTitle: text(300).nullable(),
  quantity: z.number().finite(),
  unitAmount: z.number().finite(),
  lineTotal: z.number().finite(),
  sageItemCode: text(100).nullable(),
})

const orderSchema = z.object({
  reference: text(20),
  createdAt: text(40),
  createdAtLabel: text(40),
  customerName: text(300),
  customerEmail: text(300),
  company: text(300).nullable(),
  vatNumber: text(50).nullable(),
  registrationNumber: text(50).nullable(),
  billingAddress: text(600),
  items: z.array(itemSchema).max(200),
  currency: text(10),
  discountTotal: z.number().finite(),
  voucherCodes: z.array(text(100)).max(20),
  total: z.number().finite(),
  paymentMethod: text(100),
  paymentReference: text(200).nullable(),
})

const refundSchema = z.object({
  reference: text(20),
  refundedAt: text(40),
  refundedAtLabel: text(40),
  amount: z.number().finite(),
  currency: text(10),
  note: text(1000).nullable(),
})

export const sageOrderListSchema = z.object({
  to: z.array(z.string().email()).min(1).max(10),
  cc: z.array(z.string().email()).max(10).default([]),
  windowLabel: z.string().min(1).max(100),
  /** First and last day covered, YYYY-MM-DD (SAST). */
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  orders: z.array(orderSchema).max(2000),
  refunds: z.array(refundSchema).max(500).default([]),
  /** The window held more orders than the list can carry (Medusa's cap, 2000). */
  incomplete: z.boolean().default(false),
  excluded: z
    .object({ canceled: z.number().int().min(0), qaVoucher: z.number().int().min(0), draft: z.number().int().min(0) })
    .optional(),
})

export type SageOrderListData = z.infer<typeof sageOrderListSchema>
export type SageOrderRow = SageOrderListData['orders'][number]
export type SageRefundRow = SageOrderListData['refunds'][number]

export const SAGE_LIST_INSTRUCTION =
  'Type the SR number in the Sage invoice reference field, so the automatic link later skips the order.'
export const INCOMPLETE_TEXT =
  'This list is incomplete: the day held more orders than fit. Check the Medusa admin for the rest.'
export const SAGE_LIST_FOOTER = 'This list holds customer details: keep it within the team.'
export const NO_CODE_TEXT = 'no code, check'

export function sageOrderListSubject(data: Pick<SageOrderListData, 'windowLabel' | 'orders'>): string {
  const n = data.orders.length
  return `Orders for Sage: ${data.windowLabel}, ${n} order${n === 1 ? '' : 's'}`
}

export function money(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`
}

/* --------------------------------- CSV --------------------------------- */

export const CSV_COLUMNS = [
  'reference',
  'date',
  'customer_name',
  'customer_email',
  'company',
  'item_code',
  'item',
  'variant',
  'quantity',
  'unit_amount',
  'line_total',
  'currency',
  'discount',
  'order_total',
  'payment_method',
  'payment_reference',
] as const

/** RFC 4180 quoting; a leading = + - @ (or tab / CR) is defused with a quote so Excel never runs it. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const amount = (n: number) => n.toFixed(2)

export function buildSageCsv(data: Pick<SageOrderListData, 'orders'>): string {
  const lines: string[] = [CSV_COLUMNS.join(',')]
  for (const o of data.orders) {
    const lead = [o.reference, o.createdAtLabel, o.customerName, o.customerEmail, o.company ?? ''].map(csvCell)
    const items = o.items.length > 0 ? o.items : [null]
    for (const item of items) {
      const cells = [
        ...lead,
        csvCell(item?.sageItemCode ?? ''),
        csvCell(item?.productTitle ?? ''),
        csvCell(item?.variantTitle ?? ''),
        item ? String(item.quantity) : '',
        item ? amount(item.unitAmount) : '',
        item ? amount(item.lineTotal) : '',
        csvCell(o.currency),
        amount(o.discountTotal),
        amount(o.total),
        csvCell(o.paymentMethod),
        csvCell(o.paymentReference ?? ''),
      ]
      lines.push(cells.join(','))
    }
  }
  return lines.join('\r\n') + '\r\n'
}

export function sageCsvFilename(data: Pick<SageOrderListData, 'toDate'>): string {
  return `sage-orders-${data.toDate}.csv`
}

/* ------------------------------- plain text ------------------------------ */

export function sageOrderListText(data: SageOrderListData): string {
  if (data.orders.length === 0 && data.refunds.length === 0 && !data.incomplete) {
    return [`No orders on ${data.windowLabel}.`, '', SAGE_LIST_FOOTER].join('\n')
  }
  const lines: string[] = data.incomplete ? [INCOMPLETE_TEXT, ''] : []
  lines.push(SAGE_LIST_INSTRUCTION, '')
  if (data.orders.length === 0) lines.push(`No orders on ${data.windowLabel}.`, '')
  for (const o of data.orders) {
    lines.push(`${o.reference}  ${o.createdAtLabel}`)
    lines.push(`  Customer: ${o.customerName} <${o.customerEmail}>`)
    if (o.company) {
      const ids = [o.vatNumber ? `VAT ${o.vatNumber}` : '', o.registrationNumber ? `Reg ${o.registrationNumber}` : ''].filter(Boolean)
      lines.push(`  Company: ${o.company}${ids.length ? ` (${ids.join(', ')})` : ''}`)
    }
    if (o.billingAddress) lines.push(`  Billing: ${o.billingAddress}`)
    for (const i of o.items) {
      const name = i.variantTitle ? `${i.productTitle} - ${i.variantTitle}` : i.productTitle
      lines.push(
        `  - [${i.sageItemCode ?? NO_CODE_TEXT}] ${name}: ${i.quantity} x ${money(i.unitAmount, o.currency)} = ${money(i.lineTotal, o.currency)}`,
      )
    }
    if (o.discountTotal > 0 || o.voucherCodes.length > 0) {
      lines.push(`  Discount: ${money(o.discountTotal, o.currency)}${o.voucherCodes.length ? ` (voucher ${o.voucherCodes.join(', ')})` : ''}`)
    }
    lines.push(`  Total: ${money(o.total, o.currency)}`)
    lines.push(`  Payment: ${o.paymentMethod}${o.paymentReference ? `, ref ${o.paymentReference}` : ''}`, '')
  }
  if (data.refunds.length > 0) {
    lines.push('REFUNDS')
    for (const r of data.refunds) {
      lines.push(`  ${r.reference}  ${r.refundedAtLabel}  ${money(r.amount, r.currency)}${r.note ? `  ${r.note}` : ''}`)
    }
    lines.push('')
  }
  lines.push(SAGE_LIST_FOOTER)
  return lines.join('\n')
}

/* --------------------------------- send --------------------------------- */

export async function sendSageOrderListEmail(data: SageOrderListData): Promise<string> {
  const attachments =
    data.orders.length > 0
      ? [{ filename: sageCsvFilename(data), content: Buffer.from(buildSageCsv(data), 'utf-8') }]
      : undefined
  return sendEmail({
    to: data.to,
    ...(data.cc.length > 0 ? { cc: data.cc } : {}),
    subject: sageOrderListSubject(data),
    react: createElement(SageOrderList, { data }),
    text: sageOrderListText(data),
    ...(attachments ? { attachments } : {}),
  })
}
