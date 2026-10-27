/**
 * Working hours for the session notice rule (DECISIONS.md D024).
 *
 * A working hour is Monday to Friday, 08:00 to 17:00 South African time
 * (SAST, UTC+2 all year, no daylight saving), on a day that is not a South
 * African public holiday. A client who cancels or moves a session with less
 * than 48 of these hours to go loses the session.
 *
 * Public holidays follow the Public Holidays Act: the ten fixed dates, Good
 * Friday and Family Day (from Easter), and the Monday after any holiday that
 * falls on a Sunday. Days the President declares ad hoc (an election day) go
 * in SA_EXTRA_PUBLIC_HOLIDAYS as YYYY-MM-DD, comma separated.
 */

export const NOTICE_WORKING_HOURS = 48

const SAST_OFFSET_MS = 2 * 60 * 60_000
const DAY_MS = 24 * 60 * 60_000
const DAY_START_MIN = 8 * 60
const DAY_END_MIN = 17 * 60

// MM-DD: New Year, Human Rights, Freedom, Workers', Youth, National Women's,
// Heritage, Reconciliation, Christmas, Day of Goodwill.
const FIXED = ['01-01', '03-21', '04-27', '05-01', '06-16', '08-09', '09-24', '12-16', '12-25', '12-26']

function ymd(utcMidnight: number): string {
  return new Date(utcMidnight).toISOString().slice(0, 10)
}

/** Easter Sunday (Gregorian, anonymous algorithm) as a UTC midnight timestamp. */
export function easterSunday(year: number): number {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return Date.UTC(year, month - 1, day)
}

const cache = new Map<number, ReadonlySet<string>>()

function extraHolidays(): string[] {
  return (process.env.SA_EXTRA_PUBLIC_HOLIDAYS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
}

/** Every South African public holiday in `year`, as YYYY-MM-DD (SAST dates). */
export function saPublicHolidays(year: number): ReadonlySet<string> {
  const cached = cache.get(year)
  if (cached) return withExtras(year, cached)
  const days = FIXED.map((md) => Date.parse(`${year}-${md}T00:00:00Z`))
  const easter = easterSunday(year)
  days.push(easter - 2 * DAY_MS, easter + DAY_MS)
  const set = new Set(days.map(ymd))
  // A holiday on a Sunday moves the day off to the Monday.
  for (const day of days) {
    if (new Date(day).getUTCDay() === 0) set.add(ymd(day + DAY_MS))
  }
  cache.set(year, set)
  return withExtras(year, set)
}

// Declared days are read on every call, so a new one needs no restart.
function withExtras(year: number, base: ReadonlySet<string>): ReadonlySet<string> {
  const extras = extraHolidays().filter((d) => d.startsWith(`${year}-`))
  return extras.length === 0 ? base : new Set([...base, ...extras])
}

/** True for Monday to Friday SAST dates that are not public holidays. */
export function isWorkingDay(sastMidnight: number): boolean {
  const day = new Date(sastMidnight).getUTCDay()
  if (day === 0 || day === 6) return false
  return !saPublicHolidays(new Date(sastMidnight).getUTCFullYear()).has(ymd(sastMidnight))
}

/**
 * Working minutes from `from` to `to` (0 when `to` is not later). Stops
 * counting once `cap` is reached, so a booking months ahead costs a few loops.
 */
export function workingMinutesBetween(from: Date, to: Date, cap: number = Number.POSITIVE_INFINITY): number {
  // Shift to SAST wall-clock time held in a UTC timestamp.
  const start = from.getTime() + SAST_OFFSET_MS
  const end = to.getTime() + SAST_OFFSET_MS
  if (!(end > start)) return 0

  let total = 0
  for (let day = Math.floor(start / DAY_MS) * DAY_MS; day < end && total < cap; day += DAY_MS) {
    if (!isWorkingDay(day)) continue
    const open = day + DAY_START_MIN * 60_000
    const close = day + DAY_END_MIN * 60_000
    const overlap = Math.min(close, end) - Math.max(open, start)
    if (overlap > 0) total += overlap / 60_000
  }
  return Math.min(Math.floor(total), cap)
}

/** True when a change at `changedAt` gives less than 48 working hours before `sessionStart`. */
export function isLateChange(changedAt: Date, sessionStart: Date): boolean {
  const needed = NOTICE_WORKING_HOURS * 60
  return workingMinutesBetween(changedAt, sessionStart, needed) < needed
}
