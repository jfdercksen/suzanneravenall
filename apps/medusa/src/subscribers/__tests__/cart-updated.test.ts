import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryCartRecoveryStore } from '../../modules/automations/cart-recovery-store'

const { store } = vi.hoisted(() => ({ store: { current: null as unknown } }))

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))
vi.mock('../../automations/runtime', () => ({ getCartRecoveryStore: () => store.current }))

import handler, { config } from '../cart-updated'
import { CART_FIELDS } from '../../automations/cart-recovery'

const openCart = {
  id: 'cart_1',
  email: 'johan+k04@aiautomations.co.za',
  completed_at: null,
  currency_code: 'zar',
  total: 9900,
  billing_address: { first_name: 'Johan' },
  items: [{ id: 'li_1', title: 'Coaching', quantity: 1, unit_price: 9900 }],
}

function container(cart: Record<string, unknown> | null = openCart) {
  const graph = vi.fn(async () => ({ data: cart ? [cart] : [] }))
  return { graph, resolve: (key: string) => (key === 'query' ? { graph } : undefined) }
}

let n = 0
const run = (c: ReturnType<typeof container>, id = `cart_${++n}`) =>
  handler({ event: { name: 'cart.updated', data: { id } }, container: c } as never)

describe('cart-updated subscriber', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    store.current = new MemoryCartRecoveryStore()
    fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('listens to cart.updated', () => {
    expect(config.event).toBe('cart.updated')
  })

  it('reads the cart through Query, never through cart relations (KI057)', async () => {
    vi.stubEnv('AUTOMATION_CART_RECOVERY', 'code')
    const c = container()
    await run(c, 'cart_1')
    expect(c.graph).toHaveBeenCalledWith({ entity: 'cart', fields: CART_FIELDS, filters: { id: 'cart_1' } })
  })

  describe('code mode', () => {
    beforeEach(() => vi.stubEnv('AUTOMATION_CART_RECOVERY', 'code'))

    it('upserts one cart_recovery row and does not call n8n', async () => {
      const c = container()
      await run(c, 'cart_1')
      await run(c, 'cart_1')
      const rows = (store.current as MemoryCartRecoveryStore).rows
      expect(rows.size).toBe(1)
      expect(rows.get('cart_1')).toMatchObject({ step: 0, status: 'active', email: 'johan+k04@aiautomations.co.za' })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('skips a cart without an email, an empty cart and a completed cart', async () => {
      await run(container({ ...openCart, email: null }), 'cart_a')
      await run(container({ ...openCart, items: [] }), 'cart_b')
      await run(container({ ...openCart, completed_at: '2026-10-20T10:00:00Z' }), 'cart_c')
      await run(container(null), 'cart_d')
      expect((store.current as MemoryCartRecoveryStore).rows.size).toBe(0)
    })

    it('closes an open sequence when the cart completes', async () => {
      const c = container()
      await run(c, 'cart_1')
      await run(container({ ...openCart, completed_at: '2026-10-20T10:00:00Z' }), 'cart_1')
      expect((store.current as MemoryCartRecoveryStore).rows.get('cart_1')).toMatchObject({ status: 'completed' })
    })

    it('stores nothing in dry run', async () => {
      vi.stubEnv('AUTOMATION_DRY_RUN', 'true')
      await run(container(), 'cart_1')
      expect((store.current as MemoryCartRecoveryStore).rows.size).toBe(0)
    })
  })

  it('n8n mode (default) posts the cart to the n8n webhook and stores nothing', async () => {
    await run(container(), 'cart_n8n')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/\/webhook\/cart-updated$/)
    expect(JSON.parse(String(init.body))).toMatchObject({ cartId: 'cart_1', firstName: 'Johan', total: 9900, currency: 'ZAR' })
    expect((store.current as MemoryCartRecoveryStore).rows.size).toBe(0)
  })

  it('n8n mode debounces the same cart for 30 minutes', async () => {
    const c = container()
    await run(c, 'cart_debounce')
    await run(c, 'cart_debounce')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('off mode does nothing at all', async () => {
    vi.stubEnv('AUTOMATION_CART_RECOVERY', 'off')
    const c = container()
    await run(c, 'cart_off')
    expect(c.graph).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
