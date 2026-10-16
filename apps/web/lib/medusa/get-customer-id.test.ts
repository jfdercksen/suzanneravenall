import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMedusaCustomerId, getMedusaCustomerIds } from './get-customer-id'

vi.mock('@/lib/log', () => ({ logError: vi.fn(), logWarn: vi.fn() }))
vi.mock('./admin-client', () => ({ medusaAdminFetch: vi.fn() }))

import { logError } from '@/lib/log'
import { medusaAdminFetch } from './admin-client'

const adminFetch = vi.mocked(medusaAdminFetch)

function response(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response
}

describe('getMedusaCustomerIds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searches the admin customers list case-insensitively and keeps exact matches only', async () => {
    adminFetch.mockResolvedValue(
      response(200, {
        customers: [
          { id: 'cus_guest', email: 'Johan+Portal@aiautomations.co.za' },
          { id: 'cus_account', email: 'johan+portal@aiautomations.co.za' },
          { id: 'cus_other', email: 'johan+portal@aiautomations.co.za.example' },
        ],
      }),
    )

    const ids = await getMedusaCustomerIds('  Johan+Portal@Aiautomations.co.za ')

    expect(ids).toEqual(['cus_guest', 'cus_account'])
    expect(adminFetch).toHaveBeenCalledWith(
      '/customers?q=johan%2Bportal%40aiautomations.co.za&fields=id,email&limit=20&order=-created_at',
    )
  })

  it('returns [] for a member Medusa has never seen', async () => {
    adminFetch.mockResolvedValue(response(200, { customers: [] }))

    expect(await getMedusaCustomerIds('new@example.com')).toEqual([])
    expect(logError).not.toHaveBeenCalled()
  })

  it('returns [] without calling Medusa for a blank email', async () => {
    expect(await getMedusaCustomerIds('   ')).toEqual([])
    expect(adminFetch).not.toHaveBeenCalled()
  })

  it('returns [] when the client has no credentials', async () => {
    adminFetch.mockResolvedValue(null)

    expect(await getMedusaCustomerIds('a@b.c')).toEqual([])
  })

  it('logs and returns [] on a non-2xx answer', async () => {
    adminFetch.mockResolvedValue(response(401))

    expect(await getMedusaCustomerIds('a@b.c')).toEqual([])
    expect(logError).toHaveBeenCalledWith('[medusa/get-customer-id] customer lookup failed', undefined, { status: 401 })
  })

  it('logs and returns [] when the call throws', async () => {
    const boom = new Error('network')
    adminFetch.mockRejectedValue(boom)

    expect(await getMedusaCustomerIds('a@b.c')).toEqual([])
    expect(logError).toHaveBeenCalledWith('[medusa/get-customer-id] customer lookup threw', boom)
  })
})

describe('getMedusaCustomerId', () => {
  it('returns the first id or null', async () => {
    adminFetch.mockResolvedValueOnce(response(200, { customers: [{ id: 'cus_1', email: 'a@b.c' }, { id: 'cus_2', email: 'a@b.c' }] }))
    expect(await getMedusaCustomerId('a@b.c')).toBe('cus_1')

    adminFetch.mockResolvedValueOnce(response(200, { customers: [] }))
    expect(await getMedusaCustomerId('a@b.c')).toBeNull()
  })
})
