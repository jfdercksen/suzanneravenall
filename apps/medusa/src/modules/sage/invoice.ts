/**
 * Order to Sage TaxInvoice/Save body: pure functions, no I/O.
 *
 * Amounts: on this shop Medusa amounts are MINOR units (249000 = R2,490.00) in
 * every currency. buildSageOrderSnapshot converts each amount to rand exactly
 * once, through centsToRand (BigNumber-aware via toAmount, rounded to 2
 * decimals); everything after that (this builder, the job payload, the Sage
 * body) is in rand. Arithmetic here is in whole cents so the invoice total
 * equals the order total exactly.
 *
 * Lines: a variant with variant.metadata.sage_item_code that Sage knows becomes
 * an item line (SelectionId = Sage item id). Otherwise an account line on
 * SAGE_INCOME_ACCOUNT_ID, with a warning. The difference between the item lines
 * and the order total (a voucher, a fee) is one extra account line, negative
 * for a discount, so the totals always agree.
 *
 * The company is not VAT registered: TaxTypeId is SAGE_TAX_TYPE_ID or the
 * build refuses. Nothing here ever picks 15%.
 *
 * Refunds are not built: no credit note is posted. Carla issues the credit
 * note in Sage by hand. The staff alert on a refund is not wired yet: no order
 * refund subscriber exists in this app.
 */

import { orderBuyer, srInvoiceReference, toOrderSnapshot } from "@suzanne/integrations"
import { toAmount } from "../payment-payfast/cancel-plan"
import { SageConfigError } from "./errors"
import { LINE_TYPE_ACCOUNT, LINE_TYPE_ITEM, type SageInvoiceBody, type SageInvoiceLine } from "./types"

export type SageOrderItem = {
  title: string
  productTitle: string | null
  variantTitle: string | null
  quantity: number
  /** Rand (converted from Medusa cents), tax inclusive. */
  unitPrice: number
  sageItemCode: string | null
}

/** What the SAGE_INVOICE job carries: plain JSON, amounts in rand. */
export type SageOrderSnapshot = {
  id: string
  displayId: number | null
  currencyCode: string
  total: number
  createdAt: string
  email: string
  customerName: string
  items: SageOrderItem[]
}

const cents = (amount: number): number => Math.round(amount * 100)

/** The one place Medusa minor units (cents) become rand: 249000 -> 2490, rounded to 2 decimals. */
export function centsToRand(value: unknown): number {
  return Math.round(toAmount(value as never)) / 100
}

type RawItem = {
  title?: string | null
  quantity?: unknown
  unit_price?: unknown
  variant?: { title?: string | null; metadata?: Record<string, unknown> | null; product?: { title?: string | null } | null } | null
}

/** Builds the job payload from the Query graph order (ORDER_GRAPH_FIELDS). */
export function buildSageOrderSnapshot(order: unknown, receivedAt: Date = new Date()): SageOrderSnapshot {
  const raw = order as {
    id: string
    display_id?: number | string | null
    currency_code?: string | null
    total?: unknown
    created_at?: string | Date | null
    items?: RawItem[] | null
  }
  const plain = toOrderSnapshot(order)
  const buyer = orderBuyer({ ...plain, customer: { ...plain.customer, email: plain.customer?.email || plain.email } })
  const display = Number(raw.display_id)
  const created = raw.created_at ? new Date(raw.created_at) : receivedAt
  return {
    id: raw.id,
    displayId: Number.isInteger(display) && display > 0 ? display : null,
    currencyCode: String(raw.currency_code ?? "").toUpperCase(),
    total: centsToRand(raw.total),
    createdAt: Number.isNaN(created.getTime()) ? receivedAt.toISOString() : created.toISOString(),
    email: buyer.email,
    customerName: `${buyer.firstName} ${buyer.lastName === buyer.firstName ? "" : buyer.lastName}`.trim(),
    items: (raw.items ?? []).map((item) => {
      const code = item.variant?.metadata?.sage_item_code
      return {
        title: item.title ?? "Item",
        productTitle: item.variant?.product?.title ?? null,
        variantTitle: item.variant?.title ?? null,
        quantity: toAmount(item.quantity as never) || 1,
        unitPrice: centsToRand(item.unit_price),
        sageItemCode: typeof code === "string" && code.trim() ? code.trim() : null,
      }
    }),
  }
}

/** The calendar date of an instant in South Africa (SAST, UTC+2, no daylight saving), YYYY-MM-DD. */
export function sastDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso))
}

function describe(item: SageOrderItem): string {
  const product = item.productTitle ?? item.title
  const text = item.variantTitle && item.variantTitle !== "Default" && item.variantTitle !== product ? `${product} - ${item.variantTitle}` : product
  return text.slice(0, 200)
}

export type BuildInput = {
  order: SageOrderSnapshot
  customerId: number
  taxTypeId: number | null
  incomeAccountId: number | null
  /** Sage item id per code: a number = known, null = Sage has no such code, missing = not looked up. */
  itemIds: Record<string, number | null | undefined>
}

export function buildSageInvoice(input: BuildInput): { body: SageInvoiceBody; warnings: string[] } {
  const { order } = input
  if (input.taxTypeId === null) throw new SageConfigError("SAGE_TAX_TYPE_ID is not set; the link will not guess a VAT type")
  const taxTypeId = input.taxTypeId
  if (order.displayId === null) throw new Error(`Order ${order.id} has no order number for the invoice reference`)
  if (order.items.length === 0) throw new Error(`Order ${order.id} has no items`)

  const warnings: string[] = []
  const accountLine = (description: string, quantity: number, unitPriceInclusive: number): SageInvoiceLine => {
    if (input.incomeAccountId === null) throw new SageConfigError("SAGE_INCOME_ACCOUNT_ID is not set but this invoice needs an account line")
    return {
      SelectionId: input.incomeAccountId,
      LineType: LINE_TYPE_ACCOUNT,
      TaxTypeId: taxTypeId,
      Description: description,
      Quantity: quantity,
      UnitPriceInclusive: unitPriceInclusive,
      DiscountPercentage: 0,
    }
  }

  let linesCents = 0
  const lines: SageInvoiceLine[] = order.items.map((item, i) => {
    const unit = cents(item.unitPrice) / 100
    linesCents += cents(item.unitPrice) * item.quantity
    const description = describe(item)
    const code = item.sageItemCode
    const sageId = code ? input.itemIds[code] : undefined
    if (code && typeof sageId === "number") {
      return {
        SelectionId: sageId,
        LineType: LINE_TYPE_ITEM,
        TaxTypeId: taxTypeId,
        Description: description,
        Quantity: item.quantity,
        UnitPriceInclusive: unit,
        DiscountPercentage: 0,
      }
    }
    warnings.push(
      code
        ? `line ${i + 1} (${description}): item code "${code}" is not known in Sage, posted to the income account`
        : `line ${i + 1} (${description}): the variant has no sage_item_code, posted to the income account`,
    )
    return accountLine(description, item.quantity, unit)
  })

  // A voucher (negative) or a fee (positive) is the gap between the lines and what the buyer paid.
  const diff = cents(order.total) - linesCents
  if (diff !== 0) {
    lines.push(accountLine(diff < 0 ? "Discount" : "Other charges", 1, diff / 100))
    warnings.push(`order total differs from the item lines by ${(diff / 100).toFixed(2)}: added as a "${diff < 0 ? "Discount" : "Other charges"}" line`)
  }

  const date = sastDate(order.createdAt)
  return {
    body: {
      CustomerId: input.customerId,
      Date: date,
      DueDate: date, // paid at checkout
      Inclusive: true,
      Reference: srInvoiceReference(order.displayId),
      Message: "Thank you for your purchase.",
      Lines: lines,
    },
    warnings,
  }
}

/** Invoice total in cents, for the check that it equals the order total. */
export function invoiceTotalCents(body: SageInvoiceBody): number {
  return body.Lines.reduce((sum, l) => sum + Math.round(l.UnitPriceInclusive * 100) * l.Quantity, 0)
}
