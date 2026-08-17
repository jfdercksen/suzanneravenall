import * as fs from "fs"
import * as path from "path"
import { describe, it, expect } from "vitest"
import {
  CONSOLIDATION_MAP,
  buildSourceSlugIndex,
  buildRedirectMap,
  buildConsolidatedPayload,
  computeMissingVariants,
  variantManagesInventory,
  getSkipReason,
  priceInCents,
} from "../migrate-woocommerce"
import type { ConsolidationEntry, WcProduct } from "../migrate-woocommerce"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeWcProduct(overrides: Partial<WcProduct> = {}): WcProduct {
  return {
    id: 99999,
    name: "Fixture Product",
    slug: "fixture-product",
    type: "simple",
    status: "publish",
    sku: "",
    price: "100",
    regular_price: "100",
    sale_price: "",
    description_length: 10,
    short_description_length: 10,
    categories: [{ id: 50, name: "Sessions", slug: "sessions" }],
    tags: [],
    attributes: [],
    images: [],
    variations: [],
    proposed_collection: "start-here",
    proposed_program_type: "session",
    program_type_confidence: "high",
    flags: [],
    ...overrides,
  }
}

function entryByHandle(handle: string): ConsolidationEntry {
  const entry = CONSOLIDATION_MAP.find((e) => e.canonical_slug === handle)
  if (!entry) throw new Error(`No consolidation entry for handle "${handle}"`)
  return entry
}

// The 15 legitimate WooCommerce category-73 products from KI006, by WC slug.
const KI006_WC_SLUGS = [
  // Resonance Repatterning Program 6 (Live + Self Study) — WC 16491, 16238
  "resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom",
  "resonance-repatterning-program-6-inner-cultivation-practical-demos-self-study",
  // Program 7 / Program 9 Live via Zoom — WC 16492, 16493
  "resonance-repatterning-program-7-principles-of-relationships-practical-demos-live-via-zoom",
  "resonance-repatterning-program-9-energetics-of-relationships-practical-demos-live-via-zoom",
  // Deep Energy Clearing Purchased Together — WC 16259, 16260
  "deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom",
  "deep-energy-clearing-fundamentals-advanced-purchased-together-live-retaker-via-zoom",
  // Practitioner Mentorship (4 variants) — WC 16061, 16063, 16062, 16064
  "mentorship-single-session-live",
  "mentorship-single-session-self-study",
  "mentorship-bundle-of-5-sessions-live",
  "mentorship-bundle-of-5-sessions-self-study",
  // Growth Booster add-ons — WC 16065, 16067, 16066, 16110, 16138
  "email-support",
  "coaching-support-package",
  "vip-package",
  "bonus-lifetime-access-self-study-online",
  "ravenall-institute-certification-observation-fee",
]

// ---------------------------------------------------------------------------
// KI006 coverage
// ---------------------------------------------------------------------------

describe("KI006 — category-73 products are covered by the consolidation map", () => {
  const index = buildSourceSlugIndex()

  it.each(KI006_WC_SLUGS)("absorbs WC slug %s", (slug) => {
    expect(index.has(slug)).toBe(true)
  })

  it("keeps the ZAR prices from the WooCommerce source", () => {
    const p6 = entryByHandle(
      "resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom"
    )
    expect(p6.variants.find((v) => v.label === "Live via Zoom")?.price_zar).toBe(5315)
    expect(p6.variants.find((v) => v.label === "Self Study")?.price_zar).toBe(4205)

    const dec = entryByHandle(
      "deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom"
    )
    expect(dec.variants.find((v) => v.label === "Live via Zoom")?.price_zar).toBe(17500)
    expect(dec.variants.find((v) => v.label === "Live Retaker")?.price_zar).toBe(1660)

    const mentorship = entryByHandle("mentorship-single-session-live")
    expect(mentorship.variants).toHaveLength(4)
    expect(mentorship.variants.find((v) => v.label === "Single Session (Live)")?.price_zar).toBe(575)
    expect(mentorship.variants.find((v) => v.label === "Bundle of 5 Sessions (Live)")?.price_zar).toBe(1900)

    expect(entryByHandle("email-support").variants[0]?.price_zar).toBe(200)
    expect(entryByHandle("coaching-support-package").variants[0]?.price_zar).toBe(1660)
    expect(entryByHandle("vip-package").variants[0]?.price_zar).toBe(1500)
    expect(entryByHandle("bonus-lifetime-access-self-study-online").variants[0]?.price_zar).toBe(2060)
    expect(entryByHandle("ravenall-institute-certification-observation-fee").variants[0]?.price_zar).toBe(2800)
  })

  it("adds Live via Zoom variants to the existing Program 7 and 9 entries", () => {
    for (const handle of [
      "resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study",
      "resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study",
    ]) {
      const entry = entryByHandle(handle)
      const labels = entry.variants.map((v) => v.label)
      expect(labels).toContain("Live via Zoom")
      expect(labels).toContain("Self Study")
      expect(entry.variants.find((v) => v.label === "Live via Zoom")?.price_zar).toBe(5315)
    }
  })

  it("gives the KI006 rescue entries descriptions from the WC source", () => {
    for (const handle of [
      "resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom",
      "deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom",
      "mentorship-single-session-live",
      "email-support",
      "coaching-support-package",
      "vip-package",
      "bonus-lifetime-access-self-study-online",
      "ravenall-institute-certification-observation-fee",
    ]) {
      expect(entryByHandle(handle).description ?? "").not.toBe("")
    }
  })
})

// ---------------------------------------------------------------------------
// Map integrity
// ---------------------------------------------------------------------------

describe("consolidation map integrity", () => {
  it("has no WC slug absorbed by two entries", () => {
    const totalSlugs = CONSOLIDATION_MAP.flatMap((e) =>
      e.variants.flatMap((v) => v.source_wc_slugs)
    ).filter((s) => s !== "")
    const index = buildSourceSlugIndex()
    expect(index.size).toBe(totalSlugs.length)
  })

  it("has no duplicate canonical slugs", () => {
    const handles = CONSOLIDATION_MAP.map((e) => e.canonical_slug)
    expect(new Set(handles).size).toBe(handles.length)
  })

  it("has no duplicate variant labels within an entry", () => {
    for (const entry of CONSOLIDATION_MAP) {
      const labels = entry.variants.map((v) => v.label)
      expect(new Set(labels).size, entry.canonical_slug).toBe(labels.length)
    }
  })

  it("redirects the legacy Program 6 slugs to the new canonical handle", () => {
    const redirects = buildRedirectMap()
    const p6 = redirects.filter(
      (r) =>
        r.to_slug ===
        "resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom"
    )
    const fromSlugs = p6.map((r) => r.from_slug)
    expect(fromSlugs).toContain("resonance-repatterning-06-inner-cultivation-live-online")
    expect(fromSlugs).toContain("resonance-repatterning-06-inner-cultivation-live-online-3")
    expect(fromSlugs).toContain(
      "resonance-repatterning-program-6-inner-cultivation-practical-demos-self-study"
    )
  })
})

// ---------------------------------------------------------------------------
// Inventory rule (must match KI030-KI033 behaviour)
// ---------------------------------------------------------------------------

describe("manage_inventory rule", () => {
  it("only group-session Live seats track inventory", () => {
    const group = entryByHandle("group-session-develop-super-confidence")
    expect(variantManagesInventory(group, "Live")).toBe(true)
    expect(variantManagesInventory(group, "Recorded series")).toBe(false)

    // Course "Live via Zoom" variants must NOT track inventory.
    const p6 = entryByHandle(
      "resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom"
    )
    expect(variantManagesInventory(p6, "Live via Zoom")).toBe(false)
  })

  it("creates every KI006 payload variant with manage_inventory: false", () => {
    for (const handle of KI006_WC_SLUGS) {
      const entry = CONSOLIDATION_MAP.find((e) =>
        e.variants.some((v) => v.source_wc_slugs.includes(handle))
      )
      expect(entry, handle).toBeDefined()
      const payload = buildConsolidatedPayload(entry!, null)
      for (const variant of payload.variants) {
        expect(variant.manage_inventory, `${entry!.canonical_slug} / ${variant.title}`).toBe(false)
      }
    }
  })

  it("still creates group-session Live seats with manage_inventory: true", () => {
    const entry = entryByHandle("group-session-develop-super-confidence")
    const payload = buildConsolidatedPayload(entry, null)
    expect(payload.variants.find((v) => v.title === "Live")?.manage_inventory).toBe(true)
    expect(payload.variants.find((v) => v.title === "Recorded series")?.manage_inventory).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Payload building
// ---------------------------------------------------------------------------

describe("buildConsolidatedPayload", () => {
  it("converts ZAR to cents and carries handle, title and description", () => {
    const entry = entryByHandle("email-support")
    const payload = buildConsolidatedPayload(entry, "col_123")
    expect(payload.handle).toBe("email-support")
    expect(payload.title).toBe("Email Support")
    expect(payload.collection_id).toBe("col_123")
    expect(payload.description).not.toBe("")
    expect(payload.variants[0]?.prices[0]).toEqual({ amount: 20000, currency_code: "zar" })
    expect(priceInCents(5315)).toBe(531500)
  })

  it("keeps empty descriptions for pre-KI006 entries (curated elsewhere)", () => {
    const entry = entryByHandle("meditation-live-via-zoom")
    expect(buildConsolidatedPayload(entry, null).description).toBe("")
  })
})

// ---------------------------------------------------------------------------
// Variant sync (idempotent re-runs against the live VPS catalogue)
// ---------------------------------------------------------------------------

describe("computeMissingVariants", () => {
  const p7 = entryByHandle(
    "resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study"
  )

  it("returns the Live variant when the VPS product only has Self Study", () => {
    const missing = computeMissingVariants(p7, ["Self Study"])
    expect(missing.map((m) => m.label)).toEqual(["Live via Zoom"])
  })

  it("returns nothing on a second run (both variants present)", () => {
    expect(computeMissingVariants(p7, ["Live via Zoom", "Self Study"])).toEqual([])
  })

  it("ignores null titles from the API", () => {
    const missing = computeMissingVariants(p7, [null, "Self Study"])
    expect(missing.map((m) => m.label)).toEqual(["Live via Zoom"])
  })
})

// ---------------------------------------------------------------------------
// Exclusion rules — phase 2 must not duplicate the rescued products
// ---------------------------------------------------------------------------

describe("getSkipReason", () => {
  it("still skips published category-73 products in the standalone phase", () => {
    // e.g. WC 16065 "Email Support" — created via the map, so the standalone
    // scan has to keep excluding it or the migration would duplicate it.
    const product = makeWcProduct({
      id: 16065,
      name: "Email Support",
      slug: "email-support",
      categories: [
        { id: 177, name: "Product Add-ons : Growth Boosters", slug: "growth-boosters" },
        { id: 73, name: "not used-Akashic Coaching", slug: "not-used-akashic-coaching" },
      ],
    })
    expect(getSkipReason(product)).toBe("excluded_category_73")
  })

  it("keeps skipping drafts and test products", () => {
    expect(getSkipReason(makeWcProduct({ status: "draft" }))).toBe("not_published")
    expect(getSkipReason(makeWcProduct({ name: "SR-product-test-variable-8" }))).toBe("test_product")
  })

  it("does not skip a normal published product", () => {
    expect(getSkipReason(makeWcProduct())).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Integration against the real WooCommerce audit export (skipped when the
// infra data files are not present, e.g. in a partial checkout)
// ---------------------------------------------------------------------------

const AUDIT_FILE = path.resolve(
  __dirname,
  "../../../../../infra/scripts/migrations/wc-product-audit.json"
)

describe.skipIf(!fs.existsSync(AUDIT_FILE))("real audit export (KI006 end-to-end)", () => {
  const KI006_WC_IDS = [
    16491, 16238, 16492, 16493, // RR Programs 6/7/9
    16259, 16260, // Deep Energy Clearing Purchased Together
    16061, 16063, 16062, 16064, // Practitioner Mentorship
    16065, 16067, 16066, 16110, 16138, // Growth Booster add-ons
  ]

  it("absorbs all 15 published category-73 products and creates no standalone duplicates", () => {
    const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8")) as {
      products: WcProduct[]
    }
    const index = buildSourceSlugIndex()

    const found = audit.products.filter((p) => KI006_WC_IDS.includes(p.id))
    expect(found).toHaveLength(15)

    for (const product of found) {
      // Every rescued product's WC slug is claimed by a consolidation entry...
      expect(index.has(product.slug), `${product.id} ${product.slug}`).toBe(true)
      // ...and the standalone phase still refuses it, so nothing is duplicated.
      expect(getSkipReason(product), `${product.id} ${product.slug}`).toBe("excluded_category_73")
    }
  })
})
