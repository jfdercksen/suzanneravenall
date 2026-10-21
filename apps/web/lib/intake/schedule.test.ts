import { describe, it, expect, vi } from 'vitest'
import { firstReminderAt, nextReminderAt, parseReminderDelays, reminderDelays, MAX_REMINDERS } from './schedule'

const DAY = 86_400_000
const BOUGHT = new Date('2026-10-21T08:00:00Z')

describe('reminder schedule', () => {
  it('defaults to day 1, 3, 5, then every 3 days, six reminders', () => {
    expect(reminderDelays({}).map((ms) => ms / DAY)).toEqual([1, 3, 5, 8, 11, 14])
    expect(reminderDelays({})).toHaveLength(MAX_REMINDERS)
  })

  it('takes a time-compressed list from INTAKE_REMINDER_DELAYS', () => {
    expect(reminderDelays({ INTAKE_REMINDER_DELAYS: '2m,4m,6m' })).toEqual([120_000, 240_000, 360_000])
  })

  it.each(['', '1d,1d', '3d,1d', '1x', '1d,2d,3d,4d,5d,6d,7d', '0m'])('rejects %j', (raw) => {
    expect(parseReminderDelays(raw)).toBeNull()
  })

  it('falls back to the default on a bad value, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect(reminderDelays({ INTAKE_REMINDER_DELAYS: 'soon' })).toHaveLength(6)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('puts reminder 1 a day after the purchase', () => {
    expect(firstReminderAt(BOUGHT, reminderDelays({})).toISOString()).toBe('2026-10-22T08:00:00.000Z')
  })

  it('schedules each next reminder from the purchase time when on time', () => {
    const delays = reminderDelays({})
    const sentAt = new Date(BOUGHT.getTime() + DAY + 60_000) // reminder 1 went a minute late
    expect(nextReminderAt(BOUGHT, 1, sentAt, delays)?.toISOString()).toBe('2026-10-24T08:00:00.000Z') // day 3
    expect(nextReminderAt(BOUGHT, 3, new Date(BOUGHT.getTime() + 5 * DAY), delays)?.toISOString()).toBe(
      '2026-10-29T08:00:00.000Z', // day 8
    )
  })

  it('stops after the sixth reminder', () => {
    expect(nextReminderAt(BOUGHT, 6, new Date(BOUGHT.getTime() + 14 * DAY), reminderDelays({}))).toBeNull()
  })

  it('keeps the gap after a backlog instead of sending two at once', () => {
    const delays = reminderDelays({})
    const late = new Date(BOUGHT.getTime() + 10 * DAY) // the site was down; reminder 1 only goes on day 10
    expect(nextReminderAt(BOUGHT, 1, late, delays)?.getTime()).toBe(late.getTime() + 2 * DAY)
  })
})
