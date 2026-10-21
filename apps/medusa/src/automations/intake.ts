/**
 * Client intake forms (H-12). Medusa only notices the moments; the web app
 * owns the records (Supabase intake_submissions), the forms (Payload) and the
 * mails:
 *
 *   order placed -> subscribers/order-placed-intake.ts -> POST web /api/intake/orders
 *   every hour   -> jobs/intake-reminders.ts           -> POST web /api/intake/reminders
 *
 *   AUTOMATION_INTAKE       code (default) | off. off: no records, no mails, no reminders.
 *   INTAKE_REMINDER_DELAYS  read here only for the job's tick (the web app owns
 *                           the schedule): any offset under an hour switches
 *                           the job to every minute, for the time-compressed test.
 *
 * Every line goes to the web app with `session` set by the order mail's rule
 * (detectOrderProductType, parent-category fallback KI082); the web app picks
 * the form, so the team can also put a non-session product on a form in the CMS.
 */

import {
  automationMode,
  fetchWithRetry,
  IntegrationError,
  type AutomationMode,
} from "@suzanne/integrations"

export function intakeMode(env: Record<string, string | undefined> = process.env): AutomationMode {
  const mode = automationMode(["AUTOMATION_INTAKE"], "code", env)
  // There is no n8n intake workflow: "n8n" reads as the default.
  return mode === "n8n" ? "code" : mode
}

const UNIT_MS: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }

/** Hourly; every minute when INTAKE_REMINDER_DELAYS holds an offset under an hour. */
export function intakeReminderSchedule(env: Record<string, string | undefined> = process.env): string {
  const offsets = (env.INTAKE_REMINDER_DELAYS ?? "")
    .split(",")
    .map((p) => /^(\d+)([smhd])$/.exec(p.trim().toLowerCase()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]) * UNIT_MS[m[2]])
  return offsets.some((ms) => ms > 0 && ms < 3_600_000) ? "* * * * *" : "0 * * * *"
}

// ---------------------------------------------------------------------------
// The order, as the web route takes it
// ---------------------------------------------------------------------------

export interface IntakeOrderItem {
  title?: string | null
  variant?: {
    title?: string | null
    product?: { handle?: string | null; title?: string | null } | null
  } | null
}

export interface IntakeOrder {
  id: string
  display_id?: number | string | null
  created_at?: string | Date | null
  email?: string | null
  customer?: { email?: string | null; first_name?: string | null; last_name?: string | null } | null
  billing_address?: { first_name?: string | null; last_name?: string | null } | null
  items?: IntakeOrderItem[] | null
}

export interface IntakeOrderPayload {
  orderId: string
  displayId: string | null
  email: string
  firstName: string | null
  lastName: string | null
  /** When the order was placed (ISO); the reminders count from here. */
  placedAt: string | null
  lines: { handle: string; title: string; session: boolean }[]
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function placedAtOf(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/**
 * Orders placed before this moment are never swept (the go-live of the
 * feature), so the first deploy does not mail forms for older orders.
 * INTAKE_SWEEP_SINCE (ISO) overrides it.
 */
export const INTAKE_LIVE_SINCE = "2026-10-21T07:15:00Z"

/** The sweep window: the last 24 hours, never before the go-live. */
export function sweepSince(now: Date, env: Record<string, string | undefined> = process.env): Date {
  const configured = new Date((env.INTAKE_SWEEP_SINCE || "").trim() || INTAKE_LIVE_SINCE)
  const floor = Number.isNaN(configured.getTime()) ? new Date(INTAKE_LIVE_SINCE) : configured
  return new Date(Math.max(now.getTime() - 24 * 3_600_000, floor.getTime()))
}

/**
 * The body for /api/intake/orders, or null when there is nothing to ask the
 * web app (no email, no product lines). `isSession` is the order mail's rule
 * for one line.
 */
export function buildIntakePayload(
  order: IntakeOrder,
  isSession: (item: IntakeOrderItem) => boolean,
): IntakeOrderPayload | null {
  const email = clean(order.customer?.email) ?? clean(order.email)
  if (!email) return null
  const lines = (order.items ?? [])
    .map((item) => {
      const handle = clean(item.variant?.product?.handle)
      if (!handle) return null
      return { handle, title: clean(item.variant?.product?.title) ?? clean(item.title) ?? handle, session: isSession(item) }
    })
    .filter((l): l is IntakeOrderPayload["lines"][number] => l !== null)
  if (lines.length === 0) return null
  const hasCustomerName = Boolean(clean(order.customer?.first_name) || clean(order.customer?.last_name))
  const names = hasCustomerName ? order.customer : order.billing_address
  return {
    orderId: order.id,
    displayId: order.display_id == null ? null : String(order.display_id),
    email,
    firstName: clean(names?.first_name),
    lastName: clean(names?.last_name),
    placedAt: placedAtOf(order.created_at),
    lines,
  }
}

// ---------------------------------------------------------------------------
// Calls to the web app
// ---------------------------------------------------------------------------

type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>

function webCall(env: Record<string, string | undefined>) {
  const base = (env.WEB_BASE_URL || "http://web:3000").replace(/\/$/, "")
  const secret = env.INTERNAL_WEBHOOK_SECRET || env.N8N_WEBHOOK_SECRET || ""
  if (!secret) throw new Error("INTERNAL_WEBHOOK_SECRET and N8N_WEBHOOK_SECRET are unset on medusa")
  return { base, headers: { "Content-Type": "application/json", "x-webhook-secret": secret } }
}

/**
 * POST /api/intake/orders, retried (the route is idempotent per order and
 * service, and resends only a mail that did not go). Throws after the last try.
 */
export async function postIntakeOrder(
  payload: IntakeOrderPayload,
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: FetchImpl,
  retries = 4,
): Promise<unknown> {
  const { base, headers } = webCall(env)
  const res = await fetchWithRetry(
    `${base}/api/intake/orders`,
    { method: "POST", headers, body: JSON.stringify(payload) },
    // 5 s, 10 s, 20 s, 40 s between tries: rides out a web restart during a deploy.
    { system: "web-intake", retries, baseDelayMs: 5_000, timeoutMs: 30_000, fetchImpl },
  )
  if (!res.ok) {
    throw new IntegrationError(`intake orders route answered HTTP ${res.status}`, {
      system: "web-intake",
      status: res.status,
      retriable: res.status >= 500,
    })
  }
  return res.json().catch(() => ({}))
}

/** POST /api/intake/cancel: an order was cancelled, so its open forms stop (no more reminders). */
export async function postIntakeCancel(
  orderId: string,
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: FetchImpl,
): Promise<void> {
  const { base, headers } = webCall(env)
  const res = await fetchWithRetry(
    `${base}/api/intake/cancel`,
    { method: "POST", headers, body: JSON.stringify({ orderId }) },
    { system: "web-intake", retries: 4, baseDelayMs: 5_000, timeoutMs: 30_000, fetchImpl },
  )
  if (!res.ok) throw new Error(`intake cancel route answered HTTP ${res.status}`)
}

/** POST /api/intake/reminders once; the next tick is the retry. */
export async function postIntakeReminderRun(
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: FetchImpl,
): Promise<Record<string, unknown>> {
  const { base, headers } = webCall(env)
  const res = await fetchWithRetry(
    `${base}/api/intake/reminders`,
    { method: "POST", headers, body: "{}" },
    { system: "web-intake", retries: 0, timeoutMs: 120_000, fetchImpl },
  )
  if (!res.ok) throw new Error(`intake reminders route answered HTTP ${res.status}`)
  return (await res.json().catch(() => ({}))) as Record<string, unknown>
}
