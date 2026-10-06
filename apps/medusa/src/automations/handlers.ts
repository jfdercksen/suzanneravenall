/**
 * Queue handlers for the order automations (n8n migration steps 1 and 2).
 *
 *   thinkific_enrolment  - medusa-thinkific-enrollment.json in code
 *   course_access_email  - the buyer's "course access is ready" mail, sent by
 *                          the web app's React Email template
 *                          (POST /api/email/course-access)
 *   vtiger_order         - medusa-order-to-vtiger.json in code
 *
 * Handlers only hold logic; clients and the mail sender come in through
 * AutomationDeps so tests can mock them and dry runs can swap them.
 */

import {
  emptyEnrolmentState,
  enrolOrderInThinkific,
  maskEmail,
  orderValidForVtiger,
  parseOrderForThinkific,
  prepareOrderForVtiger,
  syncOrderToVtiger,
  THINKIFIC_ADMIN_URL,
  type EnrolmentState,
  type Logger,
  type OrderSnapshot,
  type OrderVtigerState,
  type ThinkificClient,
  type VtigerClient,
} from "@suzanne/integrations"
import { PermanentError, type AutomationHandler, type JobRecord } from "../modules/automations/queue"
import { COURSE_ACCESS_EMAIL, THINKIFIC_ENROLMENT, VTIGER_ORDER } from "./config"

export type CourseAccessMail = {
  email: string
  firstName: string
  courses: string[]
  orderId: string
  displayId: number | string | null
}

export type AutomationDeps = {
  thinkific: () => ThinkificClient
  vtiger: () => VtigerClient
  sendCourseAccessEmail: (mail: CourseAccessMail) => Promise<void>
  logger: Logger
}

export type OrderJobPayload = { order: OrderSnapshot }

function orderLabel(job: JobRecord): string {
  const order = (job.payload as Partial<OrderJobPayload>).order
  const display = order?.display_id !== undefined && order?.display_id !== null ? `#${order.display_id}` : ""
  return `${display} (${job.order_id ?? order?.id ?? "unknown order"})`.trim()
}

// ---------------------------------------------------------------------------
// Thinkific enrolment
// ---------------------------------------------------------------------------

export function thinkificEnrolmentHandler(deps: AutomationDeps): AutomationHandler {
  return {
    name: THINKIFIC_ENROLMENT,
    alertAfterAttempts: 3, // about 36 minutes of retries: a buyer is waiting
    async run(ctx) {
      const order = (ctx.payload as OrderJobPayload).order
      let parsed: ReturnType<typeof parseOrderForThinkific>
      try {
        parsed = parseOrderForThinkific(order)
      } catch (err) {
        throw new PermanentError(err instanceof Error ? err.message : String(err))
      }
      if (!parsed.hasCourseItems) return { result: { skipped: "no course items" } }

      const state = (ctx.state as EnrolmentState | null) ?? emptyEnrolmentState()
      const save = (s: EnrolmentState) => ctx.save(s as unknown as Record<string, unknown>)
      const outcome = await enrolOrderInThinkific(deps.thinkific(), parsed, state, { save })

      // Buyer mail for every course that is newly open (n8n: any success -> mail).
      const toMail = outcome.granted.filter((c) => !state.courses[c.courseId]?.emailed)
      if (toMail.length > 0) {
        const ids = toMail.map((c) => c.courseId).sort().join(",")
        await ctx.enqueue(COURSE_ACCESS_EMAIL, `${COURSE_ACCESS_EMAIL}:${order.id}:${ids}`, {
          mail: {
            email: parsed.email,
            firstName: parsed.firstName,
            courses: toMail.map((c) => c.title),
            orderId: order.id,
            displayId: order.display_id ?? null,
          } satisfies CourseAccessMail,
        })
        for (const c of toMail) state.courses[c.courseId] = { ...state.courses[c.courseId]!, emailed: true }
        await save(state)
      }

      // Courses a retry cannot fix: one staff alert (n8n: partial failure alert).
      const newlyFailed = outcome.failed.filter((c) => !state.courses[c.courseId]?.alerted)
      if (newlyFailed.length > 0) {
        await ctx.alert({
          key: "thinkific-enrolment",
          subject: `Thinkific enrolment partial failure - order ${orderLabel(ctx.job)}`,
          lines: [
            `Thinkific enrolment errors for order ${orderLabel(ctx.job)}.`,
            `Customer: ${maskEmail(parsed.email)} (full address on the order in Medusa admin).`,
            `Thinkific user ID: ${outcome.userId}`,
            "Failed enrolments:",
            ...newlyFailed.map((c) => `- Course ID ${c.courseId} (${c.title}): ${c.error}`),
            `Successful: ${outcome.granted.map((c) => c.title).join(", ") || "none"}`,
            `Please enrol the customer by hand for the failed course(s) in the Thinkific admin: ${THINKIFIC_ADMIN_URL}`,
          ],
        })
        for (const c of newlyFailed) state.courses[c.courseId] = { ...state.courses[c.courseId]!, alerted: true }
        await save(state)
      }

      if (outcome.retry.length > 0) {
        throw new Error(
          `${outcome.retry.length} course(s) not enrolled yet: ${outcome.retry.map((c) => `${c.courseId} (${c.error})`).join("; ")}`
        )
      }
      return {
        state: state as unknown as Record<string, unknown>,
        result: {
          thinkificUserId: outcome.userId,
          userCreated: outcome.userCreated,
          granted: outcome.granted.map((c) => c.courseId),
          failed: outcome.failed.map((c) => c.courseId),
        },
      }
    },
    describeFailure(job, error, final) {
      const state = (job.state as EnrolmentState | null) ?? emptyEnrolmentState()
      const order = (job.payload as Partial<OrderJobPayload>).order
      const items = order ? safeCourseItems(order) : []
      const open = items.filter((i) => {
        const s = state.courses[String(i.thinkific_course_id)]?.status
        return s !== "enrolled" && s !== "already"
      })
      return {
        key: "thinkific-enrolment",
        subject: final
          ? `Thinkific enrolment failed - order ${orderLabel(job)}`
          : `Thinkific enrolment still failing, retrying - order ${orderLabel(job)}`,
        lines: [
          final
            ? `Thinkific enrolment for order ${orderLabel(job)} gave up after ${job.attempts} attempt(s).`
            : `Thinkific enrolment for order ${orderLabel(job)} has failed ${job.attempts} times; the queue keeps retrying (after 30 min, 2 h and 12 h).`,
          `Error: ${error}`,
          `Thinkific user ID: ${state.userId ?? "not found or created yet"}`,
          `Courses not enrolled yet: ${open.map((i) => `${i.thinkific_course_id} (${i.title})`).join(", ") || "none"}`,
          final
            ? `Please enrol the customer by hand in the Thinkific admin: ${THINKIFIC_ADMIN_URL}`
            : "No action needed yet unless the buyer is waiting.",
        ],
      }
    },
  }
}

function safeCourseItems(order: OrderSnapshot) {
  try {
    return parseOrderForThinkific(order).courseItems
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Course-access mail
// ---------------------------------------------------------------------------

export function courseAccessEmailHandler(deps: AutomationDeps): AutomationHandler {
  return {
    name: COURSE_ACCESS_EMAIL,
    alertAfterAttempts: 3,
    async run(ctx) {
      const mail = (ctx.payload as { mail?: CourseAccessMail }).mail
      if (!mail?.email || !mail.courses?.length) throw new PermanentError("course-access mail job has no recipient or courses")
      await deps.sendCourseAccessEmail(mail)
      return { result: { sent: true, courses: mail.courses.length } }
    },
    describeFailure(job, error, final) {
      const mail = (job.payload as { mail?: CourseAccessMail }).mail
      const label = mail?.displayId ? `#${mail.displayId} (${mail.orderId})` : (mail?.orderId ?? job.order_id ?? "unknown")
      return {
        key: "course-access-email",
        subject: final
          ? `Course access mail not sent - order ${label}`
          : `Course access mail still failing, retrying - order ${label}`,
        lines: [
          `The buyer of order ${label} is enrolled in Thinkific but the "course access is ready" mail ${final ? "could not be sent" : `failed ${job.attempts} times`}.`,
          `Error: ${error}`,
          `Courses: ${(mail?.courses ?? []).join(", ")}`,
          final ? "Please let the buyer know their courses are open (reply to the order confirmation)." : "The queue keeps retrying.",
        ],
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Order to Vtiger
// ---------------------------------------------------------------------------

export function vtigerOrderHandler(deps: AutomationDeps): AutomationHandler {
  return {
    name: VTIGER_ORDER,
    alertAfterAttempts: 3,
    async run(ctx) {
      const order = (ctx.payload as OrderJobPayload).order
      // n8n "Validate: Required Fields": the false branch did nothing.
      if (!orderValidForVtiger(order)) return { result: { skipped: "no customer email or no total" } }
      const prep = prepareOrderForVtiger(order)
      const state = (ctx.state as OrderVtigerState | null) ?? {}
      const res = await syncOrderToVtiger(deps.vtiger(), prep, state, {
        save: (s) => ctx.save(s as unknown as Record<string, unknown>),
      })
      return { state: state as unknown as Record<string, unknown>, result: res }
    },
    describeFailure(job, error, final) {
      const state = (job.state as OrderVtigerState | null) ?? {}
      return {
        key: "vtiger-order",
        subject: final
          ? `Medusa to Vtiger sync failed - order ${orderLabel(job)}`
          : `Medusa to Vtiger sync still failing, retrying - order ${orderLabel(job)}`,
        lines: [
          `Medusa to Vtiger sync ${final ? "gave up" : "is still failing"} for order ${orderLabel(job)} after ${job.attempts} attempt(s).`,
          `Error: ${error}`,
          state.contactId
            ? `Contact step done (${state.contactId}): the order total is already in cf_total_spend_zar; only the purchase Event is missing.`
            : "Contact step not done: neither the contact nor the purchase Event was written.",
          final ? "Please add the purchase to the contact in Vtiger by hand." : "The queue keeps retrying.",
        ],
      }
    },
  }
}
