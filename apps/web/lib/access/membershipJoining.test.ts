import { describe, it, expect } from 'vitest'
import { placeholdersIn, richLineText } from '@/lib/content/richLine'
import {
  joiningLabel,
  joiningRequirement,
  MEMBERSHIP_JOINING_RULE,
  MEMBERSHIP_TIERS,
  NOVICE_FUNDAMENTALS,
} from './tiers'

// Suzanne, 12 Nov 2026: Lifestyle and Student have no prerequisites. Novice
// needs the fundamentals (1 programme Akashic, 1 Energy Clearing, 3 Resonance
// Repatterning), a teacher's sign-off, then the membership upgrade.

const byLevel = (level: string) => MEMBERSHIP_TIERS.filter((t) => t.level === level)

describe('who may join which membership level', () => {
  it('Lifestyle and both Student levels have no prerequisites', () => {
    const open = [...byLevel('lifestyle'), ...byLevel('student')]
    expect(open.map((t) => t.sku).sort()).toEqual(['S0212', 'S0213', 'S0226'])
    for (const tier of open) {
      expect(joiningRequirement(tier), tier.sku).toBe('none')
      expect(tier.requiresTraining, tier.sku).toBe(false)
      expect(joiningLabel(tier)).toBe('No prerequisites')
    }
  })

  it('every Novice level needs the fundamentals and a teacher sign-off, on two separate ladders', () => {
    const novice = byLevel('novice')
    expect(novice.map((t) => t.sku).sort()).toEqual(['S0214', 'S0215', 'S0227', 'S0228'])
    expect(new Set(novice.map((t) => t.track))).toEqual(new Set(['akashic', 'energy-clearing']))
    for (const tier of novice) {
      expect(joiningRequirement(tier), tier.sku).toBe('fundamentals-and-sign-off')
      expect(tier.requiresTraining, tier.sku).toBe(true)
      expect(joiningLabel(tier)).toBe('Fundamentals + teacher sign-off')
    }
  })

  it('states one fundamentals programme per ladder, a teacher sign-off and the upgrade', () => {
    for (const track of ['akashic', 'energy-clearing'] as const) {
      const rule = NOVICE_FUNDAMENTALS[track]
      expect(rule.programmes).toBe(1)
      const text = richLineText(rule.text)
      expect(text).toMatch(/one programme/)
      expect(text).toMatch(/teacher signs off/)
      expect(text).toMatch(/upgrade your membership/)
    }
  })

  it('the page rule names three Resonance Repatterning programmes and leaves which ones to Suzanne', () => {
    const text = MEMBERSHIP_JOINING_RULE.map(richLineText).join(' ')
    expect(text).toMatch(/Lifestyle and Student memberships have no prerequisites/)
    expect(text).toMatch(/one programme for Akashic, one for Energy Clearing and three for Resonance Repatterning/)
    expect(text).toMatch(/separate ladders/)
    expect(MEMBERSHIP_JOINING_RULE.flatMap((line) => placeholdersIn(line))).toEqual([
      { placeholder: 'which three Resonance Repatterning programmes count', owner: 'Suzanne' },
    ])
    expect(text).not.toContain('\u2014')
  })

  it('leaves the levels above Novice as requiring training', () => {
    for (const tier of MEMBERSHIP_TIERS.filter((t) => !['guest', 'lifestyle', 'student', 'novice'].includes(t.level))) {
      expect(joiningRequirement(tier), tier.sku).toBe('training')
    }
  })

  it('keeps the approved level and price table exactly as it was', () => {
    expect(MEMBERSHIP_TIERS.map((t) => [t.sku, t.zarPrice, t.usdPrice])).toEqual([
      ['S0211', 0, 0], ['S0212', 350, 20], ['S0213', 525, 30], ['S0214', 875, 50], ['S0215', 1225, 70],
      ['S0216', 1400, 80], ['S0217', 1750, 100], ['S0218', 1750, 100], ['S0219', 2100, 120], ['S0220', 1750, 100],
      ['S0221', 2100, 120], ['S0222', 1750, 100], ['S0223', 2625, 150], ['S0224', 2625, 150], ['S0225', 2625, 150],
      ['S0226', 525, 30], ['S0227', 875, 50], ['S0228', 1225, 70], ['S0229', 1400, 80], ['S0230', 1750, 100],
      ['S0231', 1750, 100], ['S0232', 2100, 120], ['S0233', 1750, 100], ['S0234', 2100, 120], ['S0235', 1750, 100],
      ['S0236', 2625, 150], ['S0237', 2625, 150], ['S0238', 2625, 150], ['S0239', 2625, 150],
    ])
  })
})
