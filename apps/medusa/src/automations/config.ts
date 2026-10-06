/**
 * Cutover flags for the order automations (docs/n8n-migration-plan.md
 * section 5). Read at call time; a flip is an env change plus
 * `docker compose up -d --no-deps medusa`.
 *
 *   AUTOMATION_THINKIFIC     n8n (default) | code | off
 *   AUTOMATION_ORDER_VTIGER  n8n (default) | code | off
 *
 * n8n  - order-placed.ts calls the n8n webhook exactly as before.
 * code - our own code does the work through the durable queue; the n8n
 *        webhook for that automation is NOT called.
 * off  - nobody does it (queued jobs are held, not dropped).
 *
 * AUTOMATION_DRY_RUN=true: code mode runs the code with no network calls and
 * nothing persisted; n8n mode additionally runs the code that way next to the
 * real n8n call (a shadow run), so the logs can be compared with n8n.
 */

import { automationMode, isDryRun, type AutomationMode } from "@suzanne/integrations"

export const THINKIFIC_ENROLMENT = "thinkific_enrolment"
export const COURSE_ACCESS_EMAIL = "course_access_email"
export const VTIGER_ORDER = "vtiger_order"

export type OrderAutomation = typeof THINKIFIC_ENROLMENT | typeof VTIGER_ORDER

export function thinkificMode(env: Record<string, string | undefined> = process.env): AutomationMode {
  return automationMode(["AUTOMATION_THINKIFIC"], "n8n", env)
}

/** AUTOMATION_VTIGER_ORDER (the plan's spelling) is accepted as an alias. */
export function orderVtigerMode(env: Record<string, string | undefined> = process.env): AutomationMode {
  return automationMode(["AUTOMATION_ORDER_VTIGER", "AUTOMATION_VTIGER_ORDER"], "n8n", env)
}

/** The flag that governs a queued job. The course-access mail follows the Thinkific flag. */
export function modeFor(automation: string, env: Record<string, string | undefined> = process.env): AutomationMode {
  if (automation === THINKIFIC_ENROLMENT || automation === COURSE_ACCESS_EMAIL) return thinkificMode(env)
  if (automation === VTIGER_ORDER) return orderVtigerMode(env)
  return "off"
}

export function dryRun(env: Record<string, string | undefined> = process.env): boolean {
  return isDryRun(env)
}

export function idempotencyKey(automation: OrderAutomation, orderId: string): string {
  return `${automation}:${orderId}`
}
