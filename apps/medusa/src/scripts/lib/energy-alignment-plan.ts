/**
 * What rename-energy-alignment-2026-11-16.ts changes, as pure functions
 * (tested in src/scripts/__tests__/energy-alignment-plan.test.ts).
 *
 * Suzanne, 12 Nov 2026 ("Re energy - yes please"): Energy Clearing is renamed
 * Energy Alignment & Optimisation across the site, the shop and the
 * membership names. Only visible text changes: product titles, subtitles and
 * descriptions, variant titles and category names. Handles, SKUs, category
 * handles, metadata (track "energy-clearing", thinkific ids) and Thinkific
 * itself keep the old name on purpose, so orders, access and the sale guard
 * keep working (KI116).
 *
 * The match is case-sensitive: "Energy Clearing" names the programme, while
 * the lowercase "energy clearing" in a description describes the technique
 * and is left as written. "Energetic Clearing" (the remote session) and the
 * Akashic "Clearing Self / Clearing Others" level names do not match.
 * "Deep Energy Clearing", the shop's name for the same programme, becomes the
 * new name as a whole.
 */

export const NEW_NAME = "Energy Alignment & Optimisation"

const OLD_NAMES = /(?:Deep )?Energy Clearing/g

/** The text with every programme-name use renamed. */
export function renameText(text: string): string {
  return text.replace(OLD_NAMES, NEW_NAME)
}

export function needsRename(text: string | null | undefined): boolean {
  return typeof text === "string" && /Energy Clearing/.test(text)
}

/**
 * The products the rename must reach on the review box (read 16 Nov 2026):
 * the three on sale and the 14 levels of the membership ladder. A missing
 * one is reported, so a partial catalogue is never silent.
 */
export const EXPECTED_HANDLES = [
  "deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom",
  "deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom",
  "deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom",
  ...Array.from({ length: 14 }, (_, i) => `membership-s02${26 + i}`),
] as const

export type ProductRow = {
  id: string
  handle: string
  title: string | null
  subtitle: string | null
  description: string | null
  variants?: Array<{ id: string; title: string | null }> | null
}

export type CategoryRow = { id: string; handle: string; name: string | null; description: string | null }

export type FieldChange = { field: string; from: string; to: string }

export type EntityChange<K extends "product" | "variant" | "category"> = {
  kind: K
  id: string
  /** The product or category handle, for the log. */
  handle: string
  changes: FieldChange[]
  /** The fields to write (the renamed values only). */
  update: Record<string, string>
}

export type RenamePlan = {
  products: EntityChange<"product">[]
  variants: EntityChange<"variant">[]
  categories: EntityChange<"category">[]
  /** Expected products not in the catalogue at all. */
  missing: string[]
  /** Expected products found that already carry the new name. */
  alreadyRenamed: string[]
  /** Expected products found whose title carries neither name: logged, not a failure. */
  warnings: string[]
}

function changesOf(fields: Record<string, string | null | undefined>): { changes: FieldChange[]; update: Record<string, string> } {
  const changes: FieldChange[] = []
  const update: Record<string, string> = {}
  for (const [field, value] of Object.entries(fields)) {
    if (!needsRename(value)) continue
    const to = renameText(value as string)
    changes.push({ field, from: value as string, to })
    update[field] = to
  }
  return { changes, update }
}

/** Every rename the catalogue needs. Running it on a renamed catalogue plans nothing. */
export function planRename(products: ProductRow[], categories: CategoryRow[]): RenamePlan {
  const plan: RenamePlan = { products: [], variants: [], categories: [], missing: [], alreadyRenamed: [], warnings: [] }

  for (const p of products) {
    const own = changesOf({ title: p.title, subtitle: p.subtitle, description: p.description })
    if (own.changes.length > 0) plan.products.push({ kind: "product", id: p.id, handle: p.handle, ...own })
    for (const v of p.variants ?? []) {
      const vc = changesOf({ title: v.title })
      if (vc.changes.length > 0) plan.variants.push({ kind: "variant", id: v.id, handle: p.handle, ...vc })
    }
  }
  for (const c of categories) {
    const cc = changesOf({ name: c.name, description: c.description })
    if (cc.changes.length > 0) plan.categories.push({ kind: "category", id: c.id, handle: c.handle, ...cc })
  }

  const byHandle = new Map(products.map((p) => [p.handle, p]))
  const planned = new Set(plan.products.map((p) => p.handle))
  for (const handle of EXPECTED_HANDLES) {
    const product = byHandle.get(handle)
    if (!product) plan.missing.push(handle)
    else if (!planned.has(handle) && (product.title ?? "").includes(NEW_NAME)) plan.alreadyRenamed.push(handle)
    else if (!planned.has(handle)) plan.warnings.push(`${handle}: title "${product.title ?? ""}" carries neither name, left as it is`)
  }
  return plan
}

/** One log line per field: old -> new. Long descriptions show the sentence that changes. */
export function describeChange(entity: EntityChange<"product" | "variant" | "category">, change: FieldChange): string {
  const short = (s: string) => {
    if (change.field !== "description") return s
    const at = s.search(/Energy Clearing|Energy Alignment & Optimisation/)
    const start = Math.max(0, s.lastIndexOf(".", at) + 1)
    const end = s.indexOf(".", at)
    return `...${s.slice(start, end === -1 ? undefined : end + 1).trim()}...`
  }
  return `${entity.kind} ${entity.handle} ${change.field}: "${short(change.from)}" -> "${short(change.to)}"`
}
