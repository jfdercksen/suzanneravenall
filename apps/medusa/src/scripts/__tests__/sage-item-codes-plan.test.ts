import { describe, it, expect } from "vitest"
import { mergedMetadata, planSageItemCodes, planTable, summarise, type MapEntry, type VariantRow } from "../lib/sage-item-codes-plan"
import data from "../data/sage-item-codes-2026-11-26.json"

const map: MapEntry[] = [
  { handle: "rapid-repatterning-session", variant_title: "90 min online", woo_id: 9229, woo_name: "Rapid Repatterning Session (90 mins)", sage_item_code: "S0101" },
  { handle: "rapid-repatterning-session", variant_title: "90 min in-person", woo_id: 14331, woo_name: "Rapid Repatterning Session (In-person)", sage_item_code: "S0102" },
  { handle: "love-relationships-group-session", variant_title: "Recorded series", woo_id: null, woo_name: null, sage_item_code: null },
]

const v = (over: Partial<VariantRow>): VariantRow => ({
  variantId: "variant_1",
  productHandle: "rapid-repatterning-session",
  productTitle: "Rapid Repatterning Session",
  variantTitle: "90 min online",
  ...over,
})

describe("planSageItemCodes", () => {
  it("sets the code from the catalogue map, matched on handle and variant title", () => {
    const [row] = planSageItemCodes([v({})], map)
    expect(row).toMatchObject({ action: "set", code: "S0101", source: "catalogue-map", oldProduct: "Rapid Repatterning Session (90 mins)" })
  })

  it("matches regardless of case and outer spaces", () => {
    const [row] = planSageItemCodes([v({ productHandle: " Rapid-Repatterning-Session ", variantTitle: "90 MIN ONLINE " })], map)
    expect(row.code).toBe("S0101")
  })

  it("uses a membership level's own code from product metadata.tier", () => {
    const [row] = planSageItemCodes([v({ productHandle: "membership-s0214", variantTitle: "Default", productMetadata: { tier: "S0214" } })], map)
    expect(row).toMatchObject({ action: "set", code: "S0214", source: "membership-tier" })
  })

  it("prefers the catalogue map over the tier", () => {
    const [row] = planSageItemCodes([v({ productMetadata: { tier: "S0999" } })], map)
    expect(row.code).toBe("S0101")
  })

  it("reports a variant missing from the map as no-code, for a check by hand", () => {
    const [row] = planSageItemCodes([v({ productHandle: "new-product-since-october" })], map)
    expect(row).toMatchObject({ action: "no-code", code: null })
    expect(row.note).toMatch(/not in the 14 Oct map/)
  })

  it("reports a mapped variant whose old product has no code as no-code", () => {
    const [row] = planSageItemCodes([v({ productHandle: "love-relationships-group-session", variantTitle: "Recorded series" })], map)
    expect(row.action).toBe("no-code")
    expect(row.note).toMatch(/old product has no code/)
  })

  it("ignores a tier that is not an S-code (such as guest)", () => {
    const [row] = planSageItemCodes([v({ productHandle: "membership-guest", productMetadata: { tier: "guest" } })], map)
    expect(row.action).toBe("no-code")
  })

  it("leaves a variant that already holds the same code unchanged", () => {
    const [row] = planSageItemCodes([v({ variantMetadata: { sage_item_code: "S0101" } })], map)
    expect(row.action).toBe("unchanged")
  })

  it("never overwrites a different code already on the variant", () => {
    const [row] = planSageItemCodes([v({ variantMetadata: { sage_item_code: "S0500" } })], map)
    expect(row).toMatchObject({ action: "conflict", current: "S0500" })
  })

  it("never reads the SKU field (Thinkific ids live there)", () => {
    const [row] = planSageItemCodes([v({ productHandle: "course", variantTitle: "x", variantMetadata: null })], map)
    expect(row.code).toBeNull()
  })

  it("flags a code planned for two variants", () => {
    const rows = planSageItemCodes([v({ variantId: "a" }), v({ variantId: "b" })], map)
    expect(rows.every((r) => /another variant/.test(r.note ?? ""))).toBe(true)
  })

  it("summarises by action", () => {
    const rows = planSageItemCodes([v({}), v({ variantId: "x", productHandle: "nope" }), v({ variantId: "y", variantTitle: "90 min in-person", variantMetadata: { sage_item_code: "S0102" } })], map)
    expect(summarise(rows)).toEqual({ set: 1, unchanged: 1, conflict: 0, "no-code": 1 })
  })
})

describe("mergedMetadata", () => {
  it("keeps every existing key and adds the code", () => {
    expect(mergedMetadata({ tier: "S0214", thinkific_course_id: 12 }, "S0214")).toEqual({ tier: "S0214", thinkific_course_id: 12, sage_item_code: "S0214" })
  })
  it("works when the variant has no metadata", () => {
    expect(mergedMetadata(null, "S0101")).toEqual({ sage_item_code: "S0101" })
  })
})

describe("planTable", () => {
  it("lists the rows needing attention first and escapes pipes", () => {
    const rows = planSageItemCodes([v({}), v({ variantId: "x", productHandle: "nope", productTitle: "A | B" })], map)
    const t = planTable(rows).split("\n")
    expect(t[2]).toMatch(/^\| no-code \| A \\\| B/)
    expect(t[3]).toMatch(/^\| set \|/)
  })
})

describe("the committed catalogue map", () => {
  it("has 145 entries, 142 with an S-code, and no code used twice", () => {
    const entries = (data as { entries: MapEntry[] }).entries
    const codes = entries.map((e) => e.sage_item_code).filter((c): c is string => !!c)
    expect(entries).toHaveLength(145)
    expect(codes).toHaveLength(142)
    expect(new Set(codes).size).toBe(142)
    expect(codes.every((c) => /^S\d{4}$/.test(c))).toBe(true)
  })
})
