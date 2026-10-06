/**
 * Automation runner (n8n migration step 0), every minute:
 *
 * 1. Recovery sweep: orders placed in code mode whose order.placed event was
 *    lost (restart) get their jobs now (src/automations/sweep.ts).
 * 2. Runs every queued job whose retry time has come, and every job left
 *    "running" by a process that died (lease expired). Backoff 1 min, 5 min,
 *    30 min, 2 h, 12 h, then dead with one staff alert.
 *
 * With every flag on "n8n" (the default) there are no jobs and this only
 * reads two small rows per minute.
 */

import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { OrderSnapshot } from "@suzanne/integrations"
import { dryRun } from "../automations/config"
import { dispatchOrderAutomations } from "../automations/dispatch"
import { buildOrderSnapshot, ORDER_GRAPH_FIELDS } from "../automations/order-snapshot"
import { createDryRunQueue, getAutomationQueue } from "../automations/runtime"
import { sweepRecentOrders } from "../automations/sweep"

const PROCESS_STARTED_AT = new Date()

type QueryGraph = {
  graph(input: Record<string, unknown>): Promise<{ data: unknown[] }>
}

export default async function automationRunner(container: MedusaContainer): Promise<void> {
  const queue = getAutomationQueue(container)

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as unknown as QueryGraph
    await sweepRecentOrders({
      store: queue.storeRef,
      processStartedAt: PROCESS_STARTED_AT,
      listOrdersSince: async (since) => {
        const { data } = await query.graph({
          entity: "order",
          fields: [...ORDER_GRAPH_FIELDS, "created_at"],
          filters: { created_at: { $gt: since.toISOString() } },
          pagination: { skip: 0, take: 200, order: { created_at: "ASC" } },
        })
        return data.map((o) => buildOrderSnapshot(o))
      },
      enqueueOrder: async (order: OrderSnapshot, only) =>
        dispatchOrderAutomations(order, {
          queue: () => queue,
          dryRunQueue: createDryRunQueue,
          kick: false,
          only,
        }),
    })
  } catch (err) {
    console.error(`[automation-runner] sweep failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (dryRun()) return

  try {
    const counts = await queue.runDue(25)
    const ran = Object.entries(counts).filter(([, n]) => n > 0)
    if (ran.length > 0) {
      console.info(`[automation-runner] ${ran.map(([k, n]) => `${k}=${n}`).join(" ")}`)
    }
  } catch (err) {
    console.error(`[automation-runner] run failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const config = {
  name: "automation-runner",
  schedule: "* * * * *",
}
