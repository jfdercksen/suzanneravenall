/**
 * Abandoned-cart reminders (n8n migration step 4, plan section 3.4), every
 * 10 minutes (every minute when CART_RECOVERY_DELAYS holds a delay under
 * 10 minutes, for the time-compressed test).
 *
 * For each active cart_recovery row whose reminder is due, one outbox job
 * cart_recovery_email is queued and started at once. The job reads the cart
 * in-process, stops on a completed, missing or emptied cart, otherwise POSTs
 * the web route with template 1, 2 or 3 and moves the row on (next reminder
 * 23 h, then 48 h later; stopped after the third). A failed send is retried
 * by the outbox (automation-runner, 1 min .. 12 h) and goes dead with one
 * staff alert; the sequence for that cart then stops.
 *
 * Runs only when AUTOMATION_CART_RECOVERY=code and not in dry run.
 */

import type { MedusaContainer } from "@medusajs/framework/types"
import { cartRecoveryMode, cartRecoverySchedule, scheduleDueReminders } from "../automations/cart-recovery"
import { dryRun } from "../automations/config"
import { getAutomationQueue, getCartRecoveryStore } from "../automations/runtime"

export default async function cartRecovery(container: MedusaContainer): Promise<void> {
  if (cartRecoveryMode() !== "code" || dryRun()) return
  try {
    const counts = await scheduleDueReminders(getCartRecoveryStore(container), getAutomationQueue(container))
    if (counts.enqueued + counts.pending + counts.stopped > 0) {
      console.info(`[cart-recovery] enqueued=${counts.enqueued} pending=${counts.pending} stopped=${counts.stopped}`)
    }
  } catch (err) {
    console.error(`[cart-recovery] run failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const config = {
  name: "cart-recovery",
  schedule: cartRecoverySchedule(),
}
