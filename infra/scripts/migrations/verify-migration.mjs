/**
 * One-off migration verification script.
 * Checks product count, spot-checks 3 products with expected variant counts,
 * and verifies redirect-map.json exists.
 */

import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.MEDUSA_URL ?? "http://medusa:9000"
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL ?? "admin@suzanneravenall.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD ?? ""

async function run() {
  // Auth
  const authRes = await fetch(`${BASE_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!authRes.ok) throw new Error(`Auth failed: ${authRes.status}`)
  const { token } = await authRes.json()
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  // Total product count
  const countRes = await fetch(`${BASE_URL}/admin/products?limit=1`, { headers: h })
  const countData = await countRes.json()
  console.log(`\nTotal products in Medusa: ${countData.count}`)
  console.log(`  (48 WC migration + 12 seed placeholders = 60 expected)\n`)

  // Spot-check 3 products
  const checks = [
    { handle: "rapid-repatterning-session-60-min-online", expectedVariants: 12, name: "Rapid Repatterning Session" },
    { handle: "resonance-repatterning-program-1-fundamentals-live-online", expectedVariants: 3, name: "Resonance Repatterning Program 1" },
    { handle: "executive-coaching-session", expectedVariants: 6, name: "Executive Coaching Session" },
  ]

  for (const check of checks) {
    const res = await fetch(`${BASE_URL}/admin/products?handle=${check.handle}&fields=id,title,handle,variants`, { headers: h })
    const data = await res.json()
    const product = data.products?.[0]
    if (!product) {
      console.log(`  MISSING: "${check.name}" (handle: ${check.handle})`)
      continue
    }
    const variantCount = product.variants?.length ?? 0
    const ok = variantCount === check.expectedVariants ? "OK" : `MISMATCH (expected ${check.expectedVariants})`
    console.log(`  ${check.name}: ${variantCount} variants — ${ok}`)
  }

  // Redirect map check
  const redirectPath = join(__dirname, "redirect-map.json")
  if (existsSync(redirectPath)) {
    const data = JSON.parse(readFileSync(redirectPath, "utf8"))
    console.log(`\nredirect-map.json: ${data.count} entries — ${data.count === 129 ? "OK" : "MISMATCH (expected 129)"}`)
  } else {
    console.log("\nredirect-map.json: MISSING")
  }
}

run().catch((e) => { console.error("Failed:", e); process.exit(1) })
