import { IntegrationError } from './http'
import { orderBuyer, type OrderItemSnapshot, type OrderSnapshot } from './orders'
import { ThinkificError, type ThinkificClient } from './thinkific'

/**
 * Order -> Thinkific enrolment, ported from
 * infra/n8n/workflows/medusa-thinkific-enrollment.json (as fixed for KI045,
 * KI047, KI049, KI053 and the name fallback; proven on orders #6 and #14).
 *
 * Same steps: buyer from the order, course ids from
 * item.variant.product.metadata.thinkific_course_id, find the Thinkific user
 * by email or create it (send_welcome_email: true), enrol per course with one
 * activated_at, isolated per-course failures.
 *
 * Added for the retry queue: progress is kept in `state`, which the caller
 * persists after every step, and each course is checked for an existing
 * enrolment before it is POSTed, so a retry or a replayed order never enrols
 * twice. Differences from n8n are listed in packages/integrations/README.md.
 */

export type CourseItem = { thinkific_course_id: number; title: string }

/** n8n "Parse: Order + Extract Course IDs", without the secret check (no HTTP hop any more). */
export function parseOrderForThinkific(order: OrderSnapshot) {
  const { email, firstName, lastName } = orderBuyer(order)
  if (!email) throw new Error('Order payload missing customer.email - cannot enroll')

  const courseItems: CourseItem[] = []
  for (const item of order.items ?? []) {
    const courseId = itemCourseId(item)
    if (courseId != null) {
      const productTitle = item?.variant?.product?.title ?? item?.title ?? 'Course'
      const format = item?.variant?.title
      const title = format && format !== 'Standard' && format !== 'Default' ? `${productTitle} (${format})` : productTitle
      courseItems.push({ thinkific_course_id: Number(courseId), title })
    }
  }

  return {
    orderId: order.id,
    email,
    firstName,
    lastName,
    courseItems,
    hasCourseItems: courseItems.length > 0,
  }
}

export type ParsedThinkificOrder = ReturnType<typeof parseOrderForThinkific>

/**
 * The Thinkific course for one line item. A programme sold in several formats
 * (Live via Zoom, Live Retaker, Self Study) is one product whose formats are
 * separate Thinkific courses, so the variant's own id wins; the product id is
 * the fallback for single-format products.
 */
export function itemCourseId(item: OrderItemSnapshot | null | undefined): string | null {
  for (const id of [item?.variant?.metadata?.thinkific_course_id, item?.variant?.product?.metadata?.thinkific_course_id]) {
    if (id != null && String(id).trim() !== '') return String(id).trim()
  }
  return null
}

/** True when the order has at least one line item with a Thinkific course id. */
export function orderHasCourses(order: OrderSnapshot): boolean {
  return (order.items ?? []).some((item) => itemCourseId(item) != null)
}

export type CourseStatus =
  /** Enrolled by us. */
  | 'enrolled'
  /** Thinkific already had an active enrolment (a retry, or a repeat purchase). */
  | 'already'
  /** Failed in a way a retry cannot fix (4xx, bad course id). Needs a human. */
  | 'failed'
  /** Failed in a way a retry may fix (timeout, 5xx, 429). */
  | 'retry'

export type CourseState = {
  title: string
  status: CourseStatus
  error?: string
  /** The buyer's course-access mail has been queued for this course. */
  emailed?: boolean
  /** Staff have been alerted about this course. */
  alerted?: boolean
}

export type EnrolmentState = {
  userId?: number | string
  userCreated?: boolean
  /** One timestamp for every course, like the n8n "Build Tasks" node. */
  activatedAt?: string
  courses: Record<string, CourseState>
}

export function emptyEnrolmentState(): EnrolmentState {
  return { courses: {} }
}

export type EnrolmentOutcome = {
  userId: number | string
  userCreated: boolean
  /** Courses the buyer can now open (enrolled or already enrolled). */
  granted: Array<{ courseId: string; title: string }>
  failed: Array<{ courseId: string; title: string; error: string }>
  retry: Array<{ courseId: string; title: string; error: string }>
}

function errorText(err: unknown): string {
  if (err instanceof ThinkificError) return `${err.message}${err.detail ? `: ${err.detail}` : ''}`
  return err instanceof Error ? err.message : String(err)
}

function isRetriable(err: unknown): boolean {
  return err instanceof IntegrationError ? err.retriable : true
}

/**
 * Finds or creates the Thinkific user, then enrols every course that is not
 * yet enrolled. Calls `save(state)` after each step. Throws only when the
 * user cannot be found or created (the n8n "fatal" branch); per-course
 * failures are recorded in the state and the returned outcome.
 */
export async function enrolOrderInThinkific(
  client: ThinkificClient,
  parsed: ParsedThinkificOrder,
  state: EnrolmentState,
  opts: { now?: () => Date; save?: (state: EnrolmentState) => Promise<void> } = {},
): Promise<EnrolmentOutcome> {
  const now = opts.now ?? (() => new Date())
  const save = opts.save ?? (async () => {})

  // 1. Find or create the user (n8n: Find User -> IF -> Create User).
  if (state.userId === undefined || state.userId === null) {
    let user = await client.findUserByEmail(parsed.email)
    let created = false
    if (!user) {
      try {
        user = await client.createUser({ firstName: parsed.firstName, lastName: parsed.lastName, email: parsed.email })
        created = true
      } catch (err) {
        // A concurrent run or an earlier attempt may have created the user
        // between our lookup and the POST: Thinkific answers 422 then.
        if (err instanceof ThinkificError && err.status === 422) {
          user = await client.findUserByEmail(parsed.email)
          if (!user) throw err
        } else {
          throw err
        }
      }
    }
    state.userId = user.id
    state.userCreated = created
    await save(state)
  }
  const userId = state.userId as number | string

  // 2. One activated_at for all courses (n8n "Merge: Resolve User ID + Build Tasks").
  if (!state.activatedAt) {
    state.activatedAt = now().toISOString()
    await save(state)
  }

  // 3. Enrol per course, isolated failures (n8n "Enroll: Per Course").
  for (const item of parsed.courseItems) {
    const key = String(item.thinkific_course_id)
    const current = state.courses[key]
    if (current && (current.status === 'enrolled' || current.status === 'already' || current.status === 'failed')) continue

    let next: CourseState
    if (!Number.isFinite(item.thinkific_course_id)) {
      next = { title: item.title, status: 'failed', error: 'thinkific_course_id is not a number' }
    } else {
      try {
        const existing = await client.findEnrolment(userId, item.thinkific_course_id)
        if (existing && !existing.expired) {
          next = { title: item.title, status: 'already' }
        } else {
          await client.enrol(userId, item.thinkific_course_id, state.activatedAt)
          next = { title: item.title, status: 'enrolled' }
        }
      } catch (err) {
        next = { title: item.title, status: isRetriable(err) ? 'retry' : 'failed', error: errorText(err).slice(0, 400) }
      }
    }
    state.courses[key] = { ...current, ...next }
    await save(state)
  }

  const outcome: EnrolmentOutcome = { userId, userCreated: state.userCreated ?? false, granted: [], failed: [], retry: [] }
  for (const [courseId, c] of Object.entries(state.courses)) {
    if (c.status === 'enrolled' || c.status === 'already') outcome.granted.push({ courseId, title: c.title })
    else if (c.status === 'failed') outcome.failed.push({ courseId, title: c.title, error: c.error ?? '' })
    else outcome.retry.push({ courseId, title: c.title, error: c.error ?? '' })
  }
  return outcome
}

/** n8n "Prepare: Confirmation Email" subject. */
export function courseAccessSubject(titles: string[]): string {
  return `Your course access is ready - ${titles.join(', ')}`
}

/** Where the buyer opens their courses (the n8n mail's link). */
export const THINKIFIC_COURSES_URL = 'https://ravenallinstitute-9629.thinkific.com/collections'
/** Thinkific admin, for staff alerts. */
export const THINKIFIC_ADMIN_URL = 'https://ravenallinstitute-9629.thinkific.com'
