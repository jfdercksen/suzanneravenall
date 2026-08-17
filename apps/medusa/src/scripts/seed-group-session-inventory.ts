/**
 * seed-group-session-inventory.ts — Medusa v2 seed script that turns on REAL,
 * auto-decrementing "spots remaining" inventory for the 8 live group-coaching
 * session products migrated from WooCommerce (see migrate-woocommerce.ts,
 * CONSOLIDATION_MAP, "── Group Sessions ──" section, program_type: "group",
 * collection handle "deep-dive").
 *
 * Only the variant whose title starts with "Live" (the capacity-limited
 * cohort seat) is touched. "Recorded series" variants (unlimited digital
 * content) and any other variant are left completely untouched.
 *
 * The script is idempotent:
 *   - Re-running it never resets an inventory level that already exists —
 *     real purchases may have already decremented it. Only a location level
 *     that does not yet exist gets seeded with SEAT_CAPACITY (12).
 *   - manage_inventory / allow_backorder are only PATCHed when they differ
 *     from the desired value.
 *   - The default stock location and its sales-channel link are created only
 *     if genuinely absent.
 *
 * ── IMPORTANT — verified finding (2026-08, Medusa v2.14.1 source) ──────────
 * `manage_inventory` defaults to `true` on EVERY product variant created via
 * the Admin API unless the caller explicitly passes `false`
 * (node_modules/@medusajs/medusa/dist/api/admin/products/validators.js:
 * `manage_inventory: booleanString().optional().default(true)`). Because
 * migrate-woocommerce.ts and seed-memberships.ts never set this field, EVERY
 * variant in this catalogue (not just group sessions) already has
 * manage_inventory: true and already has an auto-created inventory item
 * (@medusajs/core-flows create-product-variants.js creates a default
 * inventory item whenever manage_inventory is true and no inventory_items
 * were supplied).
 *
 * Combined with the fact that NO stock location has ever been created or
 * linked to a sales channel in this codebase, this means checkout is
 * currently broken for the ENTIRE catalogue, not just group sessions:
 * @medusajs/core-flows cart/utils/prepare-confirm-inventory-input.js throws
 * `Sales channel {id} is not associated with any stock location for variant
 * {id}` for any manage_inventory=true / allow_backorder=false variant at
 * complete-cart time, because there is no stock-location-to-sales-channel
 * link at all. This script links the default stock location to the store's
 * default sales channel (harmless — it only makes the 8 Live variants below
 * fully purchasable; every other variant remains exactly as broken/working
 * as it was before, since this script does not touch their manage_inventory
 * or create location levels for them).
 *
 * REMEDIATION (2026-08-04): the sitewide side is now handled by
 * fix-variant-inventory-flags.ts, which sets manage_inventory: false on every
 * variant EXCEPT the Live seats defined below (it imports
 * GROUP_SESSION_PRODUCTS from this file). The creation paths
 * (migrate-woocommerce.ts, seed.ts, seed-memberships.ts) now also pass
 * manage_inventory explicitly, so new variants are born correct. Run order on
 * a fresh environment: fix-variant-inventory-flags.ts first, then this script.
 *
 * ── Store API — reading remaining quantity back on the storefront ─────────
 * Verified against node_modules/@medusajs/types/dist/http/product/common.d.ts
 * (BaseProductVariant): the field is `variants.inventory_quantity` and it is
 * a *computed* field that is NOT returned by default even when `*variants`
 * is requested — it must be explicitly added with the `+` prefix:
 *
 *   fields=id,handle,title,description,thumbnail,*variants,*variants.prices,
 *          *categories,*collection,+variants.inventory_quantity
 *
 * Response shape: each entry in `product.variants[]` gains
 * `inventory_quantity: number | null` — the sum of `stocked_quantity -
 * reserved_quantity` across the stock locations linked to the request's
 * sales channel. This is documented directly in the Medusa v2 type
 * declarations (see doc comment on `inventory_quantity` in common.d.ts) —
 * not just inferred — so it can be relied on with confidence. What was NOT
 * verified against a live server (flagged per task constraints — no live
 * run was performed): the exact numeric behaviour once a variant is fully
 * sold out (whether it returns `0` or `null`) and whether the storefront's
 * Medusa JS SDK needs `publishableApiKey`/`sales_channel` scoping for this
 * field to resolve correctly. Confirm both with one real `GET /store/products`
 * call once this script has been run against the VPS.
 *
 * Run:
 *   MEDUSA_URL=http://localhost:9000 \
 *   MEDUSA_ADMIN_EMAIL=admin@suzanneravenall.com \
 *   MEDUSA_ADMIN_PASSWORD=<password> \
 *   ts-node src/scripts/seed-group-session-inventory.ts
 *
 * Required env vars:
 *   MEDUSA_URL             — Medusa backend base URL (default: http://localhost:9000)
 *   MEDUSA_ADMIN_EMAIL     — Admin user email
 *   MEDUSA_ADMIN_PASSWORD  — Admin user password
 */

const BASE_URL = process.env.MEDUSA_URL || "http://localhost:9000"
const ADMIN_EMAIL =
  process.env.MEDUSA_ADMIN_EMAIL || "admin@suzanneravenall.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || ""

const SEAT_CAPACITY = 12
const STOCK_LOCATION_NAME = "Default Stock Location"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthResponse {
  token: string
}

interface ListResponse<T> {
  [key: string]: T[]
}

interface SalesChannel {
  id: string
  name: string
}

interface Store {
  id: string
  default_sales_channel_id: string | null
}

interface StockLocation {
  id: string
  name: string
  sales_channels?: SalesChannel[]
}

interface ProductVariantInventoryItemLink {
  inventory_item_id: string
}

interface ProductVariant {
  id: string
  title: string | null
  manage_inventory: boolean | null
  allow_backorder: boolean | null
  inventory_items?: ProductVariantInventoryItemLink[] | null
}

interface Product {
  id: string
  title: string
  handle: string
  variants: ProductVariant[]
}

interface InventoryLevel {
  id: string
  location_id: string
  inventory_item_id: string
  stocked_quantity: number
}

// ── Group session definitions ───────────────────────────────────────────────
// Source of truth: apps/medusa/src/scripts/migrate-woocommerce.ts,
// CONSOLIDATION_MAP, "── Group Sessions ──" section (program_type: "group").
// liveVariantTitle is `null` for the one product that has no "Live" variant
// at all (Attraction Frequency only ships a "Recorded series" variant).

export interface GroupSessionProduct {
  canonicalSlug: string
  title: string
  liveVariantTitle: string | null
}

// Exported: fix-variant-inventory-flags.ts imports this as the single source
// of truth for which variants must KEEP manage_inventory: true.
export const GROUP_SESSION_PRODUCTS: GroupSessionProduct[] = [
  {
    canonicalSlug: "group-session-attraction-frequency-recorded",
    title: "Group Session — Attraction Frequency",
    liveVariantTitle: null,
  },
  {
    canonicalSlug: "group-session-being-a-great-boundary-setter-booked-as-a-series-only",
    title: "Group Session — Being a Great Boundary Setter",
    liveVariantTitle: "Live (booked as series)",
  },
  {
    canonicalSlug: "career-progression-group-session",
    title: "Group Session — Career Progression",
    liveVariantTitle: "Live (booked as series)",
  },
  {
    canonicalSlug: "group-session-develop-super-confidence",
    title: "Group Session — Develop Super Confidence",
    liveVariantTitle: "Live",
  },
  {
    canonicalSlug: "love-relationships-group-session",
    title: "Group Session — Love & Relationships",
    liveVariantTitle: "Live (booked as series)",
  },
  {
    canonicalSlug: "money-mastery-group-session",
    title: "Group Session — Money Mastery",
    liveVariantTitle: "Live (booked as series)",
  },
  {
    canonicalSlug: "group-session-nice-or-not-nice-in-communication-booked-as-a-series-only",
    title: "Group Session — Nice or Not Nice in Communication",
    liveVariantTitle: "Live (booked as series)",
  },
  {
    canonicalSlug: "group-session-shedding-excess-weight",
    title: "Group Session — Shedding Excess Weight",
    liveVariantTitle: "Live (booked as series)",
  },
]

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${options.method || "GET"} ${path} → ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authenticate(): Promise<string> {
  console.log(`Authenticating as ${ADMIN_EMAIL}…`)
  const data = await request<AuthResponse>("/auth/user/emailpass", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  console.log("  Authenticated.")
  return data.token
}

// ── Stock location ────────────────────────────────────────────────────────────

async function ensureDefaultStockLocation(token: string): Promise<StockLocation> {
  console.log("\nResolving default stock location…")
  const { stock_locations } = await request<ListResponse<StockLocation>>(
    "/admin/stock-locations?limit=1",
    {},
    token
  )

  if (stock_locations.length > 0) {
    const existing = stock_locations[0]
    if (!existing) {
      throw new Error("Unexpected empty stock_locations entry")
    }
    console.log(`  Found existing stock location "${existing.name}" (${existing.id}).`)
    return existing
  }

  console.log(`  No stock location found — creating "${STOCK_LOCATION_NAME}"…`)
  const { stock_location } = await request<{ stock_location: StockLocation }>(
    "/admin/stock-locations",
    {
      method: "POST",
      body: JSON.stringify({ name: STOCK_LOCATION_NAME }),
    },
    token
  )
  console.log(`  Created stock location "${stock_location.name}" (${stock_location.id}).`)
  return stock_location
}

async function ensureStockLocationLinkedToSalesChannel(
  token: string,
  location: StockLocation
): Promise<void> {
  console.log("\nResolving default sales channel…")

  const { stores } = await request<ListResponse<Store>>("/admin/stores?limit=1", {}, token)
  const store = stores[0]

  const { sales_channels: allSalesChannels } = await request<ListResponse<SalesChannel>>(
    "/admin/sales-channels?limit=100",
    {},
    token
  )

  if (allSalesChannels.length === 0) {
    console.warn("  No sales channels exist yet — cannot link stock location. Skipping.")
    return
  }

  let targetChannelIds: string[]
  if (store?.default_sales_channel_id) {
    targetChannelIds = [store.default_sales_channel_id]
    console.log(`  Store default sales channel: ${store.default_sales_channel_id}`)
  } else {
    console.warn(
      "  Store has no default_sales_channel_id set — linking stock location to ALL " +
        `${allSalesChannels.length} existing sales channel(s) as a fallback.`
    )
    targetChannelIds = allSalesChannels.map((sc) => sc.id)
  }

  const { stock_location: locationWithChannels } = await request<{
    stock_location: StockLocation
  }>(`/admin/stock-locations/${location.id}?fields=id,name,*sales_channels`, {}, token)

  const alreadyLinked = new Set(
    (locationWithChannels.sales_channels ?? []).map((sc) => sc.id)
  )
  const toLink = targetChannelIds.filter((id) => !alreadyLinked.has(id))

  if (toLink.length === 0) {
    console.log("  Stock location already linked to the target sales channel(s) — skipping.")
    return
  }

  await request(
    `/admin/stock-locations/${location.id}/sales-channels`,
    {
      method: "POST",
      body: JSON.stringify({ add: toLink }),
    },
    token
  )
  console.log(`  Linked stock location "${location.name}" to ${toLink.length} sales channel(s).`)
}

// ── Product / variant lookup ────────────────────────────────────────────────

async function fetchProductByHandle(token: string, handle: string): Promise<Product | null> {
  const encoded = encodeURIComponent(handle)
  const { products } = await request<ListResponse<Product>>(
    `/admin/products?handle=${encoded}&limit=1&fields=id,title,handle,*variants,*variants.inventory_items`,
    {},
    token
  )
  return products[0] ?? null
}

// ── Variant configuration ───────────────────────────────────────────────────

type VariantOutcome =
  | { status: "configured"; product: string; variant: string }
  | { status: "skipped_already_configured"; product: string; variant: string }
  | { status: "no_live_variant_defined"; product: string }
  | { status: "product_not_found"; product: string }
  | { status: "variant_not_matched"; product: string; expectedTitle: string }
  | { status: "no_inventory_item"; product: string; variant: string }

async function ensureVariantFlags(
  token: string,
  productId: string,
  variant: ProductVariant
): Promise<boolean> {
  const needsUpdate =
    variant.manage_inventory !== true || variant.allow_backorder !== false

  if (!needsUpdate) {
    return false
  }

  await request(
    `/admin/products/${productId}/variants/${variant.id}`,
    {
      method: "POST",
      body: JSON.stringify({ manage_inventory: true, allow_backorder: false }),
    },
    token
  )
  return true
}

async function ensureInventoryLevel(
  token: string,
  inventoryItemId: string,
  locationId: string
): Promise<"created" | "skipped_existing"> {
  const { inventory_levels } = await request<ListResponse<InventoryLevel>>(
    `/admin/inventory-items/${inventoryItemId}/location-levels?location_id=${locationId}`,
    {},
    token
  )

  const existing = inventory_levels.find((level) => level.location_id === locationId)
  if (existing) {
    return "skipped_existing"
  }

  await request(
    `/admin/inventory-items/${inventoryItemId}/location-levels`,
    {
      method: "POST",
      body: JSON.stringify({ location_id: locationId, stocked_quantity: SEAT_CAPACITY }),
    },
    token
  )
  return "created"
}

async function configureGroupSessionProduct(
  token: string,
  def: GroupSessionProduct,
  locationId: string
): Promise<VariantOutcome> {
  if (def.liveVariantTitle === null) {
    console.log(`  "${def.title}" — no "Live" variant defined for this product. Skipping.`)
    return { status: "no_live_variant_defined", product: def.title }
  }

  const product = await fetchProductByHandle(token, def.canonicalSlug)
  if (!product) {
    console.warn(`  "${def.title}" (${def.canonicalSlug}) — product not found. Skipping.`)
    return { status: "product_not_found", product: def.title }
  }

  const variant = product.variants.find((v) => v.title === def.liveVariantTitle)
  if (!variant) {
    console.warn(
      `  "${def.title}" — no variant titled "${def.liveVariantTitle}" found ` +
        `(variants present: ${product.variants.map((v) => v.title).join(", ")}). Skipping.`
    )
    return {
      status: "variant_not_matched",
      product: def.title,
      expectedTitle: def.liveVariantTitle,
    }
  }

  const flagsChanged = await ensureVariantFlags(token, product.id, variant)

  const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
  if (!inventoryItemId) {
    console.error(
      `  "${def.title}" / "${variant.title}" — manage_inventory is set but no inventory ` +
        "item is linked to this variant. This needs manual investigation " +
        "(unexpected — see script header comment). Skipping inventory level."
    )
    return { status: "no_inventory_item", product: def.title, variant: variant.title ?? "" }
  }

  const levelResult = await ensureInventoryLevel(token, inventoryItemId, locationId)

  if (levelResult === "created") {
    console.log(
      `  "${def.title}" / "${variant.title}" — configured ` +
        `(manage_inventory=true, allow_backorder=false, stocked_quantity=${SEAT_CAPACITY}).`
    )
    return { status: "configured", product: def.title, variant: variant.title ?? "" }
  }

  console.log(
    `  "${def.title}" / "${variant.title}" — inventory level already exists` +
      (flagsChanged ? " (flags were updated, quantity left untouched)." : " — nothing to do.")
  )
  return {
    status: "skipped_already_configured",
    product: def.title,
    variant: variant.title ?? "",
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "MEDUSA_ADMIN_PASSWORD is not set. Export it before running this script."
    )
  }

  const token = await authenticate()
  const stockLocation = await ensureDefaultStockLocation(token)
  await ensureStockLocationLinkedToSalesChannel(token, stockLocation)

  console.log(`\nConfiguring ${GROUP_SESSION_PRODUCTS.length} group-session products…`)

  const outcomes: VariantOutcome[] = []
  for (const def of GROUP_SESSION_PRODUCTS) {
    const outcome = await configureGroupSessionProduct(token, def, stockLocation.id)
    outcomes.push(outcome)
  }

  const configured = outcomes.filter((o) => o.status === "configured")
  const alreadyOk = outcomes.filter((o) => o.status === "skipped_already_configured")
  const noLiveVariant = outcomes.filter((o) => o.status === "no_live_variant_defined")
  const notFound = outcomes.filter((o) => o.status === "product_not_found")
  const notMatched = outcomes.filter((o) => o.status === "variant_not_matched")
  const noInventoryItem = outcomes.filter((o) => o.status === "no_inventory_item")

  console.log("\n=== SUMMARY ===")
  console.log(`Newly configured (stocked_quantity=${SEAT_CAPACITY} set):  ${configured.length}`)
  for (const o of configured) {
    if (o.status === "configured") console.log(`  - ${o.product} / ${o.variant}`)
  }
  console.log(`Already configured (left untouched):        ${alreadyOk.length}`)
  for (const o of alreadyOk) {
    if (o.status === "skipped_already_configured") console.log(`  - ${o.product} / ${o.variant}`)
  }
  console.log(`No "Live" variant defined for this product:  ${noLiveVariant.length}`)
  for (const o of noLiveVariant) {
    if (o.status === "no_live_variant_defined") console.log(`  - ${o.product}`)
  }
  if (notFound.length > 0) {
    console.log(`Product not found in Medusa:                ${notFound.length}`)
    for (const o of notFound) {
      if (o.status === "product_not_found") console.log(`  - ${o.product}`)
    }
  }
  if (notMatched.length > 0) {
    console.log(`Variant title could not be matched:          ${notMatched.length}`)
    for (const o of notMatched) {
      if (o.status === "variant_not_matched") {
        console.log(`  - ${o.product} (expected "${o.expectedTitle}")`)
      }
    }
  }
  if (noInventoryItem.length > 0) {
    console.log(`No inventory item linked (needs investigation): ${noInventoryItem.length}`)
    for (const o of noInventoryItem) {
      if (o.status === "no_inventory_item") console.log(`  - ${o.product} / ${o.variant}`)
    }
  }

  console.log("\nGroup-session inventory seed complete.")
}

export default seed

// Allow running directly: ts-node src/scripts/seed-group-session-inventory.ts
if (require.main === module) {
  seed().catch((err: unknown) => {
    console.error("Group-session inventory seed failed:", err)
    process.exit(1)
  })
}
