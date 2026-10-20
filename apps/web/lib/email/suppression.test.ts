import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockClient, maybeSingle } = vi.hoisted(() => ({ mockClient: vi.fn(), maybeSingle: vi.fn() }))
vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: mockClient }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

import { isEmailUnsubscribed, unsubscribeStatus } from './suppression'

function withRow(result: { data: unknown; error: unknown }) {
  maybeSingle.mockResolvedValue(result)
  const chain: Record<string, unknown> = {}
  chain.select = () => chain
  chain.eq = () => chain
  chain.maybeSingle = maybeSingle
  mockClient.mockReturnValue({ from: () => chain })
}

describe('unsubscribeStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads an opted-out address as unsubscribed', async () => {
    withRow({ data: { email: 'a@b.co' }, error: null })
    expect(await unsubscribeStatus('A@B.co ')).toBe('unsubscribed')
  })

  it('reads an address with no row as subscribed', async () => {
    withRow({ data: null, error: null })
    expect(await unsubscribeStatus('a@b.co')).toBe('subscribed')
  })

  it('reports unavailable on a query error instead of guessing', async () => {
    withRow({ data: null, error: { message: 'timeout' } })
    expect(await unsubscribeStatus('a@b.co')).toBe('unavailable')
  })

  it('reports unavailable when the query throws', async () => {
    maybeSingle.mockRejectedValue(new Error('fetch failed'))
    const chain: Record<string, unknown> = {}
    chain.select = () => chain
    chain.eq = () => chain
    chain.maybeSingle = maybeSingle
    mockClient.mockReturnValue({ from: () => chain })
    expect(await unsubscribeStatus('a@b.co')).toBe('unavailable')
  })

  it('reports unavailable without a service-role client', async () => {
    mockClient.mockReturnValue(null)
    expect(await unsubscribeStatus('a@b.co')).toBe('unavailable')
  })
})

describe('isEmailUnsubscribed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('stays fail-open for the membership and welcome mails', async () => {
    mockClient.mockReturnValue(null)
    expect(await isEmailUnsubscribed('a@b.co')).toBe(false)
  })

  it('is true for an opted-out address', async () => {
    withRow({ data: { email: 'a@b.co' }, error: null })
    expect(await isEmailUnsubscribed('a@b.co')).toBe(true)
  })
})
