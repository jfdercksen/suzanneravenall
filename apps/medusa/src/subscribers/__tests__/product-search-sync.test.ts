import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { syncProductToSearch, reindexProducts, alertSend } = vi.hoisted(() => ({
  syncProductToSearch: vi.fn(async () => 'upserted'),
  reindexProducts: vi.fn(async (_client: unknown, _fetchPage: (o: number, l: number) => Promise<unknown>) => ({ scanned: 0, upserted: 0, deleted: 0, deleteSkipped: true })),
  alertSend: vi.fn(async () => 'sent'),
}))

vi.mock('@medusajs/framework/utils', () => ({ ContainerRegistrationKeys: { QUERY: 'query' } }))
vi.mock('@suzanne/integrations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@suzanne/integrations')>()
  return { ...actual, syncProductToSearch, reindexProducts, MeiliClient: { fromEnv: () => ({ fake: true }) } }
})
vi.mock('../../automations/runtime', () => ({ staffAlerter: () => ({ send: alertSend }) }))

import handler, { config } from '../product-search-sync'
import searchReindex, { config as jobConfig } from '../../jobs/search-reindex'
import { PRODUCT_SEARCH_FIELDS, resetMeiliClient } from '../../automations/search'

const product = { id: 'prod_1', status: 'published', title: 'T' }

function container(graph = vi.fn(async () => ({ data: [product], metadata: { count: 1 } }))) {
  return { graph, resolve: (key: string) => (key === 'query' ? { graph } : undefined) }
}

describe('product-search-sync subscriber', () => {
  beforeEach(() => {
    resetMeiliClient()
    syncProductToSearch.mockClear()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('listens to product created, updated and deleted', () => {
    expect(config.event).toEqual(['product.created', 'product.updated', 'product.deleted'])
  })

  it('reads the product through Query and syncs it', async () => {
    const c = container()
    await handler({ event: { name: 'product.updated', data: { id: 'prod_1' } }, container: c } as never)
    expect(c.graph).toHaveBeenCalledWith({ entity: 'product', fields: PRODUCT_SEARCH_FIELDS, filters: { id: 'prod_1' } })
    expect(syncProductToSearch).toHaveBeenCalledWith({ fake: true }, 'prod_1', product)
  })

  it('passes null for a product Query no longer finds', async () => {
    const c = container(vi.fn(async () => ({ data: [] })))
    await handler({ event: { name: 'product.created', data: { id: 'prod_1' } }, container: c } as never)
    expect(syncProductToSearch).toHaveBeenCalledWith({ fake: true }, 'prod_1', null)
  })

  it('deletes on product.deleted without reading the product', async () => {
    const c = container()
    await handler({ event: { name: 'product.deleted', data: { id: 'prod_1' } }, container: c } as never)
    expect(c.graph).not.toHaveBeenCalled()
    expect(syncProductToSearch).toHaveBeenCalledWith({ fake: true }, 'prod_1', null)
  })

  it('does nothing when AUTOMATION_SEARCH_SYNC=off', async () => {
    vi.stubEnv('AUTOMATION_SEARCH_SYNC', 'off')
    await handler({ event: { name: 'product.updated', data: { id: 'prod_1' } }, container: container() } as never)
    expect(syncProductToSearch).not.toHaveBeenCalled()
  })

  it('never throws when MeiliSearch fails', async () => {
    syncProductToSearch.mockRejectedValueOnce(new Error('meili down'))
    await expect(handler({ event: { name: 'product.updated', data: { id: 'prod_1' } }, container: container() } as never)).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })
})

describe('search-reindex job', () => {
  beforeEach(() => {
    reindexProducts.mockClear()
    alertSend.mockClear()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('runs at 00:00 UTC every night', () => {
    expect(jobConfig).toEqual({ name: 'search-reindex', schedule: '0 0 * * *' })
  })

  it('pages products through Query with skip and take', async () => {
    const c = container(vi.fn(async () => ({ data: [product], metadata: { count: 250 } })))
    reindexProducts.mockImplementationOnce(async (_client: unknown, fetchPage: (o: number, l: number) => Promise<unknown>) => {
      expect(await fetchPage(200, 100)).toEqual({ products: [product], count: 250 })
      return { scanned: 1, upserted: 1, deleted: 0, deleteSkipped: false }
    })
    await searchReindex(c as never)
    expect(c.graph).toHaveBeenCalledWith(expect.objectContaining({ entity: 'product', pagination: { skip: 200, take: 100, order: { created_at: 'ASC', id: 'ASC' } } }))
  })

  it('stops when Query returns no count, so nothing unread is deleted', async () => {
    const c = container(vi.fn(async () => ({ data: [product] })))
    reindexProducts.mockImplementationOnce(async (_client: unknown, fetchPage: (o: number, l: number) => Promise<unknown>) => {
      await fetchPage(0, 100)
      return { scanned: 1, upserted: 1, deleted: 0, deleteSkipped: false }
    })
    await searchReindex(c as never)
    expect(alertSend).toHaveBeenCalledWith(expect.objectContaining({ key: 'search-reindex' }))
  })

  it('alerts staff when the rebuild skipped its deletes', async () => {
    reindexProducts.mockResolvedValueOnce({ scanned: 5, upserted: 0, deleted: 0, deleteSkipped: true })
    await searchReindex(container() as never)
    expect(alertSend).toHaveBeenCalledWith(expect.objectContaining({ key: 'search-reindex-guard' }))
  })

  it('alerts staff once when the rebuild fails', async () => {
    reindexProducts.mockRejectedValueOnce(new Error('meili down'))
    await searchReindex(container() as never)
    expect(alertSend).toHaveBeenCalledWith(expect.objectContaining({ key: 'search-reindex' }))
  })
})
