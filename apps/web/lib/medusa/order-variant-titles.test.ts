import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/log', () => ({ logError: vi.fn() }))
vi.mock('./admin-client', () => ({ medusaAdminFetch: vi.fn() }))

import { medusaAdminFetch } from './admin-client'
import { orderVariantTitles } from './order-variant-titles'

beforeEach(() => vi.mocked(medusaAdminFetch).mockReset())

describe('orderVariantTitles', () => {
  it('groups the variant titles by product handle', async () => {
    vi.mocked(medusaAdminFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          order: {
            items: [
              { product_handle: 'rapid-repatterning-session', variant_title: '90 min in-person' },
              { product_handle: 'rapid-repatterning-session', variant_title: 'Package of 04 (60 min online)' },
              { product_handle: 'executive-coaching-30-mins', variant_title: '30 min' },
              { product_handle: null, variant_title: 'x' },
            ],
          },
        }),
      ),
    )
    const titles = await orderVariantTitles('order_1')
    expect(vi.mocked(medusaAdminFetch).mock.calls[0]![0]).toBe('/orders/order_1?fields=id,items.product_handle,items.variant_title')
    expect(vi.mocked(medusaAdminFetch).mock.calls[0]![1]?.signal).toBeInstanceOf(AbortSignal)
    expect(Object.fromEntries(titles)).toEqual({
      'rapid-repatterning-session': ['90 min in-person', 'Package of 04 (60 min online)'],
      'executive-coaching-30-mins': ['30 min'],
    })
  })

  it('returns an empty map on an error answer', async () => {
    vi.mocked(medusaAdminFetch).mockResolvedValue(new Response('{}', { status: 500 }))
    expect((await orderVariantTitles('order_1')).size).toBe(0)
  })

  it('returns an empty map without admin credentials', async () => {
    vi.mocked(medusaAdminFetch).mockResolvedValue(null)
    expect((await orderVariantTitles('order_1')).size).toBe(0)
  })

})
