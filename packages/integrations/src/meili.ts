import { fetchWithRetry, IntegrationError, type FetchLike } from './http'
import { isDryRun, type Logger } from './dry-run'

/**
 * MeiliSearch product index (n8n migration step 7, plan section 3.7).
 *
 * One document shape for the seed script (src/scripts/seed-meilisearch.ts),
 * the product subscriber and the nightly rebuild: `productToSearchDoc`, the
 * transform the seed script and the n8n "Transform: Product Document" node
 * both used.
 *
 * Only published products are in the index. The web search route does not
 * filter on status, so a draft or archived product must be deleted, not
 * upserted.
 */

export const PRODUCTS_INDEX = 'products'

export const PRODUCTS_INDEX_SETTINGS = {
  searchableAttributes: ['title', 'description', 'collection_title', 'category_names', 'variant_titles'],
  filterableAttributes: ['category_ids', 'collection_id', 'status'],
  sortableAttributes: ['title', 'price_zar'],
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
}

/** Medusa product as the admin API (`*variants.prices,*categories,*collection`) and Query return it. */
export type SearchProductInput = {
  id: string
  handle?: string | null
  title?: string | null
  description?: string | null
  thumbnail?: string | null
  status?: string | null
  variants?: Array<{ title?: string | null; prices?: Array<{ currency_code?: string | null; amount?: number | string | null }> | null }> | null
  categories?: Array<{ id: string; name?: string | null }> | null
  collection?: { id: string; handle?: string | null; title?: string | null } | null
}

export type ProductSearchDoc = {
  id: string
  handle: string | null
  title: string | null
  description: string | null
  thumbnail: string | null
  status: string | null
  price_zar: number | null
  collection_id: string | null
  collection_handle: string | null
  collection_title: string | null
  category_ids: string[]
  category_names: Array<string | null>
  variant_titles: string
}

export function lowestZarPrice(product: SearchProductInput): number | null {
  const prices = (product.variants ?? [])
    .flatMap((v) => v.prices ?? [])
    .filter((p) => p.currency_code === 'zar')
    .map((p) => Number(p.amount))
    .filter((n) => Number.isFinite(n))
  return prices.length > 0 ? Math.min(...prices) : null
}

export function productToSearchDoc(p: SearchProductInput): ProductSearchDoc {
  const variants = p.variants ?? []
  const categories = p.categories ?? []
  return {
    id: p.id,
    handle: p.handle ?? null,
    title: p.title ?? null,
    description: p.description ?? null,
    thumbnail: p.thumbnail ?? null,
    status: p.status ?? null,
    price_zar: lowestZarPrice(p),
    collection_id: p.collection?.id ?? null,
    collection_handle: p.collection?.handle ?? null,
    collection_title: p.collection?.title ?? null,
    category_ids: categories.map((c) => c.id),
    category_names: categories.map((c) => c.name ?? null),
    variant_titles: variants.map((v) => v.title ?? '').join(' '),
  }
}

export function isSearchable(p: SearchProductInput | null | undefined): p is SearchProductInput {
  return !!p && p.status === 'published'
}

export type MeiliClientOptions = {
  host: string
  apiKey: string
  dryRun?: boolean
  fetchImpl?: FetchLike
  retries?: number
  timeoutMs?: number
  sleep?: (ms: number) => Promise<void>
  logger?: Logger
}

export const MEILI_BATCH_SIZE = 500

export class MeiliClient {
  readonly dryRun: boolean
  private readonly opts: MeiliClientOptions
  private readonly logger: Logger

  constructor(opts: MeiliClientOptions) {
    this.opts = { ...opts, host: opts.host.replace(/\/+$/, '') }
    this.dryRun = opts.dryRun ?? false
    this.logger = opts.logger ?? console
  }

  /** MEILISEARCH_HOST and MEILISEARCH_ADMIN_KEY. Throws when the key is missing outside dry run. */
  static fromEnv(env: Record<string, string | undefined> = process.env, overrides: Partial<MeiliClientOptions> = {}): MeiliClient {
    const dryRun = overrides.dryRun ?? isDryRun(env)
    const host = (env.MEILISEARCH_HOST ?? '').trim() || 'http://meilisearch:7700'
    const apiKey = (env.MEILISEARCH_ADMIN_KEY ?? '').trim()
    if (!apiKey && !dryRun) {
      throw new IntegrationError('MeiliSearch is not configured (MEILISEARCH_ADMIN_KEY)', { system: 'meilisearch', code: 'NOT_CONFIGURED' })
    }
    return new MeiliClient({ host, apiKey, ...overrides, dryRun })
  }

  /** Adds or replaces documents, in batches of 500. */
  async upsertDocuments(index: string, docs: Array<{ id: string }>): Promise<void> {
    for (let i = 0; i < docs.length; i += MEILI_BATCH_SIZE) {
      const batch = docs.slice(i, i + MEILI_BATCH_SIZE)
      if (this.dryRun) {
        this.logger.info(`[meili:dry-run] upsert ${batch.length} into ${index}: ${batch.map((d) => d.id).join(', ')}`)
        continue
      }
      await this.request('POST', `/indexes/${index}/documents?primaryKey=id`, batch)
    }
  }

  async deleteDocuments(index: string, ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i += MEILI_BATCH_SIZE) {
      const batch = ids.slice(i, i + MEILI_BATCH_SIZE)
      if (this.dryRun) {
        this.logger.info(`[meili:dry-run] delete ${batch.length} from ${index}: ${batch.join(', ')}`)
        continue
      }
      // 404: the index does not exist yet, so there is nothing to delete.
      await this.request('POST', `/indexes/${index}/documents/delete-batch`, batch, { allow404: true })
    }
  }

  /** Applies index settings (idempotent; creates the index when it is missing). */
  async updateSettings(index: string, settings: Record<string, unknown>): Promise<void> {
    if (this.dryRun) {
      this.logger.info(`[meili:dry-run] settings for ${index}`)
      return
    }
    await this.request('PATCH', `/indexes/${index}/settings`, settings)
  }

  /** Every document id in the index, paged. An index that does not exist yet has none. */
  async listDocumentIds(index: string, pageSize = 1_000): Promise<string[]> {
    if (this.dryRun) return []
    const ids: string[] = []
    for (let offset = 0; ; offset += pageSize) {
      const page = (await this.request('GET', `/indexes/${index}/documents?fields=id&limit=${pageSize}&offset=${offset}`, undefined, {
        allow404: true,
      })) as { results?: Array<{ id?: unknown }>; total?: number } | null
      const results = page?.results ?? []
      for (const r of results) if (typeof r.id === 'string') ids.push(r.id)
      if (results.length < pageSize) break
    }
    return ids
  }

  private async request(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown, opts: { allow404?: boolean } = {}): Promise<unknown> {
    const res = await fetchWithRetry(
      `${this.opts.host}${path}`,
      {
        method,
        headers: { Authorization: `Bearer ${this.opts.apiKey}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      {
        system: 'meilisearch',
        retries: this.opts.retries,
        timeoutMs: this.opts.timeoutMs,
        fetchImpl: this.opts.fetchImpl,
        sleep: this.opts.sleep,
      },
    )
    if (opts.allow404 && res.status === 404) return null
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new IntegrationError(`MeiliSearch ${method} ${path.split('?')[0]}: HTTP ${res.status} ${text.slice(0, 200)}`.trim(), {
        system: 'meilisearch',
        status: res.status,
        code: `HTTP_${res.status}`,
        retriable: res.status === 429 || res.status >= 500,
      })
    }
    if (res.status === 204) return null
    return res.json() as Promise<unknown>
  }
}

/**
 * One product changed: upsert it when it is published, else delete it from
 * the index. `product` null means it no longer exists.
 */
export async function syncProductToSearch(
  client: MeiliClient,
  productId: string,
  product: SearchProductInput | null,
): Promise<'upserted' | 'deleted'> {
  if (isSearchable(product)) {
    await client.upsertDocuments(PRODUCTS_INDEX, [productToSearchDoc(product)])
    return 'upserted'
  }
  await client.deleteDocuments(PRODUCTS_INDEX, [productId])
  return 'deleted'
}

export type ProductPage = { products: SearchProductInput[]; count: number }

export type ReindexResult = {
  scanned: number
  upserted: number
  deleted: number
  /**
   * True when stale documents were found but not deleted: no published
   * product was read at all, or more than half of a large index looked
   * stale. Both are more likely a bad read than a real change.
   */
  deleteSkipped: boolean
}

/** Above this many stale documents, "more than half the index stale" stops the deletes. */
export const STALE_GUARD_MIN = 20

/**
 * Full rebuild: reads every product page by page (no cap), upserts the
 * published ones, then deletes every indexed document that is not a
 * published product any more (deleted, draft, archived). It deletes nothing
 * when no published product was read, or when more than half of a large
 * index looks stale: both are more likely a faulty read than a real change.
 */
export async function reindexProducts(
  client: MeiliClient,
  fetchPage: (offset: number, limit: number) => Promise<ProductPage>,
  opts: { pageSize?: number } = {},
): Promise<ReindexResult> {
  const pageSize = opts.pageSize ?? 100
  const keep = new Set<string>()

  // The index may have been created by an upsert with default settings.
  await client.updateSettings(PRODUCTS_INDEX, PRODUCTS_INDEX_SETTINGS)
  let scanned = 0
  let upserted = 0

  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchPage(offset, pageSize)
    scanned += page.products.length
    const docs = page.products.filter(isSearchable).map(productToSearchDoc)
    for (const d of docs) keep.add(d.id)
    await client.upsertDocuments(PRODUCTS_INDEX, docs)
    upserted += docs.length
    if (page.products.length < pageSize || offset + pageSize >= page.count) break
  }

  const indexed = await client.listDocumentIds(PRODUCTS_INDEX)
  const stale = indexed.filter((id) => !keep.has(id))
  if (stale.length === 0) return { scanned, upserted, deleted: 0, deleteSkipped: false }
  if (keep.size === 0 || (stale.length > STALE_GUARD_MIN && stale.length * 2 > indexed.length)) {
    return { scanned, upserted, deleted: 0, deleteSkipped: true }
  }
  await client.deleteDocuments(PRODUCTS_INDEX, stale)
  return { scanned, upserted, deleted: stale.length, deleteSkipped: false }
}
