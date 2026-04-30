/**
 * One-off collections seeder — creates the 4 product collections needed
 * before the WooCommerce migration. Run via the node container on VPS.
 * Idempotent: checks existing handles before creating.
 */

const BASE_URL = process.env.MEDUSA_URL ?? "http://medusa:9000"
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL ?? "admin@suzanneravenall.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD ?? ""

if (!ADMIN_PASSWORD) {
  console.error("MEDUSA_ADMIN_PASSWORD is not set")
  process.exit(1)
}

async function run() {
  // Authenticate
  const authRes = await fetch(`${BASE_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!authRes.ok) throw new Error(`Auth failed: ${authRes.status}`)
  const { token } = await authRes.json()
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  // Fetch existing collections
  const listRes = await fetch(`${BASE_URL}/admin/collections?limit=100`, { headers })
  const { collections } = await listRes.json()
  const existingHandles = new Set(collections.map((c) => c.handle))

  const definitions = [
    { title: "Start Here",   handle: "start-here" },
    { title: "Deep Dive",    handle: "deep-dive" },
    { title: "Master Level", handle: "master-level" },
    { title: "Practitioner", handle: "practitioner" },
  ]

  for (const def of definitions) {
    if (existingHandles.has(def.handle)) {
      console.log(`  "${def.title}" already exists — skipping.`)
      continue
    }
    const res = await fetch(`${BASE_URL}/admin/collections`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title: def.title, handle: def.handle }),
    })
    if (!res.ok) throw new Error(`Create "${def.title}" failed: ${res.status} ${await res.text()}`)
    const { collection } = await res.json()
    console.log(`  Created "${def.title}" (${collection.id})`)
  }

  console.log("\nCollections seeded.")
}

run().catch((e) => { console.error("Failed:", e); process.exit(1) })
