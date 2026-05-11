import { describe, it, expect } from 'vitest'
import {
  hasAccess,
  tierLabel,
  minimumTierFor,
  TIER_ORDER,
  TIER_ACCESS,
} from './tiers'

describe('hasAccess', () => {
  describe('free tier', () => {
    it('returns true for resources_basic', () => {
      expect(hasAccess('free', 'resources_basic')).toBe(true)
    })

    it('returns false for resources_assessments', () => {
      expect(hasAccess('free', 'resources_assessments')).toBe(false)
    })

    it('returns false for live_session_recordings', () => {
      expect(hasAccess('free', 'live_session_recordings')).toBe(false)
    })

    it('returns false for certification_materials', () => {
      expect(hasAccess('free', 'certification_materials')).toBe(false)
    })
  })

  describe('silver tier', () => {
    it('returns true for resources_assessments', () => {
      expect(hasAccess('silver', 'resources_assessments')).toBe(true)
    })

    it('returns false for live_session_recordings', () => {
      expect(hasAccess('silver', 'live_session_recordings')).toBe(false)
    })

    it('returns false for certification_materials', () => {
      expect(hasAccess('silver', 'certification_materials')).toBe(false)
    })

    it('inherits free tier access for resources_basic', () => {
      expect(hasAccess('silver', 'resources_basic')).toBe(true)
    })
  })

  describe('gold tier', () => {
    it('returns true for live_session_recordings', () => {
      expect(hasAccess('gold', 'live_session_recordings')).toBe(true)
    })

    it('returns false for certification_materials', () => {
      expect(hasAccess('gold', 'certification_materials')).toBe(false)
    })

    it('inherits silver tier access for resources_assessments', () => {
      expect(hasAccess('gold', 'resources_assessments')).toBe(true)
    })
  })

  describe('practitioner tier', () => {
    it('returns true for certification_materials', () => {
      expect(hasAccess('practitioner', 'certification_materials')).toBe(true)
    })

    it('inherits gold tier access for live_session_recordings', () => {
      expect(hasAccess('practitioner', 'live_session_recordings')).toBe(true)
    })

    it('returns true for practitioner_resources', () => {
      expect(hasAccess('practitioner', 'practitioner_resources')).toBe(true)
    })
  })

  describe('unknown tier fallback', () => {
    it('falls back to free tier — returns true for resources_basic', () => {
      expect(hasAccess('unknown-tier', 'resources_basic')).toBe(true)
    })

    it('falls back to free tier — returns false for resources_assessments', () => {
      expect(hasAccess('unknown-tier', 'resources_assessments')).toBe(false)
    })

    it('falls back to free tier — returns false for certification_materials', () => {
      expect(hasAccess('unknown-tier', 'certification_materials')).toBe(false)
    })
  })
})

describe('tierLabel', () => {
  it('returns "Free Member" for free', () => {
    expect(tierLabel('free')).toBe('Free Member')
  })

  it('returns "Silver Member" for silver', () => {
    expect(tierLabel('silver')).toBe('Silver Member')
  })

  it('returns "Gold Member" for gold', () => {
    expect(tierLabel('gold')).toBe('Gold Member')
  })

  it('returns "Practitioner" for practitioner', () => {
    expect(tierLabel('practitioner')).toBe('Practitioner')
  })
})

describe('minimumTierFor', () => {
  it('returns "free" for resources_basic', () => {
    expect(minimumTierFor('resources_basic')).toBe('free')
  })

  it('returns "free" for blog', () => {
    expect(minimumTierFor('blog')).toBe('free')
  })

  it('returns "silver" for resources_assessments', () => {
    expect(minimumTierFor('resources_assessments')).toBe('silver')
  })

  it('returns "gold" for live_session_recordings', () => {
    expect(minimumTierFor('live_session_recordings')).toBe('gold')
  })

  it('returns "practitioner" for practitioner_resources', () => {
    expect(minimumTierFor('practitioner_resources')).toBe('practitioner')
  })

  it('returns "practitioner" for certification_materials', () => {
    expect(minimumTierFor('certification_materials')).toBe('practitioner')
  })
})

describe('TIER_ORDER', () => {
  it('contains all four tiers in ascending order', () => {
    expect(TIER_ORDER).toEqual(['free', 'silver', 'gold', 'practitioner'])
  })
})

describe('TIER_ACCESS structure', () => {
  it('has entries for all four tiers', () => {
    expect(Object.keys(TIER_ACCESS)).toEqual(['free', 'silver', 'gold', 'practitioner'])
  })

  it('tiers are strictly additive — gold has all silver permissions', () => {
    const silverKeys = Object.keys(TIER_ACCESS.silver) as (keyof typeof TIER_ACCESS.silver)[]
    for (const key of silverKeys) {
      if (TIER_ACCESS.silver[key]) {
        expect(TIER_ACCESS.gold[key]).toBe(true)
      }
    }
  })

  it('tiers are strictly additive — practitioner has all gold permissions', () => {
    const goldKeys = Object.keys(TIER_ACCESS.gold) as (keyof typeof TIER_ACCESS.gold)[]
    for (const key of goldKeys) {
      if (TIER_ACCESS.gold[key]) {
        expect(TIER_ACCESS.practitioner[key]).toBe(true)
      }
    }
  })
})
