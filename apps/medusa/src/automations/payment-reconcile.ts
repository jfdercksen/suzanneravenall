/**
 * Stuck-payment safety net (KI095). Medusa 2.14.1's complete-cart can lose a
 * run under load ("Cart is already being completed by another request", 409,
 * one caller): order #418 (21 Oct 2026) and #399/#400 (20 Oct, KI089) were
 * left with the gateway's money taken, an order row (or none), no Medusa
 * payment, no order.placed, so no confirmation mail, Thinkific or Vtiger.
 *
 * A stuck payment is a payment session whose data says the gateway took the
 * money (status authorized/captured: set only from a verified PayPal capture
 * proof or PayFast ITN proof) but which has no Medusa payment row, older than
 * five minutes, on a cart whose order is missing or not canceled. That query
 * finds exactly #399, #400 and #418 on the review box and no healthy order.
 *
 * Every 10 minutes (jobs/payment-reconcile.ts), and on a late PayPal
 * PAYMENT.CAPTURE.COMPLETED (api/hooks/payment-reconcile), each stuck payment
 * becomes one outbox job, keyed by its session, so it is handled once:
 *
 * - no order and the cart not completed: run core complete-cart, at most once
 *   (a cart still locked by a run in progress is retried later);
 * - an order without its payment: the steps core's run never finished, each
 *   idempotent and resumable: authorize the session (the provider answers
 *   "captured", so Medusa records payment and capture), add the order's
 *   capture transaction, check the order reads as paid, emit order.placed;
 * - anything else (amounts differ, cart completed without an order, the
 *   repair failed or left it unpaid, reads failing three times): one staff
 *   alert with cart, order, gateway reference and amount, plus a Sentry
 *   event. The buyer has paid.
 *
 *   AUTOMATION_PAYMENT_RECONCILE  code (default) | off
 */

import { automationMode, type AutomationMode, type Logger, type SentryEvent, type StaffAlert } from "@suzanne/integrations"
import type { RawSql } from "../modules/automations/pg-store"
import { PermanentError, type AutomationHandler, type JobRecord, type RunOutcome } from "../modules/automations/queue"

export const PAYMENT_RECONCILE = "payment_reconcile"
/** A payment younger than this may still be completing normally. */
export const RECONCILE_MIN_AGE_MS = 5 * 60_000
/** The webhook path waits as long as the sweep (PayPal retries the event meanwhile). */
export const WEBHOOK_MIN_AGE_MS = RECONCILE_MIN_AGE_MS
/** Older payments are left to people: the sweep only looks back this far. */
export const RECONCILE_WINDOW_MS = 7 * 24 * 3_600_000

export function paymentReconcileMode(env: Record<string, string | undefined> = process.env): AutomationMode {
  return automationMode(["AUTOMATION_PAYMENT_RECONCILE"], "code", env)
}

export function reconcileKey(sessionId: string): string {
  return `${PAYMENT_RECONCILE}:${sessionId}`
}

export type StuckPayment = {
  sessionId: string
  providerId: string
  collectionId: string
  cartId: string
  cartCompletedAt: string | null
  orderId: string | null
  orderDisplayId: number | null
  /** Minor units, as the rest of this store keeps them. */
  amount: number
  currencyCode: string
  /** PayPal capture id or PayFast pf_payment_id. */
  gatewayRef: string
  updatedAt: string
}

const STUCK_SQL = `
SELECT ps.id AS session_id, ps.provider_id, ps.payment_collection_id, ps.amount, ps.currency_code, ps.updated_at,
       COALESCE(ps.data->>'capture_id', ps.data->>'captureId', ps.data->>'pf_payment_id', '') AS gateway_ref,
       cpc.cart_id, c.completed_at, oc.order_id, o.display_id
FROM payment_session ps
JOIN payment_collection pc ON pc.id = ps.payment_collection_id AND pc.deleted_at IS NULL AND pc.status <> 'canceled'
JOIN cart_payment_collection cpc ON cpc.payment_collection_id = ps.payment_collection_id AND cpc.deleted_at IS NULL
JOIN cart c ON c.id = cpc.cart_id
LEFT JOIN order_cart oc ON oc.cart_id = c.id AND oc.deleted_at IS NULL
LEFT JOIN "order" o ON o.id = oc.order_id AND o.deleted_at IS NULL
WHERE ps.deleted_at IS NULL
  AND ps.data->>'status' IN ('authorized', 'captured')
  AND NOT EXISTS (SELECT 1 FROM payment p WHERE p.payment_session_id = ps.id AND p.deleted_at IS NULL)
  AND (o.id IS NULL OR o.status <> 'canceled')
  AND ps.updated_at <= ? AND ps.updated_at > ?`

function toStuck(row: Record<string, unknown>): StuckPayment {
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v))
  return {
    sessionId: String(row.session_id),
    providerId: String(row.provider_id),
    collectionId: String(row.payment_collection_id),
    cartId: String(row.cart_id),
    cartCompletedAt: iso(row.completed_at),
    orderId: row.order_id == null ? null : String(row.order_id),
    orderDisplayId: row.display_id == null ? null : Number(row.display_id),
    amount: Number(row.amount),
    currencyCode: String(row.currency_code ?? "").toLowerCase(),
    gatewayRef: String(row.gateway_ref ?? ""),
    updatedAt: iso(row.updated_at) ?? "",
  }
}

export async function findStuckPayments(
  db: RawSql,
  opts: { now: Date; minAgeMs: number; cartId?: string; sessionId?: string },
): Promise<StuckPayment[]> {
  const bindings: unknown[] = [
    new Date(opts.now.getTime() - opts.minAgeMs),
    new Date(opts.now.getTime() - RECONCILE_WINDOW_MS),
  ]
  let sql = STUCK_SQL
  if (opts.cartId) {
    sql += " AND cpc.cart_id = ?"
    bindings.push(opts.cartId)
  }
  if (opts.sessionId) {
    sql += " AND ps.id = ?"
    bindings.push(opts.sessionId)
  }
  sql += " ORDER BY ps.updated_at ASC LIMIT 50"
  const res = await db.raw(sql, bindings)
  const rows = Array.isArray(res) ? res : res?.rows ?? []
  return rows.map(toStuck)
}

export function formatAmount(amount: number, currencyCode: string): string {
  return `${currencyCode.toUpperCase()} ${(amount / 100).toFixed(2)}`
}

function gatewayName(providerId: string): string {
  if (providerId.includes("paypal")) return "PayPal"
  if (providerId.includes("payfast")) return "PayFast"
  return providerId
}

/** Lines shared by the alert and the Sentry event. No buyer email (POPIA). */
function describe(p: StuckPayment): string[] {
  return [
    `Gateway: ${gatewayName(p.providerId)}, reference ${p.gatewayRef || "(none)"}, amount ${formatAmount(p.amount, p.currencyCode)}`,
    `Cart: ${p.cartId}`,
    p.orderId ? `Order: #${p.orderDisplayId ?? "?"} (${p.orderId})` : "Order: none was created",
    `Payment session: ${p.sessionId}, marked paid at ${p.updatedAt}`,
  ]
}

export type OrderCheck = { id: string; status: string; total: number; currencyCode: string }

export type ReconcileDeps = {
  /** The same payment, read again now (null once it has a Medusa payment, or its order was canceled). */
  recheck(sessionId: string): Promise<StuckPayment | null>
  loadOrder(orderId: string): Promise<OrderCheck | null>
  /** Core complete-cart. Throws when it does not complete. */
  completeCart(cartId: string): Promise<void>
  /** Payment module authorizePaymentSession: records the payment and its capture. Idempotent. */
  authorizeSession(sessionId: string): Promise<void>
  /** The order_transaction rows core adds after authorising (reference "capture"). Skips existing ones. */
  recordOrderTransactions(orderId: string, sessionId: string): Promise<void>
  /** Sum of the order's transactions, in minor units: what admin reads as paid. */
  paidAmount(orderId: string): Promise<number>
  emitOrderPlaced(orderId: string): Promise<void>
  sentry(event: SentryEvent): Promise<unknown>
  logger: Logger
}

type Outcome = "recovered" | "already-resolved" | "order-canceled"

/** Progress kept on the job, so a retry resumes instead of repeating a write. */
type RepairState = {
  completeAttempted?: boolean
  authorized?: boolean
  recorded?: boolean
  emitted?: boolean
}

/** Core's cart lock is held by a run still in progress: try again later, not a failure yet. */
function isLockConflict(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /already being completed|lock/i.test(message)
}

async function repair(
  p: StuckPayment,
  deps: ReconcileDeps,
  state: RepairState,
  save: (s: RepairState) => Promise<void>,
): Promise<Outcome> {
  // Reads before any write: an error here is retried by the queue (1 min, 5 min).
  const current = await deps.recheck(p.sessionId)
  if (!current && !state.authorized) return "already-resolved"
  const target = current ?? p

  if (!target.orderId) {
    if (target.cartCompletedAt) {
      throw new PermanentError("the cart is marked completed but has no order; not safe to complete again")
    }
    // Completing a cart is the one write that is not idempotent: at most once.
    if (state.completeAttempted) {
      throw new PermanentError("the cart completion was already tried once and the payment is still not on an order")
    }
    await save({ ...state, completeAttempted: true })
    try {
      await deps.completeCart(target.cartId)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (isLockConflict(err)) {
        await save({ ...state, completeAttempted: false })
        throw new Error(`not now, the cart is locked by a run in progress: ${message}`)
      }
      throw new PermanentError(message)
    }
    if (await deps.recheck(p.sessionId)) {
      throw new PermanentError("the cart completion ran but the payment is still not recorded on an order")
    }
    return "recovered"
  }

  const orderId = target.orderId
  const order = await deps.loadOrder(orderId)
  if (!order) throw new Error(`order ${orderId} could not be read`)
  if (order.status === "canceled") return "order-canceled"
  if (order.total !== target.amount || order.currencyCode.toLowerCase() !== target.currencyCode) {
    throw new PermanentError(
      `amounts differ: order ${formatAmount(order.total, order.currencyCode)}, paid ${formatAmount(target.amount, target.currencyCode)}; not recording the payment`
    )
  }

  // The steps core's complete-cart runs after creating the order, each safe to
  // repeat (authorize skips a session that has its payment, transactions skip
  // existing references), so a failure part-way resumes on the retry.
  let next: RepairState = { ...state }
  if (!next.authorized) {
    await deps.authorizeSession(target.sessionId)
    next = { ...next, authorized: true }
    await save(next)
  }
  if (!next.recorded) {
    await deps.recordOrderTransactions(orderId, target.sessionId)
    next = { ...next, recorded: true }
    await save(next)
  }
  if ((await deps.paidAmount(orderId)) < target.amount || (await deps.recheck(p.sessionId))) {
    throw new PermanentError("the repair ran but the order still does not read as paid")
  }
  // The lost run never reached its order.placed: confirmation mail, invoice,
  // Thinkific and Vtiger all hang off it. Sent once (state.emitted).
  if (!next.emitted) {
    await deps.emitOrderPlaced(orderId)
    await save({ ...next, emitted: true })
  }
  return "recovered"
}

/** Attempts before staff are alerted: the first plus retries after 1 and 5 minutes. */
export const RECONCILE_MAX_ATTEMPTS = 3

export function paymentReconcileHandler(deps: ReconcileDeps): AutomationHandler {
  const sentryExtra = (p: StuckPayment) => ({
    cart_id: p.cartId,
    order_id: p.orderId,
    gateway_ref: p.gatewayRef,
    amount: formatAmount(p.amount, p.currencyCode),
  })
  return {
    name: PAYMENT_RECONCILE,
    maxAttempts: RECONCILE_MAX_ATTEMPTS,
    async run({ payload, state, save, job }) {
      const p = payload as unknown as StuckPayment
      try {
        const outcome = await repair(p, deps, (state ?? {}) as RepairState, (s) => save(s as Record<string, unknown>))
        if (outcome === "recovered") {
          deps.logger.warn(`[payment-reconcile] recovered ${p.sessionId}: ${describe(p).join(" | ")}`)
          await deps.sentry({
            level: "warning",
            message: `Stuck payment recovered automatically (${gatewayName(p.providerId)} ${p.gatewayRef})`,
            tags: { automation: PAYMENT_RECONCILE, outcome },
            extra: sentryExtra(p),
          })
        } else {
          deps.logger.info(`[payment-reconcile] ${p.sessionId}: ${outcome}`)
        }
        return { result: { outcome } }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        // Sentry only when staff are about to be alerted (the queue's dead path).
        if (err instanceof PermanentError || job.attempts >= RECONCILE_MAX_ATTEMPTS) {
          await deps.sentry({
            level: "error",
            message: `Stuck payment needs staff (${gatewayName(p.providerId)} ${p.gatewayRef}): ${message}`,
            tags: { automation: PAYMENT_RECONCILE, outcome: "alerted" },
            extra: sentryExtra(p),
          })
        }
        throw err
      }
    },
    describeFailure(job: JobRecord, error: string): StaffAlert {
      const p = job.payload as unknown as StuckPayment
      return {
        key: `${PAYMENT_RECONCILE}:${p.sessionId}`,
        subject: `Paid order not completed: ${formatAmount(p.amount, p.currencyCode)} via ${gatewayName(p.providerId)}`,
        lines: [
          "The gateway took the money, but the order did not complete in Medusa (KI095) and the automatic repair did not finish it.",
          ...describe(p),
          `Repair result: ${error}`,
          "Action: open the order (or the cart) in the Medusa admin. Either record the payment and send the confirmation, or refund the buyer in the gateway. Then cancel any half-made order.",
        ],
      }
    },
  }
}

type Queue = {
  enqueue(automation: string, key: string, payload: Record<string, unknown>, orderId?: string | null): Promise<{ job: JobRecord; created: boolean }>
  runJob(id: string): Promise<RunOutcome>
}

export type ReconcileResult = { found: number; attempted: number; outcomes: RunOutcome[] }

/** One job per stuck payment, run now. A payment seen before is never handled again. */
export async function reconcileStuckPayments(stuck: StuckPayment[], queue: Queue): Promise<ReconcileResult> {
  const outcomes: RunOutcome[] = []
  for (const p of stuck) {
    const { job, created } = await queue.enqueue(PAYMENT_RECONCILE, reconcileKey(p.sessionId), p as unknown as Record<string, unknown>, p.orderId)
    if (!created) continue
    outcomes.push(await queue.runJob(job.id))
  }
  return { found: stuck.length, attempted: outcomes.length, outcomes }
}

export type CartReconcileStatus = "clear" | "recovered" | "pending" | "alerted" | "held"

const RANK: Record<CartReconcileStatus, number> = { clear: 0, recovered: 1, held: 2, pending: 3, alerted: 4 }

function statusOf(outcome: RunOutcome | JobRecord["status"]): CartReconcileStatus {
  if (outcome === "done") return "recovered"
  if (outcome === "dead") return "alerted"
  if (outcome === "held") return "held"
  return "pending"
}

/**
 * The webhook path: a late PayPal PAYMENT.CAPTURE.COMPLETED for a cart that
 * is already completed. "pending" means try again later (the payment is under
 * a minute old, or another runner holds its job); the caller answers PayPal
 * with a 5xx so the event is retried.
 */
export async function reconcileCart(
  deps: { find(minAgeMs: number): Promise<StuckPayment[]>; queue: Queue; now?: () => Date },
): Promise<CartReconcileStatus> {
  const now = (deps.now ?? (() => new Date()))().getTime()
  const stuck = await deps.find(0)
  let worst: CartReconcileStatus = "clear"
  for (const p of stuck) {
    let status: CartReconcileStatus
    if (now - Date.parse(p.updatedAt) < WEBHOOK_MIN_AGE_MS) {
      status = "pending"
    } else {
      const { job, created } = await deps.queue.enqueue(PAYMENT_RECONCILE, reconcileKey(p.sessionId), p as unknown as Record<string, unknown>, p.orderId)
      status = statusOf(created ? await deps.queue.runJob(job.id) : job.status)
    }
    if (RANK[status] > RANK[worst]) worst = status
  }
  return worst
}
