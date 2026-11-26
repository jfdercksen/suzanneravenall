/**
 * Plan for putting the Sage item codes (the old shop's S-codes, such as S0027)
 * back on the shop's variants, in variant.metadata.sage_item_code (Sage plan,
 * 26 Nov 2026, step b). Pure: the script feeds it the variants and writes only
 * what it returns as "set".
 *
 * Sources, in order:
 *   1. the 14 Oct catalogue map (data/sage-item-codes-2026-11-26.json): product
 *      handle + variant title to the WooCommerce product and its SKU;
 *   2. a membership level's own code in product.metadata.tier (S0212, S0214...).
 * The SKU field is never used: three variants hold Thinkific ids there.
 */

export type MapEntry = {
  handle: string
  variant_title: string
  woo_id: number | null
  woo_name: string | null
  sage_item_code: string | null
}

export type VariantRow = {
  variantId: string
  productHandle: string
  productTitle: string
  productStatus?: string | null
  variantTitle: string | null
  productMetadata?: Record<string, unknown> | null
  variantMetadata?: Record<string, unknown> | null
}

export type PlanAction = "set" | "unchanged" | "conflict" | "no-code"

export type PlanRow = {
  variantId: string
  productHandle: string
  productTitle: string
  productStatus: string | null
  variantTitle: string | null
  code: string | null
  source: "catalogue-map" | "membership-tier" | null
  oldProduct: string | null
  current: string | null
  action: PlanAction
  note?: string
}

export const SAGE_ITEM_CODE_KEY = "sage_item_code"
const CODE_PATTERN = /^S\d{4}$/

function key(handle: string, variantTitle: string | null): string {
  return `${handle.trim().toLowerCase()}|${(variantTitle ?? "").trim().toLowerCase()}`
}

export function isSageItemCode(value: unknown): value is string {
  return typeof value === "string" && CODE_PATTERN.test(value.trim())
}

export function planSageItemCodes(variants: VariantRow[], map: MapEntry[]): PlanRow[] {
  const byKey = new Map<string, MapEntry>()
  for (const e of map) byKey.set(key(e.handle, e.variant_title), e)

  const rows: PlanRow[] = variants.map((v) => {
    const entry = byKey.get(key(v.productHandle, v.variantTitle))
    const tier = v.productMetadata?.tier
    let code: string | null = null
    let source: PlanRow["source"] = null
    if (entry && isSageItemCode(entry.sage_item_code)) {
      code = entry.sage_item_code.trim()
      source = "catalogue-map"
    } else if (isSageItemCode(tier)) {
      code = tier.trim()
      source = "membership-tier"
    }
    const rawCurrent = v.variantMetadata?.[SAGE_ITEM_CODE_KEY]
    const current = typeof rawCurrent === "string" && rawCurrent.trim() ? rawCurrent.trim() : null
    const base = {
      variantId: v.variantId,
      productHandle: v.productHandle,
      productTitle: v.productTitle,
      productStatus: v.productStatus ?? null,
      variantTitle: v.variantTitle,
      code,
      source,
      oldProduct: entry?.woo_name ?? null,
      current,
    }
    if (!code) {
      return { ...base, action: "no-code" as const, note: entry ? "in the map, but the old product has no code" : "not in the 14 Oct map: check by hand" }
    }
    if (current === code) return { ...base, action: "unchanged" as const }
    if (current) return { ...base, action: "conflict" as const, note: `already holds ${current}: never overwritten` }
    return { ...base, action: "set" as const }
  })

  // A code planned for more than one variant is allowed (one Sage item can be
  // sold as two variants) but flagged, so Carla looks at it.
  const count = new Map<string, number>()
  for (const r of rows) if (r.code && r.action !== "no-code") count.set(r.code, (count.get(r.code) ?? 0) + 1)
  for (const r of rows) {
    if (r.code && (count.get(r.code) ?? 0) > 1) r.note = [r.note, `code also planned for another variant`].filter(Boolean).join("; ")
  }
  return rows
}

export function summarise(rows: PlanRow[]): Record<PlanAction, number> {
  const s: Record<PlanAction, number> = { set: 0, unchanged: 0, conflict: 0, "no-code": 0 }
  for (const r of rows) s[r.action]++
  return s
}

/** The metadata to write: the existing keys kept, the code added (no-bad-patterns: spread). */
export function mergedMetadata(existing: Record<string, unknown> | null | undefined, code: string): Record<string, unknown> {
  return { ...(existing ?? {}), [SAGE_ITEM_CODE_KEY]: code }
}

/** A Markdown table for the dry-run list Carla checks against her Sage item list. */
export function planTable(rows: PlanRow[]): string {
  const esc = (s: string | null) => (s ?? "").replace(/\|/g, "\\|")
  const order: PlanAction[] = ["no-code", "conflict", "set", "unchanged"]
  const sorted = [...rows].sort((a, b) => order.indexOf(a.action) - order.indexOf(b.action) || a.productTitle.localeCompare(b.productTitle) || (a.variantTitle ?? "").localeCompare(b.variantTitle ?? ""))
  const lines = ["| Action | Product | Variant | Status | Sage code | From | Old shop product | Note |", "|---|---|---|---|---|---|---|---|"]
  for (const r of sorted) {
    lines.push(`| ${r.action} | ${esc(r.productTitle)} | ${esc(r.variantTitle)} | ${esc(r.productStatus)} | ${esc(r.code)} | ${esc(r.source)} | ${esc(r.oldProduct)} | ${esc(r.note ?? "")} |`)
  }
  return lines.join("\n")
}
