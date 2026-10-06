import { createHash } from 'node:crypto'
import { fetchWithRetry, IntegrationError, type FetchLike } from './http'
import { fakeId, isDryRun, maskEmails, type Logger } from './dry-run'

/**
 * Vtiger webservice client (Vtiger 7/8, /webservice.php).
 *
 * Login: getchallenge -> md5(token + accessKey) -> login. The session and the
 * webservice user's id (needed as assigned_user_id on every record, KI054 b)
 * are cached and shared by concurrent callers; on INVALID_SESSIONID or
 * AUTHENTICATION_REQUIRED the client logs in again once and repeats the call.
 *
 * Every HTTP call goes through fetchWithRetry: per-attempt timeout, retries on
 * network errors, 429 and 5xx with backoff.
 *
 * Dry run (AUTOMATION_DRY_RUN=true, or dryRun: true): no network at all.
 * Writes log the element they would send (emails masked) and return a fake
 * id; queries return no rows, so an upsert takes the "create" branch.
 */

export type VtigerConfig = {
  url: string
  username: string
  accessKey: string
}

export type VtigerClientOptions = VtigerConfig & {
  dryRun?: boolean
  fetchImpl?: FetchLike
  timeoutMs?: number
  retries?: number
  baseDelayMs?: number
  sleep?: (ms: number) => Promise<void>
  logger?: Logger
  /** How long a cached session is trusted before logging in again. */
  sessionTtlMs?: number
  now?: () => number
}

export type VtigerRecord = { id: string } & Record<string, unknown>

type Session = { sessionName: string; userId: string; expiresAt: number }

type CallOptions = { signal?: AbortSignal }

const SESSION_ERRORS = new Set(['INVALID_SESSIONID', 'AUTHENTICATION_REQUIRED', 'SESSION_EXPIRED'])
const DRY_RUN_USER_ID = 'dryrun-user'

export class VtigerError extends IntegrationError {
  constructor(message: string, code: string, status: number | null = null) {
    super(message, { system: 'vtiger', code, status, retriable: false })
    this.name = 'VtigerError'
  }
}

/** Escapes a value for a single-quoted VTQL literal (same rule as the n8n flow, plus backslashes). */
export function vtqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** Reads VTIGER_URL, VTIGER_USERNAME, VTIGER_ACCESS_KEY. Null when any is missing. */
export function vtigerConfigFromEnv(env: Record<string, string | undefined> = process.env): VtigerConfig | null {
  const url = (env.VTIGER_URL ?? '').trim().replace(/\/+$/, '')
  const username = (env.VTIGER_USERNAME ?? '').trim()
  const accessKey = (env.VTIGER_ACCESS_KEY ?? '').trim()
  if (!url || !username || !accessKey) return null
  return { url, username, accessKey }
}

export class VtigerClient {
  readonly dryRun: boolean
  private readonly endpoint: string
  private readonly opts: VtigerClientOptions
  private readonly logger: Logger
  private readonly now: () => number
  private session: Session | null = null
  private pendingLogin: Promise<Session> | null = null

  constructor(opts: VtigerClientOptions) {
    this.opts = opts
    this.dryRun = opts.dryRun ?? false
    this.endpoint = `${opts.url.replace(/\/+$/, '')}/webservice.php`
    this.logger = opts.logger ?? console
    this.now = opts.now ?? Date.now
  }

  /**
   * Builds a client from the environment. In dry-run mode the Vtiger env vars
   * are not needed. Throws when they are missing outside dry run.
   */
  static fromEnv(
    env: Record<string, string | undefined> = process.env,
    overrides: Partial<VtigerClientOptions> = {},
  ): VtigerClient {
    const dryRun = overrides.dryRun ?? isDryRun(env)
    const config = vtigerConfigFromEnv(env)
    if (!config && !dryRun) {
      throw new VtigerError('Vtiger is not configured (VTIGER_URL, VTIGER_USERNAME, VTIGER_ACCESS_KEY)', 'NOT_CONFIGURED')
    }
    return new VtigerClient({
      ...(config ?? { url: 'http://vtiger.dry-run.invalid', username: 'dry-run', accessKey: 'dry-run' }),
      ...overrides,
      dryRun,
    })
  }

  /** The webservice user's id, used as assigned_user_id. Logs in if needed. */
  async userId(callOpts: CallOptions = {}): Promise<string> {
    if (this.dryRun) return DRY_RUN_USER_ID
    return (await this.getSession(callOpts)).userId
  }

  async login(callOpts: CallOptions = {}): Promise<Session> {
    if (this.dryRun) {
      return { sessionName: 'dryrun-session', userId: DRY_RUN_USER_ID, expiresAt: Number.MAX_SAFE_INTEGER }
    }
    const challenge = (await this.request(
      'GET',
      { operation: 'getchallenge', username: this.opts.username },
      callOpts,
    )) as { token?: string }
    if (!challenge?.token) throw new VtigerError('Vtiger getchallenge returned no token', 'BAD_RESPONSE')

    const accessKeyHash = createHash('md5').update(challenge.token + this.opts.accessKey).digest('hex')
    const login = (await this.request(
      'POST',
      { operation: 'login', username: this.opts.username, accessKey: accessKeyHash },
      callOpts,
    )) as { sessionName?: string; userId?: string }
    if (!login?.sessionName || !login.userId) throw new VtigerError('Vtiger login returned no session', 'BAD_RESPONSE')

    this.session = {
      sessionName: login.sessionName,
      userId: login.userId,
      expiresAt: this.now() + (this.opts.sessionTtlMs ?? 30 * 60_000),
    }
    return this.session
  }

  async query<T = Record<string, unknown>>(vtql: string, callOpts: CallOptions = {}): Promise<T[]> {
    const sql = vtql.trim().endsWith(';') ? vtql.trim() : `${vtql.trim()};` // KI054 (a)
    if (this.dryRun) {
      this.logger.info(`[vtiger:dry-run] query ${maskEmails(sql)} -> no rows`)
      return []
    }
    const result = await this.withSession((sessionName) =>
      this.request('GET', { operation: 'query', sessionName, query: sql }, callOpts),
    callOpts)
    return Array.isArray(result) ? (result as T[]) : []
  }

  async retrieve(id: string, callOpts: CallOptions = {}): Promise<VtigerRecord> {
    if (this.dryRun) return { id }
    return (await this.withSession((sessionName) =>
      this.request('GET', { operation: 'retrieve', sessionName, id }, callOpts),
    callOpts)) as VtigerRecord
  }

  async create(elementType: string, element: Record<string, unknown>, callOpts: CallOptions = {}): Promise<VtigerRecord> {
    if (this.dryRun) return this.dryWrite('create', elementType, element)
    return this.write('create', { elementType, element: JSON.stringify(element) }, callOpts)
  }

  /** Full update. Vtiger REPLACES the record, so pass every field you want to keep (KI054 c). */
  async update(element: VtigerRecord, callOpts: CallOptions = {}): Promise<VtigerRecord> {
    if (this.dryRun) return this.dryWrite('update', idPrefix(element.id), element)
    return this.write('update', { element: JSON.stringify(element) }, callOpts)
  }

  /** Partial update: only the given fields change. */
  async revise(element: VtigerRecord, callOpts: CallOptions = {}): Promise<VtigerRecord> {
    if (this.dryRun) return this.dryWrite('revise', idPrefix(element.id), element)
    return this.write('revise', { element: JSON.stringify(element) }, callOpts)
  }

  // -------------------------------------------------------------------------

  private dryWrite(op: string, kind: string, element: Record<string, unknown>): VtigerRecord {
    const id = typeof element.id === 'string' ? element.id : fakeId(kind)
    this.logger.info(`[vtiger:dry-run] ${op} ${kind} ${JSON.stringify(maskEmails(element))} -> ${id}`)
    return { ...element, id }
  }

  private async write(
    operation: string,
    params: Record<string, string>,
    callOpts: CallOptions,
  ): Promise<VtigerRecord> {
    const result = (await this.withSession((sessionName) =>
      this.request('POST', { operation, sessionName, ...params }, callOpts),
    callOpts)) as VtigerRecord | null
    if (!result || typeof result.id !== 'string') {
      throw new VtigerError(`Vtiger ${operation} returned no record id`, 'BAD_RESPONSE')
    }
    return result
  }

  private async getSession(callOpts: CallOptions): Promise<Session> {
    if (this.session && this.session.expiresAt > this.now()) return this.session
    if (!this.pendingLogin) {
      this.pendingLogin = this.login(callOpts).finally(() => {
        this.pendingLogin = null
      })
    }
    return this.pendingLogin
  }

  private async withSession(
    fn: (sessionName: string) => Promise<unknown>,
    callOpts: CallOptions,
  ): Promise<unknown> {
    const session = await this.getSession(callOpts)
    try {
      return await fn(session.sessionName)
    } catch (err) {
      if (err instanceof VtigerError && SESSION_ERRORS.has(err.code)) {
        this.session = null
        const fresh = await this.getSession(callOpts)
        return fn(fresh.sessionName)
      }
      throw err
    }
  }

  /** One webservice call; returns `result` or throws VtigerError / IntegrationError. */
  private async request(
    method: 'GET' | 'POST',
    params: Record<string, string>,
    callOpts: CallOptions,
  ): Promise<unknown> {
    const body = new URLSearchParams(params)
    const url = method === 'GET' ? `${this.endpoint}?${body.toString()}` : this.endpoint
    const init: RequestInit =
      method === 'GET'
        ? { method }
        : { method, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }

    const res = await fetchWithRetry(url, init, {
      system: 'vtiger',
      retries: this.opts.retries,
      baseDelayMs: this.opts.baseDelayMs,
      timeoutMs: this.opts.timeoutMs,
      fetchImpl: this.opts.fetchImpl,
      sleep: this.opts.sleep,
      signal: callOpts.signal,
    })

    let json: { success?: boolean; result?: unknown; error?: { code?: string; message?: string } }
    try {
      json = (await res.json()) as typeof json
    } catch {
      throw new VtigerError(`Vtiger ${params.operation}: HTTP ${res.status}, response was not JSON`, 'BAD_RESPONSE', res.status)
    }
    if (!res.ok) {
      throw new VtigerError(`Vtiger ${params.operation}: HTTP ${res.status}`, `HTTP_${res.status}`, res.status)
    }
    if (!json.success) {
      const code = json.error?.code ?? 'UNKNOWN'
      throw new VtigerError(`Vtiger ${params.operation} failed: ${code}: ${json.error?.message ?? ''}`.trim(), code, res.status)
    }
    return json.result
  }
}

/** "12x188" -> "12" (the module prefix), for dry-run log labels. */
function idPrefix(id: string): string {
  return id.split('x')[0] ?? id
}
