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
import {
  dryRun,
  idempotencyKey,
  orderVtigerMode,
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
