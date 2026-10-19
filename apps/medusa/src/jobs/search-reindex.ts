/**
 * Nightly MeiliSearch rebuild (n8n migration step 7), 00:00 UTC (02:00 SAST),
 * the time the n8n cron used. Reads every product page by page (no 500 cap),
 * upserts the published ones and deletes index documents for products that
 * are gone or no longer published. Failure: one throttled staff alert.
 */

import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { reindexProducts } from "@suzanne/integrations"
import { getMeiliClient, loadProductPage, searchSyncEnabled, type QueryGraph } from "../automations/search"
import { staffAlerter } from "../automations/runtime"

export default async function searchReindex(container: MedusaContainer): Promise<void> {
  if (!searchSyncEnabled()) return
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as unknown as QueryGraph
  try {
    const res = await reindexProducts(getMeiliClient(), (offset, limit) => loadProductPage(query, offset, limit))
    console.info(`[search-reindex] scanned=${res.scanned} upserted=${res.upserted} deleted=${res.deleted}`)
    if (res.deleteSkipped) {
      await staffAlerter().send({
        key: "search-reindex-guard",
        subject: "Nightly search rebuild skipped its deletes",
        lines: [
          `Read ${res.scanned} products, ${res.upserted} published. Stale index documents were NOT deleted because the read looked incomplete (none published, or more than half the index stale).`,
          "Check the medusa log; if those products really were removed, delete them from the index by hand.",
        ],
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[search-reindex] failed: ${message}`)
    await staffAlerter().send({
      key: "search-reindex",
      subject: "Nightly search rebuild failed",
      lines: [`The MeiliSearch products index was not rebuilt: ${message}`, "Search may show stale products until the next run."],
    })
  }
}

export const config = {
  name: "search-reindex",
  schedule: "0 0 * * *",
}
