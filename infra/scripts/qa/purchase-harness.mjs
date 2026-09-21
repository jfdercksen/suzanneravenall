#!/usr/bin/env node
// Purchase harness: buys every purchasable variant with a 100% voucher through
// the same Medusa store endpoints the checkout uses, records each order, and
// verifies the Thinkific enrolment. Node 24, no npm dependencies.
//
// Reads config from the shell first, then infra/.env (gitignored). Never prints
// a secret. See docs/testing/SELF-TEST-PLAN.md for the pass criteria.
//
//   node infra/scripts/qa/purchase-harness.mjs --list
//   node infra/scripts/qa/purchase-harness.mjs --dry-run --ensure-promo [--limit=N] [--handle=H]
//   node infra/scripts/qa/purchase-harness.mjs --run --verify [--limit=N] [--handle=H] [--concurrency=3]
//   node infra/scripts/qa/purchase-harness.mjs --cleanup-plan --from=<run.json>
//   node infra/scripts/qa/purchase-harness.mjs --cleanup --yes --from=<run.json>
//
// --dry-run   creates the cart, applies the voucher, asserts total 0, then stops
//             (no order, so no Thinkific, Vtiger or email side effects)
// --run       completes the cart (creates the order and every side effect)
// --verify    after --run, polls Thinkific for the enrolment of each course product
// --cleanup   cancels the run's orders and removes the Thinkific enrolments; the
//             Vtiger rows are only listed, never touched

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..')

// ── Args ────────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  })
)
const MODE = args.list ? 'list' : args['dry-run'] ? 'dry-run' : args.run ? 'run' : args['cleanup-plan'] ? 'cleanup-plan' : args.cleanup ? 'cleanup' : null
if (!MODE) {
  console.error('Pick one of --list, --dry-run, --run, --cleanup-plan, --cleanup')
  process.exit(2)
}
const LIMIT = args.limit ? Number(args.limit) : Infinity
const HANDLE = typeof args.handle === 'string' ? args.handle : null
const CONCURRENCY = args.concurrency ? Number(args.concurrency) : 3
const VERIFY = Boolean(args.verify)
const ENSURE_PROMO = Boolean(args['ensure-promo'])

// ── Env (shell wins, then infra/.env) ───────────────────────────────────────
function loadDotEnv(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    const k = line.slice(0, i).trim()
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[k] = v
  }
  return out
}
const fileEnv = loadDotEnv(join(repoRoot, 'infra', '.env'))
const env = (k, d = '') => process.env[k] ?? fileEnv[k] ?? d

const MEDUSA_URL = env('QA_MEDUSA_URL', env('NEXT_PUBLIC_MEDUSA_URL', 'http://169.239.180.49/api')).replace(/\/$/, '')
const PUB_KEY = env('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY')
const ADMIN_EMAIL = env('MEDUSA_ADMIN_EMAIL')
const ADMIN_PASSWORD = env('MEDUSA_ADMIN_PASSWORD')
const API_TOKEN = env('MEDUSA_API_TOKEN')
const BUYER_EMAIL = env('QA_BUYER_EMAIL')
const BUYER_FIRST = env('QA_BUYER_FIRST', 'QA')
const BUYER_LAST = env('QA_BUYER_LAST', 'SelfTest')
const PROMO_CODE = env('QA_PROMO_CODE', 'QA-SELFTEST-100')
const THINKIFIC_KEY = env('THINKIFIC_API_KEY')
const THINKIFIC_BASE = 'https://api.thinkific.com/api/public/v1'
const VERIFY_TIMEOUT_MS = Number(env('QA_VERIFY_TIMEOUT_MS', '90000'))

if (!PUB_KEY) die('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is not set')
if ((MODE === 'dry-run' || MODE === 'run') && !BUYER_EMAIL) die('QA_BUYER_EMAIL is not set (the inbox we control)')

function die(msg) {
  console.error(`harness: ${msg}`)
  process.exit(1)
}

// ── HTTP helpers ────────────────────────────────────────────────────────────
async function http(url, { method = 'GET', headers = {}, body, timeoutMs = 30000 } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    })
    const text = await res.text()
    let json = null
    try { json = text ? JSON.parse(text) : null } catch { /* not json */ }
    return { ok: res.ok, status: res.status, json, text }
  } finally {
    clearTimeout(t)
  }
}

const storeHeaders = { 'x-publishable-api-key': PUB_KEY }
const store = (path, opts = {}) => http(`${MEDUSA_URL}/store${path}`, { ...opts, headers: { ...storeHeaders, ...(opts.headers ?? {}) } })

let adminToken = null
async function adminAuth() {
  if (adminToken) return adminToken
  if (API_TOKEN) { adminToken = API_TOKEN; return adminToken }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) die('Set MEDUSA_API_TOKEN, or MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD')
  const r = await http(`${MEDUSA_URL}/auth/user/emailpass`, { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  if (!r.ok || !r.json?.token) die(`admin login failed (${r.status})`)
  adminToken = r.json.token
  return adminToken
}
async function admin(path, opts = {}) {
  const token = await adminAuth()
  return http(`${MEDUSA_URL}/admin${path}`, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) } })
}

const thinkificHeaders = () => ({ Authorization: `Bearer ${THINKIFIC_KEY}` })
const thinkific = (path, opts = {}) => http(`${THINKIFIC_BASE}${path}`, { ...opts, headers: { ...thinkificHeaders(), ...(opts.headers ?? {}) } })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Catalogue ───────────────────────────────────────────────────────────────
async function zarRegionId() {
  const r = await store('/regions?limit=50')
  if (!r.ok) die(`regions failed (${r.status})`)
  const zar = (r.json.regions ?? []).find((x) => x.currency_code === 'zar')
  if (!zar) die('no ZAR region')
  return zar.id
}

async function loadMatrix(regionId) {
  const fields = 'id,title,handle,status,metadata,*variants,*variants.calculated_price,*categories,*collection'
  const rows = []
  let offset = 0
  for (;;) {
    const r = await store(`/products?limit=100&offset=${offset}&region_id=${regionId}&fields=${encodeURIComponent(fields)}`)
    if (!r.ok) die(`products failed (${r.status})`)
    const products = r.json.products ?? []
    for (const p of products) {
      const courseId = p.metadata?.thinkific_course_id ?? null
      const productType = p.metadata?.product_type ?? null
      const categories = (p.categories ?? []).map((c) => c.handle).join('|')
      for (const v of p.variants ?? []) {
        // Store amounts are in cents on this install (R1995,00 arrives as 199500).
        const cents = v.calculated_price?.calculated_amount ?? null
        const amount = cents === null ? null : cents / 100
        rows.push({
          product_id: p.id,
          product: p.title,
          handle: p.handle,
          variant_id: v.id,
          variant: v.title,
          sku: v.sku ?? '',
          price_zar: amount,
          priced: amount !== null,
          thinkific_course_id: courseId ? Number(courseId) : null,
          product_type: productType,
          categories,
          manage_inventory: Boolean(v.manage_inventory),
        })
      }
    }
    offset += products.length
    if (products.length < 100 || offset >= (r.json.count ?? 0)) break
  }
  return rows
}

function expectedEmails(row) {
  const list = ['order-confirmation']
  if (row.thinkific_course_id) list.push('thinkific-enrolment-confirmation', 'thinkific-welcome (Thinkific, first order only)')
  if (row.product_type === 'membership') list.push('membership-welcome')
  const cats = row.categories ?? ''
  if (cats.includes('private-sessions') || row.handle.includes('session') || row.handle.includes('coaching')) list.push('order-confirmation carries the Cal.com booking link')
  return list.join('; ')
}

// ── Voucher ─────────────────────────────────────────────────────────────────
async function ensurePromotion() {
  const found = await admin(`/promotions?code=${encodeURIComponent(PROMO_CODE)}&limit=1`)
  if (!found.ok) die(`promotions lookup failed (${found.status}) ${found.text.slice(0, 200)}`)
  const existing = (found.json.promotions ?? []).find((p) => p.code === PROMO_CODE)
  if (existing) {
    if (existing.status !== 'active') {
      const upd = await admin(`/promotions/${existing.id}`, { method: 'POST', body: { status: 'active' } })
      if (!upd.ok) die(`could not activate promotion (${upd.status})`)
      console.log(`voucher ${PROMO_CODE}: activated (${existing.id})`)
    } else {
      console.log(`voucher ${PROMO_CODE}: present (${existing.id})`)
    }
    return existing.id
  }
  const created = await admin('/promotions', {
    method: 'POST',
    body: {
      code: PROMO_CODE,
      type: 'standard',
      status: 'active',
      is_automatic: false,
      application_method: { type: 'percentage', target_type: 'order', allocation: 'across', value: 100 },
    },
  })
  if (!created.ok) die(`could not create promotion (${created.status}) ${created.text.slice(0, 300)}`)
  console.log(`voucher ${PROMO_CODE}: created (${created.json.promotion.id})`)
  return created.json.promotion.id
}

// ── One purchase ────────────────────────────────────────────────────────────
async function purchase(row, regionId, complete) {
  const out = { ...row, cart_id: null, order_id: null, order_display_id: null, total_after_voucher: null, discount_total: null, status: 'pending', problem: '' }
  const fail = (p) => { out.status = 'fail'; out.problem = p; return out }

  const c = await store('/carts', { method: 'POST', body: { region_id: regionId } })
  if (!c.ok) return fail(`create cart ${c.status}: ${c.text.slice(0, 160)}`)
  out.cart_id = c.json.cart.id

  const li = await store(`/carts/${out.cart_id}/line-items`, { method: 'POST', body: { variant_id: row.variant_id, quantity: 1 } })
  if (!li.ok) return fail(`add to cart ${li.status}: ${li.json?.message ?? li.text.slice(0, 160)}`)

  // Two carts setting the same new email at once race on guest-customer creation
  // ("Customer with email ... already exists"); the second attempt finds it.
  let em = await store(`/carts/${out.cart_id}`, { method: 'POST', body: { email: BUYER_EMAIL } })
  if (!em.ok && /already exists/i.test(em.json?.message ?? '')) {
    await sleep(750)
    em = await store(`/carts/${out.cart_id}`, { method: 'POST', body: { email: BUYER_EMAIL } })
  }
  if (!em.ok) return fail(`set email ${em.status}: ${em.json?.message ?? ''}`)

  const pr = await store(`/carts/${out.cart_id}/promotions`, { method: 'POST', body: { promo_codes: [PROMO_CODE] } })
  if (!pr.ok) return fail(`apply voucher ${pr.status}: ${pr.json?.message ?? pr.text.slice(0, 160)}`)
  const cart = pr.json.cart
  out.total_after_voucher = cart.total
  out.discount_total = cart.discount_total
  const applied = (cart.promotions ?? []).some((p) => p.code === PROMO_CODE)
  if (!applied) return fail('voucher not on cart after apply')
  if (Number(cart.total) !== 0) return fail(`total after voucher is ${cart.total}, expected 0`)

  if (!complete) { out.status = 'dry-run-pass'; return out }

  const done = await store(`/carts/${out.cart_id}/complete`, { method: 'POST' })
  if (!done.ok || done.json?.type !== 'order') return fail(`complete ${done.status}: ${done.json?.message ?? done.json?.error?.message ?? done.text.slice(0, 200)}`)
  out.order_id = done.json.order.id
  out.order_display_id = done.json.order.display_id
  out.status = 'ordered'
  return out
}

// ── Thinkific verification ──────────────────────────────────────────────────
async function thinkificEnrolments(email) {
  const r = await thinkific(`/enrollments?query[email]=${encodeURIComponent(email)}&limit=250`)
  if (!r.ok) throw new Error(`thinkific enrollments ${r.status}`)
  return r.json.items ?? []
}

async function verifyRow(out, startedAt) {
  if (!out.thinkific_course_id) { out.enrolment = 'no-course'; return out }
  if (!THINKIFIC_KEY) { out.enrolment = 'unchecked (no THINKIFIC_API_KEY)'; return out }
  const deadline = startedAt + VERIFY_TIMEOUT_MS
  for (;;) {
    let items = []
    try { items = await thinkificEnrolments(BUYER_EMAIL) } catch (e) { out.enrolment = `error: ${e.message}`; return out }
    const hit = items.find((i) => Number(i.course_id) === out.thinkific_course_id)
    if (hit) { out.enrolment = 'enrolled'; out.enrolment_id = hit.id; out.thinkific_user_id = hit.user_id; return out }
    if (Date.now() > deadline) { out.enrolment = 'missing'; out.status = out.status === 'ordered' ? 'fail' : out.status; out.problem = (out.problem ? out.problem + '; ' : '') + `no Thinkific enrolment for course ${out.thinkific_course_id} within ${VERIFY_TIMEOUT_MS / 1000}s`; return out }
    await sleep(5000)
  }
}

// ── Output ──────────────────────────────────────────────────────────────────
const resultsDir = join(repoRoot, 'docs', 'testing', 'results')
function stamp() { return new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16) }
function csvCell(v) { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
function writeRun(rows, mode) {
  mkdirSync(resultsDir, { recursive: true })
  const base = join(resultsDir, `purchase-${mode}-${stamp()}`)
  writeFileSync(`${base}.json`, JSON.stringify({ mode, medusa: MEDUSA_URL, promo: PROMO_CODE, buyer: BUYER_EMAIL, at: new Date().toISOString(), rows }, null, 2))
  const cols = ['page_or_product', 'test', 'problem', 'screenshot', 'link', 'status', 'found_on', 'fixed_in', 'variant', 'price_zar', 'order_display_id', 'order_id', 'thinkific_course_id', 'enrolment', 'expected_emails']
  const lines = [cols.join(',')]
  for (const r of rows) {
    const test = r.thinkific_course_id ? 'T1 voucher purchase + T2 Thinkific' : 'T1 voucher purchase'
    const status = r.status === 'ordered' ? (r.enrolment === 'missing' ? 'fail' : 'pass') : r.status === 'dry-run-pass' ? 'pass' : r.status
    lines.push([
      `${r.product} / ${r.variant}`, test, r.problem, '', r.order_display_id ? `${MEDUSA_URL.replace(/\/api$/, '')}/cms` : `${MEDUSA_URL.replace(/\/api$/, '')}/shop/${r.handle}`,
      status, new Date().toISOString().slice(0, 10), '', r.variant, r.price_zar, r.order_display_id, r.order_id, r.thinkific_course_id, r.enrolment ?? '', expectedEmails(r),
    ].map(csvCell).join(','))
  }
  writeFileSync(`${base}.csv`, lines.join('\n') + '\n')
  return base
}

async function pool(items, n, fn) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    for (;;) {
      const idx = i++
      if (idx >= items.length) return
      out[idx] = await fn(items[idx], idx)
    }
  }))
  return out
}

// ── Cleanup ─────────────────────────────────────────────────────────────────
function loadRun() {
  if (typeof args.from !== 'string') die('--from=<run.json> is required')
  return JSON.parse(readFileSync(args.from, 'utf8'))
}

async function cleanupPlan(run) {
  const orders = run.rows.filter((r) => r.order_id)
  const enrolments = run.rows.filter((r) => r.enrolment_id)
  const users = [...new Set(run.rows.map((r) => r.thinkific_user_id).filter(Boolean))]
  console.log(`Cleanup plan for run ${run.at} (buyer ${run.buyer})`)
  console.log(`  Medusa: cancel ${orders.length} orders (${orders.map((o) => '#' + o.order_display_id).join(', ')})`)
  console.log(`  Thinkific: delete ${enrolments.length} enrolments, then ${users.length} user(s): ${users.join(', ') || 'none recorded'}`)
  console.log(`  Vtiger (${env('VTIGER_URL', 'not set')}): contact ${run.buyer} and its ${orders.length} activities: listed only, Johan removes or approves per item`)
  console.log(`  Voucher ${run.promo}: delete after the final run`)
  console.log('Nothing has been changed. Run again with --cleanup --yes to execute the Medusa and Thinkific parts.')
}

async function cleanupRun(run) {
  if (!args.yes) die('--cleanup needs --yes (Johan has approved the list from --cleanup-plan)')
  const report = { cancelled: [], cancel_failed: [], unenrolled: [], unenrol_failed: [], users_deleted: [], users_failed: [] }
  for (const r of run.rows.filter((x) => x.order_id)) {
    const c = await admin(`/orders/${r.order_id}/cancel`, { method: 'POST', body: {} })
    ;(c.ok ? report.cancelled : report.cancel_failed).push(`#${r.order_display_id}${c.ok ? '' : ` (${c.status})`}`)
  }
  if (THINKIFIC_KEY) {
    for (const r of run.rows.filter((x) => x.enrolment_id)) {
      const d = await thinkific(`/enrollments/${r.enrolment_id}`, { method: 'DELETE' })
      ;(d.ok ? report.unenrolled : report.unenrol_failed).push(`${r.enrolment_id}${d.ok ? '' : ` (${d.status})`}`)
    }
    for (const u of [...new Set(run.rows.map((x) => x.thinkific_user_id).filter(Boolean))]) {
      const d = await thinkific(`/users/${u}`, { method: 'DELETE' })
      ;(d.ok ? report.users_deleted : report.users_failed).push(`${u}${d.ok ? '' : ` (${d.status})`}`)
    }
  }
  console.log(JSON.stringify(report, null, 2))
  console.log('Vtiger was not touched. The voucher was not deleted.')
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (MODE === 'cleanup-plan') return cleanupPlan(loadRun())
  if (MODE === 'cleanup') return cleanupRun(loadRun())

  const regionId = await zarRegionId()
  let matrix = await loadMatrix(regionId)
  const unpriced = matrix.filter((r) => !r.priced)
  matrix = matrix.filter((r) => r.priced)
  if (HANDLE) matrix = matrix.filter((r) => r.handle === HANDLE)
  if (Number.isFinite(LIMIT)) matrix = matrix.slice(0, LIMIT)

  console.log(`medusa ${MEDUSA_URL}; ${matrix.length} ZAR variants in scope, ${matrix.filter((r) => r.thinkific_course_id).length} with a Thinkific course; ${unpriced.length} unpriced skipped`)

  if (MODE === 'list') {
    for (const r of matrix) console.log(`${r.handle} | ${r.variant} | R${r.price_zar} | course ${r.thinkific_course_id ?? '-'} | ${r.categories}`)
    const base = writeRun(matrix.map((r) => ({ ...r, status: 'listed' })), 'list')
    console.log(`written ${base}.csv`)
    return
  }

  if (ENSURE_PROMO) await ensurePromotion()

  const complete = MODE === 'run'
  const started = Date.now()
  const rows = await pool(matrix, CONCURRENCY, async (row, i) => {
    const out = await purchase(row, regionId, complete)
    console.log(`${String(i + 1).padStart(3)}/${matrix.length} ${out.status.padEnd(12)} ${row.handle} / ${row.variant}${out.order_display_id ? ` -> order #${out.order_display_id}` : ''}${out.problem ? ` !! ${out.problem}` : ''}`)
    return out
  })

  if (complete && VERIFY) {
    console.log('verifying Thinkific enrolments...')
    await pool(rows, 4, async (out) => {
      await verifyRow(out, started)
      if (out.thinkific_course_id) console.log(`  ${out.handle}: ${out.enrolment}`)
    })
  }

  const base = writeRun(rows, MODE)
  const summary = rows.reduce((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a }, {})
  console.log(`done in ${Math.round((Date.now() - started) / 1000)}s: ${JSON.stringify(summary)}; written ${base}.csv and .json`)
  if (rows.some((r) => r.status === 'fail')) process.exitCode = 1
}

main().catch((e) => die(e.stack ?? String(e)))
