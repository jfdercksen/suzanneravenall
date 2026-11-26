/**
 * Order recovery sweep. Medusa's event bus is in memory, so an order placed
 * just before a restart can lose its order.placed event and never reach the
 * subscriber. The runner calls this every minute: it re-reads recent orders
 * and enqueues any step that has no job yet. The idempotency key makes this a
 * no-op for every order the subscriber already handled.
 *
 * It only looks at orders placed after the automation entered "code" mode
 * (automation_mode_state.since), so orders that n8n handled before a flip are
 * never run again by our code.
 */

import type { AutomationMode, Logger, OrderSnapshot } from "@suzanne/integrations"
import type { JobStore } from "../modules/automations/queue"
import { dryRun, orderVtigerMode, SAGE_INVOICE, sageMode, thinkificMode, THINKIFIC_ENROLMENT, VTIGER_ORDER, type OrderAutomation } from "./config"

/** Orders younger than this are left to the subscriber. */
export const SWEEP_GRACE_MS = 2 * 60_000
/** Orders older than this are never swept. */
export const SWEEP_WINDOW_MS = 48 * 3_600_000

/** The effective mode for the sweep: a dry run counts as "not code". */
export function effectiveMode(automation: OrderAutomation, env: Record<string, string | undefined>): AutomationMode | "dry-run" {
  const mode = automation === THINKIFIC_ENROLMENT ? thinkificMode(env) : orderVtigerMode(env)
  if (mode === "code" && dryRun(env)) return "dry-run"
  return mode
}

/**
 * Records mode changes and returns, per automation in code mode, the time
 * from which orders may be swept. `processStartedAt` is used as the start of
 * code mode on a change: flags only change with a container restart.
 */
export async function codeModeSince(
  store: JobStore,
  env: Record<string, string | undefined>,
  processStartedAt: Date
): Promise<Partial<Record<OrderAutomation, Date>>> {
  const out: Partial<Record<OrderAutomation, Date>> = {}
  for (const automation of [THINKIFIC_ENROLMENT, VTIGER_ORDER] as const) {
    const mode = effectiveMode(automation, env)
    const saved = await store.getModeState(automation)
    if (!saved || saved.mode !== mode) {
      await store.setModeState({ automation, mode, since: processStartedAt })
      if (mode === "code") out[automation] = processStartedAt
      continue
    }
    if (mode === "code") out[automation] = saved.since
  }
  return out
}

export type SweepDeps = {
  store: JobStore
  /** Orders placed after `since` (Query graph, ORDER_GRAPH_FIELDS plus created_at), oldest first. */
  listOrdersSince: (since: Date) => Promise<OrderSnapshot[]>
  /** Enqueue without starting the run; the runner picks the jobs up. */
  enqueueOrder: (order: OrderSnapshot, only: OrderAutomation[]) => Promise<Record<OrderAutomation, string>>
  env?: Record<string, string | undefined>
  now?: () => Date
  processStartedAt: Date
  logger?: Logger
}

export async function sweepRecentOrders(deps: SweepDeps): Promise<{ checked: number; recovered: number }> {
  const env = deps.env ?? process.env
  const now = (deps.now ?? (() => new Date()))()
  const logger = deps.logger ?? console
  const since = await codeModeSince(deps.store, env, deps.processStartedAt)
  const automations = Object.keys(since) as OrderAutomation[]
  if (automations.length === 0) return { checked: 0, recovered: 0 }

  const earliest = new Date(
    Math.max(Math.min(...automations.map((a) => since[a]!.getTime())), now.getTime() - SWEEP_WINDOW_MS)
  )
  const orders = await deps.listOrdersSince(earliest)
  let recovered = 0
  let checked = 0
  for (const order of orders) {
    const createdAt = order.created_at ? new Date(order.created_at).getTime() : NaN
    if (!Number.isFinite(createdAt) || createdAt > now.getTime() - SWEEP_GRACE_MS) continue
    const only = automations.filter((a) => createdAt > since[a]!.getTime())
    if (only.length === 0) continue
    checked += 1
    const res = await deps.enqueueOrder(order, only)
    for (const a of only) {
      if (res[a] === "enqueued") {
        recovered += 1
        logger.warn(`[automation-sweep] recovered order ${order.id}: ${a} had no job (lost order.placed event?)`)
      }
    }
  }
  return { checked, recovered }
}

export type SageSweepDeps = {
  store: JobStore
  /** Raw Query graph orders placed after `since` (ORDER_GRAPH_FIELDS plus created_at), oldest first. */
  listOrdersSince: (since: Date) => Promise<Array<{ id: string; created_at?: string | Date | null }>>
  /** Enqueue without starting the run (dispatchSageInvoice, kick false); "enqueued" means a new job. */
  enqueueOrder: (order: unknown) => Promise<string>
  env?: Record<string, string | undefined>
  now?: () => Date
  processStartedAt: Date
  logger?: Logger
}

/**
 * The same recovery for the Sage invoice: an order whose order.placed event was
 * lost gets its sage_invoice job here. Same idempotency key as the subscriber's
 * job, so nothing is doubled. Only runs in AUTOMATION_SAGE=code (off and shadow
 * do nothing) and only for orders placed after code mode began, so orders
 * Carla already invoiced by hand before the switch are not swept.
 */
export async function sweepSageInvoices(deps: SageSweepDeps): Promise<{ checked: number; recovered: number }> {
  const env = deps.env ?? process.env
  const now = (deps.now ?? (() => new Date()))()
  const logger = deps.logger ?? console
  const configured = sageMode(env)
  const mode = configured === "code" && dryRun(env) ? "dry-run" : configured
  const saved = await deps.store.getModeState(SAGE_INVOICE)
  if (!saved || saved.mode !== mode) await deps.store.setModeState({ automation: SAGE_INVOICE, mode, since: deps.processStartedAt })
  if (mode !== "code") return { checked: 0, recovered: 0 }
  const since = !saved || saved.mode !== mode ? deps.processStartedAt : saved.since

  const earliest = new Date(Math.max(since.getTime(), now.getTime() - SWEEP_WINDOW_MS))
  let checked = 0
  let recovered = 0
  for (const order of await deps.listOrdersSince(earliest)) {
    const createdAt = order.created_at ? new Date(order.created_at).getTime() : NaN
    if (!Number.isFinite(createdAt) || createdAt > now.getTime() - SWEEP_GRACE_MS || createdAt <= since.getTime()) continue
    checked += 1
    if ((await deps.enqueueOrder(order)) === "enqueued") {
      recovered += 1
      logger.warn(`[automation-sweep] recovered order ${order.id}: sage_invoice had no job (lost order.placed event?)`)
    }
  }
  return { checked, recovered }
}
