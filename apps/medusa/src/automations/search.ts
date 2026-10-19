/**
 * MeiliSearch product sync (n8n migration step 7, plan section 3.7).
 *
 *   AUTOMATION_SEARCH_SYNC  code (default) | off
 *
 * There is no n8n path any more (the old product-updated.ts webhook is gone);
 * `n8n` is treated as `code` with a warning. Products are read in-process
 * through Query, so no admin token is needed. MEILISEARCH_HOST and
 * MEILISEARCH_ADMIN_KEY are already on the medusa service.
 */

import { automationMode, MeiliClient, type ProductPage, type SearchProductInput } from "@suzanne/integrations"

export type QueryGraph = {
  graph(input: Record<string, unknown>): Promise<{ data: unknown[]; metadata?: { count?: number } }>
}

/**
 * What productToSearchDoc reads; same fields the seed script asks the admin
 * API for. `variants.prices` is the field alias the product-variant-price-set
 * link defines on ProductVariant (@medusajs/link-modules), so Query resolves it.
 */
export const PRODUCT_SEARCH_FIELDS = [
  "id",
  "handle",
  "title",
  "description",
  "thumbnail",
  "status",
  "variants.title",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "categories.id",
  "categories.name",
  "collection.id",
  "collection.handle",
  "collection.title",
]

export function searchSyncEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const mode = automationMode(["AUTOMATION_SEARCH_SYNC"], "code", env)
  if (mode === "n8n") console.warn("[search-sync] AUTOMATION_SEARCH_SYNC=n8n is retired; running the code path")
  return mode !== "off"
}

let client: MeiliClient | null = null
export function getMeiliClient(): MeiliClient {
  if (!client) client = MeiliClient.fromEnv(process.env)
  return client
}

/** Tests only. */
export function resetMeiliClient(): void {
  client = null
}

export async function loadProductForSearch(query: QueryGraph, id: string): Promise<SearchProductInput | null> {
  const { data } = await query.graph({ entity: "product", fields: PRODUCT_SEARCH_FIELDS, filters: { id } })
  return (data[0] as SearchProductInput | undefined) ?? null
}

export async function loadProductPage(query: QueryGraph, offset: number, limit: number): Promise<ProductPage> {
  const { data, metadata } = await query.graph({
    entity: "product",
    fields: PRODUCT_SEARCH_FIELDS,
    // id breaks created_at ties, so skip/take never drops or repeats a product.
    pagination: { skip: offset, take: limit, order: { created_at: "ASC", id: "ASC" } },
  })
  const count = metadata?.count
  // Without a count the rebuild cannot know it read everything, and would
  // then delete the unread products from the index.
  if (typeof count !== "number") throw new Error("Query returned no product count; rebuild stopped")
  return { products: data as SearchProductInput[], count }
}
