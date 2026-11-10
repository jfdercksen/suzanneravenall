import { describe, it, expect } from 'vitest'
import calendarFile from '@/data/live-calendar.json'
import {
  buildLiveCalendar,
  dateBlock,
  dateRange,
  getLiveCalendar,
  groupByMonth,
  liveCalendarSchema,
  todayInJohannesburg,
  type LiveCalendarFile,
} from './liveCalendar'

const NOW = new Date('2026-11-10T10:00:00Z')

const file = (sessions: LiveCalendarFile['programmes'][number]['sessions']): LiveCalendarFile => ({
  programmes: [
    { programmeSlug: 'meditation', format: 'Live via Zoom', sessions },
    { programmeSlug: 'mindfulness', format: 'Live via Zoom', sessions: [] },
  ],
})

describe('data/live-calendar.json', () => {
  it('passes the schema', () => {
    expect(() => liveCalendarSchema.parse(calendarFile)).not.toThrow()
  })

  it('names only published programmes (a typo fails here, not on the site)', () => {
    expect(() => getLiveCalendar(NOW)).not.toThrow()
  })

  it('lists The Inner Sanctuary and Present first', () => {
    const slugs = liveCalendarSchema.parse(calendarFile).programmes.map((p) => p.programmeSlug)
    expect(slugs.slice(0, 2)).toEqual(['meditation', 'mindfulness'])
  })

  it('holds no recorded series or self-study programme', () => {
    const { rows, toBeAnnounced } = getLiveCalendar(NOW)
    const slugs = [...rows.map((r) => r.programme.slug), ...toBeAnnounced.map((p) => p.slug)]
    expect(slugs).not.toContain('money-mastery')
    expect(slugs).not.toContain('trauma-to-transcendence')
    expect(slugs).not.toContain('energy-clearing-basic')
  })
})

describe('liveCalendarSchema', () => {
  it('rejects a date not written YYYY-MM-DD', () => {
    expect(() => liveCalendarSchema.parse(file([{ start: '12/01/2027' }]))).toThrow()
  })

  it('rejects a day that does not exist', () => {
    expect(() => liveCalendarSchema.parse(file([{ start: '2027-02-31' }]))).toThrow()
  })

  it('rejects a bookHref that leaves the site', () => {
    expect(() => liveCalendarSchema.parse(file([{ start: '2027-01-12', bookHref: '//evil.example' }]))).toThrow()
  })

  it('rejects a programme listed twice', () => {
    expect(() =>
      liveCalendarSchema.parse({
        programmes: [
          { programmeSlug: 'meditation', format: 'Live via Zoom', sessions: [] },
          { programmeSlug: 'meditation', format: 'Live via Zoom', sessions: [] },
        ],
      }),
    ).toThrow()
  })

  it('rejects an end before the start', () => {
    expect(() => liveCalendarSchema.parse(file([{ start: '2027-02-01', end: '2027-01-01' }]))).toThrow()
  })

  it('rejects an unknown field, so a misspelt key is caught', () => {
    expect(() =>
      liveCalendarSchema.parse({
        programmes: [{ programmeSlug: 'meditation', format: 'Live via Zoom', sessions: [{ start: '2027-01-12', bookhref: '/shop/x' }] }],
      }),
    ).toThrow()
  })
})

describe('buildLiveCalendar', () => {
  it('shows every programme as to be announced when no date exists', () => {
    const cal = buildLiveCalendar(file([]), NOW)
    expect(cal.rows).toHaveLength(0)
    expect(cal.toBeAnnounced.map((p) => p.title)).toEqual(['The Inner Sanctuary', 'Present'])
  })

  it('uses Suzanne\'s card text for the summary', () => {
    const cal = buildLiveCalendar(file([]), NOW)
    expect(cal.toBeAnnounced[0]?.summary).toMatch(/^More than mindfulness\./)
  })

  it('sorts future dates and drops past ones', () => {
    const cal = buildLiveCalendar(
      file([{ start: '2027-03-01' }, { start: '2026-10-01' }, { start: '2027-01-12' }]),
      NOW,
    )
    expect(cal.rows.map((r) => r.session.start)).toEqual(['2027-01-12', '2027-03-01'])
    expect(cal.toBeAnnounced.map((p) => p.slug)).toEqual(['mindfulness'])
  })

  it('keeps a multi-week run until its last day', () => {
    const cal = buildLiveCalendar(file([{ start: '2026-10-20', end: '2026-11-10' }]), NOW)
    expect(cal.rows).toHaveLength(1)
  })

  it('moves a programme back to to be announced once its only date has passed', () => {
    const cal = buildLiveCalendar(file([{ start: '2026-11-09' }]), NOW)
    expect(cal.rows).toHaveLength(0)
    expect(cal.toBeAnnounced.map((p) => p.slug)).toContain('meditation')
  })

  it('books on the shop when a date has a bookHref, else registers interest', () => {
    const cal = buildLiveCalendar(
      file([{ start: '2027-01-12', bookHref: '/shop/meditation-live-via-zoom' }, { start: '2027-02-02' }]),
      NOW,
    )
    expect(cal.rows[0]?.action).toEqual({ label: 'Book', href: '/shop/meditation-live-via-zoom' })
    expect(cal.rows[1]?.action.label).toBe('Register interest')
    expect(cal.rows[1]?.action.href).toContain('/contact?')
  })

  it('throws on a slug that is not a published programme', () => {
    expect(() =>
      buildLiveCalendar({ programmes: [{ programmeSlug: 'no-such', format: 'Live via Zoom', sessions: [] }] }, NOW),
    ).toThrow(/no-such/)
  })
})

describe('getLiveCalendar with a broken file', () => {
  it('keeps the page alive: every resolvable programme to be announced', () => {
    const cal = getLiveCalendar(NOW, {
      programmes: [
        { programmeSlug: 'meditation', format: 'Live via Zoom', sessions: [{ start: '2027-02-31' }] },
        { programmeSlug: 'no-such', format: 'Live via Zoom', sessions: [] },
      ],
    })
    expect(cal.rows).toEqual([])
    expect(cal.toBeAnnounced.map((p) => p.slug)).toEqual(['meditation'])
  })
})

describe('date helpers', () => {
  it('reads today in Johannesburg, not UTC', () => {
    expect(todayInJohannesburg(new Date('2026-11-10T22:30:00Z'))).toBe('2026-11-11')
  })

  it('formats the date block without shifting the day', () => {
    expect(dateBlock('2027-01-12')).toEqual({ weekday: 'Tue', day: '12', month: 'Jan' })
  })

  it('formats a range and a single day', () => {
    expect(dateRange({ start: '2027-01-12' })).toBe('12 January 2027')
    expect(dateRange({ start: '2027-01-12', end: '2027-02-16' })).toBe('12 January 2027 to 16 February 2027')
  })

  it('groups rows by month in order', () => {
    const cal = buildLiveCalendar(file([{ start: '2027-01-12' }, { start: '2027-01-20' }, { start: '2027-02-02' }]), NOW)
    expect(groupByMonth(cal.rows).map((g) => [g.month, g.rows.length])).toEqual([
      ['January 2027', 2],
      ['February 2027', 1],
    ])
  })
})
