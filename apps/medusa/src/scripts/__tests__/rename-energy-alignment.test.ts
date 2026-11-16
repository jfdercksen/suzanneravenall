import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import renameEnergyAlignment, { readAll } from '../rename-energy-alignment-2026-11-16'
import { EXPECTED_HANDLES, planRename } from '../lib/energy-alignment-plan'

// The real framework module does not load under vitest (the route tests mock it the same way).
vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))

const runs = vi.hoisted(() => ({ products: [] as unknown[], variants: [] as unknown[], categories: [] as unknown[] }))

vi.mock('@medusajs/medusa/core-flows', () => ({
  updateProductsWorkflow: () => ({ run: async (args: unknown) => void runs.products.push(args) }),
  updateProductVariantsWorkflow: () => ({ run: async (args: unknown) => void runs.variants.push(args) }),
  updateProductCategoriesWorkflow: () => ({ run: async (args: unknown) => void runs.categories.push(args) }),
}))

const PRODUCTS = [
  ...EXPECTED_HANDLES.map((handle, i) => ({
    id: `p${i}`,
    handle,
    title: handle.startsWith('membership-') ? 'Energy Clearing Student Membership' : 'Deep Energy Clearing Level 1: Fundamentals',
    subtitle: null,
    description: null,
    variants: [{ id: `v${i}`, title: i === 0 ? 'Energy Clearing Retaker' : 'Live via Zoom' }],
  })),
  { id: 'o1', handle: 'energetic-clearing-completed-remotely', title: 'Energetic Clearing', subtitle: null, description: null, variants: [] },
]
const CATEGORIES = [{ id: 'c1', handle: 'energy-clearing-programmes', name: 'Energy Clearing', description: '' }]

function fakeQuery() {
  const calls: Array<{ entity: string; pagination?: { skip: number; take: number } }> = []
  return {
    calls,
    graph: async ({ entity, pagination }: { entity: string; fields: string[]; pagination?: { skip: number; take: number } }): Promise<{ data: unknown[] }> => {
      calls.push({ entity, pagination })
      const rows: unknown[] = entity === 'product' ? PRODUCTS : CATEGORIES
      const { skip, take } = pagination ?? { skip: 0, take: rows.length }
      return { data: rows.slice(skip, skip + take) }
    },
  }
}

const exec = (query: ReturnType<typeof fakeQuery>) =>
  renameEnergyAlignment({ container: { resolve: () => query } } as unknown as Parameters<typeof renameEnergyAlignment>[0])

describe('rename-energy-alignment-2026-11-16', () => {
  let logs: string[]
  beforeEach(() => {
    logs = []
    runs.products.length = 0
    runs.variants.length = 0
    runs.categories.length = 0
    vi.spyOn(console, 'log').mockImplementation((line: string) => void logs.push(line))
    process.exitCode = undefined
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    process.exitCode = undefined
  })

  it('writes nothing on a dry run (the default) and prints every old -> new', async () => {
    vi.stubEnv('DRY_RUN', '')
    await exec(fakeQuery())
    expect(runs.products).toEqual([])
    expect(runs.variants).toEqual([])
    expect(runs.categories).toEqual([])
    expect(logs[0]).toContain('DRY RUN')
    expect(logs.some((l) => l.includes('title: "Deep Energy Clearing Level 1: Fundamentals" -> "Energy Alignment & Optimisation Level 1: Fundamentals"'))).toBe(true)
    expect(logs.some((l) => l.includes('variant') && l.includes('"Energy Clearing Retaker" -> "Energy Alignment & Optimisation Retaker"'))).toBe(true)
    expect(logs.at(-1)).toContain('done')
    expect(process.exitCode).toBeUndefined()
  })

  it('applies titles only with DRY_RUN=false, by id, and never touches the other service', async () => {
    vi.stubEnv('DRY_RUN', 'false')
    await exec(fakeQuery())
    expect(runs.products).toHaveLength(EXPECTED_HANDLES.length)
    expect(runs.products[0]).toEqual({ input: { selector: { id: 'p0' }, update: { title: 'Energy Alignment & Optimisation Level 1: Fundamentals' } } })
    expect(JSON.stringify(runs.products)).not.toContain('"o1"')
    expect(runs.variants).toEqual([{ input: { selector: { id: 'v0' }, update: { title: 'Energy Alignment & Optimisation Retaker' } } }])
    expect(runs.categories).toEqual([{ input: { selector: { id: 'c1' }, update: { name: 'Energy Alignment & Optimisation' } } }])
  })

  it('exits 1 when an expected product is missing', async () => {
    vi.stubEnv('DRY_RUN', '')
    const query = fakeQuery()
    const graph = query.graph
    query.graph = async (input) => {
      const out = await graph(input)
      return input.entity === 'product' ? { data: out.data.filter((p) => (p as { handle: string }).handle !== 'membership-s0239') } : out
    }
    await exec(query)
    expect(logs.some((l) => l.includes('MISSING membership-s0239'))).toBe(true)
    expect(process.exitCode).toBe(1)
  })

  it('reads every page, whatever the page size', async () => {
    const many = Array.from({ length: 450 }, (_, i) => ({ id: `x${i}` }))
    const pages: number[] = []
    const rows = await readAll(
      {
        graph: async ({ pagination }) => {
          pages.push(pagination?.skip ?? -1)
          const { skip, take } = pagination ?? { skip: 0, take: 0 }
          return { data: many.slice(skip, skip + take) }
        },
      },
      'product',
      ['id'],
    )
    expect(rows).toHaveLength(450)
    expect(pages).toEqual([0, 200, 400])
  })

  it('plans a variant rename only where a variant title names the programme', () => {
    const plan = planRename(PRODUCTS, [])
    expect(plan.variants.map((v) => v.id)).toEqual(['v0'])
  })
})
