import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockClient, calls } = vi.hoisted(() => ({
  mockClient: { current: null as unknown },
  calls: [] as Array<{ op: string; args: unknown[] }>,
}))

vi.mock('@/lib/quiz/subscriber', () => ({ getServiceRoleClient: () => mockClient.current }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

import { claimCartReminder, recordCartReminderEmailId, releaseCartReminder } from './cart-reminder-log'
import { logError } from '@/lib/log'

type Result = { data?: unknown; error: { code?: string; message: string } | null }

/** A chainable fake of the supabase-js query builder; each awaited chain takes the next result (the last one repeats). */
function fakeSupabase(...results: Result[]) {
  const builder: Record<string, unknown> = {}
  for (const op of ['insert', 'delete', 'update', 'eq', 'is', 'lt', 'select']) {
    builder[op] = (...args: unknown[]) => {
      calls.push({ op, args })
      return builder
    }
  }
  builder.then = (resolve: (v: unknown) => void) => resolve(results.length > 1 ? results.shift() : results[0])
  return {
    from: (table: string) => {
      calls.push({ op: 'from', args: [table] })
      return builder
    },
  }
}

describe('cart reminder sent-log', () => {
  beforeEach(() => {
    calls.length = 0
    vi.mocked(logError).mockClear()
  })

  it('claims a new (cart, template)', async () => {
    mockClient.current = fakeSupabase({ error: null })
    expect(await claimCartReminder('cart_1', 2)).toBe('claimed')
    expect(calls).toEqual([
      { op: 'from', args: ['cart_reminder_sends'] },
      { op: 'insert', args: [{ cart_id: 'cart_1', template: 2 }] },
    ])
  })

  it('reports already_sent on the unique-key conflict when the claim is not stale', async () => {
    mockClient.current = fakeSupabase({ error: { code: '23505', message: 'duplicate key' } }, { data: [], error: null })
    expect(await claimCartReminder('cart_1', 1)).toBe('already_sent')
    expect(logError).not.toHaveBeenCalled()
    const retake = calls.slice(calls.findIndex((c) => c.op === 'update'))
    expect(retake.map((c) => c.op)).toEqual(['update', 'eq', 'eq', 'is', 'lt', 'select'])
    expect(retake[3]?.args).toEqual(['email_id', null])
  })

  it('re-takes a stale open claim left by a request that died before Brevo answered', async () => {
    mockClient.current = fakeSupabase({ error: { code: '23505', message: 'duplicate key' } }, { data: [{ id: 'x' }], error: null })
    expect(await claimCartReminder('cart_1', 1)).toBe('claimed')
  })

  it('fails closed when the stale-claim check errors', async () => {
    mockClient.current = fakeSupabase({ error: { code: '23505', message: 'duplicate key' } }, { error: { message: 'timeout' } })
    expect(await claimCartReminder('cart_1', 1)).toBe('unavailable')
  })

  it('fails closed when the table is missing, the client is not configured, or the insert fails', async () => {
    mockClient.current = fakeSupabase({ error: { code: '42P01', message: 'relation does not exist' } })
    expect(await claimCartReminder('cart_1', 1)).toBe('unavailable')
    mockClient.current = null
    expect(await claimCartReminder('cart_1', 1)).toBe('unavailable')
    mockClient.current = fakeSupabase({ error: { code: '08006', message: 'connection failure' } })
    expect(await claimCartReminder('cart_1', 1)).toBe('unavailable')
    expect(logError).toHaveBeenCalledTimes(3)
  })

  it('releases only an open claim (no email id yet)', async () => {
    mockClient.current = fakeSupabase({ error: null })
    await releaseCartReminder('cart_1', 3)
    expect(calls.map((c) => c.op)).toEqual(['from', 'delete', 'eq', 'eq', 'is'])
    expect(calls.at(-1)?.args).toEqual(['email_id', null])
  })

  it('stores the email id on the claimed row', async () => {
    mockClient.current = fakeSupabase({ error: null })
    await recordCartReminderEmailId('cart_1', 1, 'msg_1')
    expect(calls[1]).toEqual({ op: 'update', args: [{ email_id: 'msg_1' }] })
  })
})
