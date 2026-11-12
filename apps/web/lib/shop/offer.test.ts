import { describe, it, expect } from 'vitest'
import { isOfferedVariant, productOffer, withOfferedVariants } from './offer'
import { PARTNER_LINK_REL, PARTNER_PRODUCTS, partnerProductFor } from '@/data/partnerProducts'

const LOVE = 'love-relationships-live'
const INTUITION = 'intuition-in-my-personal-capacity-live'

const variant = (id: string, title: string, metadata: Record<string, unknown> | null = null) => ({
  id,
  title,
  prices: [{ currency_code: 'zar', amount: 100 }],
  metadata,
})

describe('productOffer (Suzanne 11 and 12 Nov)', () => {
  it('offers register interest on the live-only products, naming the programmes behind them', () => {
    const love = productOffer(LOVE)
    expect(love.kind).toBe('register-interest')
    if (love.kind === 'register-interest') expect(love.programmes.map((p) => p.slug)).toEqual(['love-and-relationships'])

    const intuition = productOffer(INTUITION)
    if (intuition.kind !== 'register-interest') throw new Error('expected register interest')
    expect(intuition.programmes.map((p) => p.slug)).toEqual(['intuition-in-my-personal-capacity', 'intuition-in-business'])

    for (const handle of ['meditation-live-via-zoom', 'mindfulness-live']) expect(productOffer(handle).kind).toBe('register-interest')
  })

  it('leaves the recorded Love & Relationships group series and other products in the cart', () => {
    expect(productOffer('love-relationships-group-session').kind).toBe('cart')
    expect(productOffer('getting-unstuck-self-study').kind).toBe('cart')
    expect(productOffer('suzanne-ravenall-coaching-app').kind).toBe('cart')
  })

  it('treats Brainwave Club as a partner product', () => {
    const offer = productOffer('brainwave-club')
    expect(offer.kind).toBe('partner')
  })
})

describe('withOfferedVariants', () => {
  it('drops the Self Study variants of a live-only product, whatever the box data says', () => {
    const product = {
      handle: INTUITION,
      variants: [
        variant('a', 'Business Capacity: Live via Zoom'),
        variant('b', 'Business Capacity: Self Study'),
        variant('c', 'Personal Capacity: Live via Zoom'),
        variant('d', 'Personal Capacity: Self Study', { sale_status: 'retired' }),
      ],
    }
    expect(withOfferedVariants(product).variants.map((v) => v.id)).toEqual(['a', 'c'])
  })

  it('drops a variant the box marks retired on any product, and keeps everything else as it was', () => {
    const product = { handle: 'some-product', variants: [variant('a', 'Self Study', { sale_status: 'retired' }), variant('b', 'Live via Zoom')] }
    expect(withOfferedVariants(product).variants.map((v) => v.id)).toEqual(['b'])

    const untouched = { handle: 'getting-unstuck-self-study', variants: [variant('x', 'Self Study')] }
    expect(withOfferedVariants(untouched)).toBe(untouched)
  })

  it('keeps a restored self-study (marker removed) on a product that is not live-only', () => {
    expect(isOfferedVariant('getting-unstuck-self-study', { title: 'Self Study', metadata: { sale_status: '' } })).toBe(true)
  })
})

describe('partner products', () => {
  it('keeps the Brainwave Club link exactly as on the old shop, affiliate code included', () => {
    expect(partnerProductFor('brainwave-club')?.url).toBe('https://jv.brainwave.club/27-jv001-welcome-to-brainwave-club?hop=srav7700')
    expect(partnerProductFor('brainwave-club')?.ctaLabel).toBe('Read More')
    expect(PARTNER_LINK_REL).toBe('sponsored noopener')
  })

  it('only links to https pages', () => {
    for (const p of PARTNER_PRODUCTS) expect(new URL(p.url).protocol).toBe('https:')
  })
})
