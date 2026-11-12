import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import {
  brainwaveProduct,
  coachingAppProduct,
  KEEP_ON_SALE,
  LIVE_ONLY_HANDLES,
  parseRestore,
  planLiveOnly,
  planNewProducts,
  targetStatusFor,
  type ProductState,
} from '../lib/shop-changes-plan'

// The six products as the review box held them on 12 Nov 2026 (store API read).
const BOX: ProductState[] = [
  { id: 'p1', handle: 'love-relationships-live', variants: [
    { id: 'v1', title: 'Live via Zoom', metadata: { thinkific_course_id: '2434091' } },
    { id: 'v2', title: 'Self Study', metadata: { thinkific_course_id: '1892729' } },
  ] },
  { id: 'p2', handle: 'intuition-in-my-personal-capacity-live', variants: [
    { id: 'v3', title: 'Business Capacity: Live via Zoom', metadata: { thinkific_course_id: '2434092' } },
    { id: 'v4', title: 'Business Capacity: Self Study', metadata: { thinkific_course_id: '1895565' } },
    { id: 'v5', title: 'Personal Capacity: Live via Zoom', metadata: { thinkific_course_id: '1892722' } },
    { id: 'v6', title: 'Personal Capacity: Self Study', metadata: { thinkific_course_id: '2434112' } },
  ] },
  { id: 'p3', handle: 'be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live', variants: [
    { id: 'v7', title: 'Live via Zoom', metadata: { thinkific_course_id: '2434133' } },
    { id: 'v8', title: 'Self Study', metadata: { thinkific_course_id: '1892677' } },
  ] },
  { id: 'p4', handle: 'be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live', variants: [
    { id: 'v9', title: 'Live via Zoom', metadata: { thinkific_course_id: '2434134' } },
  ] },
  { id: 'p5', handle: 'meditation-live-via-zoom', variants: [
    { id: 'v10', title: 'Live via Zoom', metadata: { thinkific_course_id: '2434094' } },
    { id: 'v11', title: 'Self Study', metadata: { thinkific_course_id: '1892716' } },
  ] },
  { id: 'p6', handle: 'mindfulness-live', variants: [
    { id: 'v12', title: 'Live via Zoom', metadata: { thinkific_course_id: '1892702' } },
    { id: 'v13', title: 'Self Study', metadata: { thinkific_course_id: '2434157' } },
  ] },
]

/** Applies a plan the way Medusa merges metadata ("" removes a key). */
function apply(products: ProductState[], plan: ReturnType<typeof planLiveOnly>): ProductState[] {
  const byId = new Map(plan.updates.map((u) => [u.variantId, u.metadata]))
  return products.map((p) => ({
    ...p,
    variants: p.variants.map((v) => {
      const next = byId.get(v.id)
      if (!next) return v
      const merged: Record<string, unknown> = { ...v.metadata }
      for (const [k, val] of Object.entries(next)) {
        if (val === '') delete merged[k]
        else merged[k] = val
      }
      return { ...v, metadata: merged }
    }),
  }))
}

describe('live-only plan (Suzanne 12 Nov)', () => {
  it('retires every Self Study variant and puts every live variant on register interest', () => {
    const plan = planLiveOnly(BOX)
    expect(plan.missing).toEqual([])
    expect(plan.updates).toHaveLength(13)
    const to = Object.fromEntries(plan.updates.map((u) => [u.title + ' @' + u.handle.slice(0, 12), u.to]))
    expect(to['Self Study @love-relatio']).toBe('retired')
    expect(to['Live via Zoom @love-relatio']).toBe('register_interest')
    expect(to['Business Capacity: Self Study @intuition-in']).toBe('retired')
    expect(to['Personal Capacity: Self Study @intuition-in']).toBe('retired')
    expect(to['Personal Capacity: Live via Zoom @intuition-in']).toBe('register_interest')
    expect(plan.updates.filter((u) => u.to === 'retired')).toHaveLength(6)
  })

  it('keeps every other metadata key, the Thinkific course ids included', () => {
    for (const u of planLiveOnly(BOX).updates) {
      expect(u.metadata.thinkific_course_id, u.variantId).toBeTruthy()
      expect(u.metadata.sale_status_since).toBe('2026-11-12')
    }
  })

  it('changes nothing on a second run', () => {
    const after = apply(BOX, planLiveOnly(BOX))
    const again = planLiveOnly(after)
    expect(again.updates).toEqual([])
    expect(again.unchanged).toBe(13)
  })

  it('RESTORE puts only the retired Self Study back on sale; live stays register interest', () => {
    const after = apply(BOX, planLiveOnly(BOX))
    const restore = planLiveOnly(after, new Set(['mindfulness-live']))
    expect(restore.updates).toHaveLength(1)
    expect(restore.updates[0]).toMatchObject({ variantId: 'v13', from: 'retired', to: null })
    expect(restore.updates[0].metadata).toMatchObject({ sale_status: '', thinkific_course_id: '2434157' })
    const restored = apply(after, restore)
    expect(restored.find((p) => p.handle === 'mindfulness-live')!.variants.find((v) => v.id === 'v13')!.metadata).toEqual({ thinkific_course_id: '2434157' })
  })

  it('reports a missing product and never touches the recorded Love & Relationships group series', () => {
    const plan = planLiveOnly([
      ...BOX.slice(1),
      { id: 'g', handle: KEEP_ON_SALE[0], variants: [{ id: 'gv', title: 'Self Study', metadata: null }] },
    ])
    expect(plan.missing).toEqual(['love-relationships-live'])
    expect(plan.updates.some((u) => u.handle === 'love-relationships-group-session')).toBe(false)
    expect(LIVE_ONLY_HANDLES).not.toContain('love-relationships-group-session')
  })

  it('reads self-study titles the way the shop does', () => {
    expect(targetStatusFor('Self Study')).toBe('retired')
    expect(targetStatusFor('Business Capacity: Self-Study')).toBe('retired')
    expect(targetStatusFor('Live via Zoom')).toBe('register_interest')
    expect(targetStatusFor(null)).toBe('register_interest')
  })

  it('parses RESTORE and flags handles it does not manage', () => {
    expect(parseRestore(' mindfulness-live, love-relationships-group-session ,')).toEqual({
      handles: new Set(['mindfulness-live']),
      unknown: ['love-relationships-group-session'],
    })
    expect(parseRestore(undefined).handles.size).toBe(0)
  })

  it('lists the same products as the web register-interest programmes', () => {
    // apps/web/data/programs.ts derives REGISTER_INTEREST_HANDLES from the programmes; these must match.
    const programs = readFileSync(join(__dirname, '../../../../web/data/programs.ts'), 'utf8')
    for (const handle of LIVE_ONLY_HANDLES) expect(programs).toContain(`shopHandle: '${handle}'`)
  })
})

describe('new products', () => {
  const ctx = { categoryId: 'pcat_tools', salesChannelId: 'sc_1', shippingProfileId: 'sp_1' }

  it('creates both when neither exists, and nothing when both do', () => {
    expect(planNewProducts(new Set(), ctx).map((p) => p.handle)).toEqual(['brainwave-club', 'suzanne-ravenall-coaching-app'])
    expect(planNewProducts(new Set(['brainwave-club', 'suzanne-ravenall-coaching-app']), ctx)).toEqual([])
    expect(planNewProducts(new Set(['brainwave-club']), ctx).map((p) => p.handle)).toEqual(['suzanne-ravenall-coaching-app'])
  })

  it('Brainwave Club is a partner product: no price, refused in a cart, the old shop copy', () => {
    const p = brainwaveProduct(ctx)
    expect(p.variants).toHaveLength(1)
    expect(p.variants[0].prices).toEqual([])
    expect(p.variants[0].metadata).toEqual({ sale_status: 'partner' })
    expect(p.description.split('\n\n')[0]).toMatch(/^Brainwave Club membership offers you instant access to a library that contains 39 unique/)
    expect(p.description).toMatch(/3xPureTone™/)
    expect(p.description).not.toMatch(/View this Product/)
    expect(p.description).not.toContain('\u2014')
    expect(p.thumbnail).toBe('/images/products/brainwave-club.png')
    expect(p.category_ids).toEqual(['pcat_tools'])
  })

  it('the Coaching App is once-off R250 in rand only, with no description and nothing to provision', () => {
    const p = coachingAppProduct({ ...ctx, shippingProfileId: null })
    expect(p.title).toBe('Suzanne Ravenall Coaching App')
    expect(p.variants[0].prices).toEqual([{ currency_code: 'zar', amount: 25000 }])
    expect('description' in p).toBe(false)
    expect('shipping_profile_id' in p).toBe(false)
    expect(JSON.stringify(p)).not.toMatch(/subscription|trial|thinkific/i)
  })

  it('copies the sales channel when the reference product has one, and leaves it out when it has none', () => {
    expect(coachingAppProduct(ctx).sales_channels).toEqual([{ id: 'sc_1' }])
    expect(brainwaveProduct(ctx).sales_channels).toEqual([{ id: 'sc_1' }])
    const bare = { ...ctx, salesChannelId: null, shippingProfileId: null }
    expect('sales_channels' in coachingAppProduct(bare)).toBe(false)
    expect('sales_channels' in brainwaveProduct(bare)).toBe(false)
  })
})
