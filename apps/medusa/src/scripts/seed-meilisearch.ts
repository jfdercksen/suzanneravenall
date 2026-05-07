/**
 * Seed MeiliSearch indexes with products from Medusa and explore topics.
 *
 * Run inside the medusa container:
 *   docker compose exec medusa npx ts-node src/scripts/seed-meilisearch.ts
 *
 * Idempotent — safe to run multiple times. Existing documents are replaced.
 */

const MEILI_HOST = process.env.MEILISEARCH_HOST ?? 'http://meilisearch:7700'
const MEILI_KEY = process.env.MEILISEARCH_ADMIN_KEY ?? ''
const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'
const MEDUSA_TOKEN = process.env.MEDUSA_API_TOKEN ?? ''

if (!MEILI_KEY) {
  console.error('MEILISEARCH_ADMIN_KEY is not set')
  process.exit(1)
}
if (!MEDUSA_TOKEN) {
  console.error('MEDUSA_API_TOKEN is not set')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// MeiliSearch helpers
// ---------------------------------------------------------------------------

async function meiliRequest(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${MEILI_HOST}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${MEILI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`MeiliSearch ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  }

  // 204 No Content has no body
  if (res.status === 204) return null
  return res.json() as unknown
}

async function ensureIndex(uid: string, primaryKey: string): Promise<void> {
  const res = await fetch(`${MEILI_HOST}/indexes/${uid}`, {
    headers: { Authorization: `Bearer ${MEILI_KEY}` },
  })

  if (res.ok) {
    console.log(`  Index "${uid}" exists`)
    return
  }
  if (res.status !== 404) {
    const text = await res.text().catch(() => '')
    throw new Error(`MeiliSearch GET /indexes/${uid} → ${res.status}: ${text.slice(0, 300)}`)
  }

  console.log(`  Creating index "${uid}"…`)
  await meiliRequest('POST', '/indexes', { uid, primaryKey })
}

async function updateSettings(uid: string, settings: unknown): Promise<void> {
  await meiliRequest('PATCH', `/indexes/${uid}/settings`, settings)
}

async function addDocuments(uid: string, documents: unknown[]): Promise<void> {
  if (documents.length === 0) return
  // Batch in 500-document chunks
  for (let i = 0; i < documents.length; i += 500) {
    const batch = documents.slice(i, i + 500)
    await meiliRequest('POST', `/indexes/${uid}/documents`, batch)
    console.log(`  Upserted ${i + batch.length} / ${documents.length} documents into "${uid}"`)
  }
}

// ---------------------------------------------------------------------------
// Products index
// ---------------------------------------------------------------------------

interface MedusaVariant {
  id: string
  title: string
  prices: Array<{ currency_code: string; amount: number }>
}

interface MedusaProductResponse {
  id: string
  handle: string
  title: string
  description: string | null
  thumbnail: string | null
  status: string
  variants: MedusaVariant[]
  categories: Array<{ id: string; name: string }>
  collection: { id: string; handle: string; title: string } | null
}

function getLowestZarPrice(variants: MedusaVariant[]): number | null {
  const prices = variants
    .flatMap((v) => v.prices)
    .filter((p) => p.currency_code === 'zar')
    .map((p) => p.amount)
  return prices.length > 0 ? Math.min(...prices) : null
}

async function seedProducts(): Promise<void> {
  console.log('\nSeeding products index…')

  await ensureIndex('products', 'id')

  await updateSettings('products', {
    searchableAttributes: ['title', 'description', 'collection_title', 'category_names', 'variant_titles'],
    filterableAttributes: ['category_ids', 'collection_id', 'status'],
    sortableAttributes: ['title', 'price_zar'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
  })

  // Fetch all published products
  const products: MedusaProductResponse[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const fields = ['id', 'handle', 'title', 'description', 'thumbnail', 'status', '*variants', '*variants.prices', '*categories', '*collection'].join(',')
    const res = await fetch(
      `${MEDUSA_URL}/admin/products?limit=${limit}&offset=${offset}&fields=${encodeURIComponent(fields)}&status[]=published`,
      {
        headers: {
          Authorization: `Bearer ${MEDUSA_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) throw new Error(`Medusa products fetch failed: ${res.status}`)

    const data = (await res.json()) as { products: MedusaProductResponse[]; count: number }
    products.push(...data.products)
    console.log(`  Fetched ${products.length} / ${data.count} products from Medusa`)

    if (products.length >= data.count) break
    offset += limit
  }

  const documents = products.map((p) => ({
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    thumbnail: p.thumbnail,
    status: p.status,
    price_zar: getLowestZarPrice(p.variants),
    collection_id: p.collection?.id ?? null,
    collection_handle: p.collection?.handle ?? null,
    collection_title: p.collection?.title ?? null,
    category_ids: p.categories.map((c) => c.id),
    category_names: p.categories.map((c) => c.name),
    variant_titles: p.variants.map((v) => v.title).join(' '),
  }))

  await addDocuments('products', documents)
  console.log(`  Products index complete — ${documents.length} documents`)
}

// ---------------------------------------------------------------------------
// Explore topics index (static data from the web app)
// ---------------------------------------------------------------------------

interface TopicDocument {
  id: string
  title: string
  shortDescription: string
  corePrinciple: string
  url: string
}

// These are the 8 explore topics from apps/web/app/explore/topics.ts.
// They are static and change rarely — update here when the source changes.
const EXPLORE_TOPICS: TopicDocument[] = [
  {
    id: 'emotional-nervous-system-mastery',
    title: 'Emotional & Nervous System Mastery',
    shortDescription: "You don't have an emotional problem. You have a nervous system pattern.",
    corePrinciple: 'This is not personality. This is patterning.',
    url: '/explore/emotional-nervous-system-mastery',
  },
  {
    id: 'relationships-attachment-patterns',
    title: 'Relationships & Attachment Patterns',
    shortDescription: 'The way you connect was learned. It can be relearned.',
    corePrinciple: 'Your attachment style is a pattern, not a personality.',
    url: '/explore/relationships-attachment-patterns',
  },
  {
    id: 'next-level-health-vitality-longevity',
    title: 'Next-Level Health, Vitality & Longevity',
    shortDescription: 'Your body is responding to what your nervous system believes.',
    corePrinciple: 'Health is a nervous system output, not a willpower contest.',
    url: '/explore/next-level-health-vitality-longevity',
  },
  {
    id: 'intuition-as-patterned-intelligence',
    title: 'Intuition as Patterned Intelligence',
    shortDescription: 'Intuition is not mystical. It is pattern recognition at speed.',
    corePrinciple: 'Intuition is intelligence, not instinct.',
    url: '/explore/intuition-as-patterned-intelligence',
  },
  {
    id: 'leadership-high-performance',
    title: 'Leadership & High Performance',
    shortDescription: 'Leadership under pressure reveals the patterns you have not yet resolved.',
    corePrinciple: 'Performance is a pattern, not a personality trait.',
    url: '/explore/leadership-high-performance',
  },
  {
    id: 'life-transitions-reinvention',
    title: 'Life Transitions & Reinvention',
    shortDescription: 'Every major transition asks you to become someone new.',
    corePrinciple: 'Reinvention is not a lifestyle choice. It is a nervous system requirement.',
    url: '/explore/life-transitions-reinvention',
  },
  {
    id: 'health-energy-intelligence',
    title: 'Health, Energy & Intelligence',
    shortDescription: 'Energy is not a resource you manage. It is a system you regulate.',
    corePrinciple: 'Energy is a regulated output, not a limited resource.',
    url: '/explore/health-energy-intelligence',
  },
  {
    id: 'identity-purpose-activation',
    title: 'Identity & Purpose Activation',
    shortDescription: 'You cannot find your purpose. You can only become the version of yourself it belongs to.',
    corePrinciple: 'Purpose emerges from identity — not from searching.',
    url: '/explore/identity-purpose-activation',
  },
]

async function seedTopics(): Promise<void> {
  console.log('\nSeeding explore_topics index…')

  await ensureIndex('explore_topics', 'id')

  await updateSettings('explore_topics', {
    searchableAttributes: ['title', 'shortDescription', 'corePrinciple'],
    filterableAttributes: [],
    sortableAttributes: ['title'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
  })

  await addDocuments('explore_topics', EXPLORE_TOPICS)
  console.log(`  Topics index complete — ${EXPLORE_TOPICS.length} documents`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`Seeding MeiliSearch at ${MEILI_HOST}`)

  const health = await fetch(`${MEILI_HOST}/health`).catch(() => null)
  if (!health?.ok) {
    console.error('MeiliSearch health check failed — is the container running?')
    process.exit(1)
  }
  console.log('MeiliSearch is healthy\n')

  await seedProducts()
  await seedTopics()

  console.log('\nAll indexes seeded successfully.')
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('Seed failed:', msg)
  process.exit(1)
})
