import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchMemberProgrammes } from './member-programmes'

vi.mock('@/lib/log', () => ({ logError: vi.fn(), logWarn: vi.fn() }))
vi.mock('./admin-client', () => ({ medusaAdminFetch: vi.fn() }))
vi.mock('./get-customer-id', () => ({ getMedusaCustomerIds: vi.fn() }))

import { logError } from '@/lib/log'
import { medusaAdminFetch } from './admin-client'
import { getMedusaCustomerIds } from './get-customer-id'

const adminFetch = vi.mocked(medusaAdminFetch)
const customerIds = vi.mocked(getMedusaCustomerIds)

function response(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response
}

const gettingUnstuck = {
  id: 'ordli_1',
  title: 'Getting Unstuck (Self Study)',
  thumbnail: '/uploads/getting-unstuck.jpg',
  product_id: 'prod_gu',
  product_title: 'Getting Unstuck',
  product_handle: 'getting-unstuck-self-study',
  variant: {
    product_id: 'prod_gu',
    product: {
      title: 'Getting Unstuck',
      handle: 'getting-unstuck-self-study',
      thumbnail: '/uploads/getting-unstuck-product.jpg',
      metadata: { delivery_method: 'Self Study', thinkific_course_id: '123' },
    },
  },
}

describe('fetchMemberProgrammes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    customerIds.mockResolvedValue(['cus_1'])
  })

  it('returns [] for a member with no Medusa customer and asks for no orders', async () => {
    customerIds.mockResolvedValue([])

    expect(await fetchMemberProgrammes('new@example.com')).toEqual([])
    expect(adminFetch).not.toHaveBeenCalled()
  })

  it('returns [] for a customer with no orders', async () => {
    adminFetch.mockResolvedValue(response(200, { orders: [] }))

    expect(await fetchMemberProgrammes('a@b.c')).toEqual([])
    expect(logError).not.toHaveBeenCalled()
  })

  it('requests the orders of every customer id with the item, variant and product expanded', async () => {
    customerIds.mockResolvedValue(['cus_guest', 'cus_account'])
    adminFetch.mockResolvedValue(response(200, { orders: [] }))

    await fetchMemberProgrammes('a@b.c')

    const [path] = adminFetch.mock.calls[0] as [string]
    const params = new URL(`http://x${path}`).searchParams
    expect(path.startsWith('/orders?')).toBe(true)
    expect(params.get('fields')).toBe('id,status,created_at,*items,*items.variant,*items.variant.product')
    expect(params.getAll('customer_id[]')).toEqual(['cus_guest', 'cus_account'])
    expect(params.get('limit')).toBe('100')
  })

  it('maps an order line to a programme using the product record', async () => {
    adminFetch.mockResolvedValue(
      response(200, {
        orders: [{ id: 'order_389', status: 'completed', created_at: '2026-10-16T09:00:00Z', items: [gettingUnstuck] }],
      }),
    )

    expect(await fetchMemberProgrammes('johan+portal@aiautomations.co.za')).toEqual([
      {
        id: 'prod_gu',
        title: 'Getting Unstuck',
        thumbnailUrl: '/uploads/getting-unstuck-product.jpg',
        purchasedAt: '2026-10-16T09:00:00Z',
        deliveryMethod: 'Self Study',
        productHandle: 'getting-unstuck-self-study',
        courseUrl: 'https://ravenallinstitute-9629.thinkific.com/collections',
      },
    ])
  })

  it('falls back to the line item fields when the variant or product is gone', async () => {
    adminFetch.mockResolvedValue(
      response(200, {
        orders: [
          {
            id: 'o1',
            status: 'completed',
            created_at: '2026-01-01T00:00:00Z',
            items: [
              {
                id: 'li',
                title: 'Old Programme',
                thumbnail: '/old.jpg',
                product_id: 'prod_old',
                product_title: 'Old Programme',
                product_handle: 'old-programme',
                variant: null,
              },
            ],
          },
        ],
      }),
    )

    expect(await fetchMemberProgrammes('a@b.c')).toEqual([
      {
        id: 'prod_old',
        title: 'Old Programme',
        thumbnailUrl: '/old.jpg',
        purchasedAt: '2026-01-01T00:00:00Z',
        deliveryMethod: 'Self Study',
        productHandle: 'old-programme',
        courseUrl: null,
      },
    ])
  })

  it('lists each product once, keeps the first (newest) order date, and skips cancelled orders', async () => {
    adminFetch.mockResolvedValue(
      response(200, {
        orders: [
          { id: 'o_cancelled', status: 'canceled', created_at: '2026-10-17T00:00:00Z', items: [{ ...gettingUnstuck, product_id: 'prod_x', variant: { product_id: 'prod_x', product: { title: 'Cancelled Thing' } } }] },
          { id: 'o_new', status: 'completed', created_at: '2026-10-16T00:00:00Z', items: [gettingUnstuck] },
          { id: 'o_old', status: 'completed', created_at: '2026-09-01T00:00:00Z', items: [gettingUnstuck] },
        ],
      }),
    )

    const programmes = await fetchMemberProgrammes('a@b.c')

    expect(programmes.map((p) => p.id)).toEqual(['prod_gu'])
    expect(programmes[0]?.purchasedAt).toBe('2026-10-16T00:00:00Z')
  })

  it('links the Thinkific school when only the variant carries the course id', async () => {
    adminFetch.mockResolvedValue(
      response(200, {
        orders: [{ id: 'o', status: 'completed', created_at: 'd', items: [{ ...gettingUnstuck, variant: { product_id: 'prod_gu', metadata: { thinkific_course_id: 2961541 }, product: { title: 'GU', metadata: {} } } }] }],
      }),
    )

    expect((await fetchMemberProgrammes('a@b.c'))[0]?.courseUrl).toBe('https://ravenallinstitute-9629.thinkific.com/collections')
  })

  it('has no course link when the product carries no thinkific_course_id', async () => {
    adminFetch.mockResolvedValue(
      response(200, {
        orders: [{ id: 'o', status: 'completed', created_at: 'd', items: [{ ...gettingUnstuck, variant: { product_id: 'prod_gu', product: { title: 'GU', metadata: { delivery_method: 'Live' } } } }] }],
      }),
    )

    expect((await fetchMemberProgrammes('a@b.c'))[0]?.courseUrl).toBeNull()
  })

  it('defaults the delivery method when the product has none', async () => {
    adminFetch.mockResolvedValue(
      response(200, {
        orders: [{ id: 'o', status: 'completed', created_at: 'd', items: [{ ...gettingUnstuck, variant: { product_id: 'prod_gu', product: { title: 'GU', metadata: {} } } }] }],
      }),
    )

    expect((await fetchMemberProgrammes('a@b.c'))[0]?.deliveryMethod).toBe('Self Study')
  })

  it('logs and returns [] when the order lookup fails', async () => {
    adminFetch.mockResolvedValue(response(500))

    expect(await fetchMemberProgrammes('a@b.c')).toEqual([])
    expect(logError).toHaveBeenCalledWith('[medusa/member-programmes] order lookup failed', undefined, { status: 500 })
  })

  it('returns [] when the admin client has no credentials', async () => {
    adminFetch.mockResolvedValue(null)

    expect(await fetchMemberProgrammes('a@b.c')).toEqual([])
  })

  it('logs and returns [] when the lookup throws', async () => {
    const boom = new Error('network')
    customerIds.mockRejectedValue(boom)

    expect(await fetchMemberProgrammes('a@b.c')).toEqual([])
    expect(logError).toHaveBeenCalledWith('[medusa/member-programmes] fetch threw', boom)
  })
})
