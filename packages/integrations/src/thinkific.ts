import { fetchWithRetry, IntegrationError, type FetchLike } from './http'
import { fakeId, isDryRun, maskEmail, type Logger } from './dry-run'

/**
 * Thinkific public API client (https://api.thinkific.com/api/public/v1).
 *
 * Auth: `Authorization: Bearer <THINKIFIC_API_KEY>`, the same header the n8n
 * workflow sent (the key is an API access token with scope write:all, KI041).
 *
 * Every call goes through fetchWithRetry: per-attempt timeout, retries on
 * network errors, 429 and 5xx with backoff. Any other 4xx is thrown at once
 * as a ThinkificError with `retriable: false`.
 *
 * Dry run (AUTOMATION_DRY_RUN=true, or dryRun: true): no network at all.
 * Lookups find nothing, writes log what they would send (email masked) and
 * return fake ids.
 */

export const THINKIFIC_API_BASE = 'https://api.thinkific.com/api/public/v1'

export type ThinkificUser = { id: number | string; email?: string; first_name?: string; last_name?: string }

export type ThinkificEnrolment = {
  id: number | string
  user_id: number | string
  course_id: number | string
  expired?: boolean
  activated_at?: string | null
  expiry_date?: string | null
}

export type ThinkificClientOptions = {
  apiKey: string
  baseUrl?: string
  dryRun?: boolean
  fetchImpl?: FetchLike
  timeoutMs?: number
  retries?: number
  baseDelayMs?: number
  sleep?: (ms: number) => Promise<void>
  logger?: Logger
}

export class ThinkificError extends IntegrationError {
  /** First 300 characters of the response body, for logs and alerts (no secrets in it). */
  readonly detail: string

  constructor(message: string, status: number | null, detail = '', retriable = false) {
    super(message, { system: 'thinkific', status, code: status ? `HTTP_${status}` : 'BAD_RESPONSE', retriable })
    this.name = 'ThinkificError'
    this.detail = detail
  }
}

export class ThinkificClient {
  readonly dryRun: boolean
  private readonly opts: ThinkificClientOptions
  private readonly base: string
  private readonly logger: Logger

  constructor(opts: ThinkificClientOptions) {
    this.opts = opts
    this.dryRun = opts.dryRun ?? false
    this.base = (opts.baseUrl ?? THINKIFIC_API_BASE).replace(/\/+$/, '')
    this.logger = opts.logger ?? console
  }

  /** Reads THINKIFIC_API_KEY. Throws when it is missing outside dry run. */
  static fromEnv(
    env: Record<string, string | undefined> = process.env,
    overrides: Partial<ThinkificClientOptions> = {},
  ): ThinkificClient {
    const dryRun = overrides.dryRun ?? isDryRun(env)
    const apiKey = (env.THINKIFIC_API_KEY ?? '').trim()
    if (!apiKey && !dryRun) {
      throw new ThinkificError('Thinkific is not configured (THINKIFIC_API_KEY)', null)
    }
    return new ThinkificClient({ apiKey: apiKey || 'dry-run', ...overrides, dryRun })
  }

  /** n8n "Thinkific: Find User": GET /users?query[email]=. Returns the user whose email matches, or null. */
  async findUserByEmail(email: string): Promise<ThinkificUser | null> {
    if (this.dryRun) {
      this.logger.info(`[thinkific:dry-run] find user ${maskEmail(email)} -> none`)
      return null
    }
    const body = (await this.request('GET', '/users', { 'query[email]': email })) as { items?: ThinkificUser[] }
    const items = Array.isArray(body?.items) ? body.items : []
    const wanted = email.toLowerCase()
    return items.find((u) => (u.email ?? '').toLowerCase() === wanted) ?? null
  }

  /** n8n "Thinkific: Create User": same body, including send_welcome_email: true. */
  async createUser(input: { firstName: string; lastName: string; email: string }): Promise<ThinkificUser> {
    const body = {
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      send_welcome_email: true,
    }
    if (this.dryRun) {
      const id = fakeId('thinkific-user')
      this.logger.info(`[thinkific:dry-run] create user ${JSON.stringify({ ...body, email: maskEmail(body.email) })} -> ${id}`)
      return { id, email: input.email }
    }
    const user = (await this.request('POST', '/users', undefined, body)) as ThinkificUser
    if (!user || user.id === undefined || user.id === null) {
      throw new ThinkificError('Thinkific user creation did not return an id', null)
    }
    return user
  }

  /** The user's enrolment in one course, or null. Used before enrolling so a retry never enrols twice. */
  async findEnrolment(userId: number | string, courseId: number | string): Promise<ThinkificEnrolment | null> {
    if (this.dryRun) {
      this.logger.info(`[thinkific:dry-run] find enrolment user=${userId} course=${courseId} -> none`)
      return null
    }
    const body = (await this.request('GET', '/enrollments', {
      'query[user_id]': String(userId),
      'query[course_id]': String(courseId),
    })) as { items?: ThinkificEnrolment[] }
    const items = Array.isArray(body?.items) ? body.items : []
    return (
      items.find((e) => String(e.user_id) === String(userId) && String(e.course_id) === String(courseId)) ?? null
    )
  }

  /** n8n "Enroll: Per Course": POST /enrollments { course_id, user_id, activated_at }. */
  async enrol(userId: number | string, courseId: number, activatedAt: string): Promise<ThinkificEnrolment> {
    const body = { course_id: courseId, user_id: userId, activated_at: activatedAt }
    if (this.dryRun) {
      const id = fakeId('thinkific-enrolment')
      this.logger.info(`[thinkific:dry-run] enrol ${JSON.stringify(body)} -> ${id}`)
      return { id, user_id: userId, course_id: courseId }
    }
    return (await this.request('POST', '/enrollments', undefined, body)) as ThinkificEnrolment
  }

  // -------------------------------------------------------------------------

  private async request(
    method: 'GET' | 'POST',
    path: string,
    query?: Record<string, string>,
    body?: unknown,
  ): Promise<unknown> {
    const qs = query ? `?${new URLSearchParams(query).toString()}` : ''
    const res = await fetchWithRetry(
      `${this.base}${path}${qs}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${this.opts.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
      {
        system: 'thinkific',
        retries: this.opts.retries,
        baseDelayMs: this.opts.baseDelayMs,
        timeoutMs: this.opts.timeoutMs,
        fetchImpl: this.opts.fetchImpl,
        sleep: this.opts.sleep,
      },
    )

    const text = await res.text().catch(() => '')
    if (!res.ok) {
      throw new ThinkificError(`Thinkific ${method} ${path}: HTTP ${res.status}`, res.status, text.slice(0, 300))
    }
    if (!text) return {}
    try {
      return JSON.parse(text) as unknown
    } catch {
      throw new ThinkificError(`Thinkific ${method} ${path}: response was not JSON`, res.status, text.slice(0, 300))
    }
  }
}
