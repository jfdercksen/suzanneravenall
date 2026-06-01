#!/usr/bin/env node
/**
 * seed-membership-tiers.mjs
 *
 * Seeds all 29 real membership tier products into Medusa.
 * Idempotent — products are skipped if their handle already exists.
 *
 * The script also ensures a "membership" collection exists.
 *
 * NOTE: The 4 placeholder products created by the old seed-memberships.ts script
 * (membership-free, membership-silver, membership-gold, membership-practitioner)
 * are NOT deleted automatically. Remove them manually via the Medusa admin UI if needed.
 *
 * Usage:
 *   MEDUSA_ADMIN_EMAIL=admin@suzanneravenall.com \
 *   MEDUSA_ADMIN_PASSWORD=<password> \
 *   node infra/scripts/seed-membership-tiers.mjs
 *
 * Optional env vars:
 *   MEDUSA_URL            — Medusa backend base URL (default: http://localhost:9000)
 *   MEDUSA_API_TOKEN      — API token from Medusa admin → API Key Management (preferred)
 *   MEDUSA_ADMIN_EMAIL    — Admin email (used when MEDUSA_API_TOKEN is not set)
 *   MEDUSA_ADMIN_PASSWORD — Admin password (used when MEDUSA_API_TOKEN is not set)
 */

import https from 'https'
import http from 'http'

const BASE_URL = process.env.MEDUSA_URL || 'http://localhost:9000'
const API_TOKEN = process.env.MEDUSA_API_TOKEN || ''
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || 'admin@suzanneravenall.com'
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || ''

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const body = options.body || null
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: parsed.pathname + (parsed.search || ''),
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
    }
    const req = lib.request(reqOptions, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${options.method || 'GET'} ${url} → ${res.statusCode}: ${raw.slice(0, 400)}`))
          return
        }
        try { resolve(JSON.parse(raw)) }
        catch { reject(new Error(`Non-JSON (${res.statusCode}): ${raw.slice(0, 300)}`)) }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authenticate() {
  if (API_TOKEN) {
    console.log('Using MEDUSA_API_TOKEN for authentication.')
    return { type: 'api-token', value: API_TOKEN }
  }
  if (!ADMIN_PASSWORD) {
    throw new Error(
      'No auth credentials found.\n' +
      'Set MEDUSA_API_TOKEN, or set MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD.'
    )
  }
  console.log(`Authenticating as ${ADMIN_EMAIL}...`)
  const data = await httpRequest(`${BASE_URL}/auth/user/emailpass`, {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!data.token) throw new Error(`Auth failed: no token in response: ${JSON.stringify(data).slice(0, 200)}`)
  console.log('  Authenticated.')
  return { type: 'bearer', value: data.token }
}

function authHeaders(auth) {
  if (auth.type === 'api-token') return { 'x-medusa-access-token': auth.value }
  return { Authorization: `Bearer ${auth.value}` }
}

function api(path, auth, options = {}) {
  return httpRequest(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(auth), ...(options.headers || {}) },
  })
}

// ── Collections ───────────────────────────────────────────────────────────────

async function ensureMembershipCollection(auth) {
  const { collections } = await api('/admin/collections?limit=200', auth)
  const existing = collections.find((c) => c.handle === 'membership')
  if (existing) {
    console.log(`  Collection "membership" exists (${existing.id}).`)
    return existing.id
  }
  console.log('  Creating "membership" collection...')
  const { collection } = await api('/admin/collections', auth, {
    method: 'POST',
    body: JSON.stringify({ title: 'Membership', handle: 'membership' }),
  })
  console.log(`  Created collection "membership" (${collection.id}).`)
  return collection.id
}

// ── Membership tier definitions ───────────────────────────────────────────────

const TIERS = [
  { sku: 'S0211', title: 'Guest Membership',                                                        track: 'general',          level: 'guest',             tierType: 'standard', accessLevel: 1,  zarPrice: 0,    usdPrice: 0,   requiresTraining: false, canChargeClients: false, annual: false },
  { sku: 'S0212', title: 'Lifestyle Membership',                                                     track: 'general',          level: 'lifestyle',         tierType: 'standard', accessLevel: 2,  zarPrice: 350,  usdPrice: 20,  requiresTraining: false, canChargeClients: false, annual: true  },
  { sku: 'S0213', title: 'Akashic Student Membership',                                               track: 'akashic',          level: 'student',           tierType: 'standard', accessLevel: 3,  zarPrice: 525,  usdPrice: 30,  requiresTraining: true,  canChargeClients: false, annual: true  },
  { sku: 'S0214', title: 'Akashic Novice Practitioner - Basic Membership',                           track: 'akashic',          level: 'novice',            tierType: 'basic',    accessLevel: 4,  zarPrice: 875,  usdPrice: 50,  requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0215', title: 'Akashic Novice Practitioner - Premier Membership',                         track: 'akashic',          level: 'novice',            tierType: 'premier',  accessLevel: 4,  zarPrice: 1225, usdPrice: 70,  requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0216', title: 'Akashic Practitioner (Prdip) - Basic Membership',                          track: 'akashic',          level: 'practitioner',      tierType: 'basic',    accessLevel: 5,  zarPrice: 1400, usdPrice: 80,  requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0217', title: 'Akashic Practitioner (Prdip) - Premier Membership',                        track: 'akashic',          level: 'practitioner',      tierType: 'premier',  accessLevel: 5,  zarPrice: 1750, usdPrice: 100, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0218', title: 'Akashic Certified Practitioner (CertPrdip) - Basic Membership',            track: 'akashic',          level: 'certified',         tierType: 'basic',    accessLevel: 6,  zarPrice: 1750, usdPrice: 100, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0219', title: 'Akashic Certified Practitioner (CertPrdip) - Premier Membership',          track: 'akashic',          level: 'certified',         tierType: 'premier',  accessLevel: 6,  zarPrice: 2100, usdPrice: 120, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0220', title: 'Akashic Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership',track: 'akashic',          level: 'advanced',          tierType: 'basic',    accessLevel: 7,  zarPrice: 1750, usdPrice: 100, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0221', title: 'Akashic Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership', track: 'akashic',      level: 'advanced',          tierType: 'premier',  accessLevel: 7,  zarPrice: 2100, usdPrice: 120, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0222', title: 'Akashic Mentor (MentorPrdip) - Premier Membership',                        track: 'akashic',          level: 'mentor',            tierType: 'premier',  accessLevel: 8,  zarPrice: 1750, usdPrice: 100, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0223', title: 'Akashic Master Practitioner (MasterPrdip) - Premier Membership',           track: 'akashic',          level: 'master',            tierType: 'premier',  accessLevel: 9,  zarPrice: 2625, usdPrice: 150, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0224', title: 'Akashic Instructor (Inst) - Premier Membership',                           track: 'akashic',          level: 'instructor',        tierType: 'premier',  accessLevel: 9,  zarPrice: 2625, usdPrice: 150, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0225', title: 'Akashic Certified Master Instructor (CertMasterInst) - Premier Membership',track: 'akashic',          level: 'master-instructor', tierType: 'premier',  accessLevel: 10, zarPrice: 2625, usdPrice: 150, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0226', title: 'Energy Clearing Student Membership',                                        track: 'energy-clearing',  level: 'student',           tierType: 'standard', accessLevel: 3,  zarPrice: 525,  usdPrice: 30,  requiresTraining: true,  canChargeClients: false, annual: true  },
  { sku: 'S0227', title: 'Energy Clearing Novice Practitioner - Basic Membership',                    track: 'energy-clearing',  level: 'novice',            tierType: 'basic',    accessLevel: 4,  zarPrice: 875,  usdPrice: 50,  requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0228', title: 'Energy Clearing Novice Practitioner - Premier Membership',                  track: 'energy-clearing',  level: 'novice',            tierType: 'premier',  accessLevel: 4,  zarPrice: 1225, usdPrice: 70,  requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0229', title: 'Energy Clearing Practitioner (Prdip) - Basic Membership',                   track: 'energy-clearing',  level: 'practitioner',      tierType: 'basic',    accessLevel: 5,  zarPrice: 1400, usdPrice: 80,  requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0230', title: 'Energy Clearing Practitioner (Prdip) - Premier Membership',                 track: 'energy-clearing',  level: 'practitioner',      tierType: 'premier',  accessLevel: 5,  zarPrice: 1750, usdPrice: 100, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0231', title: 'Energy Clearing Certified Practitioner (CertPrdip) - Basic Membership',     track: 'energy-clearing',  level: 'certified',         tierType: 'basic',    accessLevel: 6,  zarPrice: 1750, usdPrice: 100, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0232', title: 'Energy Clearing Certified Practitioner (CertPrdip) - Premier Membership',   track: 'energy-clearing',  level: 'certified',         tierType: 'premier',  accessLevel: 6,  zarPrice: 2100, usdPrice: 120, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0233', title: 'Energy Clearing Certified Advanced Practitioner (CertAdvPrdip) - Basic Membership',    track: 'energy-clearing', level: 'advanced', tierType: 'basic',   accessLevel: 7,  zarPrice: 1750, usdPrice: 100, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0234', title: 'Energy Clearing Certified Advanced Practitioner (CertAdvPrdip) - Premier Membership',  track: 'energy-clearing', level: 'advanced', tierType: 'premier', accessLevel: 7,  zarPrice: 2100, usdPrice: 120, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0235', title: 'Energy Clearing Mentor (MentorPrdip) - Premier Membership',                 track: 'energy-clearing',  level: 'mentor',            tierType: 'premier',  accessLevel: 8,  zarPrice: 1750, usdPrice: 100, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0236', title: 'Energy Clearing Master Practitioner (MasterPrdip) - Premier Membership',    track: 'energy-clearing',  level: 'master',            tierType: 'premier',  accessLevel: 9,  zarPrice: 2625, usdPrice: 150, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0237', title: 'Energy Clearing Certified Master Practitioner (CertMasterPrdip) - Premier Membership', track: 'energy-clearing', level: 'master',   tierType: 'premier',  accessLevel: 9,  zarPrice: 2625, usdPrice: 150, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0238', title: 'Energy Clearing Instructor (Inst) - Premier Membership',                    track: 'energy-clearing',  level: 'instructor',        tierType: 'premier',  accessLevel: 9,  zarPrice: 2625, usdPrice: 150, requiresTraining: true,  canChargeClients: true,  annual: true  },
  { sku: 'S0239', title: 'Energy Clearing Certified Master Instructor (CertMasterInst) - Premier Membership', track: 'energy-clearing', level: 'master-instructor', tierType: 'premier', accessLevel: 10, zarPrice: 2625, usdPrice: 150, requiresTraining: true, canChargeClients: true, annual: true },
]

// ── Seeding ───────────────────────────────────────────────────────────────────

async function seedTiers(auth, collectionId) {
  console.log('\nFetching existing products (up to 500)...')
  const { products } = await api('/admin/products?limit=500', auth)
  const existingHandles = new Set(products.map((p) => p.handle))

  console.log(`  Found ${products.length} existing products.\n`)
  console.log(`Seeding ${TIERS.length} membership tiers...\n`)

  let created = 0
  let skipped = 0

  for (const tier of TIERS) {
    const handle = `membership-${tier.sku.toLowerCase()}`

    if (existingHandles.has(handle)) {
      console.log(`  SKIP  ${tier.sku}  ${tier.title}`)
      skipped++
      continue
    }

    const prices = []
    if (tier.zarPrice >= 0) prices.push({ currency_code: 'zar', amount: tier.zarPrice * 100 })
    if (tier.usdPrice > 0) prices.push({ currency_code: 'usd', amount: tier.usdPrice * 100 })

    const body = JSON.stringify({
      title: tier.title,
      handle,
      status: 'published',
      collection_id: collectionId,
      options: [{ title: 'Type', values: ['Membership'] }],
      variants: [
        {
          title: tier.annual ? 'Annual' : 'Unlimited',
          prices,
          options: { Type: 'Membership' },
        },
      ],
      metadata: {
        sku: tier.sku,
        track: tier.track,
        level: tier.level,
        tier_type: tier.tierType,
        access_level: tier.accessLevel,
        requires_training: tier.requiresTraining,
        can_charge_clients: tier.canChargeClients,
        annual: tier.annual,
        product_type: 'membership',
      },
    })

    const { product } = await api('/admin/products', auth, { method: 'POST', body })
    console.log(`  CREATE ${tier.sku}  ${tier.title}  (${product.id})`)
    created++
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Medusa URL: ${BASE_URL}\n`)

  const auth = await authenticate()

  console.log('\nEnsuring "membership" collection...')
  const collectionId = await ensureMembershipCollection(auth)

  await seedTiers(auth, collectionId)

  console.log('\nMembership tier seed complete.')
  console.log('\nNext steps:')
  console.log('  1. Apply Supabase migration: supabase/migrations/20260526_membership_tiers.sql')
  console.log('  2. Check Medusa admin: http://169.239.180.49/api/admin → Products → filter by "membership" collection')
  console.log('  3. Remove old placeholder products manually if no longer needed:')
  console.log('     membership-free, membership-silver, membership-gold, membership-practitioner')
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message)
  process.exit(1)
})
