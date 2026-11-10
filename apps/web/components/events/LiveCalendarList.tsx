'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  dateBlock,
  dateRange,
  groupByMonth,
  type CalendarProgramme,
  type LiveCalendar,
} from '@/lib/events/calendarFormat'

type Props = {
  calendar: LiveCalendar
  /** 'light' on cream/sand grounds, 'dark' on the black ground (home page). */
  tone?: 'light' | 'dark'
  /** Show at most this many rows in total (home page); all when omitted. */
  limit?: number
  /** Prefix for heading ids, unique per list on a page. */
  idPrefix?: string
}

const rowMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
}

/**
 * Calendar rows in the reference's event-calendar shape: date block,
 * programme and format, then the action. Dated rows come first, grouped by
 * month; programmes with no date follow under "Dates to be announced" with a
 * register-interest action, so the list is honest while no dates exist.
 */
export function LiveCalendarList({ calendar, tone = 'light', limit, idPrefix = 'live-calendar' }: Props) {
  const dark = tone === 'dark'
  const rows = limit === undefined ? calendar.rows : calendar.rows.slice(0, limit)
  const tbaRoom = limit === undefined ? undefined : Math.max(0, limit - rows.length)
  const toBeAnnounced =
    tbaRoom === undefined ? calendar.toBeAnnounced : calendar.toBeAnnounced.slice(0, tbaRoom)
  const groups = groupByMonth(rows)

  const divider = dark ? 'border-white/15' : 'border-brand-border'
  const heading = dark ? 'text-white' : 'text-brand-ink'
  const body = dark ? 'text-white/70' : 'text-brand-muted'
  const label = dark ? 'text-brand-accent-400' : 'text-brand-accent'
  const dateBox = dark
    ? 'bg-white/10 text-white border border-white/15'
    : 'bg-brand-sand text-brand-ink border border-brand-border'
  const primary = dark
    ? 'bg-white hover:bg-brand-sand text-brand-primary'
    : 'bg-brand-accent-600 hover:bg-brand-accent-700 text-white'
  const secondary = dark
    ? 'border border-white/50 hover:border-white text-white hover:bg-white/10'
    : 'border border-brand-primary-300 hover:border-brand-primary text-brand-primary hover:bg-brand-sand'
  const button =
    'inline-flex items-center justify-center px-5 py-2.5 text-xs uppercase tracking-widest font-medium rounded-button transition-all duration-300'

  const programmeText = (p: CalendarProgramme) => (
    <>
      <p className={`text-xs uppercase tracking-[0.25em] font-medium mb-2 ${label}`}>{p.format}</p>
      <h4 className={`text-xl lg:text-2xl font-medium leading-snug ${heading}`}>
        <Link href={p.href} className="hover:underline underline-offset-4">
          {p.title}
        </Link>
      </h4>
    </>
  )

  return (
    <div>
      {groups.map((group, gi) => (
        <div key={group.month} className="mb-12">
          <h3 id={`${idPrefix}-month-${gi}`} className={`text-sm uppercase tracking-[0.3em] font-medium mb-2 ${label}`}>
            {group.month}
          </h3>
          <ul aria-labelledby={`${idPrefix}-month-${gi}`} className={`divide-y ${dark ? 'divide-white/15' : 'divide-brand-border'} border-y ${divider}`}>
            {group.rows.map((row, ri) => {
              const block = dateBlock(row.session.start)
              return (
                <motion.li
                  key={`${row.programme.slug}-${row.session.start}-${ri}`}
                  {...rowMotion}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 py-6"
                >
                  <div
                    className={`flex sm:flex-col items-baseline sm:items-center justify-center gap-2 sm:gap-0 shrink-0 w-full sm:w-24 py-3 rounded-card ${dateBox}`}
                    aria-hidden="true"
                  >
                    <span className="text-xs uppercase tracking-widest">{block.weekday}</span>
                    <span className="text-3xl font-semibold tracking-tight leading-none sm:my-1">{block.day}</span>
                    <span className="text-xs uppercase tracking-widest">{block.month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {programmeText(row.programme)}
                    <p className={`mt-2 text-sm ${body}`}>
                      {row.session.end && row.session.end !== row.session.start ? (
                        dateRange(row.session)
                      ) : (
                        <time dateTime={row.session.start}>{dateRange(row.session)}</time>
                      )}
                      {row.session.time && <> · {row.session.time}</>}
                      {row.session.note && <> · {row.session.note}</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <Link
                      href={row.programme.href}
                      aria-label={`${row.programme.title}: details`}
                      className={`${button} ${secondary}`}
                    >
                      Details
                    </Link>
                    <Link
                      href={row.action.href}
                      aria-label={`${row.programme.title}: ${row.action.label.toLowerCase()}, ${dateRange(row.session)}`}
                      className={`${button} ${primary}`}
                    >
                      {row.action.label}
                    </Link>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </div>
      ))}

      {toBeAnnounced.length > 0 && (
        <div>
          <h3 id={`${idPrefix}-tba`} className={`text-sm uppercase tracking-[0.3em] font-medium mb-2 ${label}`}>
            Dates to be announced
          </h3>
          <ul aria-labelledby={`${idPrefix}-tba`} className={`divide-y ${dark ? 'divide-white/15' : 'divide-brand-border'} border-y ${divider}`}>
            {toBeAnnounced.map((programme) => (
              <motion.li
                key={programme.slug}
                {...rowMotion}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 py-6"
              >
                <div
                  className={`flex items-center justify-center shrink-0 w-full sm:w-24 py-3 sm:py-5 rounded-card text-xs uppercase tracking-widest text-center ${dateBox}`}
                >
                  To be announced
                </div>
                <div className="flex-1 min-w-0">
                  {programmeText(programme)}
                  <p className={`mt-2 text-sm font-light leading-relaxed ${body}`}>{programme.summary}</p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <Link
                    href={programme.href}
                    aria-label={`${programme.title}: details`}
                    className={`${button} ${secondary}`}
                  >
                    Details
                  </Link>
                  <Link
                    href={programme.interestHref}
                    aria-label={`${programme.title}: register interest`}
                    className={`${button} ${primary}`}
                  >
                    Register interest
                  </Link>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
