import { describe, it, expect } from 'vitest'
import { withPriceVariant } from './ProgrammeOptions'

describe('withPriceVariant', () => {
  it('adds ?variant= to a plain shop link', () => {
    expect(withPriceVariant({ label: 'Enrol', href: '/shop/a-b' }, 'variant_1')).toEqual({
      label: 'Enrol',
      href: '/shop/a-b?variant=variant_1',
    })
  })

  it('leaves the link alone without a single variant behind the price', () => {
    const cta = { label: 'Enrol', href: '/shop/a-b' }
    expect(withPriceVariant(cta, undefined)).toBe(cta)
  })

  it('never touches a contact or register-interest link, or one that already has a query', () => {
    const contact = { label: 'Register Interest', href: '/contact?enquiry=x' }
    expect(withPriceVariant(contact, 'variant_1')).toBe(contact)
    const chosen = { label: 'Buy', href: '/shop/a-b?variant=other' }
    expect(withPriceVariant(chosen, 'variant_1')).toBe(chosen)
  })
})
