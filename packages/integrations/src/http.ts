/**
 * fetch with a per-attempt timeout and retries with jittered exponential
 * backoff. Retries network errors, timeouts, 429 and 5xx. Never retries any
 * other 4xx: those are our fault and repeating them changes nothing.
 */

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export type RetryOptions = {
  /** Extra attempts after the first one. */
  retries?: number
  /** First backoff delay; doubles per attempt, plus up to 50% jitter. */
  baseDelayMs?: number
  /** Abort a single attempt after this long. */
  timeoutMs?: number
  /** Overall cancel (for example the route's whole time budget). */
  signal?: AbortSignal
  fetchImpl?: FetchLike
  /** Injected in tests so retries do not really wait. */
  sleep?: (ms: number) => Promise<void>
  /** Used in error messages and logs, for example "vtiger". */
  system?: string
}

export class IntegrationError extends Error {
  readonly system: string
  readonly status: number | null
  readonly code: string
  readonly retriable: boolean

  constructor(
    message: string,
    opts: { system: string; status?: number | null; code?: string; retriable?: boolean; cause?: unknown },
  ) {
    super(message)
    this.name = 'IntegrationError'
    this.system = opts.system
    this.status = opts.status ?? null
    this.code = opts.code ?? 'UNKNOWN'
    this.retriable = opts.retriable ?? false
    if (opts.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause
  }
}

export const DEFAULT_RETRY = { retries: 3, baseDelayMs: 500, timeoutMs: 10_000 } as const

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function isRetriableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

function attemptSignal(timeoutMs: number, outer?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  if (!outer) return timeout
  const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any
  if (anyFn) return anyFn([timeout, outer])
  // Fallback for runtimes without AbortSignal.any.
  const ctrl = new AbortController()
  const abort = () => ctrl.abort()
  timeout.addEventListener('abort', abort, { once: true })
  outer.addEventListener('abort', abort, { once: true })
  return ctrl.signal
}

/**
 * Returns the Response of the first attempt that is not retriable (2xx or a
 * plain 4xx). Throws IntegrationError when every attempt failed, or when the
 * outer signal was aborted.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: RetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? DEFAULT_RETRY.retries
  const baseDelayMs = opts.baseDelayMs ?? DEFAULT_RETRY.baseDelayMs
  const timeoutMs = opts.timeoutMs ?? DEFAULT_RETRY.timeoutMs
  const doFetch: FetchLike = opts.fetchImpl ?? ((u, i) => fetch(u, i))
  const sleep = opts.sleep ?? realSleep
  const system = opts.system ?? 'http'

  let lastError: IntegrationError | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (opts.signal?.aborted) {
      throw new IntegrationError(`${system}: gave up, time budget used`, {
        system,
        code: 'ABORTED',
        retriable: true,
        cause: lastError ?? undefined,
      })
    }

    try {
      const res = await doFetch(url, { ...init, signal: attemptSignal(timeoutMs, opts.signal) })
      if (!isRetriableStatus(res.status)) return res
      lastError = new IntegrationError(`${system}: HTTP ${res.status}`, {
        system,
        status: res.status,
        code: `HTTP_${res.status}`,
        retriable: true,
      })
    } catch (err) {
      const name = err instanceof Error ? err.name : ''
      const isTimeout = name === 'TimeoutError' || name === 'AbortError'
      lastError = new IntegrationError(
        `${system}: ${isTimeout ? 'timed out' : 'network error'}: ${err instanceof Error ? err.message : String(err)}`,
        { system, code: isTimeout ? 'TIMEOUT' : 'NETWORK', retriable: true, cause: err },
      )
    }

    if (attempt < retries) {
      const delay = baseDelayMs * 2 ** attempt
      await sleep(delay + Math.floor(Math.random() * delay * 0.5))
    }
  }

  throw lastError ?? new IntegrationError(`${system}: request failed`, { system })
}
