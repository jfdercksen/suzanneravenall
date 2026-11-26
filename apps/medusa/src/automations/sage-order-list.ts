/**
 * Daily order list for the bookkeeper (Sage plan, 26 Nov 2026).
 *
 * Until the automatic Sage link exists, Carla types each invoice in Sage by
 * hand. Each working day at 07:00 SAST she gets a mail listing the previous
 * working day's orders (Monday: Friday to Sunday), each with its SR- reference
 * (srInvoiceReference) to enter in the Sage invoice reference field, so the
 * automatic link later recognises the order and skips it.
 *
 * Pure and dependency-injected: the job (src/jobs/sage-order-list.ts) wires the
 * Query graph, raw SQL for refunds and the web route.
 *
 * Flag AUTOMATION_SAGE_ORDER_LIST: "off" (default) | "code".
 * AUTOMATION_DRY_RUN=true builds the list and logs counts only.
 */

import {
  IntegrationError,
  fetchWithRetry,
  isDryRun,
  maskEmail,
  orderBusiness,
  orderBuyer,
  srInvoiceReference,
  type Logger,
  type OrderSnapshot,
  type StaffAlert,
} from "@suzanne/integrations"
import { toAmount, type AmountLike } from "../modules/payment-payfast/cancel-plan"
import type { RawSql } from "../modules/automations/pg-store"

type Env = Record<string, string | undefined>

export const QA_VOUCHER = "QA-SELFTEST-100"
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function sageOrderListMode(env: Env = process.env): "off" | "code" {
  return (env.AUTOMATION_SAGE_ORDER_LIST ?? "").trim().toLowerCase() === "code" ? "code" : "off"
}

/* ------------------------------ the window ------------------------------ */

export type ListWindow = {
  /** Inclusive start, an instant (00:00 SAST of the first day). */
  start: Date
  /** Exclusive end, an instant (00:00 SAST today). */
  end: Date
  /** First and last day covered, SAST, YYYY-MM-DD. */
  fromDate: string
  toDate: string
  /** "Wed 25 Nov 2026" or "Fri 20 Nov to Sun 22 Nov 2026". */
  label: string
}

const pad = (n: number) => String(n).padStart(2, "0")

/** SAST wall clock of an instant, read through a UTC date (South Africa has no DST). */
function sast(d: Date): Date {
  return new Date(d.getTime() + SAST_OFFSET_MS)
}

function ymd(shifted: Date): string {
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`
}

function dayLabel(shifted: Date, withYear: boolean): string {
  const base = `${DAYS[shifted.getUTCDay()]} ${shifted.getUTCDate()} ${MONTHS[shifted.getUTCMonth()]}`
  return withYear ? `${base} ${shifted.getUTCFullYear()}` : base
}

/** "2026-11-25 14:03" in SAST. */
export function sastDateTime(iso: string | Date): string {
  const s = sast(typeof iso === "string" ? new Date(iso) : iso)
  return `${ymd(s)} ${pad(s.getUTCHours())}:${pad(s.getUTCMinutes())}`
}

/**
 * [00:00 SAST of the previous working day, 00:00 SAST today). Monday covers
 * Friday, Saturday and Sunday. Mon-Fri are working days.
 */
export function windowFor(now: Date): ListWindow {
  const nowSast = sast(now)
  const todayMidnightSast = Date.UTC(nowSast.getUTCFullYear(), nowSast.getUTCMonth(), nowSast.getUTCDate())
  let startSast = todayMidnightSast - DAY_MS
  while ([0, 6].includes(new Date(startSast).getUTCDay())) startSast -= DAY_MS
  const first = new Date(startSast)
  const last = new Date(todayMidnightSast - DAY_MS)
  const sameDay = ymd(first) === ymd(last)
  const label = sameDay
    ? dayLabel(first, true)
    : `${dayLabel(first, false)} to ${dayLabel(last, true)}`
  return {
    start: new Date(startSast - SAST_OFFSET_MS),
    end: new Date(todayMidnightSast - SAST_OFFSET_MS),
    fromDate: ymd(first),
    toDate: ymd(last),
    label,
  }
}

/* ------------------------------- the payload ------------------------------ */

export type SageOrderItem = {
  productTitle: string
  variantTitle: string | null
  quantity: number
  unitAmount: number
  lineTotal: number
  sageItemCode: string | null
}

export type SageOrderRow = {
  reference: string
  createdAt: string
  createdAtLabel: string
  customerName: string
  customerEmail: string
  company: string | null
  vatNumber: string | null
  registrationNumber: string | null
  billingAddress: string
  items: SageOrderItem[]
  currency: string
  discountTotal: number
  voucherCodes: string[]
  total: number
  paymentMethod: string
  paymentReference: string | null
}

export type SageRefundRow = {
  reference: string
  refundedAt: string
  refundedAtLabel: string
  amount: number
  currency: string
  note: string | null
}

export type SageOrderListPayload = {
  to: string[]
  cc: string[]
  windowLabel: string
  fromDate: string
  toDate: string
  orders: SageOrderRow[]
  refunds: SageRefundRow[]
  excluded: { canceled: number; qaVoucher: number; draft: number }
}

type Raw = Record<string, unknown>
type AdjustmentLike = { code?: string | null }
type OrderLike = {
  id: string
  display_id?: number | string | null
  status?: string | null
  is_draft_order?: boolean | null
  created_at?: string | Date | null
  currency_code?: string | null
  email?: string | null
  total?: AmountLike
  discount_total?: AmountLike
  metadata?: Record<string, unknown> | null
  customer?: { email?: string | null; first_name?: string | null; last_name?: string | null } | null
  billing_address?: Raw | null
  items?: Array<{
    title?: string | null
    quantity?: AmountLike
    unit_price?: AmountLike
    adjustments?: AdjustmentLike[] | null
    variant?: { title?: string | null; metadata?: Record<string, unknown> | null; product?: { title?: string | null } | null } | null
  }> | null
  payment_collections?: Array<{
    payment_sessions?: Array<{ provider_id?: string | null }> | null
    payments?: Array<{ provider_id?: string | null }> | null
  }> | null
}

/** Fields for query.graph. Items, variants and customer are module links: graph only (KI045). */
export const SAGE_ORDER_FIELDS = [
  "id",
  "display_id",
  "status",
  "is_draft_order",
  "created_at",
  "currency_code",
  "email",
  "total",
  "discount_total",
  "metadata",
  "items.*",
  "items.adjustments.code",
  "items.variant.title",
  "items.variant.metadata",
  "items.variant.product.title",
  "customer.*",
  "billing_address.*",
  "payment_collections.payment_sessions.provider_id",
  "payment_collections.payments.provider_id",
]

/**
 * The one place an amount changes unit. This shop holds minor units (cents) for
 * ZAR and USD: 249000 = R2490.00 (orders.ts, InvoiceDocument). Everything after
 * this (payload, web route, template, CSV) is in major units and never divided again.
 */
export function money(value: AmountLike): number {
  return Math.round(toAmount(value)) / 100
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

function oneLineAddress(a: Raw | null | undefined): string {
  if (!a) return ""
  return ["address_1", "address_2", "city", "province", "postal_code", "country_code"]
    .map((k) => str(a[k]))
    .filter(Boolean)
    .join(", ")
}

/** Same reading as apps/web/app/api/invoices/generate getPaymentDetails. */
function paymentOf(order: OrderLike): { method: string; reference: string | null } {
  const meta = order.metadata ?? {}
  const providers = (order.payment_collections ?? []).flatMap((pc) => [
    ...(pc.payments ?? []).map((p) => p.provider_id ?? ""),
    ...(pc.payment_sessions ?? []).map((s) => s.provider_id ?? ""),
  ])
  const has = (needle: string) => providers.some((p) => p.includes(needle))
  if (has("payfast")) return { method: "PayFast", reference: meta.payfast_payment_id ? String(meta.payfast_payment_id) : null }
  if (has("paypal")) return { method: "PayPal", reference: meta.paypal_order_id ? String(meta.paypal_order_id) : null }
  if (money(order.total) === 0 && money(order.discount_total) > 0) return { method: "Voucher", reference: null }
  return { method: "Online Payment", reference: null }
}

export function voucherCodesOf(order: OrderLike): string[] {
  const codes = new Set<string>()
  for (const item of order.items ?? []) {
    for (const adj of item.adjustments ?? []) {
      const code = str(adj.code)
      if (code) codes.add(code)
    }
  }
  return [...codes]
}

export type Exclusion = "canceled" | "qaVoucher" | "draft" | null

export function exclusionOf(order: OrderLike): Exclusion {
  if (order.is_draft_order === true || order.status === "draft") return "draft"
  if (order.status === "canceled") return "canceled"
  if (voucherCodesOf(order).some((c) => c.toUpperCase() === QA_VOUCHER)) return "qaVoucher"
  return null
}

export function toOrderRow(order: OrderLike): SageOrderRow | null {
  const displayId = Number(order.display_id)
  if (!Number.isInteger(displayId) || displayId <= 0) return null
  const snapshot = order as unknown as OrderSnapshot
  const buyer = orderBuyer(snapshot)
  const business = orderBusiness({ metadata: order.metadata, billing_address: order.billing_address as { company?: string | null } | null })
  const name = [buyer.firstName, buyer.lastName].filter((v, i, a) => v && (i === 0 || v !== a[0])).join(" ")
  const pay = paymentOf(order)
  const created = order.created_at ? new Date(order.created_at) : new Date(0)
  return {
    reference: srInvoiceReference(displayId),
    createdAt: created.toISOString(),
    createdAtLabel: sastDateTime(created),
    customerName: name || buyer.email,
    customerEmail: buyer.email || str(order.email),
    company: business?.companyName ?? null,
    vatNumber: business?.vatNumber ?? null,
    registrationNumber: business?.registrationNumber ?? null,
    billingAddress: oneLineAddress(order.billing_address),
    items: (order.items ?? []).map((item) => {
      const quantity = toAmount(item.quantity) || 1
      const unit = money(item.unit_price)
      const code = item.variant?.metadata?.sage_item_code
      return {
        productTitle: str(item.variant?.product?.title) || str(item.title),
        variantTitle: str(item.variant?.title) || null,
        quantity,
        unitAmount: unit,
        lineTotal: Math.round(unit * quantity * 100) / 100, // unit is already major units
        sageItemCode: typeof code === "string" && code.trim() ? code.trim() : null,
      }
    }),
    currency: str(order.currency_code).toUpperCase(),
    discountTotal: money(order.discount_total),
    voucherCodes: voucherCodesOf(order),
    total: money(order.total),
    paymentMethod: pay.method,
    paymentReference: pay.reference,
  }
}

/* -------------------------------- refunds -------------------------------- */

const REFUND_SQL = `
SELECT r.id, r.amount, r.note, r.created_at, p.currency_code, o.display_id
FROM refund r
JOIN payment p ON p.id = r.payment_id
JOIN order_payment_collection opc ON opc.payment_collection_id = p.payment_collection_id AND opc.deleted_at IS NULL
JOIN "order" o ON o.id = opc.order_id
WHERE r.deleted_at IS NULL AND r.created_at >= ? AND r.created_at < ?
ORDER BY r.created_at ASC`

/** Refunds created inside the window, on any order (also one placed long before). */
export async function findRefunds(db: RawSql, window: Pick<ListWindow, "start" | "end">): Promise<SageRefundRow[]> {
  const res = await db.raw(REFUND_SQL, [window.start, window.end])
  const rows = Array.isArray(res) ? res : res?.rows ?? []
  const out: SageRefundRow[] = []
  for (const row of rows) {
    const displayId = Number(row.display_id)
    if (!Number.isInteger(displayId) || displayId <= 0) continue
    const at = new Date(row.created_at as string | Date)
    out.push({
      reference: srInvoiceReference(displayId),
      refundedAt: at.toISOString(),
      refundedAtLabel: sastDateTime(at),
      amount: money(row.amount as AmountLike),
      currency: str(row.currency_code).toUpperCase(),
      note: str(row.note) || null,
    })
  }
  return out
}

/* ------------------------------- the run ------------------------------- */

const EMAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/

/** Comma separated list; null when empty or any entry is not an email. */
export function parseRecipients(raw: string | undefined): string[] | null {
  const parts = (raw ?? "").split(",").map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  return parts.every((p) => EMAIL_RE.test(p)) ? parts : null
}

export type SageRunResult =
  | { status: "off" }
  | { status: "no-recipient" }
  | { status: "dry-run"; orders: number; refunds: number }
  | { status: "sent"; orders: number; refunds: number }
  | { status: "failed"; reason: string }

export type SageOrderListDeps = {
  now(): Date
  env?: Env
  /** Orders created in the window, raw graph rows. */
  loadOrders(window: ListWindow): Promise<unknown[]>
  loadRefunds(window: ListWindow): Promise<SageRefundRow[]>
  /** Throws when the mail was not accepted. */
  send(payload: SageOrderListPayload): Promise<void>
  alert(alert: StaffAlert): Promise<unknown>
  logger: Logger
}

export async function runSageOrderList(deps: SageOrderListDeps): Promise<SageRunResult> {
  const env = deps.env ?? process.env
  if (sageOrderListMode(env) === "off") return { status: "off" }

  const to = parseRecipients(env.SAGE_ORDER_LIST_EMAIL)
  const ccRaw = (env.SAGE_ORDER_LIST_CC ?? "").trim()
  const cc = ccRaw ? parseRecipients(ccRaw) : []
  if (!to || cc === null) {
    const lines = [
      to ? "SAGE_ORDER_LIST_CC holds an address that is not a valid email." : "SAGE_ORDER_LIST_EMAIL is empty or holds an address that is not a valid email.",
      "No order list was sent. Fix the setting in infra/.env and restart medusa.",
    ]
    deps.logger.error(`[sage-order-list] ${lines[0]}`)
    if (!isDryRun(env)) await deps.alert({ key: "sage-order-list-recipient", subject: "Sage order list: no valid recipient", lines })
    return { status: "no-recipient" }
  }

  const window = windowFor(deps.now())
  try {
    const raw = await deps.loadOrders(window)
    const refunds = await deps.loadRefunds(window)
    const excluded = { canceled: 0, qaVoucher: 0, draft: 0 }
    const orders: SageOrderRow[] = []
    for (const order of raw as OrderLike[]) {
      const why = exclusionOf(order)
      if (why) {
        excluded[why] += 1
        continue
      }
      const row = toOrderRow(order)
      if (row) orders.push(row)
    }
    orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const payload: SageOrderListPayload = {
      to,
      cc,
      windowLabel: window.label,
      fromDate: window.fromDate,
      toDate: window.toDate,
      orders,
      refunds,
      excluded,
    }

    const summary = `${window.label}: ${orders.length} order(s), ${refunds.length} refund(s), excluded canceled=${excluded.canceled} qa=${excluded.qaVoucher} draft=${excluded.draft}`
    if (isDryRun(env)) {
      deps.logger.info(`[sage-order-list:dry-run] would send to ${[...to, ...cc].map(maskEmail).join(", ")}: ${summary}`)
      return { status: "dry-run", orders: orders.length, refunds: refunds.length }
    }

    await deps.send(payload)
    deps.logger.info(`[sage-order-list] sent ${summary}`)
    return { status: "sent", orders: orders.length, refunds: refunds.length }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    deps.logger.error(`[sage-order-list] run failed: ${reason}`)
    // Order numbers and counts only, no customer data (POPIA).
    await deps
      .alert({
        key: "sage-order-list-failed",
        subject: `Sage order list for ${window.label} was not sent`,
        lines: [`Reason: ${reason}`, "Carla has no list for that day. Check the medusa log, then send the day's orders by hand or restart the job."],
      })
      .catch(() => undefined)
    return { status: "failed", reason }
  }
}

/** POST /api/email/sage-order-list on the web app. One attempt: a retried send could mail twice. */
export async function sendSageOrderListViaWeb(
  payload: SageOrderListPayload,
  env: Env = process.env,
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<void> {
  const base = (env.WEB_BASE_URL || "http://web:3000").replace(/\/$/, "")
  const secret = env.INTERNAL_WEBHOOK_SECRET || env.N8N_WEBHOOK_SECRET || ""
  const res = await fetchWithRetry(
    `${base}/api/email/sage-order-list`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { "x-webhook-secret": secret } : {}) },
      body: JSON.stringify(payload),
    },
    { system: "web-email", retries: 0, timeoutMs: 30_000, fetchImpl },
  )
  if (!res.ok) {
    throw new IntegrationError(`sage-order-list mail route answered HTTP ${res.status}`, {
      system: "web-email",
      status: res.status,
      retriable: false,
    })
  }
}
