/**
 * set-sage-item-codes-2026-11-26.ts: puts the Sage item codes (the old shop's
 * S-codes) back on the shop's variants, in variant.metadata.sage_item_code
 * (Sage plan step b). NOT RUN: it needs Johan's yes, after Carla has checked
 * the dry-run list against her Sage item list.
 *
 *   Dry run (default, writes nothing; prints every variant and its code):
 *     docker compose exec medusa npx medusa exec ./src/scripts/set-sage-item-codes-2026-11-26.ts
 *   Apply:
 *     docker compose exec -e DRY_RUN=false medusa npx medusa exec ./src/scripts/set-sage-item-codes-2026-11-26.ts
 *
 * Writes only rows planned as "set": a variant that already holds a different
 * code is never overwritten, a variant without a code is left alone. Metadata
 * is merged, every other key kept. The SKU field is never touched. Idempotent:
 * a second run plans nothing. To undo: remove sage_item_code from the variant's
 * metadata (the dry-run output lists every variant id).
 */

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import data from "./data/sage-item-codes-2026-11-26.json"
import { mergedMetadata, planSageItemCodes, planTable, summarise, type MapEntry, type VariantRow } from "./lib/sage-item-codes-plan"

type Query = {
  graph(input: {
    entity: string
    fields: string[]
    pagination?: { skip: number; take: number }
  }): Promise<{ data: unknown[] }>
}

type ProductRecord = {
  handle: string
  title: string
  status?: string | null
  metadata?: Record<string, unknown> | null
  variants?: Array<{ id: string; title: string | null; metadata?: Record<string, unknown> | null }>
}

const PAGE = 200

export default async function setSageItemCodes({ container }: ExecArgs): Promise<void> {
  const dryRun = process.env.DRY_RUN !== "false"
  const log = (line: string) => console.log(`[sage-item-codes] ${line}`)
  log(dryRun ? "DRY RUN: nothing is written (DRY_RUN=false to apply)" : "APPLYING")

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const products: ProductRecord[] = []
  for (let skip = 0; ; skip += PAGE) {
    const { data: page } = await query.graph({
      entity: "product",
      fields: ["handle", "title", "status", "metadata", "variants.id", "variants.title", "variants.metadata"],
      pagination: { skip, take: PAGE },
    })
    products.push(...(page as ProductRecord[]))
    if (page.length < PAGE) break
  }

  const variants: VariantRow[] = products.flatMap((p) =>
    (p.variants ?? []).map((v) => ({
      variantId: v.id,
      productHandle: p.handle,
      productTitle: p.title,
      productStatus: p.status ?? null,
      variantTitle: v.title,
      productMetadata: p.metadata ?? null,
      variantMetadata: v.metadata ?? null,
    })),
  )
  const rows = planSageItemCodes(variants, (data as { entries: MapEntry[] }).entries)
  log(`read ${products.length} product(s), ${variants.length} variant(s)`)
  console.log(planTable(rows))
  const s = summarise(rows)
  log(`set ${s.set}, unchanged ${s.unchanged}, conflict ${s.conflict}, no code ${s["no-code"]}`)

  if (dryRun) {
    log("done (dry run)")
    return
  }

  const byId = new Map(variants.map((v) => [v.variantId, v]))
  let written = 0
  for (const r of rows) {
    if (r.action !== "set" || !r.code) continue
    const metadata = mergedMetadata(byId.get(r.variantId)?.variantMetadata, r.code)
    await updateProductVariantsWorkflow(container).run({ input: { selector: { id: r.variantId }, update: { metadata } } })
    written++
    log(`WROTE ${r.variantId} ${r.productHandle} / ${r.variantTitle ?? ""}: ${r.code}`)
  }
  log(`done: ${written} variant(s) written`)
}
