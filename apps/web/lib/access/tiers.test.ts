import { describe, it, expect } from 'vitest'
import {
  isDirectlyBuyable,
  startsOnApproval,
  memberTierName,
  MEMBERSHIP_TIERS,
  hasAccess,
  tierLabel,
  minimumTierFor,
  TIER_ORDER,
  TIER_ACCESS,
  UPGRADE_PATH,
  upgradeHref,
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
  it('returns "Guest Member" for free, the Guest Membership level (KI072)', () => {
    expect(tierLabel('free')).toBe('Guest Member')
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

describe('upgradeHref (site check M15)', () => {
  it('points at the portal upgrade page', () => {
    expect(UPGRADE_PATH).toBe('/portal/upgrade')
    expect(upgradeHref()).toBe('/portal/upgrade')
  })

  it('carries the gated path as an encoded from param', () => {
    expect(upgradeHref('/portal/videos')).toBe('/portal/upgrade?from=%2Fportal%2Fvideos')
  })
})

// KI071 switch-on (19 Nov 2026): Guest and Novice are never sold from /portal/upgrade (KI114).
describe('isDirectlyBuyable', () => {
  it('leaves out Guest only; Novice is bought and starts on approval (Suzanne, 19 Nov)', () => {
    const notBuyable = MEMBERSHIP_TIERS.filter((t) => !isDirectlyBuyable(t)).map((t) => t.sku)
    expect(notBuyable).toEqual(['S0211'])
    expect(MEMBERSHIP_TIERS.filter(isDirectlyBuyable)).toHaveLength(28)
    expect(MEMBERSHIP_TIERS.filter(startsOnApproval).map((t) => t.sku)).toEqual(['S0214', 'S0215', 'S0227', 'S0228'])
  })
})

describe('memberTierName', () => {
  it('reads the free base row and a missing row as Guest Membership', () => {
    expect(memberTierName({ name: 'Free Member', slug: 'free' })).toBe('Guest Membership')
    expect(memberTierName(null)).toBe('Guest Membership')
    expect(memberTierName(undefined)).toBe('Guest Membership')
  })

  it('keeps the stored name of any other tier', () => {
    expect(memberTierName({ name: 'Lifestyle Membership', slug: 'lifestyle' })).toBe('Lifestyle Membership')
  })
})

// One catalogue (KI128): the site's tiers must equal packages/integrations memberships.ts,
// which the store's order flow and scripts read.
describe('MEMBERSHIP_TIERS against the shared catalogue', () => {
  it('has the same SKU, title, programme, level, access level and prices for all 29', async () => {
    const { MEMBERSHIP_LEVELS } = await import('@suzanne/integrations')
    expect(MEMBERSHIP_TIERS.map((t) => [t.sku, t.title, t.track, t.level, t.tierType, t.accessLevel, t.zarPrice, t.usdPrice, t.annual])).toEqual(
      MEMBERSHIP_LEVELS.map((l) => [l.sku, l.title, l.programme, l.level, l.tierType, l.accessLevel, l.zar, l.usd, l.annual]),
    )
  })
})

describe('isMembershipProductHandle (KI129)', () => {
  it('matches the 29 membership handles only', async () => {
    const { isMembershipProductHandle } = await import('./tiers')
    expect(MEMBERSHIP_TIERS.every((t) => isMembershipProductHandle(t.handle))).toBe(true)
    expect(isMembershipProductHandle('getting-unstuck')).toBe(false)
    expect(isMembershipProductHandle(undefined)).toBe(false)
  })
})
