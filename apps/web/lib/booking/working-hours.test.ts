import { afterEach, describe, expect, it, vi } from 'vitest'
import { easterSunday, isLateChange, isWorkingDay, saPublicHolidays, workingMinutesBetween } from './working-hours'

// SAST is UTC+2: 08:00 SAST = 06:00Z.
const sast = (local: string) => new Date(`${local}+02:00`)

describe('saPublicHolidays', () => {
  it('knows Easter for the years around launch', () => {
    expect(new Date(easterSunday(2026)).toISOString().slice(0, 10)).toBe('2026-04-05')
    expect(new Date(easterSunday(2027)).toISOString().slice(0, 10)).toBe('2027-03-28')
  })

  it('lists the fixed days, Good Friday, Family Day and the Monday after a Sunday holiday', () => {
    const days = saPublicHolidays(2026)
    for (const d of ['2026-01-01', '2026-03-21', '2026-04-03', '2026-04-06', '2026-04-27', '2026-05-01', '2026-06-16', '2026-08-09', '2026-09-24', '2026-12-16', '2026-12-25', '2026-12-26']) {
      expect(days.has(d)).toBe(true)
    }
    // 9 August 2026 is a Sunday: Monday 10 August is the day off.
    expect(days.has('2026-08-10')).toBe(true)
    expect(days.has('2026-10-26')).toBe(false)
  })

  it('adds declared days from SA_EXTRA_PUBLIC_HOLIDAYS', () => {
    vi.stubEnv('SA_EXTRA_PUBLIC_HOLIDAYS', '2031-05-07, nonsense')
    expect(saPublicHolidays(2031).has('2031-05-07')).toBe(true)
  })

  afterEach(() => vi.unstubAllEnvs())
})

describe('isWorkingDay', () => {
  it('is false on weekends and holidays, true on an ordinary weekday', () => {
    expect(isWorkingDay(Date.UTC(2026, 9, 26))).toBe(true) // Mon 26 Oct
    expect(isWorkingDay(Date.UTC(2026, 9, 24))).toBe(false) // Sat
    expect(isWorkingDay(Date.UTC(2026, 11, 16))).toBe(false) // Reconciliation Day
  })
})

describe('workingMinutesBetween', () => {
  it('counts only 08:00 to 17:00 SAST on working days', () => {
    expect(workingMinutesBetween(sast('2026-10-26T07:00:00'), sast('2026-10-26T18:00:00'))).toBe(9 * 60)
    expect(workingMinutesBetween(sast('2026-10-26T16:30:00'), sast('2026-10-27T08:30:00'))).toBe(60)
  })

  it('skips the weekend', () => {
    expect(workingMinutesBetween(sast('2026-10-30T16:00:00'), sast('2026-11-02T09:00:00'))).toBe(120)
  })

  it('is 0 when the session has already started', () => {
    expect(workingMinutesBetween(sast('2026-10-27T10:00:00'), sast('2026-10-27T09:00:00'))).toBe(0)
  })

  it('stops at the cap', () => {
    expect(workingMinutesBetween(sast('2026-01-05T08:00:00'), sast('2026-12-31T17:00:00'), 2880)).toBe(2880)
  })
})

describe('isLateChange', () => {
  const session = sast('2026-11-16T09:00:00') // Monday

  it('matches the Terms example: Monday 09:00 needs the change by 15:00 on the Friday ten days earlier', () => {
    expect(isLateChange(sast('2026-11-06T15:00:00'), session)).toBe(false)
    expect(isLateChange(sast('2026-11-06T15:01:00'), session)).toBe(true)
  })

  it('a change a week ahead is late when a holiday eats the notice', () => {
    // Wed 16 Dec is Reconciliation Day: a Friday 18 Dec 09:00 session changed
    // on Fri 11 Dec 09:00 has 4 working days (36 h) to go.
    expect(isLateChange(sast('2026-12-11T09:00:00'), sast('2026-12-18T09:00:00'))).toBe(true)
  })

  it('a change after the start is late', () => {
    expect(isLateChange(sast('2026-11-16T10:00:00'), session)).toBe(true)
  })
})
