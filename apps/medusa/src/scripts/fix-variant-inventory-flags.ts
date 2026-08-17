/**
 * fix-variant-inventory-flags.ts — one-shot (but safely re-runnable) repair
 * script that sets `manage_inventory: false` on EVERY product variant in the
 * catalogue EXCEPT the capacity-limited group-session "Live" seat variants.
 *
 * Why: Medusa v2 defaults `manage_inventory` to true on every variant created
 * via the Admin API. None of this project's creation paths passed the flag
 * (migrate-woocommerce.ts, seed.ts, seed-memberships.ts — all patched now),
 * so the entire catalogue tracks inventory but no stock location was ever
 * linked to a sales channel and no inventory levels exist. Result:
 * complete-cart throws "Sales channel {id} is not associated with any stock
 * location for variant {id}" for EVERY product. Only the 8 group-session
 * products are supposed to track inventory (12-seat cap, seeded by
 * seed-group-session-inventory.ts).
 *
 * What it does:
 *   1. Pages through /admin/products with explicit variant fields.
 *   2. For each variant:
 *      - If it is a group-session "Live" seat (product handle + exact variant
 *        title from GROUP_SESSION_PRODUCTS in seed-group-session-inventory.ts)
 *        → left untouched (seed-group-session-inventory.ts owns its flags).
 *      - Else if manage_inventory is already false → nothing to do.
 *      - Else → POST /admin/products/{pid}/variants/{vid}
 *        { manage_inventory: false }.
 *   3. Logs every change and prints a summary. allow_backorder is not touched.
 *
 * Idempotent: a second run finds manage_inventory already false everywhere
 * and changes nothing.
 *
 * DRY RUN by default (same convention as migrate-woocommerce.ts): without
 * DRY_RUN=false it only reports what it WOULD change.
 *
 * Dry run:  MEDUSA_ADMIN_PASSWORD=xxx npx ts-node src/scripts/fix-variant-inventory-flags.ts
 * Live run: DRY_RUN=false MEDUSA_ADMIN_PASSWORD=xxx npx ts-node src/scripts/fix-variant-inventory-flags.ts
 *
 * Required env vars:
 *   MEDUSA_URL             — Medusa backend base URL (default: http://localhost:9000)
 *   MEDUSA_ADMIN_EMAIL     — Admin user email
 *   MEDUSA_ADMIN_PASSWORD  — Admin user password
 *
 * Run order on a fresh environment: this script FIRST, then
 * seed-group-session-inventory.ts (which re-asserts manage_inventory: true on
 * the 8 Live seats, creates/links the stock location to the default sales
 * channel, and seeds the 12-seat levels).
 */

import { GROUP_SESSION_PRODUCTS } from "./seed-group-session-inventory"

const BASE_URL = process.env.MEDUSA_URL || "http://localhost:9000"
const ADMIN_EMAIL =
  process.env.MEDUSA_ADMIN_EMAIL || "admin@suzanneravenall.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || ""
const DRY_RUN = process.env.DRY_RUN !== "false"

const PAGE_SIZE = 100

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthResponse {
  token: string
}

interface ProductVariant {
  id: string
  title: string | null
  manage_inventory: boolean | null
}

interface Product {
  id: string
  title: string
  handle: string
  variants: ProductVariant[] | null
}

interface ProductListResponse {
  products: Product[]
  count: number
  offset: number
  limit: number
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

// ── Group-session exemption index ─────────────────────────────────────────────

/**
 * handle → exact Live-variant title that must KEEP manage_inventory: true.
 * Built from the same GROUP_SESSION_PRODUCTS list that
 * seed-group-session-inventory.ts uses, so the two scripts can never disagree
 * about which variants are capacity-limited. Products with
 * liveVariantTitle: null (recorded-only) have NO exempt variant.
 */
function buildExemptionIndex(): Map<string, string> {
  const index = new Map<string, string>()
  for (const def of GROUP_SESSION_PRODUCTS) {
    if (def.liveVariantTitle !== null) {
      index.set(def.canonicalSlug, def.liveVariantTitle)
    }
  }
  return index
}

// ── Product paging ────────────────────────────────────────────────────────────

async function fetchAllProducts(token: string): Promise<Product[]> {
  const all: Product[] = []
  let offset = 0

  for (;;) {
    const page = await request<ProductListResponse>(
      `/admin/products?limit=${PAGE_SIZE}&offset=${offset}` +
        `&fields=id,title,handle,variants.id,variants.title,variants.manage_inventory`,
      {},
      token
    )
    all.push(...page.products)
    offset += page.products.length
    if (offset >= page.count || page.products.length === 0) {
      return all
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function fixVariantInventoryFlags(): Promise<void> {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "MEDUSA_ADMIN_PASSWORD is not set. Export it before running this script."
    )
  }

  console.log(DRY_RUN ? "Mode: DRY RUN (pass DRY_RUN=false to apply)" : "Mode: LIVE")

  const token = await authenticate()
  const exemptLiveVariantByHandle = buildExemptionIndex()

  console.log("\nFetching all products…")
  const products = await fetchAllProducts(token)
  console.log(`  ${products.length} products fetched.`)

  const changed: string[] = []
  const exempt: string[] = []
  let alreadyOff = 0

  for (const product of products) {
    for (const variant of product.variants ?? []) {
      const label = `"${product.title}" (${product.handle}) / "${variant.title ?? ""}"`

      const exemptTitle = exemptLiveVariantByHandle.get(product.handle)
      if (exemptTitle !== undefined && variant.title === exemptTitle) {
        exempt.push(label)
        console.log(`  EXEMPT   ${label} — group-session Live seat, keeps manage_inventory: true.`)
        continue
      }

      if (variant.manage_inventory === false) {
        alreadyOff++
        continue
      }

      if (DRY_RUN) {
        console.log(`  WOULD FIX ${label} — manage_inventory ${variant.manage_inventory} → false.`)
      } else {
        await request(
          `/admin/products/${product.id}/variants/${variant.id}`,
          {
            method: "POST",
            body: JSON.stringify({ manage_inventory: false }),
          },
          token
        )
        console.log(`  FIXED    ${label} — manage_inventory → false.`)
      }
      changed.push(label)
    }
  }

  console.log("\n=== SUMMARY ===")
  console.log(`Mode:                                   ${DRY_RUN ? "DRY RUN (nothing written)" : "LIVE"}`)
  console.log(`Variants ${DRY_RUN ? "that WOULD be set" : "set"} to manage_inventory=false: ${changed.length}`)
  console.log(`Variants already manage_inventory=false: ${alreadyOff}`)
  console.log(`Group-session Live seats left untouched: ${exempt.length}`)
  for (const label of exempt) {
    console.log(`  - ${label}`)
  }

  if (exempt.length === 0) {
    console.warn(
      "\nWARNING: no group-session Live variants were found in the catalogue. " +
        "If the group-session products exist, their handles/variant titles no longer " +
        "match GROUP_SESSION_PRODUCTS in seed-group-session-inventory.ts — investigate " +
        "before running seed-group-session-inventory.ts."
    )
  }

  console.log(
    DRY_RUN
      ? "\nDry run complete. Re-run with DRY_RUN=false to apply."
      : "\nVariant inventory-flag fix complete. Now run seed-group-session-inventory.ts " +
          "to (re)assert the 12-seat Live inventory and the stock-location↔sales-channel link."
  )
}

export default fixVariantInventoryFlags

// Allow running directly: ts-node src/scripts/fix-variant-inventory-flags.ts
if (require.main === module) {
  fixVariantInventoryFlags().catch((err: unknown) => {
    console.error("Variant inventory-flag fix failed:", err)
    process.exit(1)
  })
}
