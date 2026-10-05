import { describe, it, expect } from 'vitest'
import { ENQUIRY_KEYS, ENQUIRY_OPTIONS, contactHref, resolveEnquiry, resolveTopic } from './enquiry'

describe('resolveEnquiry', () => {
  it('maps every short key to a real form option', () => {
    for (const [key, option] of Object.entries(ENQUIRY_KEYS)) {
      expect(resolveEnquiry(key)).toBe(option)
      expect(ENQUIRY_OPTIONS).toContain(option)
    }
  })

  it('is case-insensitive and trims', () => {
    expect(resolveEnquiry('  Speaking ')).toBe('Speaking Enquiry')
  })

  it('accepts the option label itself', () => {
    expect(resolveEnquiry('speaking enquiry')).toBe('Speaking Enquiry')
    expect(resolveEnquiry('1-on-1 Coaching')).toBe('1-on-1 Coaching')
  })

  it('uses the first value when the param is repeated', () => {
    expect(resolveEnquiry(['events', 'speaking'])).toBe('Events & Immersions')
  })

  it.each([undefined, '', 'nonsense', 'constructor', 'toString', '__proto__'])(
    'returns undefined for %s',
    (raw) => {
      expect(resolveEnquiry(raw)).toBeUndefined()
    },
  )
})

describe('resolveTopic', () => {
  it('returns a clean topic', () => {
    expect(resolveTopic('  3-Day   Immersion ')).toBe('3-Day Immersion')
  })

  it('strips control characters and newlines', () => {
    expect(resolveTopic('Line one\nLine\u0000two')).toBe('Line one Line two')
  })

  it('caps the length at 120 characters', () => {
    expect(resolveTopic('a'.repeat(500))).toHaveLength(120)
  })

  it.each([undefined, '', '   ', '\n\t'])('returns undefined for %j', (raw) => {
    expect(resolveTopic(raw)).toBeUndefined()
  })
})

describe('contactHref', () => {
  it('builds a /contact link with the enquiry, an encoded topic and the form anchor', () => {
    const href = contactHref('events', 'Resilience & Fortification')
    const url = new URL(href, 'http://localhost')

    expect(url.pathname).toBe('/contact')
    expect(url.searchParams.get('enquiry')).toBe('events')
    expect(url.searchParams.get('topic')).toBe('Resilience & Fortification')
    expect(url.hash).toBe('#message')
  })

  it('omits topic when none is given', () => {
    expect(contactHref('speaking')).toBe('/contact?enquiry=speaking#message')
  })

  it('round-trips through resolveEnquiry and resolveTopic', () => {
    const url = new URL(contactHref('group', 'Group Transformation Session waitlist'), 'http://localhost')

    expect(resolveEnquiry(url.searchParams.get('enquiry') ?? undefined)).toBe('Group Program')
    expect(resolveTopic(url.searchParams.get('topic') ?? undefined)).toBe(
      'Group Transformation Session waitlist',
    )
  })
})
