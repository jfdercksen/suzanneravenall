/**
 * shop-changes-2026-11-12.ts: Suzanne's shop changes of 11 and 12 Nov 2026,
 * applied to the store data in place (no deletes). Runs inside the medusa
 * container with Medusa's own container, so it needs no admin password:
 *
 *   Dry run (default, changes nothing):
 *     docker compose exec medusa npx medusa exec ./src/scripts/shop-changes-2026-11-12.ts
 *   Apply:
 *     docker compose exec -e DRY_RUN=false medusa npx medusa exec ./src/scripts/shop-changes-2026-11-12.ts
 *   Put a retired self-study back on sale once the programme has been run:
 *     docker compose exec -e DRY_RUN=false -e RESTORE=mindfulness-live medusa npx medusa exec ./src/scripts/shop-changes-2026-11-12.ts
 *
 * What it does (lib/shop-changes-plan.ts has the detail):
 * 1. Sets metadata.sale_status on the variants of the six live-only products:
 *    "retired" on Self Study, "register_interest" on the live variants. The
 *    store then refuses them in a cart (src/workflows/hooks/not-for-sale.ts).
 * 2. Creates "Brainwave Club" (partner product, no price, never in a cart) and
 *    "Suzanne Ravenall Coaching App" (once-off R250) if their handles do not
 *    exist yet, under Products & Tools, with the sales channel and shipping
 *    profile of a digital product already on sale (none, if it has none).
 *
 * Idempotent: a second run reports everything unchanged. Exits non-zero when
 * something it needs is missing, so a partial run is never silent.
 */

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow, updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import {
  LIVE_ONLY_HANDLES,
  parseRestore,
  planLiveOnly,
  planNewProducts,
  BRAINWAVE_HANDLE,
  COACHING_APP_HANDLE,
  type ProductState,
} from "./lib/shop-changes-plan"

/** A published digital product on sale whose sales channel and shipping profile the new products copy. */
const REFERENCE_HANDLE = "getting-unstuck-self-study"
const CATEGORY_HANDLE = "products-tools"

type Query = {
  graph(input: { entity: string; fields: string[]; filters?: Record<string, unknown> }): Promise<{ data: unknown[] }>
}

export default async function shopChanges({ container }: ExecArgs): Promise<void> {
  const dryRun = process.env.DRY_RUN !== "false"
  const restore = parseRestore(process.env.RESTORE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const log = (line: string) => console.log(`[shop-changes] ${line}`)
  let problems = 0

  log(dryRun ? "DRY RUN: nothing is written (DRY_RUN=false to apply)" : "APPLYING")
  if (restore.unknown.length > 0) {
    log(`RESTORE names products this script does not manage: ${restore.unknown.join(", ")}`)
    problems += 1
  }

  // 1. Live only
  const { data: rows } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.title", "variants.metadata"],
    filters: { handle: [...LIVE_ONLY_HANDLES] },
  })
  const products = (rows as ProductState[]).map((p) => ({ ...p, variants: p.variants ?? [] }))
  const plan = planLiveOnly(products, restore.handles)
  for (const handle of plan.missing) {
    log(`MISSING product ${handle}`)
    problems += 1
  }
  for (const u of plan.updates) {
    log(`${u.handle} / ${u.title}: ${u.from ?? "on sale"} -> ${u.to ?? "on sale"}`)
    if (!dryRun) {
      await updateProductVariantsWorkflow(container).run({
        input: { selector: { id: u.variantId }, update: { metadata: u.metadata } },
      })
    }
  }
  log(`live only: ${plan.updates.length} variant(s) ${dryRun ? "to change" : "changed"}, ${plan.unchanged} already right`)
  if (!dryRun && plan.updates.length > 0) {
    // A variant update does not re-index the product; the nightly reindex job
    // drops the retired self-study prices from search, or run it now.
    log("search: retired prices leave the search index on the next reindex (nightly job)")
  }

  // 2. New products
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: [BRAINWAVE_HANDLE, COACHING_APP_HANDLE] },
  })
  const existingHandles = new Set((existing as Array<{ handle: string }>).map((p) => p.handle))
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: CATEGORY_HANDLE },
  })
  const { data: references } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "sales_channels.id", "shipping_profile.id"],
    filters: { handle: REFERENCE_HANDLE },
  })
  const categoryId = (categories[0] as { id?: string } | undefined)?.id
  const reference = references[0] as
    | { sales_channels?: Array<{ id: string }> | null; shipping_profile?: { id: string } | null }
    | undefined
  const salesChannelId = reference?.sales_channels?.[0]?.id ?? null
  const shippingProfileId = reference?.shipping_profile?.id ?? null

  if (!categoryId || !reference) {
    if (!categoryId) log(`MISSING category ${CATEGORY_HANDLE}`)
    if (!reference) log(`MISSING reference product ${REFERENCE_HANDLE}`)
    problems += 1
  } else {
    // The new products are set up exactly like the reference product. On the
    // review box the published products have no sales channel and no shipping
    // profile linked, and they sell; so an absent link is copied as absent.
    log(`reference ${REFERENCE_HANDLE}: sales channel ${salesChannelId ?? "none"}, shipping profile ${shippingProfileId ?? "none"} (copied as they are)`)
    const toCreate = planNewProducts(existingHandles, { categoryId, salesChannelId, shippingProfileId })
    for (const handle of existingHandles) log(`${handle}: exists, left as it is`)
    for (const product of toCreate) log(`${product.handle}: ${dryRun ? "would create" : "creating"}`)
    if (!dryRun && toCreate.length > 0) {
      await createProductsWorkflow(container).run({
        input: { products: toCreate },
      })
    }
  }

  log(problems === 0 ? "done" : `done with ${problems} problem(s): see MISSING lines above`)
  if (problems > 0) process.exitCode = 1
}
