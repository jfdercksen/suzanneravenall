import { describe, expect, it } from 'vitest'
import {
  isNoviceLevel,
  isSellableLevel,
  MEMBERSHIP_LEVELS,
  membershipAccessFields,
  membershipBySku,
  membershipHandle,
  membershipProgrammeName,
  membershipTermEnd,
  membershipTierSlug,
} from './memberships'

describe('membership catalogue (KI128)', () => {
  it('holds the 29 levels S0211 to S0239 once each', () => {
    expect(MEMBERSHIP_LEVELS.map((l) => l.sku)).toEqual(Array.from({ length: 29 }, (_, i) => `S0${211 + i}`))
  })

  it('finds a level by SKU in any case, and nothing for an unknown one', () => {
    expect(membershipBySku('s0216')?.title).toBe('Akashic Practitioner (Prdip) - Basic Membership')
    expect(membershipBySku(' S0226 ')?.programme).toBe('energy-clearing')
    expect(membershipBySku('silver')).toBeUndefined()
    expect(membershipBySku(undefined)).toBeUndefined()
  })

  it('names the handle and the membership_tiers slug from the SKU', () => {
    const level = membershipBySku('S0212')!
    expect(membershipHandle(level)).toBe('membership-s0212')
    expect(membershipTierSlug(level)).toBe('s0212')
  })

  it('marks exactly the four Novice levels and leaves Guest unsold', () => {
    expect(MEMBERSHIP_LEVELS.filter(isNoviceLevel).map((l) => l.sku)).toEqual(['S0214', 'S0215', 'S0227', 'S0228'])
    expect(MEMBERSHIP_LEVELS.filter((l) => !isSellableLevel(l)).map((l) => l.sku)).toEqual(['S0211'])
  })

  it('runs a term 365 days from its start', () => {
    expect(membershipTermEnd(new Date('2026-11-20T10:00:00Z')).toISOString()).toBe('2027-11-20T10:00:00.000Z')
  })

  it('builds the active row for a level', () => {
    expect(membershipAccessFields(membershipBySku('S0229')!, new Date('2026-11-20T00:00:00Z'))).toEqual({
      status: 'active',
      start_date: '2026-11-20T00:00:00.000Z',
      end_date: '2027-11-20T00:00:00.000Z',
      annual_renewal_date: '2027-11-20T00:00:00.000Z',
      access_level: 5,
      track: 'energy-clearing',
      sku: 'S0229',
    })
  })

  it('names the programme, none for Guest and Lifestyle', () => {
    expect(membershipProgrammeName(membershipBySku('S0213')!)).toBe('Akashic Navigation')
    expect(membershipProgrammeName(membershipBySku('S0230')!)).toBe('Energy Alignment & Optimisation')
    expect(membershipProgrammeName(membershipBySku('S0212')!)).toBeNull()
  })

  it('is annual for every level but Guest', () => {
    expect(MEMBERSHIP_LEVELS.filter((l) => !l.annual).map((l) => l.sku)).toEqual(['S0211'])
  })
})

describe('memberships stay out of the shop and search (KI129)', () => {
  it('knows the 29 membership handles and nothing else', async () => {
    const { isMembershipHandle } = await import('./memberships')
    const { isSearchable } = await import('./meili')
    expect(isMembershipHandle('membership-s0216')).toBe(true)
    expect(isMembershipHandle('membership-free')).toBe(false)
    expect(isMembershipHandle(null)).toBe(false)
    expect(isSearchable({ id: 'p1', handle: 'membership-s0216', status: 'published' })).toBe(false)
    expect(isSearchable({ id: 'p2', handle: 'getting-unstuck', status: 'published' })).toBe(true)
  })
})
