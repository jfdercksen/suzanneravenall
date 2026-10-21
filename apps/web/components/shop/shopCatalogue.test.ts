import { describe, it, expect } from 'vitest'
import {
  catalogueCountNoun,
  shopCategoryLabel,
  displayPriceSortKey,
  getDisplayPrice,
  orderBySearchHits,
  parseShopParams,
  shopStateToQuery,
  sortProducts,
} from './shopCatalogue'
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

  it('a USD visitor never sees a rand price: products without a USD price go last as price on request (D021)', () => {
    const list = [
      product('zar-only', [['zar', 77500]]),
      product('usd-priced', [['usd', 55500], ['zar', 999900]]),
    ]
    expect(getDisplayPrice(list[0]!.variants, 'usd')).toBeNull()
    expect(sortProducts(list, 'price_asc', 'usd').map((p) => p.id)).toEqual(['usd-priced', 'zar-only'])
    expect(sortProducts(list, 'price_desc', 'usd').map((p) => p.id)).toEqual(['usd-priced', 'zar-only'])
  })

  it('uses the visitor currency when every product is priced in it', () => {
    const list = [
      product('x', [['usd', 9000], ['zar', 100000]]),
      product('y', [['usd', 10000], ['zar', 90000]]),
    ]
    expect(sortProducts(list, 'price_asc', 'usd').map((p) => p.id)).toEqual(['x', 'y'])
    expect(sortProducts(list, 'price_asc', 'zar').map((p) => p.id)).toEqual(['y', 'x'])
  })

  it('sorts an overseas visitor on the dollar price alone', () => {
    // Real catalogue shape: ZAR/USD ratios differ wildly per product, so
    // sorting by the hidden ZAR price showed $220 before $15 before $330.
    const list = [
      product('akashic-l2', [['usd', 22000], ['zar', 1029500]]),
      product('post-traumatic-growth', [['usd', 1500], ['zar', 22000]]),
      product('life-purpose', [['usd', 33000], ['zar', 99500]]),
      product('trilogy', [['zar', 16500]]),
    ]
    expect(sortProducts(list, 'price_asc', 'usd').map((p) => p.id)).toEqual(
      ['post-traumatic-growth', 'akashic-l2', 'life-purpose', 'trilogy']
    )
    expect(sortProducts(list, 'price_desc', 'usd').map((p) => p.id)).toEqual(
      ['life-purpose', 'akashic-l2', 'post-traumatic-growth', 'trilogy']
    )
  })

  it('a South African visitor sorts on ZAR, ignoring USD prices', () => {
    const list = [
      product('akashic-l2', [['usd', 22000], ['zar', 1029500]]),
      product('life-purpose', [['usd', 33000], ['zar', 99500]]),
    ]
    expect(sortProducts(list, 'price_asc', 'zar').map((p) => p.id)).toEqual(['life-purpose', 'akashic-l2'])
  })

  it('displayPriceSortKey is the shown amount in the visitor currency, or null', () => {
    expect(displayPriceSortKey(product('a', [['usd', 1500], ['zar', 22000]]), 'usd')).toBe(1500)
    expect(displayPriceSortKey(product('b', [['zar', 16500]]), 'usd')).toBeNull()
    expect(displayPriceSortKey(product('c', [['zar', 16500]]), 'zar')).toBe(16500)
    expect(displayPriceSortKey(product('d', []), 'usd')).toBeNull()
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

describe('shopCategoryLabel (site check C3)', () => {
  it('uses the same name on the card as on the filter pill', () => {
    expect(shopCategoryLabel({ handle: 'guided-programmes', name: 'Guided Programmes' })).toBe('Practitioner Programmes')
    expect(shopCategoryLabel({ handle: 'books', name: 'Books' })).toBe('Books')
  })
})

describe('catalogueCountNoun', () => {
  it('names what is listed', () => {
    expect(catalogueCountNoun('private-sessions', '')).toBe('session')
    expect(catalogueCountNoun('group-sessions', '')).toBe('session')
    expect(catalogueCountNoun('guided-programmes', '')).toBe('programme')
    expect(catalogueCountNoun('products-tools', '')).toBe('product')
    expect(catalogueCountNoun(undefined, 'programmes')).toBe('course')
    expect(catalogueCountNoun(undefined, '')).toBe('item')
  })
})
