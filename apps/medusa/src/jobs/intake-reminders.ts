/**
 * Intake forms (H-12), hourly (every minute while INTAKE_REMINDER_DELAYS holds
 * an offset under an hour, for the time-compressed test):
 *
 *  1. Sweep: orders placed in the last 24 hours (never before the feature's
 *     go-live, INTAKE_LIVE_SINCE / INTAKE_SWEEP_SINCE) are handed to the web
 *     app again. The route is idempotent per (order, service) and claims each
 *     mail before sending, so this only does work for an order whose
 *     subscriber call failed (web down during a deploy).
 *  2. Reminders: POST /api/intake/reminders; the web app sends whatever is
 *     due (day 1, 3, 5, then every 3 days, at most 6, never once the form is
 *     in) and retries failed first mails and team mails.
 *
 * Runs only when AUTOMATION_INTAKE=code (the default) and not in dry run.
 */

import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { dryRun } from "../automations/config"
import {
  buildIntakePayload,
  intakeMode,
  intakeReminderSchedule,
  postIntakeOrder,
  postIntakeReminderRun,
  sweepSince,
  type IntakeOrder,
} from "../automations/intake"
import { ORDER_GRAPH_FIELDS } from "../automations/order-snapshot"
import { staffAlerter } from "../automations/runtime"
import { detectOrderProductType } from "../subscribers/order-placed"

const PAGE = 50
const MAX_ORDERS = 500

type QueryGraph = { graph(input: Record<string, unknown>): Promise<{ data: unknown[] }> }

async function sweepRecentOrders(container: MedusaContainer, now: Date): Promise<{ posted: number; failed: number }> {
  const since = sweepSince(now)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as unknown as QueryGraph
  const counts = { posted: 0, failed: 0 }
  for (let skip = 0; skip < MAX_ORDERS; skip += PAGE) {
    const { data } = await query.graph({
      entity: "order",
      fields: [...ORDER_GRAPH_FIELDS, "status", "created_at"],
      filters: { created_at: { $gte: since.toISOString() } },
      pagination: { skip, take: PAGE, order: { created_at: "ASC" } },
    })
    for (const raw of data) {
      const order = raw as IntakeOrder & { status?: string }
      if (order.status === "canceled") continue
      // Every order with product lines: the web app decides which take a form
      // (sessions, plus products the team listed on a form in the CMS).
      const payload = buildIntakePayload(order, (item) => detectOrderProductType([item as never]) === "session")
      if (!payload) continue
      try {
        // One try each: the next hourly run is the retry.
        await postIntakeOrder(payload, process.env, undefined, 0)
        counts.posted += 1
      } catch (err) {
        counts.failed += 1
        console.error(`[intake] sweep could not hand order ${order.id} to the web app: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    if (data.length < PAGE) break
  }
  return counts
}

export default async function intakeReminders(container: MedusaContainer): Promise<void> {
  if (intakeMode() !== "code" || dryRun()) return
  const now = new Date()
  try {
    const sweep = await sweepRecentOrders(container, now)
    const run = await postIntakeReminderRun()
    const sent = Number(run.firstMails ?? 0) + Number(run.reminders ?? 0) + Number(run.teamMails ?? 0)
    if (sent > 0 || Number(run.failed ?? 0) > 0 || sweep.failed > 0) {
      console.info(
        `[intake] sweep posted=${sweep.posted} failed=${sweep.failed}; firstMails=${run.firstMails} reminders=${run.reminders} teamMails=${run.teamMails} failed=${run.failed} skipped=${run.skipped}`,
      )
    }
    if (sweep.failed > 0) {
      await staffAlerter().send({
        key: "intake-sweep",
        subject: "Intake forms could not be created for some orders",
        lines: [
          `${sweep.failed} recent order(s) could not be handed to the web app; the next hourly run tries again.`,
          "If this repeats, check that the web container is up and the intake_submissions table exists.",
        ],
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[intake] hourly run failed: ${message}`)
    await staffAlerter()
      .send({
        key: "intake-run",
        subject: "The hourly intake form run failed",
        lines: [`Error: ${message}`, "Reminders and retried mails wait for the next run. If this repeats, check the web and medusa logs."],
      })
      .catch(() => undefined)
  }
}

export const config = {
  name: "intake-reminders",
  schedule: intakeReminderSchedule(),
}
