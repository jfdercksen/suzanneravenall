/**
 * Cart abandonment recovery (n8n migration step 4, plan section 3.4).
 *
 *   AUTOMATION_CART_RECOVERY  n8n (default) | code | off
 *   CART_RECOVERY_DELAYS      "1h,23h,48h" (default): reminder 1 after the
 *                             last cart activity, reminder 2 after reminder 1,
 *                             reminder 3 after reminder 2. Units s, m, h, d.
 *
 * n8n  - cart-updated.ts posts the cart to the n8n webhook as before.
 * code - cart-updated.ts upserts a cart_recovery row; jobs/cart-recovery.ts
 *        enqueues one outbox job per due reminder (cart_recovery_email), and
 *        the handler reads the cart in-process, then POSTs the web route
 *        /api/email/cart-abandonment (which re-checks the cart, the
 *        suppression list and its own sent-log before Brevo).
 * off  - nobody sends (rows are kept, queued jobs are held).
 *
 * MEDUSA AUTOMATION_DRY_RUN=true: code mode logs what it would store and
 * stores nothing; the job does nothing.
 */

import { randomUUID } from "node:crypto"
import {
  automationMode,
  fetchWithRetry,
  IntegrationError,
  maskEmail,
  type AutomationMode,
  type Logger,
} from "@suzanne/integrations"
import { PermanentError, type AutomationHandler, type AutomationQueue } from "../modules/automations/queue"
import type { CartRecoveryRecord, CartRecoveryStore } from "../modules/automations/cart-recovery-store"

export const CART_RECOVERY_EMAIL = "cart_recovery_email"

export type Template = 1 | 2 | 3

export function cartRecoveryMode(env: Record<string, string | undefined> = process.env): AutomationMode {
  return automationMode(["AUTOMATION_CART_RECOVERY"], "n8n", env)
}

// ---------------------------------------------------------------------------
// Delays and schedule
// ---------------------------------------------------------------------------

export const DEFAULT_DELAYS = "1h,23h,48h"
const UNIT_MS: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }

function parseDelayList(raw: string): [number, number, number] | null {
  const parts = raw.split(",").map((p) => p.trim().toLowerCase())
  if (parts.length !== 3) return null
  const out: number[] = []
  for (const part of parts) {
    const m = /^(\d+)([smhd])$/.exec(part)
    if (!m) return null
    const ms = Number(m[1]) * UNIT_MS[m[2]]
    if (!(ms > 0)) return null
    out.push(ms)
  }
  return out as [number, number, number]
}

/** [after last activity, after reminder 1, after reminder 2] in ms. A bad value falls back to the default with a warning. */
export function cartRecoveryDelays(env: Record<string, string | undefined> = process.env): [number, number, number] {
  const raw = (env.CART_RECOVERY_DELAYS ?? "").trim()
  if (raw) {
    const parsed = parseDelayList(raw)
    if (parsed) return parsed
    console.warn(`[cart-recovery] CART_RECOVERY_DELAYS="${raw}" is not three values like "1h,23h,48h"; using "${DEFAULT_DELAYS}"`)
  }
  return parseDelayList(DEFAULT_DELAYS) as [number, number, number]
}

/**
 * Every 10 minutes, or every minute when a delay is shorter than 10 minutes
 * (the time-compressed test), so a compressed run is not held up by the tick.
 * Read once when Medusa loads the job, so it follows the env of that start.
 */
export function cartRecoverySchedule(env: Record<string, string | undefined> = process.env): string {
  return Math.min(...cartRecoveryDelays(env)) < 10 * 60_000 ? "* * * * *" : "*/10 * * * *"
}

/** When the reminder after `template` is due, or null after the last one. */
export function nextSendAfter(template: Template, sentAt: Date, delays: [number, number, number]): Date | null {
  if (template === 3) return null
  return new Date(sentAt.getTime() + delays[template])
}

// ---------------------------------------------------------------------------
// The cart, read in-process through Query
// ---------------------------------------------------------------------------

export type QueryGraph = { graph(input: Record<string, unknown>): Promise<{ data: unknown[] }> }

/**
 * Customer and addresses are module links, not relations of the Cart module
 * (KI057: retrieveCart with relations ['customer'] threw on every call), so
 * the cart is always read through Query.
 */
export const CART_FIELDS = [
  "id",
  "email",
  "completed_at",
  "currency_code",
  "total",
  "items.*",
  "customer.first_name",
  "billing_address.first_name",
  "shipping_address.first_name",
]

export interface CartItem {
  id: string
  title: string
  variant_title?: string | null
  quantity: number | string
  unit_price: number | string
  thumbnail?: string | null
}

interface CartName {
  first_name?: string | null
}

export interface CartSnapshot {
  id: string
  email?: string | null
  completed_at?: string | Date | null
  customer?: CartName | null
  billing_address?: CartName | null
  shipping_address?: CartName | null
  items?: CartItem[] | null
  total?: number | string | null
  currency_code?: string | null
}

export async function loadCart(query: QueryGraph, cartId: string): Promise<CartSnapshot | null> {
  const { data } = await query.graph({ entity: "cart", fields: CART_FIELDS, filters: { id: cartId } })
  return (data[0] as CartSnapshot | undefined) ?? null
}

export function firstNameOf(cart: CartSnapshot): string {
  // Guest carts carry the name on the address, not on a customer record.
  return cart.customer?.first_name || cart.billing_address?.first_name || cart.shipping_address?.first_name || ""
}

function totalOf(cart: CartSnapshot, items: CartItem[]): number {
  const total = Number(cart.total)
  if (Number.isFinite(total) && cart.total !== null && cart.total !== undefined) return total
  // Totals are computed fields; fall back to the line sum if they were not returned.
  return items.reduce((sum, item) => sum + finiteOr(item.unit_price, 0) * finiteOr(item.quantity, 1), 0)
}

function siteUrl(env: Record<string, string | undefined>): string {
  return (env.NEXT_PUBLIC_SITE_URL ?? "https://suzanneravenall.com").replace(/\/$/, "")
}

/** Query may hand back numeric strings or BigNumber-like values; the route takes plain numbers only. */
function finiteOr(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** The body the n8n webhook and the web email route both take (template added for the route). */
export function cartPayload(cart: CartSnapshot, env: Record<string, string | undefined> = process.env) {
  const items = cart.items ?? []
  return {
    cartId: cart.id,
    email: cart.email ?? "",
    firstName: firstNameOf(cart),
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      variant_title: item.variant_title ?? undefined,
      quantity: finiteOr(item.quantity, 1),
      unit_price: finiteOr(item.unit_price, 0),
      thumbnail: item.thumbnail ?? undefined,
    })),
    total: totalOf(cart, items),
    currency: (cart.currency_code ?? "ZAR").toUpperCase(),
    cartUrl: `${siteUrl(env)}/checkout?cartId=${cart.id}`,
  }
}

/** Worth a reminder sequence: has an address to write to, is not ordered, is not empty. */
export function isRecoverable(cart: CartSnapshot | null): cart is CartSnapshot {
  return !!cart && !cart.completed_at && !!cart.email && (cart.items?.length ?? 0) > 0
}

// ---------------------------------------------------------------------------
// Subscriber side: record the activity
// ---------------------------------------------------------------------------

export async function recordCartActivity(
  store: CartRecoveryStore,
  cart: CartSnapshot,
  opts: { now?: Date; delays?: [number, number, number]; newId?: () => string } = {},
): Promise<{ record: CartRecoveryRecord; created: boolean }> {
  const now = opts.now ?? new Date()
  const delays = opts.delays ?? cartRecoveryDelays()
  return store.recordActivity({
    id: (opts.newId ?? newCartRecoveryId)(),
    cartId: cart.id,
    email: String(cart.email).trim(),
    firstName: firstNameOf(cart) || null,
    now,
    firstSendAt: new Date(now.getTime() + delays[0]),
  })
}

function newCartRecoveryId(): string {
  return `cartrec_${randomUUID().replace(/-/g, "")}`
}

// ---------------------------------------------------------------------------
// Job side: one outbox job per due reminder
// ---------------------------------------------------------------------------

export type ReminderJobPayload = { cartId: string; template: Template; dueAt: string }

/**
 * The due time is part of the key: a reminder whose time moved (new cart
 * activity before reminder 1) gets a fresh job, while the same due reminder
 * seen on every tick maps to one job.
 */
export function reminderKey(row: Pick<CartRecoveryRecord, "cart_id" | "step" | "next_send_at">): string {
  return `${CART_RECOVERY_EMAIL}:${row.cart_id}:${row.step + 1}:${row.next_send_at?.getTime() ?? 0}`
}

export type ScheduleCounts = { enqueued: number; pending: number; stopped: number }

export async function scheduleDueReminders(
  store: CartRecoveryStore,
  queue: Pick<AutomationQueue, "enqueueAndKick">,
  opts: { now?: Date; limit?: number; logger?: Logger } = {},
): Promise<ScheduleCounts> {
  const logger = opts.logger ?? console
  const now = opts.now ?? new Date()
  const counts: ScheduleCounts = { enqueued: 0, pending: 0, stopped: 0 }
  const due = await store.listDue(now, opts.limit ?? 100)
  for (const row of due) {
    const template = row.step + 1
    if (template > 3) {
      await store.finish(row.cart_id, "stopped", "sequence_done")
      counts.stopped += 1
      continue
    }
    const payload: ReminderJobPayload = {
      cartId: row.cart_id,
      template: template as Template,
      dueAt: (row.next_send_at ?? now).toISOString(),
    }
    const { job, created } = await queue.enqueueAndKick(CART_RECOVERY_EMAIL, reminderKey(row), payload)
    if (created) {
      counts.enqueued += 1
    } else if (job.status === "dead") {
      // The outbox gave up on this reminder (and alerted staff): end the sequence.
      await store.finish(row.cart_id, "stopped", "send_failed")
      counts.stopped += 1
    } else if (job.status === "done") {
      // The job ran but the row did not move on: never loop on it.
      logger.warn(`[cart-recovery] cart ${row.cart_id} reminder ${template} job is done but the row is still due; stopping`)
      await store.finish(row.cart_id, "stopped", "stale_job")
      counts.stopped += 1
    } else {
      counts.pending += 1 // still retrying in the outbox
    }
  }
  return counts
}

// ---------------------------------------------------------------------------
// The outbox handler: one reminder
// ---------------------------------------------------------------------------

/**
 * A reminder more than this late (Medusa down for a day, the flag flipped
 * from off to code over an old backlog) is not sent: "you left something
 * behind" weeks on reads as spam. Longer than the outbox's whole retry run
 * (about 15 h), so a reminder that is merely retrying still goes.
 */
export const MAX_LATE_MS = 24 * 3_600_000

export type ReminderSendResult = { sent: true; emailId?: string } | { sent: false; reason: string }

export type CartRecoveryDeps = {
  store: () => CartRecoveryStore
  loadCart: (cartId: string) => Promise<CartSnapshot | null>
  sendReminder: (body: ReturnType<typeof cartPayload> & { template: Template }) => Promise<ReminderSendResult>
  delays?: () => [number, number, number]
  now?: () => Date
  logger: Logger
}

export function cartRecoveryEmailHandler(deps: CartRecoveryDeps): AutomationHandler {
  const now = () => (deps.now ? deps.now() : new Date())
  return {
    name: CART_RECOVERY_EMAIL,
    async run(ctx) {
      const { cartId, template } = ctx.payload as Partial<ReminderJobPayload>
      if (!cartId || (template !== 1 && template !== 2 && template !== 3)) {
        throw new PermanentError("cart reminder job has no cart id or a bad template")
      }
      const store = deps.store()
      const row = await store.get(cartId)
      // The row moved on since the job was queued (sent, stopped, or new activity pushed reminder 1 out).
      if (!row || row.status !== "active" || row.step !== template - 1) return { result: { skipped: "row_moved" } }
      // New activity pushed the reminder out. This key is done; the new due time gets its own key (reminderKey).
      if (row.next_send_at && row.next_send_at.getTime() > now().getTime()) return { result: { skipped: "rescheduled" } }
      if (row.next_send_at && now().getTime() - row.next_send_at.getTime() > MAX_LATE_MS) {
        await store.finish(cartId, "stopped", "too_late")
        return { result: { skipped: "too_late" } }
      }

      const cart = await deps.loadCart(cartId) // a Query failure throws: the outbox retries
      if (!cart) {
        await store.finish(cartId, "stopped", "cart_not_found")
        return { result: { skipped: "cart_not_found" } }
      }
      if (cart.completed_at) {
        await store.finish(cartId, "completed", "cart_completed")
        return { result: { skipped: "cart_completed" } }
      }
      if ((cart.items?.length ?? 0) === 0) {
        // Reopened by recordActivity when the cart fills up again.
        await store.finish(cartId, "stopped", "cart_empty")
        return { result: { skipped: "cart_empty" } }
      }

      const body = { ...cartPayload(cart), email: cart.email || row.email, firstName: firstNameOf(cart) || row.first_name || "", template }
      const res = await deps.sendReminder(body)

      const skipReason = "reason" in res ? res.reason : null
      if (skipReason !== null) {
        switch (skipReason) {
          case "already_sent":
            break // n8n (or an earlier attempt) sent this one: carry on with the sequence
          case "cart_completed":
            await store.finish(cartId, "completed", skipReason)
            return { result: { skipped: skipReason } }
          case "cart_unknown":
            // The route could not read the cart from the store API: try again later.
            throw new Error("web route could not read the cart status (cart_unknown)")
          default:
            // cart_not_found, unsubscribed, or anything new: never chase this cart again.
            await store.finish(cartId, "stopped", skipReason)
            return { result: { skipped: skipReason } }
        }
      }

      const delays = deps.delays ? deps.delays() : cartRecoveryDelays()
      const next = nextSendAfter(template, now(), delays)
      await store.markSent(cartId, template, next)
      deps.logger.info(
        `[cart-recovery] cart ${cartId} reminder ${template} ${skipReason ? "already sent" : "sent"} to ${maskEmail(body.email)}; ` +
          (next ? `next due ${next.toISOString()}` : "sequence done")
      )
      return { result: { template, sent: skipReason === null, emailId: "emailId" in res ? (res.emailId ?? null) : null } }
    },
    describeFailure(job, error, final) {
      const { cartId, template } = job.payload as Partial<ReminderJobPayload>
      return {
        key: "cart-recovery-email",
        subject: final
          ? `Cart reminder ${template ?? "?"} not sent - cart ${cartId ?? "unknown"}`
          : `Cart reminder ${template ?? "?"} still failing, retrying - cart ${cartId ?? "unknown"}`,
        lines: [
          `Abandoned-cart reminder ${template ?? "?"} for cart ${cartId ?? "unknown"} ${final ? `gave up after ${job.attempts} attempt(s); the sequence for this cart is stopped` : `has failed ${job.attempts} times`}.`,
          `Error: ${error}`,
          "No action is needed for the customer. Check the medusa and web logs if this repeats for many carts.",
        ],
      }
    },
  }
}

/**
 * POST /api/email/cart-abandonment on the web app. Same secret header as the
 * course-access call. The route answers { emailId } on a send and
 * { skipped: true, reason } when it decided not to send.
 */
export async function sendCartReminderViaWeb(
  body: Record<string, unknown>,
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<ReminderSendResult> {
  const base = (env.WEB_BASE_URL || "http://web:3000").replace(/\/$/, "")
  const secret = env.INTERNAL_WEBHOOK_SECRET || env.N8N_WEBHOOK_SECRET || ""
  if (!secret) throw new PermanentError("INTERNAL_WEBHOOK_SECRET and N8N_WEBHOOK_SECRET are unset on medusa")
  const res = await fetchWithRetry(
    `${base}/api/email/cart-abandonment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { "x-webhook-secret": secret } : {}) },
      body: JSON.stringify(body),
    },
    { system: "web-email", retries: 1, timeoutMs: 15_000, fetchImpl }
  )
  if (!res.ok) {
    throw new IntegrationError(`cart-abandonment mail route answered HTTP ${res.status}`, {
      system: "web-email",
      status: res.status,
      // 401/400 need a config or code fix; 5xx (Brevo or the sent-log down) is worth retrying.
      retriable: res.status >= 500,
    })
  }
  const json = (await res.json().catch(() => ({}))) as { emailId?: unknown; skipped?: unknown; reason?: unknown }
  if (json.skipped === true) return { sent: false, reason: typeof json.reason === "string" ? json.reason : "skipped" }
  return { sent: true, emailId: typeof json.emailId === "string" ? json.emailId : undefined }
}
