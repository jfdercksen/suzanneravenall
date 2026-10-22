import { randomUUID } from 'node:crypto'
import { maskEmails, type Logger } from './dry-run'

/**
 * One Sentry event over Sentry's HTTP envelope API, for processes without the
 * Sentry SDK (Medusa, docs/n8n-migration-plan.md 4.3). No DSN = log only.
 *
 * - never throws: reporting must not break the path that raised it;
 * - emails are masked in the message and in every extra string (POPIA);
 * - AUTOMATION_DRY_RUN=true logs instead of sending.
 */

export type SentryLevel = 'info' | 'warning' | 'error' | 'fatal'

export type SentryEvent = {
  message: string
  level: SentryLevel
  tags?: Record<string, string>
  extra?: Record<string, string | number | boolean | null>
}

export type SentryOutcome = 'sent' | 'no-dsn' | 'dry-run' | 'failed'

type Dsn = { endpoint: string; publicKey: string; dsn: string }

/** https://<key>@<host>/<project> -> the project's envelope endpoint. Null when malformed. */
export function parseSentryDsn(dsn: string | undefined): Dsn | null {
  const raw = (dsn ?? '').trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    // The last path segment is the project id; anything before it is a
    // self-hosted path prefix.
    const segments = url.pathname.split('/').filter(Boolean)
    const id = segments.pop()
    if (!url.username || !id || !/^\d+$/.test(id)) return null
    const prefix = segments.length > 0 ? `/${segments.join('/')}` : ''
    return {
      endpoint: `${url.protocol}//${url.host}${prefix}/api/${id}/envelope/`,
      publicKey: url.username,
      dsn: raw,
    }
  } catch {
    return null
  }
}

export async function sendSentryEvent(
  event: SentryEvent,
  opts: {
    env?: Record<string, string | undefined>
    logger?: Logger
    fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
    now?: () => Date
  } = {},
): Promise<SentryOutcome> {
  const env = opts.env ?? process.env
  const logger = opts.logger ?? console
  const message = maskEmails(event.message)
  const extra = Object.fromEntries(
    Object.entries(event.extra ?? {}).map(([k, v]) => [k, typeof v === 'string' ? maskEmails(v) : v]),
  )

  if (env.AUTOMATION_DRY_RUN === 'true') {
    logger.info(`[sentry:dry-run] ${event.level} ${message}`)
    return 'dry-run'
  }
  const dsn = parseSentryDsn(env.SENTRY_DSN)
  if (!dsn) return 'no-dsn'

  const now = (opts.now ?? (() => new Date()))()
  const eventId = randomUUID().replace(/-/g, '')
  const body = [
    JSON.stringify({ event_id: eventId, sent_at: now.toISOString(), dsn: dsn.dsn }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify({
      event_id: eventId,
      timestamp: now.getTime() / 1000,
      platform: 'node',
      level: event.level,
      environment: env.SENTRY_ENVIRONMENT || 'production',
      message: { formatted: message },
      tags: event.tags ?? {},
      extra,
    }),
  ].join('\n')

  try {
    const res = await (opts.fetchImpl ?? fetch)(dsn.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=suzanne-integrations/1.0`,
      },
      body,
      // A hung Sentry must not hold up the job that reports to it.
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      logger.error(`[sentry] event not accepted: HTTP ${res.status}`)
      return 'failed'
    }
    return 'sent'
  } catch (err) {
    logger.error(`[sentry] could not send event: ${err instanceof Error ? err.message : String(err)}`)
    return 'failed'
  }
}
