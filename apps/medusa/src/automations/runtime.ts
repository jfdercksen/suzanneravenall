/**
 * Wiring: one queue per process on Medusa's Postgres, one dry-run queue in
 * memory, the clients, the staff alerter and the course-access mail sender.
 */

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
// The path Medusa itself resolves, so the workflow is composed once (KI089).
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import {
  createStaffAlerter,
  sendSentryEvent,
  fetchWithRetry,
  IntegrationError,
  ThinkificClient,
  VtigerClient,
  type Logger,
  type StaffAlerter,
} from "@suzanne/integrations"
import { AutomationQueue } from "../modules/automations/queue"
import { PgJobStore, type RawSql } from "../modules/automations/pg-store"
import { MemoryJobStore } from "../modules/automations/memory-store"
import { PgCartRecoveryStore, type CartRecoveryStore } from "../modules/automations/cart-recovery-store"
import {
  cartRecoveryEmailHandler,
  loadCart,
  sendCartReminderViaWeb,
  type QueryGraph,
} from "./cart-recovery"
import { dryRun, modeFor } from "./config"
import { findStuckPayments, paymentReconcileHandler, type ReconcileDeps } from "./payment-reconcile"
import { toAmount, type AmountLike } from "../modules/payment-payfast/cancel-plan"
import {
  courseAccessEmailHandler,
  thinkificEnrolmentHandler,
  vtigerOrderHandler,
  type AutomationDeps,
  type CourseAccessMail,
} from "./handlers"

type Resolver = { resolve<T = unknown>(key: string): T }

const logger: Logger = console

let alerter: StaffAlerter | null = null
export function staffAlerter(): StaffAlerter {
  if (!alerter) alerter = createStaffAlerter({ logger })
  return alerter
}

/**
 * POST /api/email/course-access on the web app (React Email template, Brevo
 * sender). Same secret header as the membership-welcome call.
 */
export async function sendCourseAccessEmailViaWeb(
  mail: CourseAccessMail,
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<void> {
  const base = (env.WEB_BASE_URL || "http://web:3000").replace(/\/$/, "")
  const secret = env.INTERNAL_WEBHOOK_SECRET || env.N8N_WEBHOOK_SECRET || ""
  const res = await fetchWithRetry(
    `${base}/api/email/course-access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { "x-webhook-secret": secret } : {}) },
      body: JSON.stringify(mail),
    },
    { system: "web-email", retries: 1, timeoutMs: 15_000, fetchImpl }
  )
  if (!res.ok) {
    throw new IntegrationError(`course-access mail route answered HTTP ${res.status}`, {
      system: "web-email",
      status: res.status,
      // 401/422 need a config or code fix; 5xx (Brevo down) is worth retrying.
      retriable: res.status >= 500,
    })
  }
}

function realDeps(): AutomationDeps {
  let thinkific: ThinkificClient | null = null
  let vtiger: VtigerClient | null = null
  return {
    thinkific: () => (thinkific ??= ThinkificClient.fromEnv(process.env, { dryRun: false })),
    vtiger: () => (vtiger ??= VtigerClient.fromEnv(process.env, { dryRun: false })),
    sendCourseAccessEmail: (mail) => sendCourseAccessEmailViaWeb(mail),
    logger,
  }
}

function dryDeps(): AutomationDeps {
  return {
    thinkific: () => ThinkificClient.fromEnv(process.env, { dryRun: true, logger }),
    vtiger: () => VtigerClient.fromEnv(process.env, { dryRun: true, logger }),
    sendCourseAccessEmail: async (mail) => {
      logger.info(
        `[course-access:dry-run] would POST /api/email/course-access for order ${mail.orderId}: ${mail.courses.length} course(s)`
      )
    },
    logger,
  }
}

export function buildHandlers(deps: AutomationDeps) {
  return [thinkificEnrolmentHandler(deps), courseAccessEmailHandler(deps), vtigerOrderHandler(deps)]
}

let cartStore: CartRecoveryStore | null = null

/** The cart_recovery rows on Medusa's Postgres (n8n migration step 4). */
export function getCartRecoveryStore(container: Resolver): CartRecoveryStore {
  if (!cartStore) cartStore = new PgCartRecoveryStore(container.resolve<RawSql>(ContainerRegistrationKeys.PG_CONNECTION))
  return cartStore
}

function cartRecoveryHandler(container: Resolver) {
  return cartRecoveryEmailHandler({
    store: () => getCartRecoveryStore(container),
    loadCart: (cartId) => loadCart(container.resolve<QueryGraph>(ContainerRegistrationKeys.QUERY), cartId),
    sendReminder: (body) => sendCartReminderViaWeb(body),
    logger,
  })
}

type OrderRow = { id: string; status: string; total: AmountLike; currency_code: string }

/** The Medusa side of the stuck-payment repair (KI095). */
export function reconcileDeps(container: Resolver): ReconcileDeps {
  const db = () => container.resolve<RawSql>(ContainerRegistrationKeys.PG_CONNECTION)
  return {
    recheck: async (sessionId) =>
      (await findStuckPayments(db(), { now: new Date(), minAgeMs: 0, sessionId }))[0] ?? null,
    loadOrder: async (orderId) => {
      const query = container.resolve<QueryGraph>(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "order",
        fields: ["id", "status", "total", "currency_code"],
        filters: { id: orderId },
      })
      const order = data[0] as OrderRow | undefined
      // total is a BigNumber ({ numeric }): Number() on it is NaN.
      return order ? { id: order.id, status: order.status, total: toAmount(order.total), currencyCode: order.currency_code } : null
    },
    completeCart: async (cartId) => {
      await completeCartWorkflow(container as never).run({ input: { id: cartId } })
    },
    authorizeSession: async (sessionId) => {
      const payment = container.resolve<{ authorizePaymentSession(id: string, context: Record<string, unknown>): Promise<unknown> }>(Modules.PAYMENT)
      await payment.authorizePaymentSession(sessionId, {})
    },
    recordOrderTransactions: async (orderId, sessionId) => {
      // Same rows core's addOrderTransactionStep writes after authorising.
      const payment = container.resolve<{
        listPayments(filters: Record<string, unknown>, config: Record<string, unknown>): Promise<
          Array<{ currency_code: string; captures?: Array<{ id: string; amount: unknown; raw_amount?: unknown }> }>
        >
      }>(Modules.PAYMENT)
      const orders = container.resolve<{
        listOrderTransactions(filters: Record<string, unknown>, config: Record<string, unknown>): Promise<Array<{ reference_id: string | null }>>
        addOrderTransactions(data: Array<Record<string, unknown>>): Promise<unknown>
      }>(Modules.ORDER)
      const payments = await payment.listPayments({ payment_session_id: sessionId }, { relations: ["captures"] })
      const rows = payments.flatMap((p) =>
        (p.captures ?? []).map((c) => ({
          order_id: orderId,
          amount: c.raw_amount ?? c.amount,
          currency_code: p.currency_code,
          reference: "capture",
          reference_id: c.id,
        }))
      )
      if (rows.length === 0) throw new Error(`no capture recorded for payment session ${sessionId}`)
      const existing = await orders.listOrderTransactions(
        { order_id: orderId, reference: "capture", reference_id: rows.map((r) => r.reference_id) },
        { select: ["reference_id"] }
      )
      const have = new Set(existing.map((t) => t.reference_id))
      const missing = rows.filter((r) => !have.has(r.reference_id))
      if (missing.length > 0) await orders.addOrderTransactions(missing)
    },
    paidAmount: async (orderId) => {
      const res = await db().raw(
        `SELECT COALESCE(SUM(amount), 0) AS paid FROM order_transaction WHERE order_id = ? AND deleted_at IS NULL`,
        [orderId]
      )
      const rows = Array.isArray(res) ? res : res?.rows ?? []
      return Number(rows[0]?.paid ?? 0)
    },
    emitOrderPlaced: async (orderId) => {
      const bus = container.resolve<{ emit(event: { name: string; data: Record<string, unknown> }): Promise<void> }>(Modules.EVENT_BUS)
      await bus.emit({ name: "order.placed", data: { id: orderId } })
    },
    sentry: (event) => sendSentryEvent(event, { logger }),
    logger,
  }
}

let queue: AutomationQueue | null = null

/** The durable queue (Medusa Postgres). Jobs whose flag is "off" are held. */
export function getAutomationQueue(container: Resolver): AutomationQueue {
  if (!queue) {
    const db = container.resolve<RawSql>(ContainerRegistrationKeys.PG_CONNECTION)
    queue = new AutomationQueue({
      store: new PgJobStore(db),
      handlers: [...buildHandlers(realDeps()), cartRecoveryHandler(container), paymentReconcileHandler(reconcileDeps(container))],
      alert: (a) => staffAlerter().send(a),
      logger,
      isRunnable: (automation) => !dryRun() && modeFor(automation) !== "off",
    })
  }
  return queue
}

/**
 * A throwaway in-memory queue with dry-run clients: no network, nothing
 * persisted, alerts logged only. Used for AUTOMATION_DRY_RUN=true.
 */
export function createDryRunQueue(): AutomationQueue {
  const dryAlerter = createStaffAlerter({ logger, env: { AUTOMATION_DRY_RUN: "true" } })
  return new AutomationQueue({
    store: new MemoryJobStore(),
    handlers: buildHandlers(dryDeps()),
    alert: (a) => dryAlerter.send(a),
    logger,
    // Follow-up jobs (the course-access mail) run inline so the whole dry run is in one log block.
    defer: (fn) => {
      void fn().catch((err: unknown) => logger.error(`[automation:dry-run] ${err instanceof Error ? err.message : String(err)}`))
    },
  })
}

/** Tests only. */
export function resetAutomationRuntime(): void {
  queue = null
  alerter = null
  cartStore = null
}
