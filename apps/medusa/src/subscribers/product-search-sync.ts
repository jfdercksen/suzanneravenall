/**
 * Keeps the MeiliSearch `products` index in step with Medusa (n8n migration
 * step 7). Replaces product-updated.ts, which called the n8n webhook.
 *
 * created / updated: read the product through Query; published -> upsert,
 * anything else -> delete from the index. deleted: delete from the index.
 * A failure is logged and left to the nightly rebuild (jobs/search-reindex.ts);
 * Medusa has no Sentry SDK yet (plan 4.3). Price-only edits may not emit
 * product.updated; the nightly rebuild picks those up too.
 */

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncProductToSearch } from "@suzanne/integrations"
import { getMeiliClient, loadProductForSearch, searchSyncEnabled, type QueryGraph } from "../automations/search"

export const PRODUCT_DELETED = "product.deleted"

export default async function productSearchSyncHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const productId = data?.id
  if (!productId || !searchSyncEnabled()) return

  try {
    const product =
      name === PRODUCT_DELETED
        ? null
        : await loadProductForSearch(container.resolve(ContainerRegistrationKeys.QUERY) as unknown as QueryGraph, productId)
    const outcome = await syncProductToSearch(getMeiliClient(), productId, product)
    console.info(`[search-sync] ${name} ${productId} -> ${outcome}`)
  } catch (err) {
    console.error(
      `[search-sync] ${name} ${productId} failed, the nightly rebuild will catch up: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", PRODUCT_DELETED],
}
