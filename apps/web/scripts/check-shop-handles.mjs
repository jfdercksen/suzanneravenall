// Checks that every shopHandle in data/programs.ts is a published Medusa product.
// Programme pages link "View in Shop" to /shop/{shopHandle}; when a product is
// retired (set to draft) the link turns into a 404 on the programme page.
// Run after any catalogue change:  node scripts/check-shop-handles.mjs
// Needs NEXT_PUBLIC_MEDUSA_URL and NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in the environment
// (or in apps/web/.env, loaded here without any dependency). Against the review box:
//   env $(grep -E "^(NEXT_PUBLIC_MEDUSA_URL|NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY)=" ../../infra/.env | xargs) node scripts/check-shop-handles.mjs
import { readFileSync, existsSync } from 'node:fs'

for (const f of ['.env', '.env.local']) {
  if (!existsSync(f)) continue
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const base = (process.env.NEXT_PUBLIC_MEDUSA_URL ?? '').replace(/\/$/, '')
const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
if (!base || !key) {
  console.error('NEXT_PUBLIC_MEDUSA_URL and NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY are required')
  process.exit(2)
}

const published = new Set()
for (let offset = 0; ; offset += 100) {
  const res = await fetch(`${base}/store/products?limit=100&offset=${offset}&fields=handle`, {
    headers: { 'x-publishable-api-key': key },
  })
  if (!res.ok) {
    console.error(`store API ${res.status}`)
    process.exit(2)
  }
  const data = await res.json()
  for (const p of data.products) published.add(p.handle)
  if (offset + 100 >= data.count) break
}

const source = readFileSync('data/programs.ts', 'utf8')
const handles = [...source.matchAll(/shopHandle: '([^']+)'/g)].map((m) => m[1])
const dead = handles.filter((h) => !published.has(h))

console.log(`${handles.length} programme shop handles, ${published.size} published products`)
if (dead.length) {
  console.error('NOT PUBLISHED (programme page would link to a 404):')
  for (const h of dead) console.error(`  ${h}`)
  process.exit(1)
}
console.log('all programme shop handles resolve')
