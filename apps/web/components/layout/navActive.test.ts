import { describe, it, expect } from 'vitest'
import { isActivePath } from './navActive'

describe('isActivePath', () => {
  it('matches the root only on the root', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/about', '/')).toBe(false)
  })

  it('matches an exact path and its sub-routes', () => {
    expect(isActivePath('/resources', '/resources')).toBe(true)
    expect(isActivePath('/resources/articles', '/resources')).toBe(true)
    expect(isActivePath('/resourcesx', '/resources')).toBe(false)
  })

  it('ignores the hash on the href (site check M7)', () => {
    expect(isActivePath('/services', '/services#private')).toBe(true)
    expect(isActivePath('/services', '/services#group')).toBe(true)
    expect(isActivePath('/speaking', '/services#group')).toBe(false)
  })

  it('ignores a query string on the href', () => {
    expect(isActivePath('/contact', '/contact?enquiry=speaking#message')).toBe(true)
  })
})
