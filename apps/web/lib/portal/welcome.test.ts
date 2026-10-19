import { describe, expect, it } from 'vitest'
import { isFirstSession, welcomeHeading } from './welcome'
import { membershipsEnabled } from '@/lib/access/memberships'

describe('isFirstSession', () => {
  it('is true when the last sign-in is the confirmation sign-in', () => {
    expect(
      isFirstSession({
        created_at: '2026-10-16T08:00:00Z',
        email_confirmed_at: '2026-10-16T09:30:00Z',
        last_sign_in_at: '2026-10-16T09:30:02Z',
      })
    ).toBe(true)
  })

  it('uses created_at when the address needed no confirmation', () => {
    expect(isFirstSession({ created_at: '2026-10-16T08:00:00Z', last_sign_in_at: '2026-10-16T08:00:01Z' })).toBe(true)
  })

  it('is false once the member has signed in again', () => {
    expect(
      isFirstSession({
        created_at: '2026-10-16T08:00:00Z',
        email_confirmed_at: '2026-10-16T08:01:00Z',
        last_sign_in_at: '2026-10-18T07:00:00Z',
      })
    ).toBe(false)
  })

  it('is false when the times are missing', () => {
    expect(isFirstSession({})).toBe(false)
    expect(isFirstSession({ created_at: '2026-10-16T08:00:00Z' })).toBe(false)
  })
})

describe('welcomeHeading', () => {
  it('says Welcome on the first session and Welcome back after', () => {
    expect(welcomeHeading('Johan', true)).toBe('Welcome, Johan')
    expect(welcomeHeading('Johan', false)).toBe('Welcome back, Johan')
    expect(welcomeHeading('', true)).toBe('Welcome')
  })
})

describe('membershipsEnabled', () => {
  it('is off unless MEMBERSHIPS_ENABLED is exactly "true"', () => {
    expect(membershipsEnabled({})).toBe(false)
    expect(membershipsEnabled({ MEMBERSHIPS_ENABLED: 'false' })).toBe(false)
    expect(membershipsEnabled({ MEMBERSHIPS_ENABLED: '1' })).toBe(false)
    expect(membershipsEnabled({ MEMBERSHIPS_ENABLED: 'true' })).toBe(true)
  })
})
