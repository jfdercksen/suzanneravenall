/**
 * Medusa v2 seed script — regions, tax rates, and shipping options.
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
