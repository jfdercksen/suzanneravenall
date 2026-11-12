import { describe, expect, it, vi } from 'vitest'
import { MedusaError } from '@medusajs/framework/utils'
import { firstNotForSale, itemName, refuseNotForSale, variantIdsOf } from '../sale-guard'
// Registers the hooks on the mocked workflows below (vi.mock is hoisted above the imports).
import '../../workflows/hooks/not-for-sale'

// The real framework module does not load under vitest (the route tests mock it the same way).
vi.mock('@medusajs/framework/utils', () => ({
  ContainerRegistrationKeys: { QUERY: 'query' },
  MedusaError: class extends Error {
    static Types = { NOT_ALLOWED: 'not_allowed' }
    type: string
    constructor(type: string, message: string) {
      super(message)
      this.type = type
    }
  },
}))

const handlers = vi.hoisted(() => ({ addToCart: [] as Function[], createCart: [] as Function[] }))

vi.mock('@medusajs/medusa/core-flows', () => ({
  addToCartWorkflow: { hooks: { validate: (fn: Function) => handlers.addToCart.push(fn) } },
  createCartWorkflow: { hooks: { validate: (fn: Function) => handlers.createCart.push(fn) } },
}))

const ROWS = {
  live: { id: 'v_live', title: 'Live via Zoom', metadata: { thinkific_course_id: '2434091', sale_status: 'register_interest' }, product: { title: 'Love & Relationships' } },
  retired: { id: 'v_ss', title: 'Self Study', metadata: { thinkific_course_id: '1892729', sale_status: 'retired' }, product: { title: 'Love & Relationships' } },
  partner: { id: 'v_bw', title: 'Partner product', metadata: { sale_status: 'partner' }, product: { title: 'Brainwave Club' } },
  onSale: { id: 'v_ok', title: 'Self Study', metadata: { thinkific_course_id: '1' }, product: { title: 'Getting Unstuck' } },
}

function containerReturning(rows: unknown[]) {
  const graph = vi.fn(async () => ({ data: rows }))
  return { container: { resolve: () => ({ graph }) }, graph }
}

describe('variantIdsOf', () => {
  it('reads the variant ids of the items, once each', () => {
    expect(variantIdsOf([{ variant_id: 'a', quantity: 1 }, { variant_id: 'b' }, { variant_id: 'a' }])).toEqual(['a', 'b'])
  })

  it('ignores items without a variant and inputs that are not lists', () => {
    expect(variantIdsOf([{ quantity: 1 }, null, { variant_id: '' }, { variant_id: 3 }])).toEqual([])
    expect(variantIdsOf(undefined)).toEqual([])
    expect(variantIdsOf({ variant_id: 'a' })).toEqual([])
  })
})

describe('firstNotForSale', () => {
  it('finds a retired, register-interest or partner variant', () => {
    expect(firstNotForSale([ROWS.onSale, ROWS.retired])?.status).toBe('retired')
    expect(firstNotForSale([ROWS.live])?.status).toBe('register_interest')
    expect(firstNotForSale([ROWS.partner])?.status).toBe('partner')
  })

  it('passes variants that are on sale, including a restored one', () => {
    expect(firstNotForSale([ROWS.onSale])).toBeNull()
    expect(firstNotForSale([{ ...ROWS.retired, metadata: { thinkific_course_id: '1892729', sale_status: '' } }])).toBeNull()
  })
})

describe('itemName', () => {
  it('names product and variant', () => {
    expect(itemName(ROWS.retired)).toBe('Love & Relationships (Self Study)')
    expect(itemName({ id: 'x', title: null, product: null })).toBe('This item')
  })
})

describe('refuseNotForSale', () => {
  it('refuses a retired self-study variant with NOT_ALLOWED', async () => {
    const { container, graph } = containerReturning([ROWS.retired])
    const refusal = refuseNotForSale(container, ['v_ss'])
    await expect(refusal).rejects.toBeInstanceOf(MedusaError)
    await expect(refuseNotForSale(container, ['v_ss'])).rejects.toMatchObject({
      type: MedusaError.Types.NOT_ALLOWED,
      message: 'Love & Relationships (Self Study) is not on sale at the moment.',
    })
    expect(graph).toHaveBeenCalledWith(expect.objectContaining({ entity: 'product_variant', filters: { id: ['v_ss'] } }))
  })

  it('lets a variant on sale through', async () => {
    const { container } = containerReturning([ROWS.onSale])
    await expect(refuseNotForSale(container, ['v_ok'])).resolves.toBeUndefined()
  })

  it('does not query when there are no variants', async () => {
    const { container, graph } = containerReturning([])
    await refuseNotForSale(container, [])
    expect(graph).not.toHaveBeenCalled()
  })
})

describe('the cart hooks', () => {
  it('register on add-to-cart and create-cart and refuse a partner product', async () => {
    expect(handlers.addToCart).toHaveLength(1)
    expect(handlers.createCart).toHaveLength(1)

    const { container } = containerReturning([ROWS.partner])
    await expect(handlers.addToCart[0]({ input: { cart_id: 'c', items: [{ variant_id: 'v_bw', quantity: 1 }] } }, { container })).rejects.toMatchObject({
      message: "Brainwave Club (Partner product) is a partner product, bought on the partner's site.",
    })
    await expect(handlers.createCart[0]({ input: { items: [{ variant_id: 'v_bw', quantity: 1 }] } }, { container })).rejects.toBeInstanceOf(MedusaError)
    // A cart created without items is not touched.
    await expect(handlers.createCart[0]({ input: { region_id: 'r' } }, { container })).resolves.toBeUndefined()
  })
})
