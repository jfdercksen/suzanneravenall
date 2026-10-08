/**
 * The free masterclass, as the current site runs it (Shayna, 7 Oct):
 * register, then "Watch Now" (straight to the viewing page) or "Watch Later"
 * (pick a date and time, the viewing details come by email). Shared by the
 * form, the lead route, the welcome email and the viewing page.
 */

export const MASTERCLASS_WATCH_PATH = '/masterclass/watch'

/**
 * The masterclass recording, copied 8 Oct from the current site
 * (wp-content/uploads/2021/10/Suzanne-Masterclass-1.m4v) into the Medusa
 * uploads volume, which nginx serves at /uploads/.
 */
export const MASTERCLASS_VIDEO_URL = '/uploads/media/suzanne-masterclass.mp4'

/** The programme the masterclass is a taster for. */
export const MASTERCLASS_PROGRAMME = {
  name: 'Trauma to Transcendence',
  path: '/programs/trauma-to-transcendence',
}

/**
 * The offer revealed when the video ends: 25% off Trauma to Transcendence
 * (Shayna, 8 Oct), with the current site's code masterclass-t59sw7s. It is a
 * Medusa promotion on both Trauma to Transcendence products; codes are stored
 * and shown in capitals, and the voucher box accepts any case.
 */
export const MASTERCLASS_OFFER: { code: string; text: string } | null = {
  code: 'MASTERCLASS-T59SW7S',
  text: 'As a thank you for watching, take 25% off the Trauma to Transcendence programme with the code',
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * "Friday 9 October 2026 at 19:00" from the form's date and time fields, or
 * null when either is missing, malformed, not a real date, or outside
 * yesterday..one year ahead (yesterday allows for the visitor's time zone).
 * The time is the visitor's own; it is echoed back, never converted.
 */
export function formatWatchAt(date: string, time: string, now: Date = new Date()): string | null {
  const d = DATE_RE.exec(date)
  if (!d || !TIME_RE.test(time)) return null
  const [y, m, day] = [Number(d[1]), Number(d[2]), Number(d[3])]
  const at = new Date(Date.UTC(y, m - 1, day))
  if (at.getUTCFullYear() !== y || at.getUTCMonth() !== m - 1 || at.getUTCDate() !== day) return null

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const dayMs = 24 * 60 * 60 * 1000
  if (at.getTime() < today - dayMs || at.getTime() > today + 366 * dayMs) return null

  // Built by hand: toLocaleDateString's punctuation differs between Node builds.
  return `${WEEKDAYS[at.getUTCDay()]} ${day} ${MONTHS[m - 1]} ${y} at ${time}`
}
