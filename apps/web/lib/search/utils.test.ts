import { describe, it, expect } from 'vitest'
import { resultPrice } from './utils'
import type { SearchResultItem } from './types'

const item: SearchResultItem = {
  type: 'products',
  id: 'p',
  title: 'Book',
  subtitle: '',
  url: '/shop/book',
  thumbnail: null,
  price_zar: 16500,
  price_usd: 1750,
}

describe('resultPrice (KI094)', () => {
  it('returns the price in the visitor currency', () => {
    expect(resultPrice(item, 'usd')).toEqual({ amount: 1750, currency_code: 'usd' })
    expect(resultPrice(item, 'zar')).toEqual({ amount: 16500, currency_code: 'zar' })
    expect(resultPrice(item, 'USD')).toEqual({ amount: 1750, currency_code: 'usd' })
  })

  it('returns null while the currency is unknown', () => {
    expect(resultPrice(item, null)).toBeNull()
    expect(resultPrice(item, undefined)).toBeNull()
  })

  it('never falls back to rand for a dollar visitor (index not rebuilt yet, or no USD price)', () => {
    expect(resultPrice({ ...item, price_usd: null }, 'usd')).toBeNull()
    expect(resultPrice({ ...item, price_usd: undefined as unknown as null }, 'usd')).toBeNull()
  })
})
