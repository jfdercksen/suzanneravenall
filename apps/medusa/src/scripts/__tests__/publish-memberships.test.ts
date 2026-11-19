import { readFileSync } from 'fs'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import publishMemberships from '../publish-memberships-2026-11-19'
import { HELD_BACK, planPublish, PUBLISH_TIERS, type MembershipRow } from '../lib/membership-publish-plan'

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))

const runs = vi.hoisted(() => ({ products: [] as unknown[] }))
vi.mock('@medusajs/medusa/core-flows', () => ({
  updateProductsWorkflow: () => ({ run: async (args: unknown) => void runs.products.push(args) }),
}))

const SC = 'sc_default'

/** A tier as the 2026 seed left it on the box: draft, no channel, no metadata.tier. */
function seeded(handle: string, overrides: Partial<MembershipRow> = {}): MembershipRow {
  const spec = PUBLISH_TIERS.find((t) => t.handle === handle)
  return {
    id: `prod_${handle}`,
    handle,
    title: spec?.title ?? 'Guest Membership',
    status: 'draft',
    description: null,
    metadata: { product_type: 'membership', sku: spec?.sku },
    sales_channels: [],
    variants: [{ id: `var_${handle}`, manage_inventory: false, prices: [
      { currency_code: 'zar', amount: (spec?.zar ?? 0) * 100 },
      { currency_code: 'usd', amount: (spec?.usd ?? 0) * 100 },
    ] }],
    ...overrides,
  }
}

const ready = (handle: string) => seeded(handle, { metadata: { product_type: 'membership', tier: 'silver' }, description: 'About it' })

describe('membership publish plan (KI071 switch-on)', () => {
  it('covers 24 tiers and holds back Guest and the four Novice tiers (KI114)', () => {
    expect(PUBLISH_TIERS).toHaveLength(24)
    expect(Object.keys(HELD_BACK).sort()).toEqual(['membership-s0211', 'membership-s0214', 'membership-s0215', 'membership-s0227', 'membership-s0228'])
    for (const handle of Object.keys(HELD_BACK)) expect(PUBLISH_TIERS.some((t) => t.handle === handle)).toBe(false)
  })

  it('gives every tier exactly the title and price in apps/web/lib/access/tiers.ts', () => {
    const tiers = readFileSync(join(__dirname, '../../../../web/lib/access/tiers.ts'), 'utf8')
    for (const spec of PUBLISH_TIERS) {
      const line = tiers.split('\n').find((l) => l.includes(`sku: '${spec.sku}'`)) ?? ''
      expect(line).toContain(`title: '${spec.title}'`)
      expect(line).toContain(`handle: '${spec.handle}'`)
      expect(line).toContain(`zarPrice: ${spec.zar},`)
      expect(line).toContain(`usdPrice: ${spec.usd},`)
    }
  })

  it('blocks a seeded tier: no metadata.tier means a paid order activates nothing (KI128)', () => {
    const plan = planPublish([seeded('membership-s0212')], SC)
    const s0212 = plan.tiers.find((p) => p.spec.sku === 'S0212')!
    expect(s0212.blockers.join(' ')).toMatch(/metadata\.tier missing/)
    expect(s0212.update).toEqual({ status: 'published', sales_channels: [{ id: SC }] })
    expect(plan.ready).toBe(false)
  })

  it('blocks an old "Energy Clearing" title and a wrong rand price', () => {
    const row = ready('membership-s0226')
    row.title = 'Energy Clearing Student Membership'
    row.variants = [{ prices: [{ currency_code: 'zar', amount: 999 }] }]
    const p = planPublish([row], SC).tiers.find((x) => x.spec.sku === 'S0226')!
    expect(p.blockers.join(' ')).toMatch(/rename script/)
    expect(p.blockers.join(' ')).toMatch(/ZAR price 999 \(cents\) is not R525/)
    expect(p.warnings.join(' ')).toMatch(/USD price none/)
  })

  it('reads prices in cents, warns on an empty description, keeps existing channels', () => {
    const row = seeded('membership-s0213', { metadata: { product_type: 'membership', tier: 'silver' }, sales_channels: [{ id: 'sc_other' }] })
    const p = planPublish([row], SC).tiers.find((x) => x.spec.sku === 'S0213')!
    expect(p.blockers).toEqual([])
    expect(p.warnings).toEqual(['no description: the shop page shows the title and price only'])
    expect(p.update).toEqual({ status: 'published', sales_channels: [{ id: 'sc_other' }, { id: SC }] })
  })

  it('blocks a rand amount stored as if it were cents (R5.25 instead of R525)', () => {
    const row = ready('membership-s0213')
    row.variants = [{ prices: [{ currency_code: 'zar', amount: 525 }, { currency_code: 'usd', amount: 3000 }] }]
    expect(planPublish([row], SC).tiers.find((x) => x.spec.sku === 'S0213')!.blockers.join(' ')).toMatch(/ZAR price 525/)
  })

  it('plans nothing for a tier already published in the default channel', () => {
    const row = ready('membership-s0212')
    row.status = 'published'
    row.sales_channels = [{ id: SC }]
    expect(planPublish([row], SC).tiers.find((x) => x.spec.sku === 'S0212')!.update).toBeNull()
  })

  it('blocks every tier and plans no channel write when the store has no default sales channel', () => {
    const p = planPublish([ready('membership-s0212')], null).tiers.find((x) => x.spec.sku === 'S0212')!
    expect(p.blockers).toContain('the store has no default sales channel')
    expect(p.update).toEqual({ status: 'published' })
  })

  it('reports a missing product and a held-back product that is published', () => {
    const plan = planPublish([seeded('membership-s0214', { status: 'published' })], SC)
    expect(plan.tiers.every((p) => p.blockers.includes('product missing from the store'))).toBe(true)
    expect(plan.heldBackPublished).toEqual(['membership-s0214'])
  })
})

function fakeQuery(rows: MembershipRow[], defaultChannel: string | null = SC) {
  return {
    graph: async ({ entity }: { entity: string }): Promise<{ data: unknown[] }> =>
      entity === 'store' ? { data: [{ id: 'store', default_sales_channel_id: defaultChannel }] } : { data: rows },
  }
}
const exec = (rows: MembershipRow[]) =>
  publishMemberships({ container: { resolve: () => fakeQuery(rows) } } as unknown as Parameters<typeof publishMemberships>[0])

describe('publish-memberships-2026-11-19', () => {
  let logs: string[]
  beforeEach(() => {
    logs = []
    runs.products.length = 0
    vi.spyOn(console, 'log').mockImplementation((line: string) => void logs.push(line))
    process.exitCode = undefined
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    process.exitCode = undefined
  })

  it('writes nothing on a dry run and exits 1 on the seeded box state', async () => {
    await exec(PUBLISH_TIERS.map((t) => seeded(t.handle)))
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/DRY RUN/)
    expect(logs.filter((l) => l.includes('BLOCKER metadata.tier missing'))).toHaveLength(24)
    expect(process.exitCode).toBe(1)
  })

  it('refuses to apply while a blocker stands', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    await exec(PUBLISH_TIERS.map((t) => seeded(t.handle)))
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/REFUSED/)
  })

  it('applies all 24 by id once every tier is ready, and never touches a held-back product', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    await exec([...PUBLISH_TIERS.map((t) => ready(t.handle)), seeded('membership-s0214')])
    expect(runs.products).toHaveLength(24)
    expect(runs.products[0]).toEqual({ input: { selector: { id: 'prod_membership-s0212' }, update: { status: 'published', sales_channels: [{ id: SC }] } } })
    expect(JSON.stringify(runs.products)).not.toMatch(/s0214|s0211|s0215|s0227|s0228/)
    expect(process.exitCode).toBeUndefined()
  })

  it('refuses to apply while a held-back product is published, even when the 24 are ready', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    await exec([...PUBLISH_TIERS.map((t) => ready(t.handle)), seeded('membership-s0227', { status: 'published' })])
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/membership-s0227 is published although it is held back/)
    expect(process.exitCode).toBe(1)
  })

  it('ONLY publishes one tier for the proof purchase, judged on that tier alone', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    vi.stubEnv('ONLY', 'membership-s0212')
    await exec([ready('membership-s0212'), ...PUBLISH_TIERS.slice(1).map((t) => seeded(t.handle))])
    expect(runs.products).toHaveLength(1)
  })

  it('refuses ONLY for a held-back tier', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    vi.stubEnv('ONLY', 'membership-s0214')
    await exec([ready('membership-s0212')])
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/not one of the 24 buyable tiers \(Novice/)
    expect(process.exitCode).toBe(1)
  })
})
