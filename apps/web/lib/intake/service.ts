import { randomBytes } from 'crypto'
import { logError } from '@/lib/log'
import { sendStaffAlert } from '@/lib/integrations/staff-alert'
import { sendIntakeCompletedEmail, sendIntakeRequestEmail } from '@/lib/email/intake'
import { orderVariantTitles } from '@/lib/medusa/order-variant-titles'
import { chooseForm, fetchIntakeForm, fetchIntakeForms, serviceIntroduction } from './forms'
import { firstReminderAt, linkExpiresAt, nextReminderAt, reminderDelays } from './schedule'
import * as store from './store'
import { validateSubmission, type IntakeSubmission } from './validate'
import type { IntakeForm, IntakeRecord } from './types'

/**
 * Intake forms (H-12), the three moments:
 *  - an order with a private session  -> createIntakesForOrder (POST /api/intake/orders, from Medusa)
 *  - the hourly run                    -> runIntakeReminders   (POST /api/intake/reminders, from Medusa)
 *  - the client sends the form         -> submitIntake          (POST /api/intake/submit, from the page)
 * Dependencies are injectable so the tests run without Supabase, Payload or Brevo.
 *
 * Every mail is claimed in the database before it goes and given back if
 * Brevo refuses it (store.ts), so overlapping callers (the order route and
 * the hourly sweep, the submit route and the hourly retry) never send one
 * mail twice. A row whose mails fail MAX_SEND_FAILURES times is left alone
 * and staff get one alert, so a bad address never crowds out the rest.
 */

export interface IntakeDeps {
  store: typeof store
  loadForms: () => Promise<IntakeForm[]>
  loadForm: (id: string) => Promise<IntakeForm | null>
  /** Variant titles per product handle for an order; empty when Medusa cannot be read. */
  loadVariantTitles: (orderId: string) => Promise<Map<string, string[]>>
  sendRequest: typeof sendIntakeRequestEmail
  sendCompleted: typeof sendIntakeCompletedEmail
  alert: (input: { key: string; subject: string; lines: string[] }) => Promise<unknown>
  newToken: () => string
  delays: () => number[]
  now: () => Date
}

export const defaultDeps: IntakeDeps = {
  store,
  loadForms: () => fetchIntakeForms(),
  loadForm: (id) => fetchIntakeForm(id),
  loadVariantTitles: (orderId) => orderVariantTitles(orderId),
  sendRequest: sendIntakeRequestEmail,
  sendCompleted: sendIntakeCompletedEmail,
  alert: (input) => sendStaffAlert(input),
  newToken: () => randomBytes(32).toString('base64url'),
  delays: () => reminderDelays(),
  now: () => new Date(),
}

/** 32 random bytes in base64url: exactly 43 characters. */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

/** Counts a failed send; at the cap, staff are told once (POPIA: order id only). */
async function noteFailure(record: IntakeRecord, what: string, err: unknown, deps: IntakeDeps): Promise<void> {
  logError(`[intake] ${what} failed for order ${record.order_id}`, err, { orderId: record.order_id })
  const failures = await deps.store.recordSendFailure(record.id, record.send_failures ?? 0).catch(() => 0)
  if (failures === store.MAX_SEND_FAILURES) {
    await deps
      .alert({
        key: `intake-failed:${record.id}`,
        subject: 'An intake form mail keeps failing',
        lines: [
          `Order: ${record.order_display_id ? `#${record.order_display_id}` : record.order_id}`,
          `Service: ${record.service_name}`,
          `Mail: ${what}, failed ${failures} times; no further tries.`,
          'Check the address on the order and send the client the form by hand if needed.',
        ],
      })
      .catch(() => undefined)
  }
}

// ---------------------------------------------------------------------------
// Order -> intake records + first mail
// ---------------------------------------------------------------------------

const IN_PERSON_RE = /\bin[\s-]?person\b/i

/**
 * In-person when every variant bought of the service says so ("90 min
 * in-person"). Unknown (no titles, Medusa not readable) counts as online, so
 * the client still gets the Zoom link.
 */
export function isInPerson(titles: string[] | undefined): boolean {
  return Boolean(titles && titles.length > 0 && titles.every((t) => IN_PERSON_RE.test(t)))
}

export interface OrderLine {
  handle: string
  title: string
  /** The line is a private session by the order mail's product-type rule. */
  session: boolean
}

export interface OrderIntakeInput {
  orderId: string
  displayId: string | null
  email: string
  firstName: string | null
  lastName: string | null
  /** When the order was placed; the reminders count from here. Defaults to now. */
  placedAt?: Date | null
  lines: OrderLine[]
}

export interface OrderIntakeResult {
  records: { serviceKey: string; formKey: string; created: boolean; mailed: boolean }[]
  /** Mails that failed, plus session lines with no form to send. > 0 means the route answers 5xx. */
  failed: number
}

/**
 * One record per service in the order (several sessions of one service, or a
 * package, share one form), then the first mail for every record that has
 * not had it. Safe to call again for the same order: the (order, service) key
 * holds, and only an unsent mail goes out.
 */
export async function createIntakesForOrder(input: OrderIntakeInput, deps: IntakeDeps = defaultDeps): Promise<OrderIntakeResult> {
  const result: OrderIntakeResult = { records: [], failed: 0 }
  const byHandle = new Map<string, OrderLine>()
  for (const line of input.lines) {
    const existing = byHandle.get(line.handle)
    byHandle.set(line.handle, existing ? { ...existing, session: existing.session || line.session } : line)
  }
  if (byHandle.size === 0) return result

  const forms = await deps.loadForms()
  // Unknown counts as online (the client gets the Zoom link): a Medusa hiccup
  // must never hold back the intake mail itself.
  const variantTitles = await deps.loadVariantTitles(input.orderId).catch(() => new Map<string, string[]>())
  const now = deps.now()
  const placedAt = input.placedAt && input.placedAt.getTime() <= now.getTime() ? input.placedAt : now
  const delays = deps.delays()

  for (const line of byHandle.values()) {
    const choice = chooseForm(forms, line)
    if (!choice) {
      if (line.session) {
        // A private session with no form to send: the client would silently get nothing.
        result.failed += 1
        logError(`[intake] no active form (and no default form) for session product ${line.handle}, order ${input.orderId}`)
      }
      continue
    }
    const { record, created } = await deps.store.upsertIntakeRecord({
      token: deps.newToken(),
      order_id: input.orderId,
      order_display_id: input.displayId,
      customer_email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      service_key: line.handle,
      service_name: choice.serviceName,
      form_id: choice.form.id,
      form_key: choice.form.formKey,
      purchased_at: placedAt.toISOString(),
      in_person: isInPerson(variantTitles.get(line.handle)),
      next_reminder_at: firstReminderAt(placedAt, delays).toISOString(),
      expires_at: linkExpiresAt(placedAt).toISOString(),
    })

    let mailed = record.intake_sent_at !== null
    if (!mailed && record.status === 'pending' && (record.send_failures ?? 0) < store.MAX_SEND_FAILURES) {
      if (await deps.store.claimIntakeSend(record.id, deps.now())) {
        try {
          await deps.sendRequest(record, 0)
          mailed = true
        } catch (err) {
          result.failed += 1
          await deps.store.releaseIntakeSend(record.id)
          await noteFailure(record, 'the first intake mail', err, deps)
        }
      }
    }
    result.records.push({ serviceKey: line.handle, formKey: choice.form.formKey, created, mailed })
  }
  return result
}

/** The order was cancelled: its open forms close and their reminders stop. */
export async function cancelIntakesForOrder(orderId: string, deps: IntakeDeps = defaultDeps): Promise<number> {
  return deps.store.cancelOrderIntakes(orderId, deps.now())
}

// ---------------------------------------------------------------------------
// The hourly run
// ---------------------------------------------------------------------------

export interface ReminderRunResult {
  firstMails: number
  reminders: number
  teamMails: number
  failed: number
  skipped: number
}

/** A first mail is left to the order route for this long before the hourly run retries it. */
export const UNSENT_GRACE_MS = 10 * 60_000
/** A completed form's team mail is left to the submit route for this long. */
export const TEAM_GRACE_MS = 5 * 60_000

function purchaseTime(record: IntakeRecord): Date {
  return new Date(record.purchased_at ?? record.created_at)
}

export async function runIntakeReminders(deps: IntakeDeps = defaultDeps): Promise<ReminderRunResult> {
  const out: ReminderRunResult = { firstMails: 0, reminders: 0, teamMails: 0, failed: 0, skipped: 0 }
  const now = deps.now()
  const delays = deps.delays()

  // 1. First mails that never went.
  for (const record of await deps.store.listUnsentIntakes(new Date(now.getTime() - UNSENT_GRACE_MS), now)) {
    if (!(await deps.store.claimIntakeSend(record.id, deps.now()))) {
      out.skipped += 1
      continue
    }
    try {
      await deps.sendRequest(record, 0)
      out.firstMails += 1
    } catch (err) {
      out.failed += 1
      await deps.store.releaseIntakeSend(record.id)
      await noteFailure(record, 'the retried first intake mail', err, deps)
    }
  }

  // 2. Reminders that are due: day 1, 3, 5, then every 3 days, at most 6.
  for (const record of await deps.store.listDueReminders(now)) {
    const n = record.reminders_sent + 1
    if (n > delays.length) {
      // The schedule was shortened under a running sequence: end it.
      await deps.store.endReminders(record.id)
      out.skipped += 1
      continue
    }
    const next = nextReminderAt(purchaseTime(record), n, now, delays)
    if (!(await deps.store.claimReminder(record.id, n, next, now))) {
      out.skipped += 1 // completed meanwhile, or another run took this reminder
      continue
    }
    try {
      await deps.sendRequest(record, n)
      out.reminders += 1
    } catch (err) {
      out.failed += 1
      await deps.store.releaseReminder(record.id, n, record.next_reminder_at, record.last_reminder_at)
      await noteFailure(record, `intake reminder ${n}`, err, deps)
    }
  }

  // 3. Completed forms whose team mail did not go.
  for (const record of await deps.store.listTeamPending(new Date(now.getTime() - TEAM_GRACE_MS))) {
    if (!(await deps.store.claimTeamNotify(record.id, deps.now()))) {
      out.skipped += 1
      continue
    }
    try {
      const form = await deps.loadForm(record.form_id).catch(() => null)
      await deps.sendCompleted(record, form)
      out.teamMails += 1
    } catch (err) {
      out.failed += 1
      await deps.store.releaseTeamNotify(record.id)
      await noteFailure(record, 'the completed form to the team', err, deps)
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// The page and the submit
// ---------------------------------------------------------------------------

export type IntakePageState =
  | { state: 'not_found' }
  | { state: 'completed'; serviceName: string }
  | { state: 'expired'; serviceName: string }
  | { state: 'unavailable' }
  | { state: 'open'; record: IntakeRecord; form: IntakeForm; introduction: string | null }

function isExpired(record: IntakeRecord, now: Date): boolean {
  return new Date(record.expires_at).getTime() <= now.getTime()
}

/**
 * The form a record is answered against: the one it was sent, else (deleted
 * in the CMS meanwhile) whatever form now covers its service.
 */
async function formFor(record: IntakeRecord, deps: IntakeDeps): Promise<IntakeForm | null> {
  const form = await deps.loadForm(record.form_id)
  if (form) return form
  const choice = chooseForm(await deps.loadForms(), { handle: record.service_key, title: record.service_name, session: true })
  return choice?.form ?? null
}

export async function loadIntakePage(token: string, deps: IntakeDeps = defaultDeps): Promise<IntakePageState> {
  if (!TOKEN_RE.test(token)) return { state: 'not_found' }
  try {
    const record = await deps.store.getIntakeByToken(token)
    if (!record) return { state: 'not_found' }
    if (record.status === 'completed') return { state: 'completed', serviceName: record.service_name }
    // A cancelled order's form is closed: same message as an expired link.
    if (record.status === 'cancelled' || isExpired(record, deps.now())) return { state: 'expired', serviceName: record.service_name }
    const form = await formFor(record, deps)
    if (!form) return { state: 'unavailable' }
    return { state: 'open', record, form, introduction: serviceIntroduction(form, record.service_key) }
  } catch (err) {
    logError('[intake] page could not load', err)
    return { state: 'unavailable' }
  }
}

export type SubmitResult =
  | { status: 'completed' }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'not_found' | 'already_completed' | 'expired' | 'unavailable' }

export async function submitIntake(token: string, submission: IntakeSubmission, deps: IntakeDeps = defaultDeps): Promise<SubmitResult> {
  if (!TOKEN_RE.test(token)) return { status: 'not_found' }
  const record = await deps.store.getIntakeByToken(token)
  if (!record) return { status: 'not_found' }
  if (record.status === 'completed') return { status: 'already_completed' }
  const now = deps.now()
  if (record.status === 'cancelled' || isExpired(record, now)) return { status: 'expired' }

  const form = await formFor(record, deps)
  if (!form) return { status: 'unavailable' }

  const checked = validateSubmission(form, submission)
  if (!checked.ok) return { status: 'invalid', errors: checked.errors }

  const completed = await deps.store.completeIntake(token, checked.answers, now)
  if (!completed) return { status: 'already_completed' }

  // The answers are saved; the team mail is best effort here and retried by the hourly run.
  try {
    if (await deps.store.claimTeamNotify(completed.id, deps.now())) {
      try {
        await deps.sendCompleted(completed, form)
      } catch (err) {
        await deps.store.releaseTeamNotify(completed.id)
        throw err
      }
    }
  } catch (err) {
    logError(`[intake] team mail failed for order ${completed.order_id}; the hourly run retries it`, err, {
      orderId: completed.order_id,
    })
  }
  return { status: 'completed' }
}
