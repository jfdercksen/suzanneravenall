import { describe, it, expect } from 'vitest'
import { placeholdersIn, richLineText } from '@/lib/content/richLine'
import {
  joiningLabel,
  joiningRequirement,
  MEMBERSHIP_JOINING_RULE,
  MEMBERSHIP_TIERS,
  NOVICE_FUNDAMENTALS,
} from './tiers'

// Lifestyle and Student: no prerequisites (Suzanne, 12 Nov 2026). Novice: her
// Career & Certification Pathway documents of 12 Nov, used as sent (Johan,
// 16 Nov): Akashic Novice Navigator AN1 + AN2, Energy Alignment & Optimisation
// Novice Practitioner EA1 + EA2, Rapid Repatterning Novice Practitioner RP1 + RP2.

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

  it('every Novice level needs the two programmes of its ladder and the observation, on two separate ladders', () => {
    const novice = byLevel('novice')
    expect(novice.map((t) => t.sku).sort()).toEqual(['S0214', 'S0215', 'S0227', 'S0228'])
    expect(new Set(novice.map((t) => t.track))).toEqual(new Set(['akashic', 'energy-clearing']))
    for (const tier of novice) {
      expect(joiningRequirement(tier), tier.sku).toBe('novice-prerequisites')
      expect(tier.requiresTraining, tier.sku).toBe(true)
      expect(joiningLabel(tier), tier.sku).toBe(tier.track === 'akashic' ? 'AN1 + AN2 + observation' : 'EA1 + EA2 + observation')
    }
  })

  it('states the Novice prerequisite of each ladder as the pathway documents do, with the pathway link', () => {
    expect(NOVICE_FUNDAMENTALS.akashic).toMatchObject({ prerequisite: 'AN1 + AN2', status: 'Novice Navigator' })
    expect(NOVICE_FUNDAMENTALS['energy-clearing']).toMatchObject({ prerequisite: 'EA1 + EA2', status: 'Novice Practitioner' })
    expect(JSON.stringify(NOVICE_FUNDAMENTALS.akashic.text)).toContain('/programs/certification/akashic-navigation')
    expect(JSON.stringify(NOVICE_FUNDAMENTALS['energy-clearing'].text)).toContain('/programs/certification/energy-alignment-optimisation')
    for (const rule of Object.values(NOVICE_FUNDAMENTALS)) expect(richLineText(rule.text)).not.toMatch(/teacher|sign/)
  })

  it('the page rule names all three Novice prerequisites, links the three pathways and says nothing about Resonance Repatterning', () => {
    const text = MEMBERSHIP_JOINING_RULE.map(richLineText).join(' ')
    expect(text).toMatch(/Lifestyle and Student memberships have no prerequisites/)
    expect(text).toContain('Akashic Navigation™ Novice Navigator completes AN1 + AN2')
    expect(text).toContain('Energy Alignment & Optimisation™ Novice Practitioner EA1 + EA2')
    expect(text).toContain('Rapid Repatterning™ Novice Practitioner RP1 + RP2')
    expect(text).toMatch(/separate ladders/)
    expect(text).not.toMatch(/Resonance Repatterning|teacher signs off|sign-off/)
    expect(MEMBERSHIP_JOINING_RULE.flatMap((line) => placeholdersIn(line))).toEqual([])
    const links = JSON.stringify(MEMBERSHIP_JOINING_RULE)
    for (const slug of ['akashic-navigation', 'energy-alignment-optimisation', 'rapid-repatterning']) {
      expect(links).toContain(`/programs/certification/${slug}`)
    }
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
