/**
 * Cutover flags for the order automations (docs/n8n-migration-plan.md
 * section 5). Read at call time; a flip is an env change plus
 * `docker compose up -d --no-deps medusa`.
 *
 *   AUTOMATION_THINKIFIC     n8n (default) | code | off
 *   AUTOMATION_ORDER_VTIGER  n8n (default) | code | off
 *   AUTOMATION_CART_RECOVERY n8n (default) | code | off (see cart-recovery.ts)
 *   AUTOMATION_PAYMENT_RECONCILE code (default) | off (see payment-reconcile.ts)
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
import { CART_RECOVERY_EMAIL, cartRecoveryMode } from "./cart-recovery"
import { PAYMENT_RECONCILE, paymentReconcileMode } from "./payment-reconcile"

export const THINKIFIC_ENROLMENT = "thinkific_enrolment"
export const COURSE_ACCESS_EMAIL = "course_access_email"
export const VTIGER_ORDER = "vtiger_order"

export const SAGE_INVOICE = "sage_invoice"

export type OrderAutomation = typeof THINKIFIC_ENROLMENT | typeof VTIGER_ORDER

export function thinkificMode(env: Record<string, string | undefined> = process.env): AutomationMode {
  return automationMode(["AUTOMATION_THINKIFIC"], "n8n", env)
}

/** AUTOMATION_VTIGER_ORDER (the plan's spelling) is accepted as an alias. */
export function orderVtigerMode(env: Record<string, string | undefined> = process.env): AutomationMode {
  return automationMode(["AUTOMATION_ORDER_VTIGER", "AUTOMATION_VTIGER_ORDER"], "n8n", env)
}

export type SageMode = "off" | "shadow" | "code"

/**
 * AUTOMATION_SAGE: off (default) | shadow | code. shadow builds the invoice and
 * logs a masked summary with no Sage call and nothing persisted. Unknown values
 * mean off. (The shared flag parser has no "shadow", so Sage parses its own.)
 */
export function sageMode(env: Record<string, string | undefined> = process.env): SageMode {
  const raw = (env.AUTOMATION_SAGE ?? "").trim().toLowerCase()
  if (!raw) return "off"
  if (raw === "off" || raw === "shadow" || raw === "code") return raw
  console.warn(`[automation] AUTOMATION_SAGE="${raw}" is not one of off, shadow, code; using "off"`)
  return "off"
}

export function sageIdempotencyKey(orderId: string): string {
  return `${SAGE_INVOICE}:${orderId}`
}

/** The flag that governs a queued job. The course-access mail follows the Thinkific flag. */
export function modeFor(automation: string, env: Record<string, string | undefined> = process.env): AutomationMode {
  if (automation === THINKIFIC_ENROLMENT || automation === COURSE_ACCESS_EMAIL) return thinkificMode(env)
  if (automation === VTIGER_ORDER) return orderVtigerMode(env)
  if (automation === CART_RECOVERY_EMAIL) return cartRecoveryMode(env)
  // Only "code" runs durable jobs; shadow runs in memory (dispatch.ts), so queued jobs are held.
  if (automation === SAGE_INVOICE) return sageMode(env) === "code" ? "code" : "off"
  if (automation === PAYMENT_RECONCILE) return paymentReconcileMode(env)
  return "off"
}

export function dryRun(env: Record<string, string | undefined> = process.env): boolean {
  return isDryRun(env)
}

export function idempotencyKey(automation: OrderAutomation, orderId: string): string {
  return `${automation}:${orderId}`
}
