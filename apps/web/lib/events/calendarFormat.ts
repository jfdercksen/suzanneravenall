/**
 * Types and pure formatting helpers for the live-programme calendar. Kept free
 * of data and zod imports so the client list component does not pull the
 * programme catalogue into the browser bundle (lib/events/liveCalendar.ts
 * builds the calendar on the server).
 */

export interface LiveSession {
  start: string
  end?: string
  time?: string
  note?: string
  bookHref?: string
}

export interface CalendarProgramme {
  slug: string
  title: string
  summary: string
  format: string
  href: string
  /** Register-interest enquiry for this programme. */
  interestHref: string
}

export interface CalendarRow {
  programme: CalendarProgramme
  session: LiveSession
  /** Book on the shop when a date is for sale, else register interest. */
  action: { label: string; href: string }
}

export interface LiveCalendar {
  /** Future dates, earliest first. */
  rows: CalendarRow[]
  /** Live programmes with no future date: "dates to be announced". */
  toBeAnnounced: CalendarProgramme[]
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' })
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' })
const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' })
const monthYearFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const longFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** A YYYY-MM-DD date at UTC midnight, so formatting never shifts the day. */
const asDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`)

/** Parts for the calendar's date block: "Tue", "12", "Jan". */
export function dateBlock(iso: string): { weekday: string; day: string; month: string } {
  const d = asDate(iso)
  return { weekday: weekdayFormat.format(d), day: dayFormat.format(d), month: monthFormat.format(d) }
}

/** Month heading for grouping rows: "January 2027". */
export const monthHeading = (iso: string): string => monthYearFormat.format(asDate(iso))

/** "12 January 2027" or "12 January 2027 to 16 February 2027". */
export function dateRange(session: LiveSession): string {
  const start = longFormat.format(asDate(session.start))
  if (!session.end || session.end === session.start) return start
  return `${start} to ${longFormat.format(asDate(session.end))}`
}

/** Rows grouped by the month of their start date, in order. */
export function groupByMonth(rows: CalendarRow[]): { month: string; rows: CalendarRow[] }[] {
  const groups: { month: string; rows: CalendarRow[] }[] = []
  for (const row of rows) {
    const month = monthHeading(row.session.start)
    const last = groups[groups.length - 1]
    if (last && last.month === month) last.rows.push(row)
    else groups.push({ month, rows: [row] })
  }
  return groups
}
