/**
 * Hands a placed order to the code automations, per flag. Called by
 * order-placed.ts (after it has decided which n8n webhooks to call) and by
 * the recovery sweep.
 *
 *   flag code, no dry run  -> durable job (idempotent per order), run at once
 *   flag code, dry run     -> run in memory with dry-run clients, log only
 *   flag n8n,  dry run     -> same dry run, as a shadow of the real n8n call
 *   anything else          -> nothing
 */

import { orderHasCourses, type AutomationMode, type OrderSnapshot } from "@suzanne/integrations"
import type { AutomationQueue } from "../modules/automations/queue"
import { buildSageOrderSnapshot } from "../modules/sage/invoice"
import {
  dryRun,
  idempotencyKey,
  orderVtigerMode,
  SAGE_INVOICE,
  sageIdempotencyKey,
  sageMode,
  thinkificMode,
  THINKIFIC_ENROLMENT,
  VTIGER_ORDER,
  type OrderAutomation,
} from "./config"

export type DispatchAction = "enqueued" | "duplicate" | "dry-run" | "shadow" | "not-applicable" | "none"

export type DispatchResult = Record<OrderAutomation, DispatchAction>

/** Whether the automation has anything to do for this order (same tests the n8n flows made first). */
export function appliesTo(automation: OrderAutomation, order: OrderSnapshot): boolean {
  if (automation === THINKIFIC_ENROLMENT) return orderHasCourses(order)
  return true // vtiger_order: the handler itself skips orders without an email or total, like n8n
}

export async function dispatchOrderAutomations(
  order: OrderSnapshot,
  deps: {
    queue: () => AutomationQueue
    dryRunQueue: () => AutomationQueue
    env?: Record<string, string | undefined>
    /** Only enqueue, do not start the run now (the sweep lets the runner pick jobs up). */
    kick?: boolean
    /** Limit to these automations (the sweep). */
    only?: OrderAutomation[]
  }
): Promise<DispatchResult> {
  const env = deps.env ?? process.env
  const modes: Record<OrderAutomation, AutomationMode> = {
    [THINKIFIC_ENROLMENT]: thinkificMode(env),
    [VTIGER_ORDER]: orderVtigerMode(env),
  }
  const isDry = dryRun(env)
  const result: DispatchResult = { [THINKIFIC_ENROLMENT]: "none", [VTIGER_ORDER]: "none" }

  for (const automation of [THINKIFIC_ENROLMENT, VTIGER_ORDER] as const) {
    if (deps.only && !deps.only.includes(automation)) continue
    const mode = modes[automation]
    if (mode === "off") continue
    if (mode === "n8n" && !isDry) continue
    if (!appliesTo(automation, order)) {
      result[automation] = "not-applicable"
      continue
    }
    const key = idempotencyKey(automation, order.id)
    const payload = { order }

    if (isDry) {
      // Nothing persisted: the dry run can never block or replace the real run later.
      const q = deps.dryRunQueue()
      const { job } = await q.enqueue(automation, key, payload, order.id)
      await q.runJob(job.id)
      result[automation] = mode === "n8n" ? "shadow" : "dry-run"
      continue
    }

    const q = deps.queue()
    const { created } =
      deps.kick === false
        ? await q.enqueue(automation, key, payload, order.id)
        : await q.enqueueAndKick(automation, key, payload, order.id)
    result[automation] = created ? "enqueued" : "duplicate"
  }
  return result
}

export type SageDispatchAction = "enqueued" | "duplicate" | "shadow" | "dry-run" | "none"

/**
 * Hands a placed order to the Sage invoice automation, per AUTOMATION_SAGE:
 *   off                 nothing
 *   shadow, or a dry run  in-memory run with no Sage call (masked log only)
 *   code                durable job (idempotent per order), run at once
 * `rawOrder` is the Query graph order: the Sage job needs quantities and prices
 * in cents (converted to rand once, in the snapshot), which the shared OrderSnapshot does not carry.
 */
export async function dispatchSageInvoice(
  rawOrder: unknown,
  deps: {
    queue: () => AutomationQueue
    dryRunQueue: () => AutomationQueue
    env?: Record<string, string | undefined>
    kick?: boolean
  }
): Promise<SageDispatchAction> {
  const env = deps.env ?? process.env
  const mode = sageMode(env)
  if (mode === "off") return "none"
  const order = buildSageOrderSnapshot(rawOrder)
  const key = sageIdempotencyKey(order.id)
  const payload = { order }

  if (mode === "shadow" || dryRun(env)) {
    // Nothing persisted: a shadow run can never block the real run later.
    const q = deps.dryRunQueue()
    const { job } = await q.enqueue(SAGE_INVOICE, key, payload, order.id)
    await q.runJob(job.id)
    return mode === "shadow" ? "shadow" : "dry-run"
  }

  const q = deps.queue()
  const { created } =
    deps.kick === false ? await q.enqueue(SAGE_INVOICE, key, payload, order.id) : await q.enqueueAndKick(SAGE_INVOICE, key, payload, order.id)
  return created ? "enqueued" : "duplicate"
}
