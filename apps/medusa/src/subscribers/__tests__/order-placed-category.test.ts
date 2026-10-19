import { describe, it, expect, vi } from 'vitest'
import { detectOrderProductType, getHighestCategoryAccess } from '../order-placed'

/**
 * KI082: a product filed under a sub-category takes the product type (and
 * portal access) of its nearest mapped parent category. Order #390, Exploring
 * the Alpha Mind (exploring-the-alpha-mind under private-sessions), got the
 * generic next steps and no booking link because only the own category was read.
 */

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))
vi.mock('../../modules/memberships', () => ({ MEMBERSHIPS_MODULE: 'membershipsModule' }))
vi.mock('../../modules/memberships/service', () => ({ default: class {} }))
vi.mock('../../automations/runtime', () => ({
  getAutomationQueue: vi.fn(),
  staffAlerter: () => ({ send: vi.fn(), reset: () => undefined }),
  createDryRunQueue: vi.fn(),
}))


type Cat = { handle: string; parent_category?: Cat | null }
const item = (handle: string, categories: Cat[]) => ({ variant: { product: { handle, categories } } })
const chain = (...handles: string[]): Cat =>
  handles.reduceRight<Cat | null>((parent, handle) => ({ handle, parent_category: parent }), null) as Cat

describe('detectOrderProductType with sub-categories', () => {
  it('reads a product in a child of private-sessions as a session', () => {
    expect(detectOrderProductType([item('exploring-the-alpha-mind-45-minutes', [chain('exploring-the-alpha-mind', 'private-sessions')])])).toBe('session')
  })

  it('reads a product in a child of group-sessions-live as group', () => {
    expect(detectOrderProductType([item('weekly-circle', [chain('weekly-circle-live', 'group-sessions-live', 'group-sessions')])])).toBe('group')
  })

  it('walks past an unmapped parent to the nearest mapped ancestor', () => {
    expect(detectOrderProductType([item('alpha-deep-dive', [chain('alpha-deep-dive', 'alpha-series', 'private-sessions')])])).toBe('session')
  })

  it('still prefers a directly mapped category', () => {
    expect(detectOrderProductType([item('mixed', [chain('exploring-the-alpha-mind', 'private-sessions'), chain('rp-live')])])).toBe('live')
  })

  it('keeps mentorship ahead of any category', () => {
    expect(detectOrderProductType([item('mentorship-single-session-live', [chain('exploring-the-alpha-mind', 'private-sessions')])])).toBe('mentorship')
  })

  it('lets a mapped parent decide before the handle patterns of a child', () => {
    expect(detectOrderProductType([item('x', [chain('akashic-coaching', 'private-sessions')])])).toBe('session')
  })

  it('falls through to other when no ancestor is mapped', () => {
    expect(detectOrderProductType([item('mystery-item', [chain('unmapped-child', 'unmapped-root')])])).toBe('other')
  })

  it('ignores inherited object keys as category handles', () => {
    expect(detectOrderProductType([item('mystery-item', [chain('constructor', 'toString')])])).toBe('other')
  })
})

describe('getHighestCategoryAccess with sub-categories', () => {
  it('resolves a child of a mapped category to the parent access', () => {
    expect(getHighestCategoryAccess([item('x', [chain('weekly-circle-live', 'group-sessions-live')])])).toMatchObject({ access_level: 2, product_type: 'group' })
  })

  it('keeps a private-sessions child at access level 1, so no portal grant follows', () => {
    expect(getHighestCategoryAccess([item('x', [chain('exploring-the-alpha-mind', 'private-sessions')])])?.access_level).toBe(1)
  })

  it('returns null when nothing in the chain is mapped', () => {
    expect(getHighestCategoryAccess([item('x', [chain('unmapped-child', 'unmapped-root')])])).toBeNull()
  })
})
