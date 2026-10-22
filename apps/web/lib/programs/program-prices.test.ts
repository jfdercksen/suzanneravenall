import { describe, it, expect } from 'vitest'
import type { Program } from '@/data/programs'
import { getProgramBySlug } from '@/data/programs'
import type { ProductVariant } from '@/types/medusa'
import {
  PRICE_ON_REQUEST,
  lowestProgramPrice,
  programPriceIn,
  programPriceSuffix,
  programPriceTexts,
} from './program-prices'

function variant(title: string, zar: number | null, usd: number | null): ProductVariant {
  const prices: ProductVariant['prices'] = []
  if (zar !== null) prices.push({ currency_code: 'zar', amount: zar })
  if (usd !== null) prices.push({ currency_code: 'usd', amount: usd })
  return { id: `variant_${title}`, title, prices }
}

function program(overrides: Partial<Program>): Program {
  return {
    slug: 'test-programme',
    image: '/x.jpg',
    name: 'Test programme',
    category: 'self-paced',
    shortDescription: 'Short',
    description: 'Long',
    features: [],
    isPublished: true,
    isFeatured: false,
    ...overrides,
  }
}

describe('programPriceTexts', () => {
  it('keeps the rand price exactly as the programme pages always printed it', () => {
    const texts = programPriceTexts(program({ priceZar: 13950, priceUsd: 2540 }), null)
    expect(texts.zar).toBe('R13,950')
  })

  it('takes the dollar price from the Medusa variant whose rand amount is the programme price', () => {
    const variants = [
      variant('Live via Zoom', 786000, 35000),
      variant('Self Study', 465000, 25000),
      variant('Live Retaker', 332000, 27500),
    ]
    const texts = programPriceTexts(program({ priceZar: 4650, priceUsd: 350 }), variants)
    expect(texts.usd).toBe('$250')
    expect(texts.zar).toBe('R4,650')
  })

  it('ignores the Thinkific dollar figure in the data file', () => {
    const texts = programPriceTexts(program({ priceZar: 13950, priceUsd: 2540 }), [variant('Standard', 1395000, 210500)])
    expect(texts.usd).toBe('$2,105')
  })

  it('takes the lowest dollar price when several variants carry the programme rand price', () => {
    const variants = [variant('Self Study', 99500, 22000), variant('Live via Zoom', 99500, 33000)]
    expect(programPriceTexts(program({ priceZar: 995 }), variants).usd).toBe('$220')
  })

  it('shows cents only when the dollar amount has them', () => {
    expect(programPriceTexts(program({ priceZar: 100 }), [variant('A', 10000, 1750)]).usd).toBe('$17.50')
  })

  it('says "Price on request" in dollars when the matching variant has no dollar price', () => {
    const texts = programPriceTexts(program({ priceZar: 1500 }), [variant('Live', 150000, null)])
    expect(texts.usd).toBe(PRICE_ON_REQUEST)
    expect(texts.usdCents).toBeNull()
  })

  it('never derives dollars from rand: no variant at the programme rand price means no dollar price', () => {
    const texts = programPriceTexts(program({ priceZar: 1500, priceUsd: 90 }), [variant('Other', 200000, 30000)])
    expect(texts.usd).toBe(PRICE_ON_REQUEST)
  })

  it('says "Price on request" in dollars when there is no shop product or Medusa was unreachable', () => {
    const texts = programPriceTexts(program({ priceZar: 1995, priceUsd: 99 }), null)
    expect(texts.usd).toBe(PRICE_ON_REQUEST)
    expect(texts.zar).toBe('R1,995')
  })

  it('uses a single-variant product for both currencies when the programme has no rand price', () => {
    const texts = programPriceTexts(program({ priceUsd: 220 }), [variant('Live via Zoom', 166000, 16500)])
    expect(texts.zar).toBe('R1,660')
    expect(texts.usd).toBe('$165')
  })

  it('says "Price on request" in both currencies with no rand price and an ambiguous product', () => {
    const texts = programPriceTexts(program({ priceUsd: 220 }), [variant('A', 100000, 10000), variant('B', 200000, 20000)])
    expect(texts).toMatchObject({ zar: PRICE_ON_REQUEST, usd: PRICE_ON_REQUEST })
  })

  it('maps the Basic Five in the real catalogue through its shop handle', () => {
    const basicFive = getProgramBySlug('resonance-repatterning-basic-5-series')
    expect(basicFive?.shopHandle).toBeTruthy()
    expect(programPriceTexts(basicFive as Program, [variant('Standard', 1395000, 210500)]).usd).toBe('$2,105')
  })
})

describe('programPriceIn and programPriceSuffix', () => {
  const texts = programPriceTexts(program({ priceZar: 4650 }), [variant('Self Study', 465000, 25000)])

  it('picks the text for the visitor currency, in either case', () => {
    expect(programPriceIn(texts, 'usd')).toBe('$250')
    expect(programPriceIn(texts, 'USD')).toBe('$250')
    expect(programPriceIn(texts, 'zar')).toBe('R4,650')
  })

  it('says "Price on request" for a programme with no texts', () => {
    expect(programPriceIn(undefined, 'usd')).toBe(PRICE_ON_REQUEST)
  })

  it('labels a price with its currency and leaves "Price on request" bare', () => {
    expect(programPriceSuffix('$250', 'usd')).toBe('USD')
    expect(programPriceSuffix('R4,650', 'zar')).toBe('ZAR')
    expect(programPriceSuffix(PRICE_ON_REQUEST, 'usd')).toBeNull()
  })
})

describe('lowestProgramPrice', () => {
  it('takes the lowest price per currency and skips programmes without one', () => {
    const a = programPriceTexts(program({ priceZar: 1500 }), [variant('A', 150000, 30000)])
    const b = programPriceTexts(program({ priceZar: 1500 }), [variant('B', 150000, 9000)])
    const c = programPriceTexts(program({ priceZar: 1200 }), null)
    expect(lowestProgramPrice([a, b, c])).toMatchObject({ zar: 'R1,200', usd: '$90' })
  })

  it('says "Price on request" when none of them has a price', () => {
    expect(lowestProgramPrice([])).toMatchObject({ zar: PRICE_ON_REQUEST, usd: PRICE_ON_REQUEST })
  })
})
