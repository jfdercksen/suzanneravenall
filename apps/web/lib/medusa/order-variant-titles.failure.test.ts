import { it, expect, vi } from 'vitest'

// A Medusa call that throws, mocked in the factory: orderVariantTitles must
// swallow it (logged) and answer an empty map, so the intake mail still goes.
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))
vi.mock('./admin-client', () => ({
  medusaAdminFetch: vi.fn(async () => {
    throw new Error('down')
  }),
}))

import { logError } from '@/lib/log'
import { orderVariantTitles } from './order-variant-titles'

it('returns an empty map, without throwing, when the Medusa call fails', async () => {
  const titles = await orderVariantTitles('order_1')
  expect(titles.size).toBe(0)
  expect(logError).toHaveBeenCalled()
})
