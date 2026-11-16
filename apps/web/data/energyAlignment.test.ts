import { describe, it, expect } from 'vitest'
import { richLineText } from '@/lib/content/richLine'
import { MEMBERSHIP_JOINING_RULE, MEMBERSHIP_TIERS, NOVICE_FUNDAMENTALS } from '@/lib/access/tiers'
import { BUNDLES, PROGRAMS, getBundleForSeries, getProgramBySlug, getProgramsBySeries } from './programs'
import { PROGRAMME_COPY, SERIES_PATHS } from './programmeCopy'
import { EAO_MARKED, EAO_NAME, EAO_STRAPLINE, withoutTrademark } from './energyAlignment'

// Suzanne, 12 Nov 2026: Energy Clearing is renamed Energy Alignment &
// Optimisation across the site. Ids keep the old name on purpose (KI116).

const OLD = 'Energy Clearing'

describe('Energy Alignment & Optimisation (was Energy Clearing)', () => {
  it('spells the name as in her 12 Nov document, with the trademark for first use', () => {
    expect(EAO_NAME).toBe('Energy Alignment & Optimisation')
    expect(EAO_MARKED).toBe('Energy Alignment & Optimisation™')
    expect(EAO_STRAPLINE).toBe("Aligning the body's energy systems for coherence, capacity and performance.")
    expect(withoutTrademark(EAO_MARKED)).toBe(EAO_NAME)
  })

  it('moves both levels to the new slugs and drops the old ones', () => {
    for (const level of ['basic', 'advanced']) {
      expect(getProgramBySlug(`energy-alignment-optimisation-${level}`)?.isPublished).toBe(true)
      expect(getProgramBySlug(`energy-clearing-${level}`)).toBeUndefined()
    }
  })

  it('names the levels and the bundle with the new name, the levels carrying the trademark', () => {
    expect(getProgramsBySeries('energy-clearing').map((p) => p.name)).toEqual([
      'Energy Alignment & Optimisation™: Self Clearing Level 1 (Basic)',
      'Energy Alignment & Optimisation™: Clearing Others Level 2 (Advanced)',
    ])
    expect(getBundleForSeries('energy-clearing')?.name).toBe('Energy Alignment & Optimisation Level 1 & 2: Purchased Together')
    expect(getProgramBySlug('energy-alignment-optimisation-advanced')?.prerequisite).toEqual({
      text: 'Energy Alignment & Optimisation Level 1 (Basic).',
      slug: 'energy-alignment-optimisation-basic',
    })
  })

  it('keeps the shop handles, so orders, access and the sale guard are unchanged', () => {
    expect([...getProgramsBySeries('energy-clearing'), getBundleForSeries('energy-clearing')].map((p) => p?.shopHandle)).toEqual([
      'deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom',
      'deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom',
      'deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom',
    ])
  })

  it('shows the old name nowhere in programme names, descriptions or her long-form copy', () => {
    for (const p of [...PROGRAMS, ...BUNDLES]) {
      expect([p.name, p.shortDescription, p.description, p.duration ?? '', ...(p.features ?? [])].join(' '), p.slug).not.toContain(OLD)
    }
    expect(JSON.stringify(PROGRAMME_COPY)).not.toContain(OLD)
    expect(JSON.stringify(SERIES_PATHS)).not.toContain(OLD)
  })

  it('keeps her copy otherwise, renaming the certificate and the practitioner title only', () => {
    const l1 = JSON.stringify(PROGRAMME_COPY['energy-alignment-optimisation-basic'])
    const l2 = JSON.stringify(PROGRAMME_COPY['energy-alignment-optimisation-advanced'])
    expect(l1).toContain('your Level 1 Energy Alignment & Optimisation certificate from The Ravenall Institute')
    expect(l2).toContain('certified as an Energy Alignment & Optimisation Practitioner by The Ravenall Institute')
    // The technique, not the programme name: left as she wrote it.
    expect(l1).toContain('Energy clearing is a complementary practice.')
    expect(SERIES_PATHS['energy-clearing']?.steps.map((s) => s.slug)).toEqual([
      'energy-alignment-optimisation-basic',
      'energy-alignment-optimisation-advanced',
    ])
  })

  it('renames all 14 membership levels of the ladder and keeps their SKUs, handles and track id', () => {
    const ladder = MEMBERSHIP_TIERS.filter((t) => t.track === 'energy-clearing')
    expect(ladder.map((t) => t.sku)).toEqual(Array.from({ length: 14 }, (_, i) => `S02${26 + i}`))
    for (const tier of ladder) {
      expect(tier.title.startsWith('Energy Alignment & Optimisation '), tier.sku).toBe(true)
      expect(tier.handle).toBe(`membership-${tier.sku.toLowerCase()}`)
    }
    expect(ladder[0]?.title).toBe('Energy Alignment & Optimisation Student Membership')
    expect(MEMBERSHIP_TIERS.map((t) => t.title).join(' ')).not.toContain(OLD)
  })

  it('renames the ladder in the joining rule', () => {
    const rule = MEMBERSHIP_JOINING_RULE.map(richLineText).join(' ')
    expect(rule).not.toContain(OLD)
    expect(rule).toContain('Akashic and Energy Alignment & Optimisation are separate ladders: you climb each one on its own.')
    expect(richLineText(NOVICE_FUNDAMENTALS['energy-clearing'].text)).not.toContain(OLD)
  })
})
