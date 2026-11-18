import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import {
  ADDON_HANDLES,
  CART_ADDON_HANDLES,
  cartAddOnOffers,
  cartAddOnPairings,
  fetchAddOnProducts,
  isAddOnHandle,
  lifetimeAccessCap,
  type CartLineFacts,
  type CartProductFacts,
} from './addons'

const product = (handle: string) => ({
  id: `prod_${handle}`,
  handle,
  title: handle,
  description: null,
  thumbnail: null,
  metadata: null,
  variants: [{ id: `v_${handle}`, title: 'Per month', prices: [{ currency_code: 'zar', amount: 20000 }] }],
  categories: [],
  collection: null,
})

const json = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response

describe('shop add-ons (17 Nov)', () => {
  beforeEach(() => vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa.test'))
  afterEach(() => vi.unstubAllEnvs())

  it('knows the five add-on products and nothing else', () => {
    expect(ADDON_HANDLES).toHaveLength(5)
    expect(isAddOnHandle('bonus-lifetime-access-self-study-online')).toBe(true)
    expect(isAddOnHandle('email-support')).toBe(true)
    expect(isAddOnHandle('getting-unstuck-self-study')).toBe(false)
    expect(isAddOnHandle(null)).toBe(false)
  })

  it('asks the store for the five handles in one call and keeps the section order', async () => {
    const fetchImpl = vi.fn(async () =>
      json({ products: [product('vip-package'), product('email-support'), product('bonus-lifetime-access-self-study-online')] }),
    )
    const list = await fetchAddOnProducts(fetchImpl as unknown as typeof fetch)
    expect(list.map((p) => p.handle)).toEqual(['bonus-lifetime-access-self-study-online', 'email-support', 'vip-package'])
    const url = new URL(String((fetchImpl.mock.calls[0] as unknown[])[0]))
    expect(url.origin + url.pathname).toBe('http://medusa.test/store/products')
    expect(url.searchParams.getAll('handle[]')).toEqual([...ADDON_HANDLES])
  })

  it('gives an empty list when the store fails, so the section hides', async () => {
    expect(await fetchAddOnProducts((async () => json({}, false)) as unknown as typeof fetch)).toEqual([])
    expect(await fetchAddOnProducts((async () => { throw new Error('down') }) as unknown as typeof fetch)).toEqual([])
  })

  it('reads nothing without a Medusa URL', async () => {
    vi.stubEnv('MEDUSA_BACKEND_URL', '')
    vi.stubEnv('NEXT_PUBLIC_MEDUSA_URL', '')
    const fetchImpl = vi.fn()
    expect(await fetchAddOnProducts(fetchImpl as unknown as typeof fetch)).toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

// ── Cart offer: Johan's pairings, 17 Nov 2026 ───────────────────────────────

const facts = (
  handle: string,
  categories: string[],
  variants: Array<{ title: string; metadata?: Record<string, unknown> }>,
): CartProductFacts => ({
  handle,
  title: handle,
  metadata: null,
  categories: categories.map((c) => ({ handle: c })),
  variants: variants.map((v, i) => ({ id: `${handle}_v${i}`, title: v.title, metadata: v.metadata ?? null, prices: [] })),
})

const line = (handle: string, variant: string, title = handle): CartLineFacts => ({
  product_handle: handle,
  title,
  variant_title: variant,
})

// Shapes from the review box (17 Nov).
const akashicL2 = facts('akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom', ['akashic-live'], [
  { title: 'Live via Zoom' },
  { title: 'Live Retaker' },
  { title: 'Self Study' },
])
const liveOnly = facts('be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live', ['energy-clearing-live'], [
  { title: 'Live via Zoom' },
])
const retiredSelfStudy = facts('some-live-programme-live-via-zoom', ['life-enhancing-live'], [
  { title: 'Live via Zoom' },
  { title: 'Self Study', metadata: { sale_status: 'retired' } },
])
const transformation = facts('transformation-coaching-60-mins', ['transformation-coaching'], [
  { title: '60 min' },
  { title: 'Package of 08' },
])
const rapidRepatterning = facts('rapid-repatterning-session', ['rapid-repatterning'], [
  { title: '60 min online' },
  { title: 'Package of 04 (60 min online)' },
])
const products = new Map([akashicL2, liveOnly, retiredSelfStudy, transformation, rapidRepatterning].map((p) => [p.handle, p]))
const handles = (lines: CartLineFacts[], map = products) => cartAddOnPairings(lines, map).map((p) => p.handle)

describe('cart add-on pairings (Johan, 17 Nov)', () => {
  it('offers Bonus Lifetime Access with a programme that has a self-study variant, whichever format is in the cart', () => {
    expect(handles([line(akashicL2.handle, 'Live via Zoom')])).toEqual(['bonus-lifetime-access-self-study-online'])
    expect(handles([line(akashicL2.handle, 'Self Study')])).toEqual(['bonus-lifetime-access-self-study-online'])
  })

  it('does not offer it with a programme that sells no self-study, or whose self-study is retired', () => {
    expect(handles([line(liveOnly.handle, 'Live via Zoom')])).toEqual([])
    expect(handles([line(retiredSelfStudy.handle, 'Live via Zoom')])).toEqual([])
  })

  it('offers Email Support and the Coaching Support Package with a coaching session, not the VIP Package', () => {
    expect(handles([line(transformation.handle, '60 min')])).toEqual(['email-support', 'coaching-support-package'])
  })

  it('adds the VIP Package for a coaching package', () => {
    expect(handles([line(transformation.handle, 'Package of 08')])).toEqual([
      'email-support',
      'coaching-support-package',
      'vip-package',
    ])
  })

  it('reads coaching from the category too, and from the handle when the categories were not read', () => {
    const byCategory = facts('new-coaching-product', ['executive-coaching'], [{ title: '30 min' }])
    expect(handles([line('new-coaching-product', '30 min')], new Map([[byCategory.handle, byCategory]]))).toEqual([
      'email-support',
      'coaching-support-package',
    ])
    expect(handles([line('executive-coaching-30-mins', 'Package of 04')], new Map())).toEqual([
      'email-support',
      'coaching-support-package',
      'vip-package',
    ])
  })

  it('offers nothing with a private session that is not coaching', () => {
    expect(handles([line(rapidRepatterning.handle, 'Package of 04 (60 min online)')])).toEqual([])
  })

  it('never offers an add-on that is already in the cart', () => {
    expect(
      handles([line(transformation.handle, 'Package of 08'), line('email-support', 'Per month'), line('vip-package', 'Per month')]),
    ).toEqual(['coaching-support-package'])
    expect(handles([line(akashicL2.handle, 'Self Study'), line('bonus-lifetime-access-self-study-online', 'Per programme level')])).toEqual([])
  })

  it('never offers the certification observation fee', () => {
    expect(CART_ADDON_HANDLES).not.toContain('ravenall-institute-certification-observation-fee')
    const everything = handles([line(akashicL2.handle, 'Live via Zoom'), line(transformation.handle, 'Package of 08')])
    expect(everything).toEqual(['bonus-lifetime-access-self-study-online', 'email-support', 'coaching-support-package', 'vip-package'])
    expect(everything).not.toContain('ravenall-institute-certification-observation-fee')
  })

  it('lists the cart items each add-on goes with', () => {
    const [lifetime] = cartAddOnPairings([line(akashicL2.handle, 'Self Study', 'Akashic Navigator: Advanced')], products)
    expect(lifetime?.goesWith).toEqual(['Akashic Navigator: Advanced'])
  })
})

describe('cart add-on offers', () => {
  const addOn = (handle: string, metadata: Record<string, unknown> | null = null): CartProductFacts => ({
    handle,
    title: handle,
    categories: [],
    variants: [
      {
        id: `${handle}_v`,
        title: 'Per month',
        metadata,
        prices: [
          { currency_code: 'zar', amount: 20000 },
          { currency_code: 'usd', amount: 3000 },
        ],
      },
    ],
  })
  const pairings = cartAddOnPairings([line(transformation.handle, 'Package of 08')], products)

  it('prices each offer in the cart currency, with the variant to add', () => {
    const map = new Map(['email-support', 'coaching-support-package', 'vip-package'].map((h) => [h, addOn(h)]))
    const offers = cartAddOnOffers(pairings, map, 'usd')
    expect(offers.map((o) => [o.handle, o.variantId, o.amount])).toEqual([
      ['email-support', 'email-support_v', 3000],
      ['coaching-support-package', 'coaching-support-package_v', 3000],
      ['vip-package', 'vip-package_v', 3000],
    ])
  })

  it('never offers an add-on whose variant carries a sale_status guard', () => {
    for (const status of ['retired', 'register_interest', 'partner']) {
      const map = new Map([
        ['email-support', addOn('email-support', { sale_status: status })],
        ['coaching-support-package', addOn('coaching-support-package')],
        ['vip-package', addOn('vip-package')],
      ])
      expect(cartAddOnOffers(pairings, map, 'zar').map((o) => o.handle), status).toEqual(['coaching-support-package', 'vip-package'])
    }
  })

  it('leaves out an add-on the store did not return or that has no price in the cart currency', () => {
    const zarOnly = addOn('vip-package')
    zarOnly.variants[0]!.prices = [{ currency_code: 'zar', amount: 150000 }]
    const map = new Map([['vip-package', zarOnly]])
    expect(cartAddOnOffers(pairings, map, 'usd')).toEqual([])
    expect(cartAddOnOffers(pairings, map, 'zar').map((o) => o.handle)).toEqual(['vip-package'])
  })
})

// ── Bonus Lifetime Access per programme level: Johan, 18 Nov 2026 ──────────

describe('Bonus Lifetime Access, one per programme level (Johan, 18 Nov)', () => {
  const akashicL1 = facts('akashic-navigator-level-1-live-via-zoom', ['akashic-live'], [
    { title: 'Live via Zoom' },
    { title: 'Self Study' },
  ])
  const map = new Map([...products, [akashicL1.handle, akashicL1]])
  const lifetime = (quantity: number): CartLineFacts => ({
    product_handle: 'bonus-lifetime-access-self-study-online',
    title: 'Bonus Lifetime Access',
    variant_title: 'Per programme level',
    quantity,
  })
  const l1 = line(akashicL1.handle, 'Self Study', 'Akashic Navigator Level 1')
  const l2 = line(akashicL2.handle, 'Live via Zoom', 'Akashic Navigator Level 2')

  it('allows one per programme line that sells self-study', () => {
    expect(lifetimeAccessCap([l1, l2], map)).toBe(2)
    expect(lifetimeAccessCap([l1, l2, lifetime(1)], map)).toBe(2)
  })

  it('counts neither add-ons, programmes without self-study, nor sessions, and is 1 when nothing qualifies', () => {
    expect(lifetimeAccessCap([l1, line(liveOnly.handle, 'Live via Zoom'), line(transformation.handle, '60 min')], map)).toBe(1)
    expect(lifetimeAccessCap([line(liveOnly.handle, 'Live via Zoom')], map)).toBe(1)
    expect(lifetimeAccessCap([lifetime(2)], map)).toBe(1)
    expect(lifetimeAccessCap([], map)).toBe(1)
  })

  it('is 1 while the products are not read yet', () => {
    expect(lifetimeAccessCap([l1, l2], null)).toBe(1)
  })

  it('keeps offering it while the cart has fewer than one per qualifying programme, naming them all', () => {
    const [offer] = cartAddOnPairings([l1, l2, lifetime(1)], map)
    expect(offer?.handle).toBe('bonus-lifetime-access-self-study-online')
    expect(offer?.goesWith).toEqual(['Akashic Navigator Level 1', 'Akashic Navigator Level 2'])
  })

  it('stops offering it once there is one per qualifying programme, or more', () => {
    expect(handles([l1, l2, lifetime(2)], map)).toEqual([])
    expect(handles([l1, lifetime(3)], map)).toEqual([])
  })

  it('still offers the other add-ons only once', () => {
    expect(handles([line(transformation.handle, '60 min'), { ...line('email-support', 'Per month'), quantity: 1 }], map)).toEqual([
      'coaching-support-package',
    ])
  })
})
