/**
 * seed-memberships.ts — Medusa v2 seed script for membership tier products.
 *
 * Creates the 4 membership products (Free, Silver, Gold, Practitioner) via the
 * Medusa Admin REST API. The script is idempotent — products are skipped when
 * their handle already exists.
 *
 * Run:
 *   MEDUSA_URL=http://localhost:9000 \
 *   MEDUSA_ADMIN_EMAIL=admin@suzanneravenall.com \
 *   MEDUSA_ADMIN_PASSWORD=<password> \
 *   ts-node src/scripts/seed-memberships.ts
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthResponse {
  token: string
}

interface Collection {
  id: string
  title: string
  handle: string
}

interface Product {
  id: string
  title: string
  handle: string
}

interface ListResponse<T> {
  [key: string]: T[]
}

interface ProductPrice {
  currency_code: string
  amount: number
}

interface ProductOption {
  title: string
  values: string[]
}

interface ProductVariantInput {
  title: string
  prices: ProductPrice[]
  // Memberships are digital subscriptions — never inventory-tracked. Medusa
  // v2 defaults manage_inventory to true, which breaks complete-cart when no
  // stock location is linked to the sales channel.
  manage_inventory?: boolean
  options: Record<string, string>
}

interface MembershipProductMetadata {
  tier: "free" | "silver" | "gold" | "practitioner"
  access_level: number
  product_type: "membership"
}

interface MembershipProductDefinition {
  title: string
  handle: string
  collectionHandle: string
  status: "published" | "draft"
  options: ProductOption[]
  variants: ProductVariantInput[]
  metadata: MembershipProductMetadata
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

// ── Collections ───────────────────────────────────────────────────────────────

async function fetchCollectionIdByHandle(
  token: string
): Promise<Record<string, string>> {
  const { collections } = await request<ListResponse<Collection>>(
    "/admin/collections?limit=100",
    {},
    token
  )
  return Object.fromEntries(collections.map((c) => [c.handle, c.id]))
}

// ── Membership products ───────────────────────────────────────────────────────

const MEMBERSHIP_DEFINITIONS: MembershipProductDefinition[] = [
  {
    title: "Free Member",
    handle: "membership-free",
    collectionHandle: "start-here",
    status: "published",
    options: [{ title: "Type", values: ["Membership"] }],
    variants: [
      {
        title: "Monthly",
        prices: [{ currency_code: "zar", amount: 0 }],
        options: { Type: "Membership" },
      },
    ],
    metadata: {
      tier: "free",
      access_level: 1,
      product_type: "membership",
    },
  },
  {
    title: "Silver Member",
    handle: "membership-silver",
    collectionHandle: "deep-dive",
    status: "published",
    options: [{ title: "Type", values: ["Membership"] }],
    variants: [
      {
        title: "Monthly",
        prices: [{ currency_code: "zar", amount: 29900 }],
        options: { Type: "Membership" },
      },
    ],
    metadata: {
      tier: "silver",
      access_level: 2,
      product_type: "membership",
    },
  },
  {
    title: "Gold Member",
    handle: "membership-gold",
    collectionHandle: "master-level",
    status: "published",
    options: [{ title: "Type", values: ["Membership"] }],
    variants: [
      {
        title: "Monthly",
        prices: [{ currency_code: "zar", amount: 59900 }],
        options: { Type: "Membership" },
      },
    ],
    metadata: {
      tier: "gold",
      access_level: 3,
      product_type: "membership",
    },
  },
  {
    title: "Practitioner License",
    handle: "membership-practitioner",
    collectionHandle: "practitioner",
    status: "published",
    options: [{ title: "Type", values: ["Membership"] }],
    variants: [
      {
        title: "Monthly",
        prices: [{ currency_code: "zar", amount: 99900 }],
        options: { Type: "Membership" },
      },
    ],
    metadata: {
      tier: "practitioner",
      access_level: 4,
      product_type: "membership",
    },
  },
]

async function seedMembershipProducts(token: string): Promise<void> {
  console.log("\nFetching existing collections…")
  const collectionIdByHandle = await fetchCollectionIdByHandle(token)

  console.log("Fetching existing products…")
  const { products } = await request<ListResponse<Product>>(
    "/admin/products?limit=100",
    {},
    token
  )
  const existingHandles = new Set(products.map((p) => p.handle))

  console.log("\nSeeding membership products…")

  for (const def of MEMBERSHIP_DEFINITIONS) {
    if (existingHandles.has(def.handle)) {
      console.log(`  Product "${def.title}" already exists — skipping.`)
      continue
    }

    const collectionId = collectionIdByHandle[def.collectionHandle]
    if (!collectionId) {
      console.warn(
        `  Cannot create "${def.title}" — collection "${def.collectionHandle}" not found. ` +
          "Run the main seed.ts first to create collections."
      )
      continue
    }

    console.log(`  Creating product "${def.title}"…`)

    const { product } = await request<{ product: Product }>(
      "/admin/products",
      {
        method: "POST",
        body: JSON.stringify({
          title: def.title,
          handle: def.handle,
          status: def.status,
          collection_id: collectionId,
          options: def.options,
          // Explicit manage_inventory: false — memberships are not
          // capacity-limited (see fix-variant-inventory-flags.ts).
          variants: def.variants.map((v) => ({
            ...v,
            manage_inventory: false,
          })),
          metadata: def.metadata,
        }),
      },
      token
    )

    console.log(`  Created "${def.title}" (${product.id}).`)
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
  await seedMembershipProducts(token)

  console.log("\nMembership seed complete.")
}

export default seed

// Allow running directly: ts-node src/scripts/seed-memberships.ts
if (require.main === module) {
  seed().catch((err: unknown) => {
    console.error("Membership seed failed:", err)
    process.exit(1)
  })
}
