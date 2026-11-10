import { z } from 'zod'
import calendarFile from '@/data/live-calendar.json'
import { getProgramBySlug, type Program } from '@/data/programs'
import { contactHref } from '@/app/contact/enquiry'
import { logError } from '@/lib/log'
import type { CalendarProgramme, CalendarRow, LiveCalendar } from './calendarFormat'

export type { CalendarProgramme, CalendarRow, LiveCalendar, LiveSession } from './calendarFormat'
export { dateBlock, dateRange, groupByMonth, monthHeading } from './calendarFormat'

/**
 * The live-programme calendar (item 11 of Suzanne's 8 Nov list): one data
 * file, data/live-calendar.json, that Shayna can fill (how-to beside it in
 * live-calendar.README.md). Names and card copy come from data/programs.ts so
 * a programme is described in one place.
 */

/** YYYY-MM-DD and a real calendar day (2027-02-31 would crash the date formatting). */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'dates are YYYY-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
  }, 'not a real date')

const sessionSchema = z
  .object({
    start: isoDate,
    end: isoDate.optional(),
    time: z.string().min(1).optional(),
    note: z.string().min(1).optional(),
    // A path on this site only: '//host' would be an outside link.
    bookHref: z.string().regex(/^\/(?!\/)/, 'bookHref is a path on this site').optional(),
  })
  .strict()
  .refine((s) => !s.end || s.end >= s.start, { message: 'end is before start' })

const programmeSchema = z
  .object({
    programmeSlug: z.string().min(1),
    format: z.string().min(1),
    sessions: z.array(sessionSchema),
  })
  .strict()

export const liveCalendarSchema = z
  .object({
    programmes: z
      .array(programmeSchema)
      .refine((list) => new Set(list.map((p) => p.programmeSlug)).size === list.length, 'a programme is listed twice'),
  })
  .strict()

export type LiveCalendarFile = z.infer<typeof liveCalendarSchema>
/** Today's date in Johannesburg as YYYY-MM-DD (dates in the file are local). */
export function todayInJohannesburg(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function toCalendarProgramme(program: Program, format: string): CalendarProgramme {
  const dateTopic = `${program.name} (${format.toLowerCase()})`
  return {
    slug: program.slug,
    title: program.name,
    summary: program.cardText ?? program.shortDescription,
    format,
    href: `/programs/${program.slug}`,
    interestHref: contactHref('events', dateTopic),
  }
}

/**
 * Builds the calendar from a parsed file. A session counts as upcoming until
 * the day after it ends (or after its start, for a one-day date). Throws on a
 * slug that is not a published programme, so a typo fails the tests instead
 * of silently dropping a date.
 */
export function buildLiveCalendar(file: LiveCalendarFile, now: Date): LiveCalendar {
  const today = todayInJohannesburg(now)
  const rows: CalendarRow[] = []
  const toBeAnnounced: CalendarProgramme[] = []

  for (const entry of file.programmes) {
    const program = getProgramBySlug(entry.programmeSlug)
    if (!program || !program.isPublished) {
      throw new Error(`live-calendar.json: no published programme "${entry.programmeSlug}"`)
    }
    const programme = toCalendarProgramme(program, entry.format)
    const upcoming = entry.sessions.filter((s) => (s.end ?? s.start) >= today)
    if (upcoming.length === 0) {
      toBeAnnounced.push(programme)
      continue
    }
    for (const session of upcoming) {
      rows.push({
        programme,
        session,
        action: session.bookHref
          ? { label: 'Book', href: session.bookHref }
          : {
              label: 'Register interest',
              href: contactHref('events', `${programme.title}, ${session.start}`),
            },
      })
    }
  }

  rows.sort((a, b) => a.session.start.localeCompare(b.session.start))
  return { rows, toBeAnnounced }
}

/**
 * The calendar from data/live-calendar.json, validated. The tests reject a bad
 * file before it ships; if one still reaches the site the page must not die,
 * so the error goes to Sentry and every programme whose slug resolves shows
 * "dates to be announced".
 */
export function getLiveCalendar(now: Date = new Date(), file: unknown = calendarFile): LiveCalendar {
  try {
    return buildLiveCalendar(liveCalendarSchema.parse(file), now)
  } catch (error) {
    logError('live-calendar.json is invalid; showing every programme as to be announced', error)
    const raw = (file as { programmes?: unknown } | null)?.programmes
    const entries = Array.isArray(raw) ? (raw as { programmeSlug?: unknown; format?: unknown }[]) : []
    const toBeAnnounced: CalendarProgramme[] = []
    for (const entry of entries) {
      const program = typeof entry?.programmeSlug === 'string' ? getProgramBySlug(entry.programmeSlug) : undefined
      if (program?.isPublished && !toBeAnnounced.some((p) => p.slug === program.slug)) {
        const format = typeof entry.format === 'string' ? entry.format : 'Live via Zoom'
        toBeAnnounced.push(toCalendarProgramme(program, format))
      }
    }
    return { rows: [], toBeAnnounced }
  }
}

