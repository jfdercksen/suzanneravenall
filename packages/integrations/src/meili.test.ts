// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import {
  MeiliClient,
  productToSearchDoc,
  reindexProducts,
  syncProductToSearch,
  PRODUCTS_INDEX_SETTINGS,
  type SearchProductInput,
} from './meili'

const PRODUCT: SearchProductInput = {
  id: 'prod_01',
  handle: 'pattern-mastery',
  title: 'Pattern Mastery',
  description: 'Eight weeks of pattern work.',
  thumbnail: 'https://cdn.test/p.jpg',
  status: 'published',
  variants: [
    { title: 'Self Study', prices: [{ currency_code: 'zar', amount: 4205 }, { currency_code: 'usd', amount: 240 }] },
    { title: 'Live', prices: [{ currency_code: 'zar', amount: 9800 }] },
  ],
  categories: [{ id: 'pcat_1', name: 'Programmes' }, { id: 'pcat_2', name: 'Online' }],
  collection: { id: 'pcol_1', handle: 'signature', title: 'Signature' },
}

// The transform as it stood inline in apps/medusa/src/scripts/seed-meilisearch.ts
// before this change (git HEAD 3bdf2f9), kept verbatim as the parity reference.
type LegacyProduct = {
  id: string
  handle: string
  title: string
  description: string | null
  thumbnail: string | null
  status: string
  variants: Array<{ title: string; prices: Array<{ currency_code: string; amount: number }> }>
  categories: Array<{ id: string; name: string }>
  collection: { id: string; handle: string; title: string } | null
}
function legacySeedDoc(p: LegacyProduct) {
  const prices = p.variants.flatMap((v) => v.prices).filter((x) => x.currency_code === 'zar').map((x) => x.amount)
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    thumbnail: p.thumbnail,
    status: p.status,
    price_zar: prices.length > 0 ? Math.min(...prices) : null,
    collection_id: p.collection?.id ?? null,
    collection_handle: p.collection?.handle ?? null,
    collection_title: p.collection?.title ?? null,
    category_ids: p.categories.map((c) => c.id),
    category_names: p.categories.map((c) => c.name),
    variant_titles: p.variants.map((v) => v.title).join(' '),
  }
}

type N8nNode = { name: string; parameters: Record<string, unknown> }
const workflowPath = fileURLToPath(new URL('../../../infra/n8n/workflows/meilisearch-content-sync.json', import.meta.url))
const workflow = JSON.parse(readFileSync(workflowPath, 'utf8')) as { nodes: N8nNode[] }
function n8nDoc(product: unknown): Record<string, unknown> {
  const node = workflow.nodes.find((n) => n.name === 'Transform: Product Document')!
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function('$input', node.parameters.jsCode as string) as (i: unknown) => Array<{ json: Record<string, unknown> }>
  return fn({ item: { json: { product } } })[0]!.json
}

describe('productToSearchDoc', () => {
  it('produces exactly the document the seed script produced', () => {
    expect(productToSearchDoc(PRODUCT)).toEqual(legacySeedDoc(PRODUCT as LegacyProduct))
  })

  it('matches the n8n Transform node too', () => {
    expect(productToSearchDoc(PRODUCT)).toEqual(n8nDoc(PRODUCT))
  })

  it('matches for a product without collection, categories or ZAR price', () => {
    const bare: SearchProductInput = { ...PRODUCT, collection: null, categories: [], variants: [{ title: 'Default', prices: [{ currency_code: 'usd', amount: 10 }] }] }
    expect(productToSearchDoc(bare)).toEqual(legacySeedDoc(bare as LegacyProduct))
    expect(productToSearchDoc(bare).price_zar).toBeNull()
  })

  it('tolerates the missing relations Query can return', () => {
    expect(productToSearchDoc({ id: 'p', status: 'published' })).toMatchObject({ category_ids: [], variant_titles: '', price_zar: null, collection_id: null })
  })

  it('keeps the index settings the seed script set', () => {
    expect(PRODUCTS_INDEX_SETTINGS.filterableAttributes).toEqual(['category_ids', 'collection_id', 'status'])
    expect(PRODUCTS_INDEX_SETTINGS.sortableAttributes).toEqual(['title', 'price_zar'])
  })
})

/** In-memory MeiliSearch: documents per index, records each request. */
function fakeMeili(seed: string[] = []) {
  const docs = new Map<string, Record<string, unknown>>(seed.map((id) => [id, { id }]))
  const calls: Array<{ method: string; path: string; body: unknown }> = []
  const fetchImpl = async (input: string, init?: RequestInit) => {
    const url = new URL(input)
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ method: init?.method ?? 'GET', path: url.pathname, body })
    const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 202 })
    if (url.pathname === '/indexes/products/documents' && init?.method === 'POST') {
      for (const d of body as Array<{ id: string }>) docs.set(d.id, d)
      return ok({ taskUid: 1 })
    }
    if (url.pathname === '/indexes/products/settings') return ok({ taskUid: 0 })
    if (url.pathname === '/indexes/products/documents/delete-batch') {
      for (const id of body as string[]) docs.delete(id)
      return ok({ taskUid: 2 })
    }
    if (url.pathname === '/indexes/products/documents') {
      const limit = Number(url.searchParams.get('limit'))
      const offset = Number(url.searchParams.get('offset'))
      const all = [...docs.keys()].sort()
      return new Response(JSON.stringify({ results: all.slice(offset, offset + limit).map((id) => ({ id })), total: all.length }), { status: 200 })
    }
    return new Response('{}', { status: 404 })
  }
  const client = new MeiliClient({ host: 'http://meili.test/', apiKey: 'key', fetchImpl, retries: 0 })
  return { client, docs, calls }
}

describe('syncProductToSearch', () => {
  it('upserts a published product', async () => {
    const m = fakeMeili()
    expect(await syncProductToSearch(m.client, PRODUCT.id, PRODUCT)).toBe('upserted')
    expect(m.docs.get('prod_01')).toEqual(productToSearchDoc(PRODUCT))
  })

  it('deletes a product that is not published (draft, proposed, rejected)', async () => {
    for (const status of ['draft', 'proposed', 'rejected']) {
      const m = fakeMeili(['prod_01'])
      expect(await syncProductToSearch(m.client, PRODUCT.id, { ...PRODUCT, status })).toBe('deleted')
      expect(m.docs.has('prod_01')).toBe(false)
    }
  })

  it('deletes a product that no longer exists', async () => {
    const m = fakeMeili(['prod_01'])
    expect(await syncProductToSearch(m.client, 'prod_01', null)).toBe('deleted')
    expect(m.calls.at(-1)).toMatchObject({ path: '/indexes/products/documents/delete-batch', body: ['prod_01'] })
  })

  it('throws on an HTTP error so the caller can log it', async () => {
    const client = new MeiliClient({ host: 'http://m', apiKey: 'k', retries: 0, fetchImpl: async () => new Response('bad key', { status: 403 }) })
    await expect(syncProductToSearch(client, 'p', PRODUCT)).rejects.toThrow(/HTTP 403/)
  })
})

describe('reindexProducts', () => {
  const make = (i: number, status = 'published'): SearchProductInput => ({ ...PRODUCT, id: `prod_${String(i).padStart(3, '0')}`, status })

  it('reads every page past the old 500 cap and removes documents for products that are gone or unpublished', async () => {
    const products = Array.from({ length: 523 }, (_, i) => make(i, i % 50 === 7 ? 'draft' : 'published'))
    const m = fakeMeili(['prod_gone', 'prod_007'])
    const pages: number[] = []
    const res = await reindexProducts(
      m.client,
      async (offset, limit) => {
        pages.push(offset)
        return { products: products.slice(offset, offset + limit), count: products.length }
      },
      { pageSize: 100 },
    )
    expect(pages).toEqual([0, 100, 200, 300, 400, 500])
    const drafts = products.filter((p) => p.status === 'draft').length
    expect(res).toEqual({ scanned: 523, upserted: 523 - drafts, deleted: 2, deleteSkipped: false })
    expect(m.docs.size).toBe(523 - drafts)
    expect(m.docs.has('prod_gone')).toBe(false)
    expect(m.docs.has('prod_007')).toBe(false)
  })

  it('stops on an exact multiple of the page size', async () => {
    const products = Array.from({ length: 200 }, (_, i) => make(i))
    const m = fakeMeili()
    const pages: number[] = []
    await reindexProducts(m.client, async (offset, limit) => {
      pages.push(offset)
      return { products: products.slice(offset, offset + limit), count: 200 }
    }, { pageSize: 100 })
    expect(pages).toEqual([0, 100])
  })

  it('pages through the index ids when listing stale documents', async () => {
    const products = Array.from({ length: 2_400 }, (_, i) => make(i))
    const m = fakeMeili([...products.map((p) => p.id), ...Array.from({ length: 100 }, (_, i) => `old_${i}`)])
    const res = await reindexProducts(m.client, async (o, l) => ({ products: products.slice(o, o + l), count: 2_400 }), { pageSize: 1_000 })
    expect(res.deleted).toBe(100)
    expect(m.calls.filter((c) => c.method === 'GET').length).toBe(3)
    expect(m.docs.size).toBe(2_400)
  })

  it('applies the index settings before upserting', async () => {
    const m = fakeMeili()
    await reindexProducts(m.client, async () => ({ products: [make(1)], count: 1 }))
    expect(m.calls[0]).toMatchObject({ method: 'PATCH', path: '/indexes/products/settings', body: PRODUCTS_INDEX_SETTINGS })
  })

  it('deletes nothing when more than half of a large index looks stale', async () => {
    const m = fakeMeili(Array.from({ length: 40 }, (_, i) => `old_${i}`))
    const res = await reindexProducts(m.client, async () => ({ products: [make(1)], count: 1 }))
    expect(res).toMatchObject({ deleted: 0, deleteSkipped: true })
    expect(m.docs.size).toBe(41)
  })

  it('treats a 404 on delete (no index yet) as nothing to delete', async () => {
    const client = new MeiliClient({ host: 'http://m', apiKey: 'k', retries: 0, fetchImpl: async () => new Response('{}', { status: 404 }) })
    await expect(syncProductToSearch(client, 'p', null)).resolves.toBe('deleted')
  })

  it('deletes nothing when no published product was read', async () => {
    const m = fakeMeili(['prod_a', 'prod_b'])
    const res = await reindexProducts(m.client, async () => ({ products: [], count: 0 }))
    expect(res).toEqual({ scanned: 0, upserted: 0, deleted: 0, deleteSkipped: true })
    expect(m.docs.size).toBe(2)
  })
})

describe('MeiliClient.fromEnv', () => {
  it('requires the admin key outside dry run', () => {
    expect(() => MeiliClient.fromEnv({ MEILISEARCH_HOST: 'http://m' })).toThrow(/MEILISEARCH_ADMIN_KEY/)
    expect(MeiliClient.fromEnv({ AUTOMATION_DRY_RUN: 'true' }).dryRun).toBe(true)
  })

  it('makes no network call in dry run', async () => {
    const client = new MeiliClient({ host: 'http://m', apiKey: '', dryRun: true, fetchImpl: async () => { throw new Error('network') }, logger: { info: () => {}, warn: () => {}, error: () => {} } })
    await expect(syncProductToSearch(client, 'p', PRODUCT)).resolves.toBe('upserted')
    await expect(reindexProducts(client, async () => ({ products: [PRODUCT], count: 1 }))).resolves.toMatchObject({ deleted: 0 })
  })
})
