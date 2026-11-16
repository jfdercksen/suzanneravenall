/**
 * rename-energy-alignment-2026-11-16.ts: Energy Clearing becomes Energy
 * Alignment & Optimisation in the store (Suzanne, 12 Nov 2026). Runs inside
 * the medusa container with Medusa's own container, so it needs no admin
 * password:
 *
 *   Dry run (default, changes nothing):
 *     docker compose exec medusa npx medusa exec ./src/scripts/rename-energy-alignment-2026-11-16.ts
 *   Apply:
 *     docker compose exec -e DRY_RUN=false medusa npx medusa exec ./src/scripts/rename-energy-alignment-2026-11-16.ts
 *
 * Renames the visible text only (lib/energy-alignment-plan.ts has the rules):
 * product titles, subtitles and descriptions (published, draft and the 14
 * membership levels), variant titles and category names. Every change is
 * printed as old -> new, so the dry run output is also the record to put a
 * title back by hand. Nothing is deleted; handles, SKUs, metadata and
 * Thinkific ids are untouched (KI116).
 *
 * Idempotent: a second run plans nothing. Exits non-zero when an expected
 * product is missing, so a partial run is never silent.
 */

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  updateProductCategoriesWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import { describeChange, planRename, type CategoryRow, type ProductRow } from "./lib/energy-alignment-plan"

type Query = {
  graph(input: {
    entity: string
    fields: string[]
    pagination?: { skip: number; take: number }
  }): Promise<{ data: unknown[] }>
}

const PAGE = 200

/** Every row of an entity, page by page, so no product is skipped whatever the default page size. */
export async function readAll(query: Query, entity: string, fields: string[]): Promise<unknown[]> {
  const rows: unknown[] = []
  for (let skip = 0; ; skip += PAGE) {
    const { data } = await query.graph({ entity, fields, pagination: { skip, take: PAGE } })
    rows.push(...data)
    if (data.length < PAGE) return rows
  }
}

export default async function renameEnergyAlignment({ container }: ExecArgs): Promise<void> {
  const dryRun = process.env.DRY_RUN !== "false"
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const log = (line: string) => console.log(`[energy-alignment] ${line}`)

  log(dryRun ? "DRY RUN: nothing is written (DRY_RUN=false to apply)" : "APPLYING")

  const products = await readAll(query, "product", ["id", "handle", "title", "subtitle", "description", "variants.id", "variants.title"])
  const categories = await readAll(query, "product_category", ["id", "handle", "name", "description"])
  log(`read ${products.length} product(s) and ${categories.length} categor${categories.length === 1 ? "y" : "ies"}`)
  const plan = planRename(products as ProductRow[], categories as CategoryRow[])

  for (const handle of plan.missing) log(`MISSING ${handle}`)
  for (const warning of plan.warnings) log(`WARNING ${warning}`)
  for (const entity of [...plan.products, ...plan.variants, ...plan.categories]) {
    for (const change of entity.changes) log(describeChange(entity, change))
  }

  if (!dryRun) {
    for (const p of plan.products) {
      await updateProductsWorkflow(container).run({ input: { selector: { id: p.id }, update: p.update } })
    }
    for (const v of plan.variants) {
      await updateProductVariantsWorkflow(container).run({ input: { selector: { id: v.id }, update: v.update } })
    }
    for (const c of plan.categories) {
      await updateProductCategoriesWorkflow(container).run({ input: { selector: { id: c.id }, update: c.update } })
    }
  }

  const verb = dryRun ? "to rename" : "renamed"
  log(
    `${plan.products.length} product(s), ${plan.variants.length} variant(s), ${plan.categories.length} categor${plan.categories.length === 1 ? "y" : "ies"} ${verb}; ` +
      `${plan.alreadyRenamed.length} expected product(s) already renamed`
  )
  if (!dryRun && plan.products.length + plan.variants.length + plan.categories.length > 0) {
    log("search: the published products re-index on product.updated; the nightly reindex job catches anything missed")
  }
  log(plan.missing.length === 0 ? "done" : `done with ${plan.missing.length} problem(s): see MISSING lines above`)
  if (plan.missing.length > 0) process.exitCode = 1
}
