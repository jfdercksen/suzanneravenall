/**
 * publish-memberships-2026-11-19.ts: the publish step for memberships (KI071
 * switch-on). NOT RUN: Johan approves it after reading the switch-on report.
 * Runs inside the medusa container with Medusa's own container, so it needs no
 * admin password:
 *
 *   Dry run (default, changes nothing; prints every tier and what it lacks):
 *     docker compose exec medusa npx medusa exec ./src/scripts/publish-memberships-2026-11-19.ts
 *   Apply (refused while any tier has a blocker):
 *     docker compose exec -e DRY_RUN=false medusa npx medusa exec ./src/scripts/publish-memberships-2026-11-19.ts
 *   One tier only, for the proof purchase (same rules, that tier's blockers only):
 *     docker compose exec -e DRY_RUN=false -e ONLY=membership-s0212 medusa npx medusa exec ./src/scripts/publish-memberships-2026-11-19.ts
 *
 * Publishes the 24 directly buyable tiers and adds each to the store's default
 * sales channel (the publishable key's channel, so the store API returns it and
 * /portal/upgrade shows Upgrade Now). Guest and the four Novice tiers are never
 * published (lib/membership-publish-plan.ts HELD_BACK, KI114). Nothing else is
 * written: no title, price, description or metadata. To undo: set the product
 * back to draft in the admin (the dry-run output lists every id).
 *
 * Idempotent: a second run plans nothing. Exits non-zero when a blocker is
 * found, so a partial run is never silent.
 */

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { HELD_BACK, planPublish, PUBLISH_TIERS, type MembershipRow } from "./lib/membership-publish-plan"

type Query = {
  graph(input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
    pagination?: { skip: number; take: number }
  }): Promise<{ data: unknown[] }>
}

const PRODUCT_FIELDS = [
  "id",
  "handle",
  "title",
  "status",
  "description",
  "metadata",
  "sales_channels.id",
  "variants.id",
  "variants.manage_inventory",
  "variants.prices.amount",
  "variants.prices.currency_code",
]

export default async function publishMemberships({ container }: ExecArgs): Promise<void> {
  const dryRun = process.env.DRY_RUN !== "false"
  const only = (process.env.ONLY ?? "").trim()
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const log = (line: string) => console.log(`[publish-memberships] ${line}`)

  log(dryRun ? "DRY RUN: nothing is written (DRY_RUN=false to apply)" : "APPLYING")
  if (only && !PUBLISH_TIERS.some((t) => t.handle === only)) {
    log(`ONLY=${only} is not one of the 24 buyable tiers${HELD_BACK[only] ? ` (${HELD_BACK[only]})` : ""}`)
    process.exitCode = 1
    return
  }

  const handles = [...PUBLISH_TIERS.map((t) => t.handle), ...Object.keys(HELD_BACK)]
  // An explicit page: the default page size would cut the 29 rows short.
  const { data: products } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    filters: { handle: handles },
    pagination: { skip: 0, take: 100 },
  })
  const { data: stores } = await query.graph({ entity: "store", fields: ["id", "default_sales_channel_id"] })
  const defaultChannel = (stores[0] as { default_sales_channel_id?: string | null } | undefined)?.default_sales_channel_id ?? null
  log(`read ${products.length} membership product(s); default sales channel ${defaultChannel ?? "NONE"}`)
  if (products.length < handles.length) log(`warning: expected ${handles.length} membership products, read ${products.length}`)

  const plan = planPublish(products as MembershipRow[], defaultChannel)
  const tiers = only ? plan.tiers.filter((p) => p.spec.handle === only) : plan.tiers

  for (const p of tiers) {
    const todo = p.update ? Object.keys(p.update).join(" + ") : "nothing to do"
    log(`${p.spec.sku} ${p.spec.handle} [${p.status ?? "missing"}] ${p.id ?? ""}: ${todo}`)
    for (const b of p.blockers) log(`  BLOCKER ${b}`)
    for (const w of p.warnings) log(`  warning ${w}`)
  }
  for (const [handle, why] of Object.entries(HELD_BACK)) log(`HELD BACK ${handle}: ${why}`)
  for (const handle of plan.heldBackPublished) log(`BLOCKER ${handle} is published although it is held back: set it to draft in the admin`)

  const blocked = tiers.some((p) => p.blockers.length > 0) || plan.heldBackPublished.length > 0
  const toWrite = tiers.filter((p) => p.update && p.id)

  if (!dryRun && blocked) {
    log("REFUSED: fix the BLOCKER lines first; nothing was written")
  } else if (!dryRun) {
    for (const p of toWrite) {
      await updateProductsWorkflow(container).run({ input: { selector: { id: p.id }, update: p.update! } })
      log(`WROTE ${p.spec.handle} ${p.id}: ${Object.keys(p.update!).join(" + ")}`)
    }
  }

  const verb = dryRun || blocked ? "to publish or link" : "published or linked"
  log(`${toWrite.length} product(s) ${verb}; ${Object.keys(HELD_BACK).length} held back`)
  log(blocked ? "done with blockers: see BLOCKER lines above" : "done")
  if (blocked) process.exitCode = 1
}
