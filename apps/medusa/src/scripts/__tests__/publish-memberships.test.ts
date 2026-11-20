import { readFileSync } from 'fs'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import publishMemberships from '../publish-memberships-2026-11-19'
import { HELD_BACK, planPublish, PUBLISH_TIERS, SELLABLE_TIERS, type MembershipRow } from '../lib/membership-publish-plan'

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))

const runs = vi.hoisted(() => ({ products: [] as unknown[] }))
vi.mock('@medusajs/medusa/core-flows', () => ({
  updateProductsWorkflow: () => ({ run: async (args: unknown) => void runs.products.push(args) }),
}))

const SC = 'sc_default'

/** A tier as the 2026 seed left it on the box: draft, no channel, no metadata.tier. */
function seeded(handle: string, overrides: Partial<MembershipRow> = {}): MembershipRow {
  const spec = SELLABLE_TIERS.find((t) => t.handle === handle)
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

const skuOf = (handle: string) => handle.replace('membership-', '').toUpperCase()
const ready = (handle: string) => seeded(handle, { metadata: { product_type: 'membership', tier: skuOf(handle) }, description: 'About it' })

describe('membership publish plan (KI071 switch-on)', () => {
  it('publishes the 7 launch levels by default and holds the 21 training levels and Guest (KI133)', () => {
    expect(PUBLISH_TIERS.map((t) => t.sku)).toEqual(['S0212', 'S0213', 'S0214', 'S0215', 'S0226', 'S0227', 'S0228'])
    expect(SELLABLE_TIERS).toHaveLength(28)
    expect(SELLABLE_TIERS.filter((t) => t.training)).toHaveLength(21)
    const plan = planPublish([], 'sc')
    expect(plan.tiers).toHaveLength(7)
    expect(plan.trainingHeld).toHaveLength(21)
    expect(planPublish([], 'sc', true).tiers).toHaveLength(28)
    expect(Object.keys(HELD_BACK)).toEqual(['membership-s0211'])
    for (const handle of Object.keys(HELD_BACK)) expect(PUBLISH_TIERS.some((t) => t.handle === handle)).toBe(false)
  })

  it('gives every level exactly the title and price in apps/web/lib/access/tiers.ts', () => {
    const tiers = readFileSync(join(__dirname, '../../../../web/lib/access/tiers.ts'), 'utf8')
    for (const spec of PUBLISH_TIERS) {
      const line = tiers.split('\n').find((l) => l.includes(`sku: '${spec.sku}'`)) ?? ''
      expect(line).toContain(`title: '${spec.title}'`)
      expect(line).toContain(`handle: '${spec.handle}'`)
      expect(line).toContain(`zarPrice: ${spec.zar},`)
      expect(line).toContain(`usdPrice: ${spec.usd},`)
    }
  })

  it('writes metadata.tier = the SKU on a seeded product, keeping its other metadata (KI128)', () => {
    const plan = planPublish([seeded('membership-s0212')], SC)
    const s0212 = plan.tiers.find((p) => p.spec.sku === 'S0212')!
    expect(s0212.blockers).toEqual([])
    expect(s0212.update).toEqual({
      status: 'published',
      sales_channels: [{ id: SC }],
      metadata: { product_type: 'membership', sku: 'S0212', tier: 'S0212' },
    })
  })

  it('blocks a level that is set to something else, and never overwrites it', () => {
    const row = seeded('membership-s0213', { metadata: { product_type: 'membership', tier: 'silver' } })
    const p = planPublish([row], SC).tiers.find((x) => x.spec.sku === 'S0213')!
    expect(p.blockers.join(' ')).toMatch(/metadata\.tier is "silver", not S0213/)
    expect(p.update?.metadata).toBeUndefined()
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
    const row = seeded('membership-s0213', { metadata: { product_type: 'membership', tier: 'S0213' }, sales_channels: [{ id: 'sc_other' }] })
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
    const plan = planPublish([seeded('membership-s0211', { status: 'published' })], SC)
    expect(plan.tiers.every((p) => p.blockers.includes('product missing from the store'))).toBe(true)
    expect(plan.heldBackPublished).toEqual(['membership-s0211'])
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

  it('writes nothing on a dry run, and plans status, channel and level for every seeded product', async () => {
    await exec(PUBLISH_TIERS.map((t) => seeded(t.handle)))
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/DRY RUN/)
    expect(logs.filter((l) => l.includes('status + metadata + sales_channels'))).toHaveLength(7)
    expect(logs.filter((l) => l.includes('held, not on sale at launch'))).toHaveLength(21)
    expect(process.exitCode).toBeUndefined()
  })

  it('refuses to apply while a blocker stands', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    const rows = PUBLISH_TIERS.map((t) => seeded(t.handle))
    rows[3] = seeded(PUBLISH_TIERS[3]!.handle, { metadata: { product_type: 'membership', tier: 'gold' } })
    await exec(rows)
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/REFUSED/)
    expect(process.exitCode).toBe(1)
  })

  it('applies the 7 launch levels by id, Novice included, sets the level, and never touches Guest or a training level', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    await exec([...SELLABLE_TIERS.map((t) => seeded(t.handle)), seeded('membership-s0211')])
    expect(runs.products).toHaveLength(7)
    expect(JSON.stringify(runs.products)).not.toMatch(/s0216|s0239/)
    expect(runs.products[0]).toEqual({
      input: {
        selector: { id: 'prod_membership-s0212' },
        update: { status: 'published', sales_channels: [{ id: SC }], metadata: { product_type: 'membership', sku: 'S0212', tier: 'S0212' } },
      },
    })
    expect(JSON.stringify(runs.products)).toMatch(/membership-s0227/)
    expect(JSON.stringify(runs.products)).not.toMatch(/s0211/)
    expect(process.exitCode).toBeUndefined()
  })

  it('plans nothing on a second run once every level is published, linked and set', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    await exec(PUBLISH_TIERS.map((t) => ({ ...ready(t.handle), status: 'published', sales_channels: [{ id: SC }] })))
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/0 product\(s\) published or linked/)
  })

  it('refuses to apply while Guest is published', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    await exec([...PUBLISH_TIERS.map((t) => ready(t.handle)), seeded('membership-s0211', { status: 'published' })])
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/membership-s0211 is published although it is held back/)
    expect(process.exitCode).toBe(1)
  })

  it('ONLY publishes one level for the proof purchase, judged on that level alone', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    vi.stubEnv('ONLY', 'membership-s0212')
    const rows = PUBLISH_TIERS.map((t) => seeded(t.handle))
    rows[5] = seeded(PUBLISH_TIERS[5]!.handle, { metadata: { tier: 'gold' } })
    await exec(rows)
    expect(runs.products).toHaveLength(1)
  })

  it('publishes the training levels only with MEMBERSHIP_TRAINING_LEVELS=on', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    vi.stubEnv('MEMBERSHIP_TRAINING_LEVELS', 'on')
    await exec(SELLABLE_TIERS.map((t) => seeded(t.handle)))
    expect(runs.products).toHaveLength(28)
  })

  it('refuses to apply while a training level is published and the switch is off', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    await exec([...PUBLISH_TIERS.map((t) => seeded(t.handle)), seeded('membership-s0216', { status: 'published' })])
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/membership-s0216 is published although it is held, not on sale at launch/)
    expect(process.exitCode).toBe(1)
  })

  it('refuses ONLY for a training level while they are held', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    vi.stubEnv('ONLY', 'membership-s0216')
    await exec([seeded('membership-s0216')])
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/not one of the levels on sale \(held, not on sale at launch\)/)
  })

  it('refuses ONLY for Guest', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    vi.stubEnv('ONLY', 'membership-s0211')
    await exec([ready('membership-s0212')])
    expect(runs.products).toHaveLength(0)
    expect(logs.join('\n')).toMatch(/not one of the levels on sale \(Guest/)
    expect(process.exitCode).toBe(1)
  })
})
