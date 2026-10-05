import { describe, it, expect } from 'vitest'
import { orderBySearchHits, parseShopParams, shopStateToQuery, sortProducts } from './shopCatalogue'
import type { MedusaProduct } from '@/types/medusa'

function product(id: string, prices: Array<[string, number]>, metadata?: Record<string, unknown>): MedusaProduct {
  return {
    id,
    handle: id,
    title: id,
    description: null,
    thumbnail: null,
    metadata: metadata ?? null,
    variants: [{ id: `${id}-v`, title: 'Default', prices: prices.map(([currency_code, amount]) => ({ currency_code, amount })) }],
    categories: [],
    collection: null,
  }
}

describe('parseShopParams', () => {
  it('returns defaults for an empty query', () => {
    expect(parseShopParams(new URLSearchParams(''))).toEqual({
      categoryHandle: '',
      collectionHandle: '',
      page: 0,
      sort: 'featured',
      q: '',
    })
  })

  it('reads category, 1-based page, sort and search', () => {
    expect(parseShopParams(new URLSearchParams('category=books&page=3&sort=price_asc&q=rapid'))).toEqual({
      categoryHandle: 'books',
      collectionHandle: '',
      page: 2,
      sort: 'price_asc',
      q: 'rapid',
    })
  })

  it('ignores an unknown sort and a bad page', () => {
    const state = parseShopParams(new URLSearchParams('sort=cheapest&page=-4'))
    expect(state.sort).toBe('featured')
    expect(state.page).toBe(0)
  })

  it('honours the Self-Study collection but not other collection handles', () => {
    expect(parseShopParams(new URLSearchParams('collection=programmes')).collectionHandle).toBe('programmes')
    expect(parseShopParams(new URLSearchParams('collection=membership')).collectionHandle).toBe('')
  })
})

describe('shopStateToQuery', () => {
  it('leaves defaults out so the plain shop URL stays /shop', () => {
    expect(shopStateToQuery({ categoryHandle: '', collectionHandle: '', page: 0, sort: 'featured', q: '' })).toBe('')
  })

  it('round-trips through parseShopParams', () => {
    const state = { categoryHandle: 'private-sessions', collectionHandle: '', page: 1, sort: 'price_desc' as const, q: 'coach' }
    const query = shopStateToQuery(state)
    expect(query).toBe('category=private-sessions&q=coach&sort=price_desc&page=2')
    expect(parseShopParams(new URLSearchParams(query))).toEqual(state)
  })
})

describe('sortProducts', () => {
  it('sorts the whole list by price, low to high and high to low', () => {
    const list = [product('b', [['zar', 77500]]), product('a', [['zar', 16500]]), product('c', [['zar', 150000]])]
    expect(sortProducts(list, 'price_asc', 'zar').map((p) => p.id)).toEqual(['a', 'b', 'c'])
    expect(sortProducts(list, 'price_desc', 'zar').map((p) => p.id)).toEqual(['c', 'b', 'a'])
  })

  it('never compares dollars with rands: falls back to ZAR when some products have no USD price', () => {
    const list = [
      product('usd-priced', [['usd', 55500], ['zar', 999900]]),
      product('zar-only', [['zar', 77500]]),
    ]
    // Raw numbers would put $555 (55500) below R775 (77500); in ZAR it is R9,999.
    expect(sortProducts(list, 'price_asc', 'usd').map((p) => p.id)).toEqual(['zar-only', 'usd-priced'])
  })

  it('uses the visitor currency when every product is priced in it', () => {
    const list = [
      product('x', [['usd', 9000], ['zar', 100000]]),
      product('y', [['usd', 10000], ['zar', 90000]]),
    ]
    expect(sortProducts(list, 'price_asc', 'usd').map((p) => p.id)).toEqual(['x', 'y'])
    expect(sortProducts(list, 'price_asc', 'zar').map((p) => p.id)).toEqual(['y', 'x'])
  })

  it('puts unpriced products last in both directions', () => {
    const list = [product('free', []), product('a', [['zar', 100]]), product('b', [['zar', 200]])]
    expect(sortProducts(list, 'price_asc', 'zar').map((p) => p.id)).toEqual(['a', 'b', 'free'])
    expect(sortProducts(list, 'price_desc', 'zar').map((p) => p.id)).toEqual(['b', 'a', 'free'])
  })

  it('featured keeps store order with highlighted products first', () => {
    const list = [product('a', []), product('b', [], { badge: 'recommended' }), product('c', [])]
    expect(sortProducts(list, 'featured', 'zar').map((p) => p.id)).toEqual(['b', 'a', 'c'])
  })
})

describe('orderBySearchHits', () => {
  it('keeps relevance order and drops hits outside the loaded (filtered) products', () => {
    const list = [product('a', []), product('b', []), product('c', [])]
    expect(orderBySearchHits(list, ['c', 'zz-other-category', 'a', 'c']).map((p) => p.id)).toEqual(['c', 'a'])
  })
})
