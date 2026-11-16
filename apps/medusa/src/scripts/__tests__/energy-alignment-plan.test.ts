import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import {
  describeChange,
  EXPECTED_HANDLES,
  NEW_NAME,
  planRename,
  renameText,
  type CategoryRow,
  type ProductRow,
} from '../lib/energy-alignment-plan'

// Titles as the review box held them on 16 Nov 2026 (read from the medusa database).
const MEMBERSHIP_TITLES: Record<string, string> = {
  S0226: 'Energy Clearing Student Membership',
  S0227: 'Energy Clearing Novice Practitioner - Basic Membership',
  S0228: 'Energy Clearing Novice Practitioner - Premier Membership',
  S0229: 'Energy Clearing Practitioner (Prdip) - Basic Membership',
  S0230: 'Energy Clearing Practitioner (Prdip) - Premier Membership',
  S0231: 'Energy Clearing Certified Practitioner (CertPrdip) - Basic Membership',
  S0232: 'Energy Clearing Certified Practitioner (CertPrdip) - Premier Membership',
  S0233: 'Energy Clearing Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership',
  S0234: 'Energy Clearing Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership',
  S0235: 'Energy Clearing Mentor (MentorPrdip) - Premier Membership',
  S0236: 'Energy Clearing Master Practitioner (MasterPrdip) - Premier Membership',
  S0237: 'Energy Clearing Certified Master Practitioner (CertMasterPrdip) - Premier Membership',
  S0238: 'Energy Clearing Instructor (Inst) - Premier Membership',
  S0239: 'Energy Clearing Certified Master Instructor (CertMasterInst) - Premier Membership',
}

const SHARED_DESCRIPTION =
  'Deep Energy Clearing programmes teach you the art of energetic clearing, identifying and releasing the energetic patterns that keep individuals stuck.\n\nLevel 1 covers clearing for yourself. Level 2 prepares you to offer energy clearing as a professional service.'

const product = (id: string, handle: string, title: string, extra: Partial<ProductRow> = {}): ProductRow => ({
  id,
  handle,
  title,
  subtitle: null,
  description: null,
  variants: [],
  ...extra,
})

const BOX: ProductRow[] = [
  product('p1', 'deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom', 'Deep Energy Clearing Level 1: Fundamentals', {
    description: SHARED_DESCRIPTION,
    variants: [
      { id: 'v1', title: 'Live Retaker' },
      { id: 'v2', title: 'Live via Zoom' },
      { id: 'v3', title: 'Self Study' },
    ],
  }),
  product('p2', 'deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom', 'Deep Energy Clearing Level 2: Advanced', {
    description: SHARED_DESCRIPTION,
  }),
  product('p3', 'deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom', 'Deep Energy Clearing Level 1 & 2: Purchased Together', {
    description: 'Deep Energy Clearing Fundamentals (Level 1, Clearing Self) and Advanced (Level 2, Clearing Others) purchased together at a bundled price.',
  }),
  product('d1', 'art-of-deep-clearing-level-1-self-study', 'Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom)'),
  product('d2', 'the-art-of-deep-clearing-live', 'Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Live via Zoom)'),
  ...Object.entries(MEMBERSHIP_TITLES).map(([sku, title]) =>
    product(`m${sku}`, `membership-${sku.toLowerCase()}`, title, { variants: [{ id: `mv${sku}`, title: 'Annual' }] }),
  ),
  // Not this programme: must stay as they are.
  product('o1', 'energetic-clearing-completed-remotely', 'Energetic Clearing', { subtitle: 'Energetic Clearing: Remote Session' }),
  product('o2', 'akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom', 'Akashic Navigator Level 1: Fundamentals'),
  product('o3', 'akashic-navigator-and-intuitive-coaching-clearing-others-level-2-advanced-live-via-zoom', 'Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live via Zoom)'),
  product('o4', 'membership-s0213', 'Akashic Student Membership'),
]

const CATEGORIES: CategoryRow[] = [
  { id: 'c1', handle: 'energy-clearing-programmes', name: 'Energy Clearing', description: '' },
  { id: 'c2', handle: 'energy-clearing-live', name: 'Live', description: '' },
  { id: 'c3', handle: 'energy-clearing-self-paced', name: 'Self Paced', description: '' },
  { id: 'c4', handle: 'energetic-clearing', name: 'Energetic Clearing', description: '' },
]

describe('renameText', () => {
  it('renames the programme name, with or without "Deep"', () => {
    expect(renameText('Deep Energy Clearing Level 1: Fundamentals')).toBe('Energy Alignment & Optimisation Level 1: Fundamentals')
    expect(renameText('Energy Clearing Student Membership')).toBe('Energy Alignment & Optimisation Student Membership')
    expect(renameText('Energy Clearing')).toBe(NEW_NAME)
  })

  it('leaves the technique, Energetic Clearing and the Akashic level names alone', () => {
    expect(renameText('offer energy clearing as a professional service')).toBe('offer energy clearing as a professional service')
    expect(renameText('the art of energetic clearing')).toBe('the art of energetic clearing')
    expect(renameText('Energetic Clearing: Remote Session')).toBe('Energetic Clearing: Remote Session')
    expect(renameText('Advanced: Clearing Others, Level 2')).toBe('Advanced: Clearing Others, Level 2')
  })

  it('writes no em dash', () => {
    expect(renameText('Deep Energy Clearing Level 2: Advanced')).not.toContain('—')
  })
})

describe('planRename on the review box catalogue', () => {
  const plan = planRename(BOX, CATEGORIES)

  it('renames the three products on sale, the two drafts and the 14 membership levels, and nothing else', () => {
    expect(plan.products.map((p) => p.handle).sort()).toEqual(
      [...EXPECTED_HANDLES, 'art-of-deep-clearing-level-1-self-study', 'the-art-of-deep-clearing-live'].sort(),
    )
    expect(plan.missing).toEqual([])
  })

  it('gives the shop titles the new name', () => {
    const title = (handle: string) => plan.products.find((p) => p.handle === handle)?.update.title
    expect(title('deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom')).toBe('Energy Alignment & Optimisation Level 1: Fundamentals')
    expect(title('deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom')).toBe('Energy Alignment & Optimisation Level 2: Advanced')
    expect(title('deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom')).toBe('Energy Alignment & Optimisation Level 1 & 2: Purchased Together')
  })

  it('renames the programme name in descriptions and keeps the technique wording', () => {
    const d = plan.products.find((p) => p.id === 'p1')?.update.description ?? ''
    expect(d.startsWith('Energy Alignment & Optimisation programmes teach you the art of energetic clearing')).toBe(true)
    expect(d).toContain('offer energy clearing as a professional service')
    expect(d).not.toContain('Energy Clearing')
  })

  it('gives each membership level exactly the title in apps/web/lib/access/tiers.ts', () => {
    const tiers = readFileSync(join(__dirname, '../../../../web/lib/access/tiers.ts'), 'utf8')
    for (const sku of Object.keys(MEMBERSHIP_TITLES)) {
      const renamed = plan.products.find((p) => p.handle === `membership-${sku.toLowerCase()}`)?.update.title
      expect(renamed, sku).toBeDefined()
      expect(tiers, sku).toContain(`sku: '${sku}', title: '${renamed}', handle: 'membership-${sku.toLowerCase()}'`)
    }
  })

  it('writes titles and descriptions only: never a handle, SKU or metadata', () => {
    for (const p of plan.products) {
      for (const field of Object.keys(p.update)) expect(['title', 'subtitle', 'description']).toContain(field)
    }
    expect(plan.variants).toEqual([])
  })

  it('renames the Energy Clearing category name, not its handle, and no other category', () => {
    expect(plan.categories).toEqual([
      {
        kind: 'category',
        id: 'c1',
        handle: 'energy-clearing-programmes',
        changes: [{ field: 'name', from: 'Energy Clearing', to: NEW_NAME }],
        update: { name: NEW_NAME },
      },
    ])
  })

  it('plans nothing on a second run', () => {
    const renamed = BOX.map((p) => {
      const change = plan.products.find((c) => c.id === p.id)
      return change ? { ...p, ...change.update } : p
    })
    const again = planRename(renamed, CATEGORIES.map((c) => (c.id === 'c1' ? { ...c, name: NEW_NAME } : c)))
    expect(again.products).toEqual([])
    expect(again.categories).toEqual([])
    expect(again.missing).toEqual([])
    expect(again.alreadyRenamed.sort()).toEqual([...EXPECTED_HANDLES].sort())
  })

  it('reports an expected product that is missing', () => {
    const partial = planRename(BOX.filter((p) => p.handle !== 'membership-s0239'), CATEGORIES)
    expect(partial.missing).toEqual(['membership-s0239'])
  })

  it('prints old -> new, the description shortened to the sentence that changes', () => {
    const p1 = plan.products.find((p) => p.id === 'p1')!
    const lines = p1.changes.map((c) => describeChange(p1, c))
    expect(lines[0]).toBe(
      'product deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom title: "Deep Energy Clearing Level 1: Fundamentals" -> "Energy Alignment & Optimisation Level 1: Fundamentals"',
    )
    expect(lines[1]).toMatch(/^product .* description: "\.\.\.Deep Energy Clearing programmes teach .*" -> "\.\.\.Energy Alignment & Optimisation programmes teach .*"$/)
  })
})
