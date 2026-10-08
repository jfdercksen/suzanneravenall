import { describe, it, expect } from 'vitest'
import { formatWatchAt, MASTERCLASS_OFFER } from './masterclass'
import { leadWelcomeNext, LEAD_WELCOME_CONTENT } from './email/lead-welcome-content'

const NOW = new Date('2026-10-08T07:00:00Z')

describe('formatWatchAt (masterclass Watch Later)', () => {
  it('formats the visitor\'s own date and time', () => {
    expect(formatWatchAt('2026-10-09', '19:00', NOW)).toBe('Friday 9 October 2026 at 19:00')
  })

  it.each([
    ['', '19:00'],
    ['2026-10-09', ''],
    ['2026-02-30', '10:00'],
    ['2026-10-09', '24:00'],
    ['09/10/2026', '10:00'],
    ['2026-10-01', '10:00'],
    ['2028-01-01', '10:00'],
  ])('rejects %s %s', (date, time) => {
    expect(formatWatchAt(date, time, NOW)).toBeNull()
  })

  it('accepts yesterday, for a visitor behind UTC', () => {
    expect(formatWatchAt('2026-10-07', '22:00', NOW)).not.toBeNull()
  })
})

describe('masterclass welcome email wording', () => {
  it('links to the viewing page', () => {
    expect(LEAD_WELCOME_CONTENT.masterclass.link.path).toBe('/masterclass/watch')
  })

  it('names the Watch Later time, and no other form is affected', () => {
    expect(leadWelcomeNext('masterclass', 'Friday 9 October 2026 at 19:00')).toContain('You chose to watch on Friday 9 October 2026 at 19:00.')
    expect(leadWelcomeNext('masterclass', null)).toBe(LEAD_WELCOME_CONTENT.masterclass.next)
    expect(leadWelcomeNext('newsletter', 'x')).toBe(LEAD_WELCOME_CONTENT.newsletter.next)
  })

  it('has no em dashes', () => {
    expect(JSON.stringify(LEAD_WELCOME_CONTENT.masterclass) + leadWelcomeNext('masterclass', 'x')).not.toMatch(/\u2014/)
  })

  it('offers 25% off with the current site\'s code, in capitals (Shayna, 8 Oct)', () => {
    expect(MASTERCLASS_OFFER?.code).toBe('MASTERCLASS-T59SW7S')
    expect(MASTERCLASS_OFFER?.text).toMatch(/25% off the Trauma to Transcendence programme/)
  })
})
