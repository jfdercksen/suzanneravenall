/**
 * restore-group-session-inventory-links.ts — one-shot (but safely re-runnable)
 * repair script that restores the variant→inventory-item link for the
 * group-session "Live" seat variants.
 *
 * Why: on 2026-06-09 every row in product_variant_inventory_item was
 * soft-deleted (deleted_at set) on the VPS — cause unknown, discovered
 * 2026-08-19 while running seed-group-session-inventory.ts, which found all 7
 * Live variants with manage_inventory: true but NO active inventory-item
 * link and skipped them ("needs manual investigation"). Without the link,
 * complete-cart cannot resolve inventory for these variants, so the Live
 * seats are unpurchasable. All other ~200 variants are manage_inventory:
 * false (fix-variant-inventory-flags.ts) and don't need links.
 *
 * What it does, for each GROUP_SESSION_PRODUCTS entry with a
 * liveVariantTitle (7 of 8 — Attraction Frequency is recorded-only):
 *   1. Fetches the product by handle with variants.inventory_items.
 *   2. If the Live variant already has an active inventory-item link →
 *      nothing to do (idempotent).
 *   3. Else creates a FRESH inventory item (POST /admin/inventory-items,
 *      sku "GS-LIVE-{handle}") and links it (POST /admin/products/{pid}/
 *      variants/{vid}/inventory-items, required_quantity 1).
 *      A fresh item is used deliberately: the primary key of
 *      product_variant_inventory_item is (variant_id, inventory_item_id)
 *      INCLUDING soft-deleted rows, so re-linking the ORIGINAL item id could
 *      collide with the soft-deleted row. The original items carry no SKU,
 *      no levels and no reservations, so nothing is lost by abandoning them.
 *
 * Afterwards run seed-group-session-inventory.ts — it will find the new
 * links and create the 12-seat location levels (it never touches existing
 * levels, so re-runs stay safe after real sales).
 *
 * DRY RUN by default (house convention):
 *   Dry run:  MEDUSA_ADMIN_PASSWORD=xxx npx ts-node src/scripts/restore-group-session-inventory-links.ts
 *   Live run: DRY_RUN=false MEDUSA_ADMIN_PASSWORD=xxx npx ts-node src/scripts/restore-group-session-inventory-links.ts
 *
 * Required env vars:
 *   MEDUSA_URL             — Medusa backend base URL (default: http://localhost:9000)
 *   MEDUSA_ADMIN_EMAIL     — Admin user email
 *   MEDUSA_ADMIN_PASSWORD  — Admin user password
 */

import { GROUP_SESSION_PRODUCTS } from "./seed-group-session-inventory"

const BASE_URL = process.env.MEDUSA_URL || "http://localhost:9000"
const ADMIN_EMAIL =
  process.env.MEDUSA_ADMIN_EMAIL || "admin@suzanneravenall.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || ""
const DRY_RUN = process.env.DRY_RUN !== "false"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthResponse {
  token: string
}

interface InventoryItemLink {
  inventory_item_id: string
}

interface ProductVariant {
  id: string
  title: string | null
  manage_inventory: boolean | null
  inventory_items?: InventoryItemLink[] | null
}

interface Product {
  id: string
  title: string
  handle: string
  variants: ProductVariant[] | null
}

interface ProductListResponse {
  products: Product[]
}

interface InventoryItemResponse {
  inventory_item: { id: string }
}

interface InventoryItemListResponse {
  inventory_items: { id: string; sku: string | null }[]
}

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

// ── Lookup ────────────────────────────────────────────────────────────────────

async function fetchProductByHandle(
  token: string,
  handle: string
): Promise<Product | null> {
  const encoded = encodeURIComponent(handle)
  const { products } = await request<ProductListResponse>(
    `/admin/products?handle=${encoded}&limit=1` +
      `&fields=id,title,handle,*variants,*variants.inventory_items`,
    {},
    token
  )
  return products[0] ?? null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function restoreGroupSessionInventoryLinks(): Promise<void> {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "MEDUSA_ADMIN_PASSWORD is not set. Export it before running this script."
    )
  }

  console.log(DRY_RUN ? "Mode: DRY RUN (pass DRY_RUN=false to apply)" : "Mode: LIVE")

  const token = await authenticate()

  const restored: string[] = []
  const alreadyLinked: string[] = []
  const skipped: string[] = []

  for (const def of GROUP_SESSION_PRODUCTS) {
    if (def.liveVariantTitle === null) {
      continue // recorded-only product, no capacity-limited seat
    }

    const label = `"${def.title}" (${def.canonicalSlug}) / "${def.liveVariantTitle}"`

    const product = await fetchProductByHandle(token, def.canonicalSlug)
    if (!product) {
      console.error(`  MISSING  ${label} — product not found by handle. Skipping.`)
      skipped.push(label)
      continue
    }

    const variant = (product.variants ?? []).find(
      (v) => v.title === def.liveVariantTitle
    )
    if (!variant) {
      console.error(`  MISSING  ${label} — Live variant not found on product. Skipping.`)
      skipped.push(label)
      continue
    }

    if ((variant.inventory_items?.length ?? 0) > 0) {
      console.log(`  OK       ${label} — inventory-item link already active.`)
      alreadyLinked.push(label)
      continue
    }

    if (variant.manage_inventory !== true) {
      // fix-variant-inventory-flags.ts keeps these 7 variants at
      // manage_inventory: true — a false here means the exemption index and
      // the live catalogue have drifted apart. Restore the link anyway (the
      // seeder re-asserts the flag), but make the drift visible.
      console.warn(
        `  WARNING  ${label} — manage_inventory is ${String(variant.manage_inventory)}, ` +
          "expected true. GROUP_SESSION_PRODUCTS may have drifted from the catalogue."
      )
    }

    if (DRY_RUN) {
      console.log(`  WOULD RESTORE ${label} — create fresh inventory item + link.`)
      restored.push(label)
      continue
    }

    // A previous partially-failed run may have created the item but not the
    // link — reuse it rather than colliding on the SKU uniqueness constraint.
    const sku = `GS-LIVE-${def.canonicalSlug}`
    const existing = await request<InventoryItemListResponse>(
      `/admin/inventory-items?sku=${encodeURIComponent(sku)}&limit=1`,
      {},
      token
    )

    let inventoryItemId = existing.inventory_items[0]?.id
    if (inventoryItemId) {
      console.log(
        `  REUSE    ${label} — inventory item ${inventoryItemId} already exists for sku "${sku}".`
      )
    } else {
      const { inventory_item } = await request<InventoryItemResponse>(
        "/admin/inventory-items",
        {
          method: "POST",
          body: JSON.stringify({
            sku,
            title: `${def.title} — ${def.liveVariantTitle} seat`,
          }),
        },
        token
      )
      inventoryItemId = inventory_item.id
    }

    await request(
      `/admin/products/${product.id}/variants/${variant.id}/inventory-items`,
      {
        method: "POST",
        body: JSON.stringify({
          inventory_item_id: inventoryItemId,
          required_quantity: 1,
        }),
      },
      token
    )

    console.log(
      `  RESTORED ${label} — inventory item ${inventoryItemId} linked.`
    )
    restored.push(label)
  }

  console.log("\n=== SUMMARY ===")
  console.log(`Mode:                       ${DRY_RUN ? "DRY RUN (nothing written)" : "LIVE"}`)
  console.log(`Links ${DRY_RUN ? "that WOULD be restored" : "restored"}: ${restored.length}`)
  console.log(`Already linked (untouched): ${alreadyLinked.length}`)
  console.log(`Skipped (needs attention):  ${skipped.length}`)
  for (const label of skipped) {
    console.log(`  - ${label}`)
  }

  console.log(
    DRY_RUN
      ? "\nDry run complete. Re-run with DRY_RUN=false to apply."
      : "\nLink restore complete. Now run seed-group-session-inventory.ts to seed " +
          "the 12-seat levels on the restored links."
  )
}

export default restoreGroupSessionInventoryLinks

// Allow running directly: ts-node src/scripts/restore-group-session-inventory-links.ts
if (require.main === module) {
  restoreGroupSessionInventoryLinks().catch((err: unknown) => {
    console.error("Group-session inventory link restore failed:", err)
    process.exit(1)
  })
}
