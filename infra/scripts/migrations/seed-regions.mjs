/**
 * seed-regions.mjs — idempotent Medusa region seeder
 *
 * Creates (or repairs) the South Africa / ZAR region and attaches the
 * PayFast payment provider.  Safe to re-run at any time.
 *
 * Usage (on VPS, from infra/ directory):
 *   docker compose -f docker-compose.yml run --rm \
 *     -e MEDUSA_ADMIN_PASSWORD=<pass> \
 *     web node /app/infra/scripts/migrations/seed-regions.mjs
 *
 * Or run directly from the host if the Medusa API is reachable:
 *   MEDUSA_URL=http://169.239.180.49/api \
 *   MEDUSA_ADMIN_PASSWORD=<pass> \
 *   node infra/scripts/migrations/seed-regions.mjs
 *
 * Environment variables:
 *   MEDUSA_URL              Base URL for the Medusa API (with /api prefix if behind Nginx)
 *   MEDUSA_ADMIN_EMAIL      Defaults to admin@suzanneravenall.com
 *   MEDUSA_ADMIN_PASSWORD   Required
 */

const BASE_URL = process.env.MEDUSA_URL ?? "http://medusa:9000"
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL ?? "admin@suzanneravenall.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD ?? ""

const PAYFAST_PROVIDER_ID = "pp_payfast_payfast"

if (!ADMIN_PASSWORD) {
  console.error("MEDUSA_ADMIN_PASSWORD is not set")
  process.exit(1)
}

// ------------------------------------------------------------------
// Auth
// ------------------------------------------------------------------
async function getToken() {
  const res = await fetch(`${BASE_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`)
  const { token } = await res.json()
  return token
}

// ------------------------------------------------------------------
// Regions
// ------------------------------------------------------------------
async function getRegions(headers) {
  const res = await fetch(`${BASE_URL}/admin/regions?limit=100&fields=*countries,*payment_providers`, { headers })
  if (!res.ok) throw new Error(`List regions failed: ${res.status}`)
  const body = await res.json()
  return body.regions ?? []
}

async function createRegion(headers, { name, currencyCode, countries, paymentProviders }) {
  const body = {
    name,
    currency_code: currencyCode,
    countries,
    payment_providers: paymentProviders,
  }
  const res = await fetch(`${BASE_URL}/admin/regions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Create region failed: ${res.status} ${JSON.stringify(data)}`)
  return data.region
}

// Medusa v2 region update — tries POST (some builds), then falls back to PATCH
async function updateRegionPaymentProviders(headers, regionId, providerIds) {
  const payload = { payment_providers: providerIds }

  // Attempt 1: POST (Medusa v2 uses POST for updates on some route handlers)
  let res = await fetch(`${BASE_URL}/admin/regions/${regionId}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (res.status === 405 || res.status === 404 || (await res.clone().text()).startsWith("<!")) {
    // Attempt 2: PATCH
    res = await fetch(`${BASE_URL}/admin/regions/${regionId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    })
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.warn(`  Could not update payment providers via API (status ${res.status}).`)
    console.warn("  You may need to activate PayFast manually in the Medusa admin UI:")
    console.warn("  Settings → Regions → South Africa → Payment Providers → Enable PayFast")
    return null
  }
  return data.region
}

// ------------------------------------------------------------------
// Payment providers — list what the Medusa instance knows about
// ------------------------------------------------------------------
async function listPaymentProviders(headers) {
  const res = await fetch(`${BASE_URL}/admin/payment-providers?limit=100`, { headers })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return data.payment_providers ?? []
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function run() {
  console.log(`\nConnecting to Medusa at ${BASE_URL}`)

  const token = await getToken()
  console.log("Authenticated ✓")

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  // ----- List available payment providers -----
  const availableProviders = await listPaymentProviders(headers)
  if (availableProviders.length > 0) {
    console.log("\nAvailable payment providers:")
    for (const p of availableProviders) {
      console.log(`  - ${p.id} (is_enabled: ${p.is_enabled})`)
    }
  } else {
    console.log("\nNo payment providers listed via API — payment module may not be loaded.")
    console.log("Ensure the PayFast module is deployed (feature/task-2-6-payfast merged to main).")
  }

  // ----- South Africa region -----
  const regions = await getRegions(headers)
  const saRegion = regions.find(
    (r) =>
      r.currency_code === "zar" ||
      r.countries?.some((c) => c.iso_2 === "za") ||
      r.name?.toLowerCase().includes("south africa")
  )

  if (saRegion) {
    console.log(`\nSouth Africa region found: ${saRegion.id}`)
    console.log(`  Currency: ${saRegion.currency_code}`)
    console.log(`  Countries: ${(saRegion.countries ?? []).map((c) => c.iso_2).join(", ") || "none"}`)

    const existingProviders = saRegion.payment_providers ?? []
    const hasPayFast = existingProviders.some((p) => p.id === PAYFAST_PROVIDER_ID)

    if (hasPayFast) {
      console.log(`  PayFast: already attached ✓`)
    } else {
      console.log(`  PayFast: not attached — attempting to add...`)
      const updated = await updateRegionPaymentProviders(headers, saRegion.id, [PAYFAST_PROVIDER_ID])
      if (updated) {
        const nowHasPayFast = (updated.payment_providers ?? []).some((p) => p.id === PAYFAST_PROVIDER_ID)
        console.log(`  PayFast: ${nowHasPayFast ? "attached ✓" : "still not attached ✗"}`)
      }
    }
  } else {
    console.log("\nSouth Africa region not found — creating...")
    const created = await createRegion(headers, {
      name: "South Africa",
      currencyCode: "zar",
      countries: ["ZA"],
      paymentProviders: [PAYFAST_PROVIDER_ID],
    })
    console.log(`  Created: ${created.id}`)
    console.log(`  Currency: ${created.currency_code}`)
    console.log(`  Countries: ${(created.countries ?? []).map((c) => c.iso_2).join(", ")}`)
    console.log(`  Payment providers: ${(created.payment_providers ?? []).map((p) => p.id).join(", ") || "none"}`)
  }

  // ----- Final state -----
  const final = await getRegions(headers)
  const finalSA = final.find((r) => r.id === (saRegion?.id ?? ""))
  if (finalSA) {
    console.log("\nFinal South Africa region state:")
    console.log(`  ID:        ${finalSA.id}`)
    console.log(`  Currency:  ${finalSA.currency_code}`)
    console.log(`  Countries: ${(finalSA.countries ?? []).map((c) => c.iso_2).join(", ")}`)
    console.log(`  Providers: ${(finalSA.payment_providers ?? []).map((p) => p.id).join(", ") || "none"}`)
  }

  console.log("\nRegion seed complete.")
}

run().catch((e) => {
  console.error("seed-regions failed:", e.message)
  process.exit(1)
})
