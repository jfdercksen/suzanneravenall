/**
 * Medusa v2 seed script — regions, tax rates, shipping options,
 * product collections, and placeholder products.
 *
 * Run: ts-node src/scripts/seed.ts
 * See: src/scripts/README.md for full instructions.
 *
 * The script is idempotent — it checks for existing records before creating.
 * All requests go through the Medusa Admin API (JWT-authenticated).
 */

const BASE_URL = process.env.MEDUSA_URL || "http://localhost:9000"
const ADMIN_EMAIL =
  process.env.MEDUSA_ADMIN_EMAIL || "admin@suzanneravenall.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || ""

// ── Types ─────────────────────────────────────────────────────────────────────

interface Region {
  id: string
  name: string
  currency_code: string
}

interface ShippingOption {
  id: string
  name: string
  region_id: string
}

interface TaxRate {
  id: string
  name: string
  rate: number
  region_id: string
}

interface AuthResponse {
  token: string
}

interface ListResponse<T> {
  [key: string]: T[]
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

interface ProductPrice {
  currency_code: string
  amount: number
}

interface ProductVariantInput {
  title: string
  prices: ProductPrice[]
  // Medusa v2 defaults manage_inventory to true, which breaks complete-cart
  // when no stock location is linked to the sales channel. All placeholder
  // products here are digital/service offerings — never track inventory.
  manage_inventory?: boolean
}

interface ProductInput {
  title: string
  handle: string
  description: string
  status: "published" | "draft"
  collection_id: string | undefined
  variants: ProductVariantInput[]
}

interface ProductApiInput {
  title: string
  handle: string
  description: string
  status: "published" | "draft"
  collection_id: string
  variants: ProductVariantInput[]
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

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

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

// ── Regions ───────────────────────────────────────────────────────────────────

async function ensureRegion(
  token: string,
  name: string,
  currencyCode: string
): Promise<Region> {
  const { regions } = await request<ListResponse<Region>>(
    "/admin/regions?limit=100",
    {},
    token
  )

  const existing = regions.find(
    (r) => r.name === name || r.currency_code === currencyCode
  )

  if (existing) {
    console.log(`  Region "${name}" already exists (${existing.id}) — skipping.`)
    return existing
  }

  console.log(`  Creating region "${name}" (${currencyCode})…`)
  const { region } = await request<{ region: Region }>(
    "/admin/regions",
    {
      method: "POST",
      body: JSON.stringify({ name, currency_code: currencyCode }),
    },
    token
  )

  console.log(`  Created region "${name}" (${region.id}).`)
  return region
}

// ── Tax rates ─────────────────────────────────────────────────────────────────

async function ensureTaxRate(
  token: string,
  regionId: string,
  name: string,
  rate: number
): Promise<void> {
  const { tax_rates } = await request<ListResponse<TaxRate>>(
    `/admin/tax-rates?region_id=${regionId}&limit=100`,
    {},
    token
  )

  const existing = tax_rates.find((t) => t.name === name && t.region_id === regionId)

  if (existing) {
    console.log(`  Tax rate "${name}" already exists (${existing.id}) — skipping.`)
    return
  }

  console.log(`  Creating tax rate "${name}" (${rate}%) for region ${regionId}…`)
  const { tax_rate } = await request<{ tax_rate: TaxRate }>(
    "/admin/tax-rates",
    {
      method: "POST",
      body: JSON.stringify({ name, rate, region_id: regionId }),
    },
    token
  )

  console.log(`  Created tax rate "${name}" (${tax_rate.id}).`)
}

// ── Shipping options ──────────────────────────────────────────────────────────

async function ensureShippingOption(
  token: string,
  regionId: string,
  name: string,
  amount: number
): Promise<void> {
  const { shipping_options } = await request<ListResponse<ShippingOption>>(
    `/admin/shipping-options?region_id=${regionId}&limit=100`,
    {},
    token
  )

  const existing = shipping_options.find(
    (s) => s.name === name && s.region_id === regionId
  )

  if (existing) {
    console.log(`  Shipping option "${name}" already exists (${existing.id}) — skipping.`)
    return
  }

  // Retrieve the first fulfillment provider available (required by Medusa v2)
  const { fulfillment_providers } = await request<
    ListResponse<{ id: string }>
  >("/admin/fulfillment-providers?limit=1", {}, token)

  const providerId = fulfillment_providers[0]?.id

  if (!providerId) {
    console.warn(
      `  No fulfillment provider found — cannot create shipping option "${name}". ` +
        "Install a fulfillment provider module first."
    )
    return
  }

  console.log(`  Creating shipping option "${name}" (amount: ${amount})…`)

  const payload = {
    name,
    region_id: regionId,
    provider_id: providerId,
    data: {},
    price_type: "flat_rate",
    amount,
  }

  const { shipping_option } = await request<{ shipping_option: ShippingOption }>(
    "/admin/shipping-options",
    { method: "POST", body: JSON.stringify(payload) },
    token
  )

  console.log(`  Created shipping option "${name}" (${shipping_option.id}).`)
}

// ── Collections ───────────────────────────────────────────────────────────────

/**
 * Creates the 4 product collections that map to Suzanne's offering tiers.
 * Returns a map of handle → collection id for use when seeding products.
 * Idempotent — checks by handle before creating.
 */
async function ensureCollections(
  token: string
): Promise<Record<string, string | undefined>> {
  const { collections } = await request<ListResponse<Collection>>(
    "/admin/collections?limit=100",
    {},
    token
  )

  const existingByHandle = new Map(collections.map((c) => [c.handle, c.id]))

  const definitions: Array<{
    title: string
    handle: string
    description: string
  }> = [
    {
      title: "Start Here",
      handle: "start-here",
      description:
        "Entry level programs and resources — R1,500–R5,000. Your first step into Dr. Ravenall's methodology.",
    },
    {
      title: "Deep Dive",
      handle: "deep-dive",
      description:
        "Mid-tier intensive programs — R5,000–R20,000. Comprehensive transformation for committed clients.",
    },
    {
      title: "Master Level",
      handle: "master-level",
      description:
        "Premium coaching and group intensives — R20,000–R100,000+. For leaders ready for lasting change.",
    },
    {
      title: "Practitioner",
      handle: "practitioner",
      description:
        "Practitioner licensing, certification, and train-the-trainer programs. Become accredited in Dr. Ravenall's methodology.",
    },
  ]

  const handleToId: Record<string, string | undefined> = {}

  for (const def of definitions) {
    const existingId = existingByHandle.get(def.handle)

    if (existingId) {
      console.log(
        `  Collection "${def.title}" already exists (${existingId}) — skipping.`
      )
      handleToId[def.handle] = existingId
      continue
    }

    console.log(`  Creating collection "${def.title}"…`)
    const { collection } = await request<{ collection: Collection }>(
      "/admin/collections",
      {
        method: "POST",
        body: JSON.stringify({
          title: def.title,
          handle: def.handle,
          metadata: { description: def.description },
        }),
      },
      token
    )

    console.log(`  Created collection "${def.title}" (${collection.id}).`)
    handleToId[def.handle] = collection.id
  }

  return handleToId
}

// ── Products ──────────────────────────────────────────────────────────────────

/**
 * Creates 12 placeholder products (3 per collection) representing
 * Dr. Ravenall's coaching offering tiers.
 * Idempotent — checks by handle before creating.
 */
async function ensureProducts(
  token: string,
  collectionIdByHandle: Record<string, string | undefined>
): Promise<void> {
  const { products } = await request<ListResponse<Product>>(
    "/admin/products?limit=100",
    {},
    token
  )

  const existingHandles = new Set(products.map((p) => p.handle))

  const definitions: ProductInput[] = [
    // ── Start Here ────────────────────────────────────────────────────────────
    {
      title: "Introduction to Trauma-Informed Transformation",
      handle: "intro-trauma-informed",
      description:
        "A foundational self-paced online course introducing Dr. Ravenall's methodology for moving beyond trauma patterns. Includes 6 modules, workbook, and lifetime access.",
      status: "published",
      collection_id: collectionIdByHandle["start-here"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 150000 }],
        },
      ],
    },
    {
      title: "Clarity Breakthrough Session",
      handle: "clarity-breakthrough-session",
      description:
        "A single 90-minute private coaching session with Dr. Ravenall to identify your primary block and leave with a concrete 30-day action plan.",
      status: "published",
      collection_id: collectionIdByHandle["start-here"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 350000 }],
        },
      ],
    },
    {
      title: "Foundations of Resilience Online Programme",
      handle: "foundations-resilience-programme",
      description:
        "A 4-week online programme for professionals navigating burnout and overwhelm. Weekly group calls, workbook, and community access included.",
      status: "published",
      collection_id: collectionIdByHandle["start-here"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 480000 }],
        },
      ],
    },

    // ── Deep Dive ─────────────────────────────────────────────────────────────
    {
      title: "90-Day Private Coaching Intensive",
      handle: "90-day-private-coaching",
      description:
        "Three months of weekly 1:1 coaching sessions with Dr. Ravenall. Includes full psychometric assessment, personalised transformation plan, and WhatsApp support between sessions.",
      status: "published",
      collection_id: collectionIdByHandle["deep-dive"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 1800000 }],
        },
      ],
    },
    {
      title: "Leadership Performance Accelerator",
      handle: "leadership-performance-accelerator",
      description:
        "A 6-week group programme for senior leaders and executives ready to break through performance plateaus. Maximum 8 participants. Includes psychometric profiling and peer accountability framework.",
      status: "published",
      collection_id: collectionIdByHandle["deep-dive"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 1200000 }],
        },
      ],
    },
    {
      title: "Relationship Dynamics Deep Dive",
      handle: "relationship-dynamics-deep-dive",
      description:
        "An immersive 8-week private and group hybrid programme addressing the relational patterns that impact professional and personal performance. Includes 4 private sessions and 4 group workshops.",
      status: "published",
      collection_id: collectionIdByHandle["deep-dive"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 950000 }],
        },
      ],
    },

    // ── Master Level ──────────────────────────────────────────────────────────
    {
      title: "Transformation Mastery Retreat",
      handle: "transformation-mastery-retreat",
      description:
        "An exclusive 3-day in-person retreat (maximum 12 participants) combining group work, individual breakthroughs, and Dr. Ravenall's full Human Performance Replicator methodology. Venue, meals, and materials included.",
      status: "published",
      collection_id: collectionIdByHandle["master-level"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 4500000 }],
        },
      ],
    },
    {
      title: "Executive VIP Day",
      handle: "executive-vip-day",
      description:
        "A full-day private intensive with Dr. Ravenall. Designed for C-suite executives and high-performers requiring rapid, deep-level pattern interruption. Includes pre-session psychometrics and 30-day follow-up call.",
      status: "published",
      collection_id: collectionIdByHandle["master-level"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 2800000 }],
        },
      ],
    },
    {
      title: "Annual Transformation Partnership",
      handle: "annual-transformation-partnership",
      description:
        "Dr. Ravenall's premium 12-month private coaching relationship. Fortnightly sessions, unlimited WhatsApp support, retreat priority access, and annual performance review. By application only.",
      status: "published",
      collection_id: collectionIdByHandle["master-level"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 9500000 }],
        },
      ],
    },

    // ── Practitioner ──────────────────────────────────────────────────────────
    {
      title: "Human Performance Replicator Practitioner Certification",
      handle: "hpr-practitioner-certification",
      description:
        "Become a certified practitioner in Dr. Ravenall's proprietary Human Performance Replicator methodology. 6-month blended programme including online training modules, supervised practice hours, and certification examination.",
      status: "published",
      collection_id: collectionIdByHandle["practitioner"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 3500000 }],
        },
      ],
    },
    {
      title: "Train the Trainer — Foundations Programme",
      handle: "train-the-trainer-foundations",
      description:
        "A comprehensive train-the-trainer programme equipping coaches and HR professionals to deliver Dr. Ravenall's foundational workshops within their organisations. Includes full facilitation guides, participant workbooks, and ongoing supervision.",
      status: "published",
      collection_id: collectionIdByHandle["practitioner"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 2200000 }],
        },
      ],
    },
    {
      title: "Corporate Licensing Package",
      handle: "corporate-licensing-package",
      description:
        "Annual corporate licence to deliver Dr. Ravenall's Foundations of Resilience programme within your organisation. Includes a 2-day facilitator training, branded materials, and quarterly supervision calls. Pricing subject to organisation size.",
      status: "published",
      collection_id: collectionIdByHandle["practitioner"],
      variants: [
        {
          title: "Default",
          prices: [{ currency_code: "zar", amount: 5500000 }],
        },
      ],
    },
  ]

  for (const productInput of definitions) {
    if (existingHandles.has(productInput.handle)) {
      console.log(
        `  Product "${productInput.title}" already exists — skipping.`
      )
      continue
    }

    const collectionId = productInput.collection_id
    if (!collectionId) {
      console.warn(
        `  Cannot create "${productInput.title}" — collection ID is missing. ` +
          "Run ensureCollections first."
      )
      continue
    }

    const apiInput: ProductApiInput = {
      title: productInput.title,
      handle: productInput.handle,
      description: productInput.description,
      status: productInput.status,
      collection_id: collectionId,
      // Explicit manage_inventory: false — none of these placeholder products
      // are capacity-limited (see fix-variant-inventory-flags.ts).
      variants: productInput.variants.map((v) => ({
        ...v,
        manage_inventory: false,
      })),
    }

    console.log(`  Creating product "${productInput.title}"…`)
    const { product } = await request<{ product: Product }>(
      "/admin/products",
      {
        method: "POST",
        body: JSON.stringify(apiInput),
      },
      token
    )

    console.log(`  Created product "${productInput.title}" (${product.id}).`)
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

  // ── Regions ────────────────────────────────────────────────────────────────
  console.log("\nSeeding regions…")
  const saRegion = await ensureRegion(token, "South Africa", "zar")
  const intlRegion = await ensureRegion(token, "International", "usd")

  // ── Tax rates ──────────────────────────────────────────────────────────────
  console.log("\nSeeding tax rates…")
  await ensureTaxRate(token, saRegion.id, "VAT", 15)

  // ── Shipping options ───────────────────────────────────────────────────────
  console.log("\nSeeding shipping options…")

  // Digital delivery is free in both regions
  await ensureShippingOption(token, saRegion.id, "Digital Delivery", 0)
  await ensureShippingOption(token, intlRegion.id, "Digital Delivery", 0)

  // Physical delivery only in SA — R150 (stored in smallest currency unit: cents)
  await ensureShippingOption(token, saRegion.id, "Physical Delivery SA", 15000)

  // ── Collections ────────────────────────────────────────────────────────────
  console.log("\nSeeding product collections…")
  const collectionIdByHandle = await ensureCollections(token)

  // ── Products ───────────────────────────────────────────────────────────────
  console.log("\nSeeding placeholder products…")
  await ensureProducts(token, collectionIdByHandle)

  console.log("\nSeed complete.")
}

export default seed

// Allow running directly: ts-node src/scripts/seed.ts
if (require.main === module) {
  seed().catch((err: unknown) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
}
