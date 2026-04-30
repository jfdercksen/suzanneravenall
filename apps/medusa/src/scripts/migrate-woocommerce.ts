/**
 * WooCommerce → Medusa v2 Product Migration
 *
 * Reads from the cached audit JSON — does NOT call the WooCommerce API.
 * Applies approved exclusion rules, maps categories to Medusa collections,
 * builds product payloads, and either dry-runs or creates products via the
 * Medusa Admin API.
 *
 * Run (dry run — always start here):
 *   DRY_RUN=true MEDUSA_ADMIN_PASSWORD=xxx ts-node src/scripts/migrate-woocommerce.ts
 *
 * Run (live — only with explicit developer approval):
 *   DRY_RUN=false MEDUSA_ADMIN_PASSWORD=xxx ts-node src/scripts/migrate-woocommerce.ts
 */

import * as fs from "fs"
import * as path from "path"

// ── Config ────────────────────────────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN !== "false"
const MEDUSA_BASE = process.env.MEDUSA_URL ?? "http://169.239.180.49/api"
const ADMIN_EMAIL = "admin@suzanneravenall.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD ?? ""

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../../infra/scripts/migrations")
const AUDIT_FILE = path.join(MIGRATIONS_DIR, "wc-product-audit.json")
const SOURCE_DIR = path.join(MIGRATIONS_DIR, "source")

// ── Exclusion rules ───────────────────────────────────────────────────────────

const EXCLUDED_CATEGORY_ID = 73
const EXCLUDED_CATEGORY_132_CORRECTION = 132 // maps to start-here, NOT master-level

/** Word-boundary patterns — avoids false positives like "latest", "testing" */
const TEST_NAME_PATTERNS: RegExp[] = [
  /\btest\b/i,
  /sr-product-test/i,
  /group\s+test/i,
]

// ── Category → collection mapping ─────────────────────────────────────────────

/**
 * Category IDs that map to each Medusa collection handle.
 * Derived from the approved migration rules.
 */
const CATEGORY_TO_COLLECTION: Record<number, string> = {
  // start-here
  50: "start-here",   // Private sessions
  119: "start-here",  // Self Paced - self-study
  125: "start-here",  // Self Paced
  178: "start-here",  // Meditation
  85: "start-here",   // Meditations
  128: "start-here",  // Energetic Clearing
  82: "start-here",   // Intuition
  81: "start-here",   // Love and Relationships
  83: "start-here",   // Life Purpose
  84: "start-here",   // Mindfulness
  177: "start-here",  // Product Add-ons: Growth Boosters
  134: "start-here",  // Transformation Coaching
  113: "start-here",  // Healing Tools
  106: "start-here",  // preorder
  52: "start-here",   // Books
  174: "start-here",  // Presentations
  132: "start-here",  // Rapid Repatterning — correction: start-here, NOT master-level

  // deep-dive
  51: "deep-dive",    // Guided Programmes
  133: "deep-dive",   // Resonance Repatterning programme
  63: "deep-dive",    // Life Enhancing Programmes
  46: "deep-dive",    // Group Sessions
  118: "deep-dive",   // Live programmes (under private-sessions parent)
  116: "deep-dive",   // Resonance Repatterning
  137: "deep-dive",   // Akashic Coaching
  114: "deep-dive",   // Akashic Intuitive Coach
  115: "deep-dive",   // Energy Clearing
  131: "deep-dive",   // Family Coaching
  86: "deep-dive",    // Trauma programme
  92: "deep-dive",    // Love And Relationships Group
  93: "deep-dive",    // Career Progression Group
  130: "deep-dive",   // Exploring the Alpha Mind
  88: "deep-dive",    // Resonance Repatterning - Being Human
  173: "deep-dive",   // Brainwave Club (with product count)
  120: "deep-dive",   // Live (Akashic Intuitive Coach sub)
  121: "deep-dive",   // Self Paced (Akashic Intuitive Coach sub)
  122: "deep-dive",   // Live (Resonance Repatterning sub)
  123: "deep-dive",   // Self Paced (Resonance Repatterning sub)
  124: "deep-dive",   // Live (Life Enhancing sub)
  126: "deep-dive",   // Live (Resonance Repatterning private sub)
  127: "deep-dive",   // Self Paced (Resonance Repatterning private sub)
  69: "deep-dive",    // Resonance Repatterning Session

  // master-level
  129: "master-level", // Executive Coaching (ID 129)
  135: "master-level", // Rapid Transformation Therapy
  91: "master-level",  // Money Mastery

  // practitioner
  60: "practitioner",  // Practitioner Programmes
}

const DEFAULT_COLLECTION = "start-here"

// ── Types ─────────────────────────────────────────────────────────────────────

interface WcCategory {
  id: number
  name: string
  slug: string
}

interface WcAttribute {
  name: string
  options?: string[]
  option?: string  // on variations, single value
}

interface WcImage {
  id: number
  src: string
  alt: string
}

interface WcVariation {
  id: number
  sku?: string
  price: string
  regular_price: string
  sale_price: string
  status: string
  attributes: WcAttribute[]
  stock_status?: string
}

interface WcProduct {
  id: number
  name: string
  slug: string
  type: "simple" | "variable" | "external" | "grouped"
  status: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  description_length: number
  short_description_length: number
  categories: WcCategory[]
  tags: string[]
  attributes: WcAttribute[]
  images: WcImage[]
  variations: WcVariation[]
  proposed_collection: string
  proposed_program_type: string
  program_type_confidence: string
  flags: string[]
}

interface WcAuditJson {
  fetched_at: string
  summary: Record<string, unknown>
  categories: unknown[]
  products: WcProduct[]
  all_slugs: string[]
  all_tags: string[]
  collection_mapping: unknown
}

interface MedusaCollection {
  id: string
  title: string
  handle: string
}

interface MedusaProductPrice {
  amount: number
  currency_code: string
}

interface MedusaVariantOption {
  [optionTitle: string]: string
}

interface MedusaVariantInput {
  title: string
  prices: MedusaProductPrice[]
  options?: MedusaVariantOption
}

interface MedusaOptionInput {
  title: string
  values: string[]
}

interface MedusaProductPayload {
  title: string
  handle: string
  description: string
  status: "published" | "draft"
  collection_id: string | null
  options: MedusaOptionInput[]
  variants: MedusaVariantInput[]
}

interface SkippedProduct {
  wc_id: number
  name: string
  reason: string
}

interface ExternalProduct {
  id: number
  name: string
  slug: string
  external_url: string
  price: string
}

interface MigrateProductEntry {
  wc_id: number
  name: string
  slug: string
  type: string
  proposed_collection: string
  collection_id: string | null
  variant_count: number
  placeholder_variant: boolean
  no_description: boolean
  payload: MedusaProductPayload
}

interface DryRunSummary {
  total_in_audit: number
  will_migrate: number
  will_skip: number
  skip_reasons: {
    not_published: number
    excluded_category_73: number
    empty_slug: number
    type_external: number
    type_grouped: number
    test_product: number
  }
  by_collection: Record<string, number>
  variable_products: number
  placeholder_variants: number
  no_description: number
  already_exists_in_medusa: number
  medusa_reachable: boolean
  medusa_auth_ok: boolean
}

interface DryRunReport {
  dry_run: true
  generated_at: string
  summary: DryRunSummary
  will_migrate: MigrateProductEntry[]
  will_skip: SkippedProduct[]
  placeholder_variant_products: MigrateProductEntry[]
}

interface LiveRunResult {
  migrated: Array<{ wc_id: number; wc_slug: string; medusa_id: string; medusa_handle: string }>
  skipped: SkippedProduct[]
  errors: Array<{ wc_id: number; name: string; error: string }>
}

interface AuthResponse {
  token: string
}

interface MedusaProductResponse {
  product: {
    id: string
    handle: string
    title: string
  }
}

interface MedusaProductListResponse {
  products: Array<{ id: string; handle: string; title: string }>
}

interface MedusaCollectionListResponse {
  collections: MedusaCollection[]
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function medusaRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${MEDUSA_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${options.method ?? "GET"} ${path} → ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authenticate(): Promise<string> {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "MEDUSA_ADMIN_PASSWORD is not set. " +
        "Export it before running: MEDUSA_ADMIN_PASSWORD=xxx ts-node src/scripts/migrate-woocommerce.ts"
    )
  }

  const data = await medusaRequest<AuthResponse>("/auth/user/emailpass", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  return data.token
}

// ── Collection fetch ──────────────────────────────────────────────────────────

async function fetchMedusaCollections(token: string): Promise<Record<string, string>> {
  const data = await medusaRequest<MedusaCollectionListResponse>(
    "/admin/collections?limit=100",
    {},
    token
  )

  const handleToId: Record<string, string> = {}
  for (const col of data.collections) {
    handleToId[col.handle] = col.id
  }
  return handleToId
}

// ── Existing product check ────────────────────────────────────────────────────

async function productExistsByHandle(handle: string, token: string): Promise<boolean> {
  const encoded = encodeURIComponent(handle)
  const data = await medusaRequest<MedusaProductListResponse>(
    `/admin/products?handle=${encoded}&limit=1`,
    {},
    token
  )
  return data.products.length > 0
}

// ── Source data helpers ───────────────────────────────────────────────────────

function loadExternalUrlMap(): Record<number, string> {
  const urlMap: Record<number, string> = {}
  const sourceFiles = ["products_page1.json", "products_page2.json", "products_page3.json"]

  for (const filename of sourceFiles) {
    const filePath = path.join(SOURCE_DIR, filename)
    if (!fs.existsSync(filePath)) continue

    try {
      const raw = fs.readFileSync(filePath, "utf8")
      const products = JSON.parse(raw) as Array<{
        id: number
        type: string
        external_url?: string
      }>
      for (const p of products) {
        if (p.type === "external" && p.external_url !== undefined) {
          urlMap[p.id] = p.external_url
        }
      }
    } catch {
      console.warn(`  Warning: could not parse ${filename}`)
    }
  }

  return urlMap
}

// ── Exclusion logic ───────────────────────────────────────────────────────────

type SkipReason =
  | "not_published"
  | "excluded_category_73"
  | "empty_slug"
  | "type_external"
  | "type_grouped"
  | "test_product"

function getSkipReason(product: WcProduct): SkipReason | null {
  if (product.status !== "publish") return "not_published"
  if (product.categories.some((c) => c.id === EXCLUDED_CATEGORY_ID)) return "excluded_category_73"
  if (!product.slug || product.slug === "") return "empty_slug"
  if (product.type === "external") return "type_external"
  if (product.type === "grouped") return "type_grouped"
  if (TEST_NAME_PATTERNS.some((re) => re.test(product.name))) return "test_product"
  return null
}

// ── Collection mapping ────────────────────────────────────────────────────────

function resolveCollection(
  product: WcProduct,
  collectionHandleToId: Record<string, string>
): { handle: string; id: string | null; is_default: boolean; is_unmapped: boolean } {
  // Try each category — first match that maps to something other than default wins.
  // Exception: category 132 is explicitly corrected to start-here (not master-level).
  let resolvedHandle = DEFAULT_COLLECTION
  let foundNonDefault = false
  let isUnmapped = true

  for (const cat of product.categories) {
    const handle = CATEGORY_TO_COLLECTION[cat.id]
    if (handle !== undefined) {
      isUnmapped = false
      if (!foundNonDefault && handle !== DEFAULT_COLLECTION) {
        resolvedHandle = handle
        foundNonDefault = true
      } else if (resolvedHandle === DEFAULT_COLLECTION) {
        resolvedHandle = handle
      }
    }
  }

  // If no category matched at all, isUnmapped stays true — use default
  const id = collectionHandleToId[resolvedHandle] ?? null

  return {
    handle: resolvedHandle,
    id,
    is_default: !foundNonDefault,
    is_unmapped: isUnmapped,
  }
}

// ── Variant building ──────────────────────────────────────────────────────────

function priceInCents(priceStr: string): number {
  const parsed = parseFloat(priceStr)
  if (isNaN(parsed) || parsed < 0) return 0
  return Math.round(parsed * 100)
}

function buildVariants(product: WcProduct): {
  options: MedusaOptionInput[]
  variants: MedusaVariantInput[]
  placeholder_variant: boolean
} {
  if (product.type === "simple") {
    return {
      options: [],
      variants: [
        {
          title: "Default",
          prices: [
            {
              amount: priceInCents(product.price),
              currency_code: "zar",
            },
          ],
        },
      ],
      placeholder_variant: false,
    }
  }

  // Variable product
  if (product.variations && product.variations.length > 0) {
    const optionNames = new Set<string>()
    const optionValues: Record<string, Set<string>> = {}

    // Collect all attribute names and values across variations
    for (const variation of product.variations) {
      for (const attr of variation.attributes) {
        if (!attr.option) continue
        const name = attr.name
        optionNames.add(name)
        if (!optionValues[name]) optionValues[name] = new Set()
        optionValues[name].add(attr.option)
      }
    }

    const options: MedusaOptionInput[] = Array.from(optionNames).map((name) => ({
      title: name,
      values: Array.from(optionValues[name] ?? []),
    }))

    const variants: MedusaVariantInput[] = product.variations.map((variation) => {
      const title = variation.attributes
        .filter((a) => a.option !== undefined && a.option !== "")
        .map((a) => a.option as string)
        .join(" · ")

      const variantOptions: MedusaVariantOption = {}
      for (const attr of variation.attributes) {
        if (attr.option !== undefined) {
          variantOptions[attr.name] = attr.option
        }
      }

      return {
        title: title !== "" ? title : "Variant",
        prices: [
          {
            amount: priceInCents(variation.price),
            currency_code: "zar",
          },
        ],
        options: Object.keys(variantOptions).length > 0 ? variantOptions : undefined,
      }
    })

    return { options, variants, placeholder_variant: false }
  }

  // Variable product with no variation data fetched — placeholder
  return {
    options: [],
    variants: [
      {
        title: "Standard",
        prices: [
          {
            amount: priceInCents(product.price),
            currency_code: "zar",
          },
        ],
      },
    ],
    placeholder_variant: true,
  }
}

// ── Product payload builder ───────────────────────────────────────────────────

function buildProductPayload(
  product: WcProduct,
  collectionId: string | null
): MedusaProductPayload {
  const { options, variants } = buildVariants(product)

  return {
    title: product.name,
    handle: product.slug,
    description: "",  // filled from source files in enriched mode; audit has lengths only
    status: "published",
    collection_id: collectionId,
    options,
    variants,
  }
}

// ── Log helpers ───────────────────────────────────────────────────────────────

function log(message: string): void {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${message}`
  console.log(line)
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8")
}

// ── Main migration ────────────────────────────────────────────────────────────

async function migrate(): Promise<void> {
  const startedAt = new Date().toISOString()

  log(`WooCommerce → Medusa migration starting`)
  log(`Mode: ${DRY_RUN ? "DRY RUN (no writes to Medusa)" : "LIVE — writes will happen"}`)
  log(`Medusa base URL: ${MEDUSA_BASE}`)
  log(`Audit file: ${AUDIT_FILE}`)

  // ── Step 1: Load audit JSON ─────────────────────────────────────────────────

  if (!fs.existsSync(AUDIT_FILE)) {
    throw new Error(`Audit file not found: ${AUDIT_FILE}`)
  }

  const auditRaw = fs.readFileSync(AUDIT_FILE, "utf8")
  const audit = JSON.parse(auditRaw) as WcAuditJson
  const products = audit.products

  log(`Loaded ${products.length} products from audit (fetched ${audit.fetched_at})`)

  // ── Step 2: Load external URL map from source files ─────────────────────────

  const externalUrlMap = loadExternalUrlMap()
  log(`Loaded external URL map: ${Object.keys(externalUrlMap).length} external products`)

  // ── Step 3: Connect to Medusa (graceful degradation if unreachable) ─────────

  let token: string | null = null
  let collectionHandleToId: Record<string, string> = {}
  let medusaReachable = false
  let medusaAuthOk = false

  try {
    log("Authenticating to Medusa Admin API...")
    token = await authenticate()
    medusaAuthOk = true
    log("Authenticated successfully")

    log("Fetching Medusa collections...")
    collectionHandleToId = await fetchMedusaCollections(token)
    medusaReachable = true
    log(`Found ${Object.keys(collectionHandleToId).length} collections: ${Object.keys(collectionHandleToId).join(", ")}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!medusaAuthOk) {
      log(`Warning: Medusa auth failed (${message}) — existing-product check will be skipped`)
    } else {
      log(`Warning: Medusa unreachable (${message}) — collection IDs will be null in report`)
    }
    log("Continuing with collection-handle-only mode (medusa_reachable: false)")
  }

  // ── Step 4: Apply exclusion rules and build payloads ────────────────────────

  const willMigrate: MigrateProductEntry[] = []
  const willSkip: SkippedProduct[] = []
  const externalProducts: ExternalProduct[] = []

  const skipCounts: DryRunSummary["skip_reasons"] = {
    not_published: 0,
    excluded_category_73: 0,
    empty_slug: 0,
    type_external: 0,
    type_grouped: 0,
    test_product: 0,
  }

  const byCollection: Record<string, number> = {
    "start-here": 0,
    "deep-dive": 0,
    "master-level": 0,
    practitioner: 0,
  }

  let variableProductCount = 0
  let placeholderVariantCount = 0
  let noDescriptionCount = 0
  let alreadyExistsCount = 0

  for (const product of products) {
    // Collect external product data regardless of other exclusions
    if (product.type === "external") {
      externalProducts.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        external_url: externalUrlMap[product.id] ?? "",
        price: product.price,
      })
    }

    const skipReason = getSkipReason(product)

    if (skipReason !== null) {
      skipCounts[skipReason]++
      willSkip.push({ wc_id: product.id, name: product.name, reason: skipReason })
      continue
    }

    // Resolve collection
    const collectionResult = resolveCollection(product, collectionHandleToId)

    if (collectionResult.is_unmapped) {
      willSkip.push({
        wc_id: product.id,
        name: product.name,
        reason: "unmapped_category — defaulted to start-here (flagged for review)",
      })
      // Still migrate it — just flag it
    }

    // Check if already exists in Medusa
    let alreadyExists = false
    if (token !== null && medusaReachable) {
      try {
        alreadyExists = await productExistsByHandle(product.slug, token)
      } catch {
        log(`  Warning: could not check existence for "${product.slug}" — assuming new`)
      }
    }

    if (alreadyExists) {
      alreadyExistsCount++
      willSkip.push({ wc_id: product.id, name: product.name, reason: "already_exists" })
      continue
    }

    // Build payload
    const payload = buildProductPayload(product, collectionResult.id)
    const variantResult = buildVariants(product)
    const placeholderVariant = variantResult.placeholder_variant
    const hasNoDescription = product.description_length === 0 && product.short_description_length === 0
    const isVariable = product.type === "variable"

    if (isVariable) variableProductCount++
    if (placeholderVariant) placeholderVariantCount++
    if (hasNoDescription) noDescriptionCount++

    byCollection[collectionResult.handle] = (byCollection[collectionResult.handle] ?? 0) + 1

    const entry: MigrateProductEntry = {
      wc_id: product.id,
      name: product.name,
      slug: product.slug,
      type: product.type,
      proposed_collection: collectionResult.handle,
      collection_id: collectionResult.id,
      variant_count: variantResult.variants.length,
      placeholder_variant: placeholderVariant,
      no_description: hasNoDescription,
      payload,
    }

    willMigrate.push(entry)
  }

  // ── Step 5: Write skipped-external-products.json (always) ──────────────────

  const externalOutput = {
    skipped_at: startedAt,
    count: externalProducts.length,
    note: "External/affiliate products excluded from Medusa migration. Will become static /resources/books page.",
    products: externalProducts,
  }

  const externalOutputPath = path.join(MIGRATIONS_DIR, "skipped-external-products.json")
  writeJson(externalOutputPath, externalOutput)
  log(`Written: ${externalOutputPath}`)

  // ── Step 6: Dry run report ──────────────────────────────────────────────────

  if (DRY_RUN) {
    const summary: DryRunSummary = {
      total_in_audit: products.length,
      will_migrate: willMigrate.length,
      will_skip: willSkip.length,
      skip_reasons: skipCounts,
      by_collection: byCollection,
      variable_products: variableProductCount,
      placeholder_variants: placeholderVariantCount,
      no_description: noDescriptionCount,
      already_exists_in_medusa: alreadyExistsCount,
      medusa_reachable: medusaReachable,
      medusa_auth_ok: medusaAuthOk,
    }

    const report: DryRunReport = {
      dry_run: true,
      generated_at: startedAt,
      summary,
      will_migrate: willMigrate,
      will_skip: willSkip,
      placeholder_variant_products: willMigrate.filter((e) => e.placeholder_variant),
    }

    const reportPath = path.join(MIGRATIONS_DIR, "wc-migration-dry-run-final.json")
    writeJson(reportPath, report)
    log(`Written: ${reportPath}`)

    log("")
    log("=== DRY RUN SUMMARY ===")
    log(`Total products in audit:       ${summary.total_in_audit}`)
    log(`Will migrate:                  ${summary.will_migrate}`)
    log(`Will skip:                     ${summary.will_skip}`)
    log(`  - Not published:             ${summary.skip_reasons.not_published}`)
    log(`  - Excluded category 73:      ${summary.skip_reasons.excluded_category_73}`)
    log(`  - Empty slug:                ${summary.skip_reasons.empty_slug}`)
    log(`  - Type external:             ${summary.skip_reasons.type_external}`)
    log(`  - Type grouped:              ${summary.skip_reasons.type_grouped}`)
    log(`  - Test product:              ${summary.skip_reasons.test_product}`)
    log(``)
    log(`By collection (will migrate):`)
    for (const [handle, count] of Object.entries(summary.by_collection)) {
      log(`  ${handle.padEnd(18)} ${count}`)
    }
    log(``)
    log(`Variable products:             ${summary.variable_products}`)
    log(`Placeholder variants needed:   ${summary.placeholder_variants}`)
    log(`Products with no description:  ${summary.no_description}`)
    log(`Already exists in Medusa:      ${summary.already_exists_in_medusa}`)
    log(`Medusa reachable:              ${summary.medusa_reachable}`)
    log(`Medusa auth OK:                ${summary.medusa_auth_ok}`)
    log("")
    log("DRY RUN complete — no products written to Medusa.")
    log("Review the report, then run with DRY_RUN=false to migrate.")
    return
  }

  // ── Step 7: Live migration ──────────────────────────────────────────────────

  if (!token) {
    throw new Error(
      "Medusa authentication failed — cannot run live migration. " +
        "Check MEDUSA_ADMIN_PASSWORD and Medusa API availability."
    )
  }

  log(`Starting live migration of ${willMigrate.length} products...`)

  const results: LiveRunResult = {
    migrated: [],
    skipped: willSkip,
    errors: [],
  }

  const BATCH_SIZE = 50
  let processedCount = 0

  for (let i = 0; i < willMigrate.length; i += BATCH_SIZE) {
    const batch = willMigrate.slice(i, i + BATCH_SIZE)
    log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: items ${i + 1}–${i + batch.length}`)

    for (const entry of batch) {
      try {
        // Final duplicate check before writing
        const exists = await productExistsByHandle(entry.slug, token)
        if (exists) {
          log(`  Skipping "${entry.name}" — already exists in Medusa`)
          results.skipped.push({ wc_id: entry.wc_id, name: entry.name, reason: "already_exists" })
          continue
        }

        const apiPayload: Record<string, unknown> = {
          title: entry.payload.title,
          handle: entry.payload.handle,
          description: entry.payload.description,
          status: entry.payload.status,
          collection_id: entry.payload.collection_id,
        }

        if (entry.payload.options.length > 0) {
          apiPayload.options = entry.payload.options
        }

        if (entry.payload.variants.length > 0) {
          apiPayload.variants = entry.payload.variants
        }

        const response = await medusaRequest<MedusaProductResponse>(
          "/admin/products",
          { method: "POST", body: JSON.stringify(apiPayload) },
          token
        )

        results.migrated.push({
          wc_id: entry.wc_id,
          wc_slug: entry.slug,
          medusa_id: response.product.id,
          medusa_handle: response.product.handle,
        })

        processedCount++
        log(`  [${processedCount}/${willMigrate.length}] Created "${entry.name}" (${response.product.id})`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log(`  ERROR creating "${entry.name}": ${message}`)
        results.errors.push({ wc_id: entry.wc_id, name: entry.name, error: message })
      }
    }
  }

  // ── Step 8: Verify counts ───────────────────────────────────────────────────

  log("")
  log(`Migration complete.`)
  log(`  Migrated:  ${results.migrated.length}`)
  log(`  Skipped:   ${results.skipped.length}`)
  log(`  Errors:    ${results.errors.length}`)

  if (results.errors.length > 0) {
    log("")
    log("ERRORS — the following products failed to migrate:")
    for (const e of results.errors) {
      log(`  WC #${e.wc_id} "${e.name}": ${e.error}`)
    }
  }

  const resultsPath = path.join(MIGRATIONS_DIR, "wc-migration-results.json")
  writeJson(resultsPath, results)
  log(`Results written to: ${resultsPath}`)

  if (results.errors.length > 0) {
    log("")
    log("ROLLBACK PROCEDURE:")
    log("  1. Delete migrated products using the Medusa Admin API:")
    log(`     DELETE /admin/products/{medusa_id}  — see ${resultsPath}`)
    log("  2. Re-run this script after fixing the root cause.")
    process.exit(1)
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

migrate().catch((err: unknown) => {
  console.error("Migration failed:", err instanceof Error ? err.message : err)
  process.exit(1)
})
