import { describe, expect, it } from 'vitest'
import { shopHeroDescription } from './ShopHeroBanner'

describe('shopHeroDescription', () => {
  it('names the live catalogue size', () => {
    expect(shopHeroDescription(58)).toMatch(/^58 programmes, sessions and books\. One destination\./)
  })

  it('drops the number when the count is unknown', () => {
    expect(shopHeroDescription(null)).toMatch(/^Programmes, sessions and books in one destination\./)
  })

  it('drops the number when the count is zero or one', () => {
    expect(shopHeroDescription(0)).not.toMatch(/\d+ programmes/)
    expect(shopHeroDescription(1)).not.toMatch(/\d+ programmes/)
  })
})
