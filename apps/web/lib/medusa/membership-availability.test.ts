import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { fetchAvailableMembershipHandles, membershipHandlesIn } from './membership-availability'

const json = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response

describe('membership availability (KI071)', () => {
  beforeEach(() => {
    vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa.test')
    vi.stubEnv('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY', 'pk_test')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('keeps only membership handles', () => {
    expect(membershipHandlesIn([{ handle: 'getting-unstuck' }, { handle: 'membership-s0213' }, { handle: null }])).toEqual(['membership-s0213'])
  })

  it('never reports a Guest or Novice product, even when it is published (KI114)', () => {
    const published = ['membership-s0211', 'membership-s0214', 'membership-s0215', 'membership-s0227', 'membership-s0228', 'membership-s0216']
    expect(membershipHandlesIn(published.map((handle) => ({ handle })))).toEqual(['membership-s0216'])
  })

  it('reads every page of the store and returns the published membership handles', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ handle: i === 7 ? 'membership-s0212' : `p${i}` }))
    const page2 = [{ handle: 'membership-s0226' }, { handle: 'book' }]
    const fetchImpl = vi.fn(async (url: string | URL | Request) =>
      String(url).includes('offset=0') ? json({ products: page1, count: 102 }) : json({ products: page2, count: 102 }),
    )
    const handles = await fetchAvailableMembershipHandles(fetchImpl as unknown as typeof fetch)
    expect(handles).toEqual(['membership-s0212', 'membership-s0226'])
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe('http://medusa.test/store/products?fields=handle&limit=100&offset=0')
  })

  it('counts a draft as not available: the store simply does not return it', async () => {
    const fetchImpl = vi.fn(async () => json({ products: [{ handle: 'getting-unstuck' }], count: 1 }))
    expect(await fetchAvailableMembershipHandles(fetchImpl as unknown as typeof fetch)).toEqual([])
  })

  it('treats a failed read as none available', async () => {
    expect(await fetchAvailableMembershipHandles((async () => json({}, false)) as unknown as typeof fetch)).toEqual([])
    expect(await fetchAvailableMembershipHandles((async () => { throw new Error('down') }) as unknown as typeof fetch)).toEqual([])
  })

  it('reads nothing without a Medusa URL', async () => {
    vi.stubEnv('MEDUSA_BACKEND_URL', '')
    vi.stubEnv('NEXT_PUBLIC_MEDUSA_URL', '')
    const fetchImpl = vi.fn()
    expect(await fetchAvailableMembershipHandles(fetchImpl as unknown as typeof fetch)).toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
