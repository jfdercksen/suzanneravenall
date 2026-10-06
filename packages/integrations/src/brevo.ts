import { fetchWithRetry, IntegrationError, type FetchLike } from './http'
import { isDryRun, maskEmails, type Logger } from './dry-run'

/**
 * Brevo transactional mail (REST v3), the same provider and request shape as
 * apps/web/lib/email/send.ts, for code that is not inside the web app (the
 * Medusa automations). Plain fetch, no SDK. The key is read at call time.
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export type MailAddress = { email: string; name?: string }

export type BrevoMail = {
  from: MailAddress
  to: MailAddress[]
  subject: string
  html?: string
  text?: string
  replyTo?: MailAddress
}

export type BrevoOptions = {
  apiKey?: string
  dryRun?: boolean
  fetchImpl?: FetchLike
  sleep?: (ms: number) => Promise<void>
  logger?: Logger
}

/** "Name <a@b.c>" -> { name, email }; a bare address -> { email }. Same rule as the web sender. */
export function parseAddress(value: string): MailAddress {
  const match = value.trim().match(/^(.*?)\s*<([^<>]+)>$/)
  if (!match) return { email: value.trim() }
  const [, rawName = '', address = ''] = match
  const name = rawName.replace(/^"|"$/g, '').trim()
  return name ? { name, email: address.trim() } : { email: address.trim() }
}

/** Sends one mail and returns Brevo's message id. Throws on a missing key or a refused send. */
export async function sendBrevoEmail(mail: BrevoMail, opts: BrevoOptions = {}): Promise<string> {
  const logger = opts.logger ?? console
  if (opts.dryRun ?? isDryRun()) {
    logger.info(`[brevo:dry-run] ${JSON.stringify(maskEmails({ to: mail.to, subject: mail.subject }))}`)
    return 'dryrun-brevo'
  }
  const apiKey = opts.apiKey ?? process.env.BREVO_API_KEY
  if (!apiKey) throw new IntegrationError('BREVO_API_KEY is not configured', { system: 'brevo', code: 'NOT_CONFIGURED' })
  if (!mail.html && !mail.text) throw new IntegrationError('Email needs html or text', { system: 'brevo', code: 'EMPTY' })

  const payload: Record<string, unknown> = { sender: mail.from, to: mail.to, subject: mail.subject }
  if (mail.html) payload.htmlContent = mail.html
  if (mail.text) payload.textContent = mail.text
  if (mail.replyTo) payload.replyTo = mail.replyTo

  const res = await fetchWithRetry(
    BREVO_ENDPOINT,
    {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    },
    { system: 'brevo', retries: 2, fetchImpl: opts.fetchImpl, sleep: opts.sleep },
  )
  const body = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string; code?: string }
  if (!res.ok) {
    const detail = body.message ? `${body.code ? `${body.code}: ` : ''}${body.message}` : `HTTP ${res.status}`
    throw new IntegrationError(`Brevo error: ${detail}`, { system: 'brevo', status: res.status })
  }
  if (!body.messageId) throw new IntegrationError('Brevo returned no message id', { system: 'brevo' })
  return body.messageId
}

// ---------------------------------------------------------------------------
// Staff alerts
// ---------------------------------------------------------------------------

export const ALERT_THROTTLE_MS = 15 * 60_000
export const ALERT_SENDER: MailAddress = { name: 'Suzanne Ravenall Platform', email: 'noreply@suzanneravenall.com' }

export type StaffAlertOutcome = 'sent' | 'throttled' | 'no-recipient' | 'dry-run' | 'failed'

export type StaffAlert = {
  /** Throttle key, for example "thinkific-enrolment". */
  key: string
  subject: string
  /** Plain lines. Keep personal data out of them (POPIA): order numbers, not emails. */
  lines: string[]
}

export type StaffAlerter = {
  send(alert: StaffAlert): Promise<StaffAlertOutcome>
  /** Tests only. */
  reset(): void
}

/**
 * Staff alert mail for automation failures a human must act on, the same
 * rules as the web app's staff alert (apps/web/lib/integrations/staff-alert.ts):
 *
 * - recipient AUTOMATION_ALERT_EMAIL; unset means log only;
 * - at most one mail per key per 15 minutes per process, so an outage gives
 *   one alert, not one per order; the next mail says how many were held back
 *   (each held-back alert is still logged in full);
 * - never throws: an alert must not break the path that raised it;
 * - AUTOMATION_DRY_RUN=true logs the alert instead of mailing it.
 */
export function createStaffAlerter(
  opts: {
    env?: Record<string, string | undefined>
    now?: () => number
    throttleMs?: number
    logger?: Logger
    send?: (mail: BrevoMail) => Promise<string>
  } = {},
): StaffAlerter {
  const env = opts.env ?? process.env
  const now = opts.now ?? Date.now
  const throttleMs = opts.throttleMs ?? ALERT_THROTTLE_MS
  const logger = opts.logger ?? console
  const send = opts.send ?? ((mail: BrevoMail) => sendBrevoEmail(mail, { logger, dryRun: isDryRun(env), apiKey: env.BREVO_API_KEY }))
  const state = new Map<string, { lastSentAt: number; suppressed: number }>()

  return {
    async send(alert) {
      const at = now()
      logger.warn(`[staff-alert] ${alert.subject} | ${alert.lines.join(' | ')}`)
      if (isDryRun(env)) return 'dry-run'

      const recipient = (env.AUTOMATION_ALERT_EMAIL ?? '').trim()
      if (!recipient) return 'no-recipient'

      const entry = state.get(alert.key)
      if (entry && at - entry.lastSentAt < throttleMs) {
        entry.suppressed += 1
        return 'throttled'
      }
      const held = entry?.suppressed ?? 0
      const lines = [...alert.lines]
      if (held > 0) lines.push(`${held} more alert(s) of this kind were held back in the last 15 minutes (see the Medusa log).`)
      lines.push(`Time: ${new Date(at).toISOString()}`)
      state.set(alert.key, { lastSentAt: at, suppressed: 0 })

      try {
        await send({
          from: ALERT_SENDER,
          to: recipient.split(',').map((r) => parseAddress(r)).filter((a) => a.email),
          subject: `[ALERT] ${alert.subject}`,
          text: lines.join('\n'),
          html: lines.map((l) => `<p>${escapeHtml(l)}</p>`).join(''),
        })
        return 'sent'
      } catch (err) {
        logger.error(`[staff-alert] could not send alert mail (${alert.key}): ${err instanceof Error ? err.message : String(err)}`)
        return 'failed'
      }
    },
    reset() {
      state.clear()
    },
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
