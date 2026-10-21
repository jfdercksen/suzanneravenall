/**
 * Intake reminder schedule (client process, Suzanne 6 and 20 Oct 2026):
 * reminders on day 1, 3 and 5 after the purchase, then every 3 days, at most
 * 6, stopping as soon as the form is in.
 *
 *   INTAKE_REMINDER_DELAYS  "1d,3d,5d,8d,11d,14d" (default): reminder N is
 *                           due that long after the purchase. 1 to 6 values,
 *                           rising; units s, m, h, d. A time-compressed test
 *                           uses e.g. "2m,4m,6m,8m,10m,12m".
 *
 * Medusa's jobs/intake-reminders.ts reads the same variable for its tick.
 */

export const MAX_REMINDERS = 6
export const DEFAULT_REMINDER_DELAYS = '1d,3d,5d,8d,11d,14d'

/** A link stays usable this long after the purchase (well past the last reminder). */
export const LINK_LIFETIME_MS = 60 * 86_400_000

const UNIT_MS: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }

export function parseReminderDelays(raw: string): number[] | null {
  const parts = raw.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean)
  if (parts.length === 0 || parts.length > MAX_REMINDERS) return null
  const out: number[] = []
  for (const part of parts) {
    const m = /^(\d+)([smhd])$/.exec(part)
    const unit = m?.[2] ? UNIT_MS[m[2]] : undefined
    if (!m || unit === undefined) return null
    const ms = Number(m[1]) * unit
    if (!(ms > 0)) return null
    const previous = out[out.length - 1]
    if (previous !== undefined && ms <= previous) return null
    out.push(ms)
  }
  return out
}

/** Offsets from the purchase, in ms. A bad value falls back to the default with a warning. */
export function reminderDelays(env: Record<string, string | undefined> = process.env): number[] {
  const raw = (env.INTAKE_REMINDER_DELAYS ?? '').trim()
  if (raw) {
    const parsed = parseReminderDelays(raw)
    if (parsed) return parsed
    console.warn(`[intake] INTAKE_REMINDER_DELAYS="${raw}" is not 1 to 6 rising values like "${DEFAULT_REMINDER_DELAYS}"; using the default`)
  }
  return parseReminderDelays(DEFAULT_REMINDER_DELAYS) as number[]
}

/** When reminder 1 is due for a purchase made at `createdAt`. */
export function firstReminderAt(createdAt: Date, delays: number[]): Date {
  return new Date(createdAt.getTime() + (delays[0] ?? 0))
}

/**
 * When the reminder after number `sent` (1-based, just sent at `now`) is due,
 * or null when that was the last. Normally the purchase time plus its offset,
 * so a reminder that went a little late does not push the rest back. If that
 * moment is less than half the usual gap away (the site was down, a backlog),
 * the full gap counts from now instead, so two reminders never go back to back.
 */
export function nextReminderAt(createdAt: Date, sent: number, now: Date, delays: number[]): Date | null {
  const offset = delays[sent]
  const previous = delays[sent - 1]
  if (offset === undefined || previous === undefined) return null
  const scheduled = createdAt.getTime() + offset
  const gap = offset - previous
  return new Date(scheduled - now.getTime() >= gap / 2 ? scheduled : now.getTime() + gap)
}

export function linkExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + LINK_LIFETIME_MS)
}
