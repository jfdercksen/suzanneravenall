/**
 * sage-sandbox-run.ts: runs the Sage link against Sage's PRACTICE (trial)
 * company, from this PC, with sandbox basic auth (Sage plan step d). It never
 * touches the shop, its database or a real order: orders are synthetic and use
 * SR- references from 90001 up, far above the shop's own numbers.
 *
 * Credentials: Johan puts them himself in apps/medusa/.env.sage.local
 * (gitignored by the .env.*.local rule): SAGE_EMAIL, SAGE_PASSWORD,
 * SAGE_API_KEY, SAGE_COMPANY_ID, optionally SAGE_API_URL. They are read at run
 * time and never printed; the Authorization header and the apikey are never
 * logged or written to a fixture.
 *
 *   Step 1, discover (read only, the default):
 *     npx tsx src/scripts/sage-sandbox-run.ts
 *   Lists tax types, income accounts and items (id, name, code only), checks
 *   whether $filter works on Customer Email and TaxInvoice Reference, reads the
 *   line types of an existing invoice if there is one, and saves the answers,
 *   with emails masked, to src/modules/sage/__fixtures__/recorded/ so the test
 *   mocks can be replaced by real shapes.
 *
 *   Step 2, the reviewer test set (writes to the PRACTICE company only):
 *     SAGE_TAX_TYPE_ID=<no-VAT id> SAGE_INCOME_ACCOUNT_ID=<id> WRITE=yes npx tsx src/scripts/sage-sandbox-run.ts
 *   Refuses unless SAGE_PRACTICE_COMPANY=yes is also set, so it cannot run by
 *   mistake against a live company. Scenarios: new customer + one item; same
 *   customer again (no customer search); company customer with several items
 *   and a voucher; the first order again (must skip: already in Sage); a USD
 *   order (held, no call); tax type unset (refused, no call).
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { BasicAuth } from "../modules/sage/auth"
import { SageClient } from "../modules/sage/client"
import { sageConfigFromEnv, type SageConfig } from "../modules/sage/config"
import { SageHold } from "../modules/sage/errors"
import { buildSageInvoice, invoiceTotalCents, type SageOrderSnapshot } from "../modules/sage/invoice"
import { ItemResolver, resolveCustomerId } from "../modules/sage/resolvers"

const ENV_FILE = join(__dirname, "..", "..", ".env.sage.local")
const FIXTURES = join(__dirname, "..", "modules", "sage", "__fixtures__", "recorded")
const log = (line: string) => console.log(`[sage-sandbox] ${line}`)

/** KEY=value lines; values never echoed. Existing process env wins. */
export function loadEnvFile(path: string, env: Record<string, string | undefined> = process.env): string[] {
  if (!existsSync(path)) return []
  const names: string[] = []
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(raw)
    if (!m || raw.trim().startsWith("#")) continue
    const value = m[2].replace(/^(['"])(.*)\1$/, "$2")
    if (env[m[1]] === undefined) env[m[1]] = value
    names.push(m[1])
  }
  return names
}

/** Masks every email address and drops fields that could carry secrets. */
export function redact(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+)/g, "$1***@$2")
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (/password|apikey|api_key|token|secret|authorization/i.test(k)) continue
      out[k] = redact(v)
    }
    return out
  }
  return value
}

function save(name: string, body: unknown): void {
  mkdirSync(FIXTURES, { recursive: true })
  writeFileSync(join(FIXTURES, `${name}.json`), JSON.stringify(redact(body), null, 2) + "\n")
}

/** Read-only GET for discovery; the URL (with the apikey) is never printed. */
async function rawGet(config: SageConfig, auth: BasicAuth, path: string, params: Record<string, string> = {}): Promise<{ status: number; body: unknown }> {
  const q = new URLSearchParams({ apikey: config.apiKey, companyid: config.companyId, ...params })
  const res = await fetch(`${config.baseUrl}${path}?${q.toString()}`, { headers: await auth.headers(), signal: AbortSignal.timeout(20_000) })
  const text = await res.text()
  let body: unknown = text
  try {
    body = JSON.parse(text)
  } catch {
    /* keep text */
  }
  return { status: res.status, body }
}

type Paged = { TotalResults?: number; Results?: Array<Record<string, unknown>> }
const results = (b: unknown): Array<Record<string, unknown>> => ((b as Paged)?.Results ?? []) as Array<Record<string, unknown>>

async function discover(config: SageConfig, auth: BasicAuth): Promise<void> {
  log("DISCOVER (read only)")
  for (const [name, path, params] of [
    ["tax-types", "/TaxType/Get", {}],
    ["accounts", "/Account/Get", { $top: "200" }],
    ["items", "/Item/Get", { $top: "200" }],
    ["customers-page", "/Customer/Get", { $top: "5" }],
    ["tax-invoices-page", "/TaxInvoice/Get", { $top: "3", $orderby: "ID desc" }],
    // Dollar orders: is multi-currency on in this company, and which currencies exist?
    ["currencies", "/Currency/Get", {}],
  ] as const) {
    const r = await rawGet(config, auth, path, params)
    save(name, r)
    log(`${path}: HTTP ${r.status}, ${results(r.body).length} row(s)`)
    if (name === "tax-types") for (const t of results(r.body)) log(`  tax type ${t.ID}: ${t.Name} (${t.Percentage}%)${t.IsDefault ? " default" : ""}`)
    if (name === "accounts") for (const a of results(r.body).filter((a) => /income|sales|revenue/i.test(String(a.Name ?? "")) || a.AccountCategory === 1)) log(`  account ${a.ID}: ${a.Name}`)
    if (name === "currencies") log(`  currencies: ${r.status >= 400 ? `not available (HTTP ${r.status}): multi-currency may be off` : results(r.body).map((c) => `${c.ID} ${c.Code ?? c.Description ?? ""}`).join(", ") || "none"}`)
    if (name === "items") log(`  item codes: ${results(r.body).map((i) => i.Code).slice(0, 40).join(", ") || "none"}`)
    if (name === "tax-invoices-page") for (const inv of results(r.body)) log(`  invoice ${inv.ID} ref ${inv.Reference ?? ""}: line types ${((inv.Lines as Array<Record<string, unknown>>) ?? []).map((l) => l.LineType).join(",") || "(lines not in list answer)"}`)
  }

  // $filter support: a filter that matches nothing must return 0 rows; Sage
  // ignoring the filter shows up as the same rows as the unfiltered page.
  for (const [name, path, filter] of [
    ["filter-customer-email", "/Customer/Get", "Email eq 'no-such-address@example.invalid'"],
    ["filter-invoice-reference", "/TaxInvoice/Get", "Reference eq 'SR-00000'"],
    ["filter-item-code", "/Item/Get", "Code eq 'NO-SUCH-CODE'"],
  ] as const) {
    const r = await rawGet(config, auth, path, { $filter: filter, $top: "5" })
    save(name, r)
    const n = results(r.body).length
    log(`$filter on ${path}: HTTP ${r.status}, ${n} row(s): ${r.status >= 400 ? "REJECTED (paging fallback will be used)" : n === 0 ? "SUPPORTED" : "IGNORED (paging fallback will be used)"}`)
  }
  log(`answers saved (emails masked) to ${FIXTURES}`)
}

function order(n: number, over: Partial<SageOrderSnapshot> = {}): SageOrderSnapshot {
  return {
    id: `sandbox_order_${n}`,
    displayId: 90000 + n,
    currencyCode: "ZAR",
    total: 2490,
    createdAt: new Date().toISOString(),
    email: "sandbox.client@aiautomations.co.za",
    customerName: "Sandbox Client",
    items: [{ title: "Rapid Repatterning Session", productTitle: "Rapid Repatterning Session", variantTitle: "90 min online", quantity: 1, unitPrice: 2490, sageItemCode: null }],
    ...over,
  }
}

async function writeSet(config: SageConfig, client: SageClient): Promise<void> {
  if (process.env.SAGE_PRACTICE_COMPANY !== "yes") {
    log("REFUSED: set SAGE_PRACTICE_COMPANY=yes to confirm the company is Sage's practice company")
    process.exitCode = 1
    return
  }
  log("WRITE: reviewer test set against the practice company")
  const mapMem = new Map<string, number>()
  const map = { get: async (k: string) => mapMem.get(k) ?? null, put: async (k: string, v: number) => void mapMem.set(k, v) }
  const itemMem = new Map<string, number>()
  const items = new ItemResolver(client, { get: async (k: string) => itemMem.get(k) ?? null, put: async (k: string, v: number) => void itemMem.set(k, v) })
  const codes = (process.env.SAGE_TEST_ITEM_CODES ?? "").split(",").map((s) => s.trim()).filter(Boolean)

  const post = async (label: string, o: SageOrderSnapshot, cfg: SageConfig = config) => {
    try {
      if (o.currencyCode !== "ZAR") throw new SageHold(`${o.currencyCode} order held until the currency rule is agreed`)
      const reference = `SR-${String(o.displayId).padStart(5, "0")}`
      const existing = await client.findTaxInvoiceByReference(reference)
      if (existing) {
        log(`${label}: already-in-sage (${reference} is invoice ${existing.ID}); nothing posted`)
        return
      }
      const customerId = await resolveCustomerId({ client, map, config: cfg, email: o.email, name: o.customerName })
      const itemIds = await items.resolve(o.items.map((i) => i.sageItemCode).filter((c): c is string => !!c))
      const { body, warnings } = buildSageInvoice({ order: o, customerId, taxTypeId: cfg.taxTypeId, incomeAccountId: cfg.incomeAccountId, itemIds })
      const saved = await client.saveTaxInvoice(body)
      save(`posted-${label}`, { request: body, response: saved })
      log(`${label}: POSTED invoice ${saved.ID} ${saved.DocumentNumber ?? ""} ref ${reference}, total R${(invoiceTotalCents(body) / 100).toFixed(2)}${warnings.length ? `, warnings: ${warnings.join("; ")}` : ""}`)
    } catch (err) {
      const held = err instanceof SageHold
      log(`${label}: ${held ? "HELD" : "FAILED"}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const code = (i: number) => codes[i] ?? null
  await post("1-new-customer-one-item", order(1, { items: [{ ...order(1).items[0], sageItemCode: code(0) }] }))
  await post("2-same-customer-again", order(2, { items: [{ ...order(2).items[0], sageItemCode: code(0) }] }))
  await post(
    "3-company-several-items-voucher",
    order(3, {
      email: "sandbox.company@aiautomations.co.za",
      customerName: "Sandbox Company (Pty) Ltd",
      total: 2490 + 2 * 1660 - 500,
      items: [
        { ...order(3).items[0], sageItemCode: code(0) },
        { title: "Akashic Coaching Session", productTitle: "Akashic Coaching / Clearing Session", variantTitle: "60 min", quantity: 2, unitPrice: 1660, sageItemCode: code(1) },
      ],
    }),
  )
  await post("4-first-order-again", order(1))
  await post("5-usd-order", order(5, { currencyCode: "USD", total: 230 }))
  await post("6-tax-type-unset", order(6), { ...config, taxTypeId: null })
  log(`customer searches/creates: ${mapMem.size} distinct customer(s) for 4 posting scenarios`)
}

async function main(): Promise<void> {
  const names = loadEnvFile(ENV_FILE)
  log(names.length ? `read ${names.length} setting name(s) from .env.sage.local: ${names.join(", ")}` : "no .env.sage.local found: Johan places the practice-company login there")
  const config = sageConfigFromEnv()
  const missing = (["SAGE_EMAIL", "SAGE_PASSWORD", "SAGE_API_KEY", "SAGE_COMPANY_ID"] as const).filter((k) => !process.env[k])
  if (missing.length) {
    log(`missing: ${missing.join(", ")}`)
    process.exitCode = 1
    return
  }
  const auth = new BasicAuth({ email: config.email, password: config.password })
  if (process.env.WRITE === "yes") await writeSet(config, new SageClient(config, auth))
  else await discover(config, auth)
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[sage-sandbox] stopped: ${err instanceof Error ? err.message : String(err)}`)
    process.exitCode = 1
  })
}
