/**
 * Daily order list for the bookkeeper, 07:00 SAST Monday to Friday
 * (src/automations/sage-order-list.ts). Runs only when
 * AUTOMATION_SAGE_ORDER_LIST=code (default off); AUTOMATION_DRY_RUN logs
 * counts and sends nothing.
 */

import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { staffAlerter } from "../automations/runtime"
import {
  SAGE_ORDER_FIELDS,
  findRefunds,
  runSageOrderList,
  sageOrderListMode,
  sendSageOrderListViaWeb,
} from "../automations/sage-order-list"
import type { RawSql } from "../modules/automations/pg-store"

const PAGE = 100
const MAX_ORDERS = 2000

type QueryGraph = { graph(input: Record<string, unknown>): Promise<{ data: unknown[] }> }

export default async function sageOrderList(container: MedusaContainer): Promise<void> {
  if (sageOrderListMode() === "off") return
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as unknown as QueryGraph
    const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as RawSql
    await runSageOrderList({
      now: () => new Date(),
      logger: console,
      alert: (a) => staffAlerter().send(a),
      loadOrders: async (window) => {
        const all: unknown[] = []
        for (let skip = 0; skip < MAX_ORDERS; skip += PAGE) {
          const { data } = await query.graph({
            entity: "order",
            fields: SAGE_ORDER_FIELDS,
            filters: { created_at: { $gte: window.start.toISOString(), $lt: window.end.toISOString() } },
            pagination: { skip, take: PAGE, order: { created_at: "ASC" } },
          })
          all.push(...data)
          if (data.length < PAGE) break
        }
        return all
      },
      loadRefunds: (window) => findRefunds(db, window),
      send: (payload) => sendSageOrderListViaWeb(payload),
    })
  } catch (err) {
    console.error(`[sage-order-list] job failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const config = {
  name: "sage-order-list",
  // 05:00 UTC = 07:00 SAST (no DST), Monday to Friday.
  schedule: "0 5 * * 1-5",
}
