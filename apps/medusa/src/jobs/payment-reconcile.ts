/**
 * Stuck-payment safety net (KI095), every 10 minutes: payments the gateway
 * took more than 5 minutes ago that never became a paid Medusa order are
 * repaired once or reported to staff (src/automations/payment-reconcile.ts).
 *
 * Runs when AUTOMATION_PAYMENT_RECONCILE is not "off". In a dry run it only
 * logs what it found.
 */

import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { dryRun } from "../automations/config"
import { findStuckPayments, paymentReconcileMode, reconcileStuckPayments, RECONCILE_MIN_AGE_MS } from "../automations/payment-reconcile"
import { getAutomationQueue } from "../automations/runtime"
import type { RawSql } from "../modules/automations/pg-store"

export default async function paymentReconcile(container: MedusaContainer): Promise<void> {
  if (paymentReconcileMode() === "off") return
  try {
    const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as RawSql
    const stuck = await findStuckPayments(db, { now: new Date(), minAgeMs: RECONCILE_MIN_AGE_MS })
    if (stuck.length === 0) return
    if (dryRun()) {
      console.warn(`[payment-reconcile:dry-run] ${stuck.length} stuck payment(s): ${stuck.map((p) => p.sessionId).join(", ")}`)
      return
    }
    const res = await reconcileStuckPayments(stuck, getAutomationQueue(container))
    if (res.attempted > 0) console.warn(`[payment-reconcile] found=${res.found} attempted=${res.attempted} outcomes=${res.outcomes.join(",")}`)
  } catch (err) {
    console.error(`[payment-reconcile] run failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const config = {
  name: "payment-reconcile",
  schedule: "*/10 * * * *",
}
