import { sendEmail } from '@/lib/email/send'
import { logError } from '@/lib/log'

/**
 * Staff alert mail for automation failures a human should know about.
 *
 * Recipient: AUTOMATION_ALERT_EMAIL (during the n8n migration this points at
 * AiDa, not Suzanne's team). Unset means no mail, only the log line.
 *
 * Throttled per key: at most one mail per 15 minutes per process, so a Vtiger
 * outage produces one alert, not one per visitor. The next alert after a quiet
 * period says how many were held back.
 *
 * Never throws: an alert must not break the path that raised it.
 */

export const ALERT_THROTTLE_MS = 15 * 60_000

type AlertState = { lastSentAt: number; suppressed: number }
const state = new Map<string, AlertState>()

export type StaffAlertOutcome = 'sent' | 'throttled' | 'no-recipient' | 'failed'

export async function sendStaffAlert(input: {
  /** Throttle key, for example "leads-vtiger". */
  key: string
  subject: string
  /** Plain lines; keep personal data out of them (POPIA). */
  lines: string[]
  now?: number
}): Promise<StaffAlertOutcome> {
  const now = input.now ?? Date.now()
  const recipient = (process.env.AUTOMATION_ALERT_EMAIL ?? '').trim()
  if (!recipient) {
    console.warn(`[staff-alert] AUTOMATION_ALERT_EMAIL is not set; alert "${input.subject}" not mailed`)
    return 'no-recipient'
  }

  const entry = state.get(input.key)
  if (entry && now - entry.lastSentAt < ALERT_THROTTLE_MS) {
    entry.suppressed += 1
    return 'throttled'
  }

  const held = entry?.suppressed ?? 0
  const lines = [...input.lines]
  if (held > 0) lines.push(`${held} more alert(s) of this kind were held back in the last 15 minutes.`)
  lines.push(`Time: ${new Date(now).toISOString()}`)

  state.set(input.key, { lastSentAt: now, suppressed: 0 })

  try {
    await sendEmail({
      to: [recipient],
      subject: `[ALERT] ${input.subject}`,
      text: lines.join('\n'),
      html: lines.map((l) => `<p>${escapeHtml(l)}</p>`).join(''),
    })
    return 'sent'
  } catch (err) {
    logError('[staff-alert] could not send alert mail', err, { key: input.key })
    return 'failed'
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Tests only. */
export function resetStaffAlerts(): void {
  state.clear()
}
