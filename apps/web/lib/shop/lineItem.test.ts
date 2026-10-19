import { describe, expect, it } from 'vitest'
import { isPreorder, variantLabel } from './lineItem'

describe('variantLabel', () => {
  it('returns the line variant_title, the field the store cart sends', () => {
    expect(variantLabel({ title: 'Program 1', variant_title: 'Live Retaker', subtitle: undefined })).toBe('Live Retaker')
  })

  it('falls back to the subtitle Medusa also stores the variant title in', () => {
    expect(variantLabel({ title: 'Getting Unstuck', subtitle: 'Live via Zoom' })).toBe('Live via Zoom')
    expect(variantLabel({ title: 'Rapid Repatterning Session', subtitle: 'Package of 05' })).toBe('Package of 05')
  })

  it('hides the placeholder title of a single-variant product', () => {
    expect(variantLabel({ title: 'Getting Unstuck (Self Study)', subtitle: 'Default' })).toBeNull()
    expect(variantLabel({ title: 'X', subtitle: 'Default variant' })).toBeNull()
  })

  it('hides an empty subtitle or one that repeats the title', () => {
    expect(variantLabel({ title: 'Book', subtitle: null })).toBeNull()
    expect(variantLabel({ title: 'Book', subtitle: '  ' })).toBeNull()
    expect(variantLabel({ title: 'Book', subtitle: 'book' })).toBeNull()
  })
})

describe('isPreorder', () => {
  it('marks the Breakthrough Trilogy book as a pre-order', () => {
    expect(isPreorder('the-latest-book-by-suzanne')).toBe(true)
  })

  it('is false for everything else', () => {
    expect(isPreorder('getting-unstuck-self-study')).toBe(false)
    expect(isPreorder(null)).toBe(false)
  })
})
