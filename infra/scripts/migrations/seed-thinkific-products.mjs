/**
 * seed-thinkific-products.mjs
 *
 * Seeds 56 Thinkific courses as Medusa v2 products on the live instance.
 *
 * Usage (run inside the medusa container):
 *   MEDUSA_ADMIN_EMAIL=<email> MEDUSA_ADMIN_PASSWORD=<pass> node seed-thinkific-products.mjs
 *
 * The script reads seed data from ./thinkific-products-seed.json (sibling file).
 * On completion it writes a rollback manifest to ./thinkific-products-created.json.
 *
 * Price convention: Medusa stores amounts in MINOR units (cents).
 *   usd_price 110  → amount 11000
 *   zar_price 1660 → amount 166000
 *
 * Idempotency: products with a handle that already exists in Medusa are skipped
 * (not treated as an error). The script logs and counts every skip.
 *
 * Batch processing: products are created in batches of 10 with a 1-second
 * delay between batches to avoid overwhelming the API.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MEDUSA_BASE_URL = "http://localhost:9000";
const SEED_FILE = join(__dirname, "thinkific-products-seed.json");
const CREATED_FILE = join(__dirname, "thinkific-products-created.json");

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

const SALES_CHANNEL_ID = "sc_01KQAG37BT732RBT1HM2T80TN9"; // Default Sales Channel
const PROGRAMMES_COLLECTION_TITLE = "Programmes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function authenticate(email, password) {
  const res = await fetch(`${MEDUSA_BASE_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  }
  const { token } = await res.json();
  if (!token) throw new Error("No token in auth response");
  return token;
}

async function medusaGet(path, token) {
  const res = await fetch(`${MEDUSA_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function medusaPost(path, token, body) {
  const res = await fetch(`${MEDUSA_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

// ---------------------------------------------------------------------------
// Fetch all existing product handles (paginated)
// ---------------------------------------------------------------------------

async function fetchAllExistingHandles(token) {
  const handles = new Set();
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await medusaGet(
      `/admin/products?limit=${limit}&offset=${offset}`,
      token
    );
    const products = data.products || [];
    for (const p of products) handles.add(p.handle);
    if (handles.size >= data.count) break;
    offset += limit;
  }

  return handles;
}

// ---------------------------------------------------------------------------
// Ensure "Programmes" collection exists — create if missing
// ---------------------------------------------------------------------------

async function ensureProgrammesCollection(token) {
  const data = await medusaGet("/admin/collections?limit=50", token);
  const existing = (data.collections || []).find(
    (c) => c.title === PROGRAMMES_COLLECTION_TITLE
  );

  if (existing) {
    console.log(
      `Collection "${PROGRAMMES_COLLECTION_TITLE}" already exists: ${existing.id}`
    );
    return existing.id;
  }

  console.log(`Creating collection "${PROGRAMMES_COLLECTION_TITLE}"...`);
  const result = await medusaPost("/admin/collections", token, {
    title: PROGRAMMES_COLLECTION_TITLE,
  });

  if (!result.ok) {
    throw new Error(
      `Failed to create collection: ${result.status} ${result.body}`
    );
  }

  const parsed = JSON.parse(result.body);
  const id = parsed.collection?.id;
  console.log(`Collection created: ${id}`);
  return id;
}

// ---------------------------------------------------------------------------
// Transform a seed entry into a Medusa v2 product payload
// ---------------------------------------------------------------------------

function buildProductPayload(entry, collectionId) {
  return {
    title: entry.title,
    handle: entry.handle,
    description: entry.description ?? null,
    status: "published",
    collection_id: collectionId,
    metadata: {
      thinkific_course_id: entry.thinkific_course_id,
      category: entry.category,
    },
    options: [
      {
        title: "Type",
        values: ["Standard"],
      },
    ],
    variants: [
      {
        title: "Standard",
        sku: `thinkific-${entry.thinkific_course_id}`,
        manage_inventory: false,
        options: { Type: "Standard" },
        prices: [
          {
            currency_code: "usd",
            amount: entry.usd_price * 100,
          },
          {
            currency_code: "zar",
            amount: entry.zar_price * 100,
          },
        ],
      },
    ],
    sales_channels: [{ id: SALES_CHANNEL_ID }],
  };
}

// ---------------------------------------------------------------------------
// Create a single product — returns { success, handle, productId?, reason? }
// ---------------------------------------------------------------------------

async function createProduct(entry, collectionId, token) {
  const payload = buildProductPayload(entry, collectionId);

  const result = await medusaPost("/admin/products", token, payload);

  if (result.ok) {
    const parsed = JSON.parse(result.body);
    return {
      success: true,
      handle: entry.handle,
      productId: parsed.product?.id,
      title: entry.title,
    };
  }

  // 422 with "already exists" text = duplicate handle — treat as skip, not failure
  const isDuplicate =
    result.status === 422 &&
    (result.body.includes("already") || result.body.includes("duplicate") || result.body.includes("unique"));

  return {
    success: false,
    skipped: isDuplicate,
    handle: entry.handle,
    title: entry.title,
    status: result.status,
    reason: result.body.slice(0, 300),
  };
}

// ---------------------------------------------------------------------------
// Assign products to the Programmes collection in one batch call
// ---------------------------------------------------------------------------

async function assignToCollection(collectionId, productIds, token) {
  const result = await medusaPost(
    `/admin/collections/${collectionId}/products`,
    token,
    { add: productIds }
  );

  if (!result.ok) {
    console.warn(
      `Collection batch assign failed (${result.status}): ${result.body.slice(0, 300)}`
    );
    console.log("Falling back to per-product update...");
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Verify: count products in Medusa that match seed handles
// ---------------------------------------------------------------------------

async function verifyCreatedProducts(token, seedEntries, createdHandles) {
  const data = await medusaGet("/admin/products?limit=200", token);
  const products = data.products || [];
  const byHandle = {};
  for (const p of products) byHandle[p.handle] = p;

  const found = seedEntries.filter((e) => byHandle[e.handle]);
  console.log(
    `\nVerification: ${found.length} / ${seedEntries.length} seed handles present in Medusa`
  );

  // Spot-check 3 products across categories
  const spotChecks = [
    "getting-unstuck",
    "resonance-repatterning-inner-cultivation-self-study",
    "post-traumatic-growth",
  ];

  console.log("\nSpot-checks:");
  for (const handle of spotChecks) {
    const p = byHandle[handle];
    if (!p) {
      console.log(`  [MISSING] ${handle}`);
      continue;
    }

    const seedEntry = seedEntries.find((e) => e.handle === handle);
    const variant = p.variants?.[0];
    const prices = variant?.prices || [];
    const usdPrice = prices.find((pr) => pr.currency_code === "usd");
    const zarPrice = prices.find((pr) => pr.currency_code === "zar");

    const thinkificId = p.metadata?.thinkific_course_id;

    const usdOk = usdPrice?.amount === (seedEntry?.usd_price ?? 0) * 100;
    const zarOk = zarPrice?.amount === (seedEntry?.zar_price ?? 0) * 100;
    const tidOk = thinkificId === seedEntry?.thinkific_course_id;

    console.log(`  [${handle}]`);
    console.log(`    title:               ${p.title}`);
    console.log(
      `    usd price:           ${usdPrice?.amount} (expected ${(seedEntry?.usd_price ?? 0) * 100}) ${usdOk ? "OK" : "MISMATCH"}`
    );
    console.log(
      `    zar price:           ${zarPrice?.amount} (expected ${(seedEntry?.zar_price ?? 0) * 100}) ${zarOk ? "OK" : "MISMATCH"}`
    );
    console.log(
      `    thinkific_course_id: ${thinkificId} (expected ${seedEntry?.thinkific_course_id}) ${tidOk ? "OK" : "MISMATCH"}`
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startTime = Date.now();

  // Read credentials from environment
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "ERROR: MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set"
    );
    process.exit(1);
  }

  // Read seed data
  const seedEntries = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  console.log(`Loaded ${seedEntries.length} seed entries from ${SEED_FILE}`);

  // Authenticate
  console.log("Authenticating...");
  const token = await authenticate(email, password);
  console.log("Authenticated.");

  // Ensure collection exists
  const collectionId = await ensureProgrammesCollection(token);

  // Fetch existing handles for idempotency check
  console.log("Fetching existing product handles...");
  const existingHandles = await fetchAllExistingHandles(token);
  console.log(`Found ${existingHandles.size} existing products in Medusa.`);

  // Partition seed entries: skip vs create
  const toCreate = [];
  const preSkipped = [];

  for (const entry of seedEntries) {
    if (existingHandles.has(entry.handle)) {
      preSkipped.push({ handle: entry.handle, title: entry.title, reason: "handle already exists (pre-check)" });
    } else {
      toCreate.push(entry);
    }
  }

  console.log(`\nPre-check: ${toCreate.length} to create, ${preSkipped.length} skipped (existing handles)`);
  if (preSkipped.length > 0) {
    console.log("Pre-skipped handles:");
    for (const s of preSkipped) console.log(`  - ${s.handle}`);
  }

  // Process in batches
  const created = [];
  const failed = [];
  const apiSkipped = [];

  const batches = chunk(toCreate, BATCH_SIZE);
  console.log(`\nProcessing ${batches.length} batches of up to ${BATCH_SIZE}...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\nBatch ${i + 1}/${batches.length} (${batch.length} products):`);

    for (const entry of batch) {
      const result = await createProduct(entry, collectionId, token);

      if (result.success) {
        created.push({ handle: result.handle, product_id: result.productId, title: result.title });
        console.log(`  [OK]   ${result.handle} → ${result.productId}`);
      } else if (result.skipped) {
        apiSkipped.push({ handle: result.handle, title: result.title, reason: result.reason });
        console.log(`  [SKIP] ${result.handle} (duplicate handle from API)`);
      } else {
        failed.push({ handle: result.handle, title: result.title, status: result.status, reason: result.reason });
        console.log(`  [FAIL] ${result.handle} — ${result.status}: ${result.reason.slice(0, 120)}`);
      }
    }

    if (i < batches.length - 1) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Assign newly created products to the Programmes collection
  if (created.length > 0) {
    console.log(`\nAssigning ${created.length} new products to collection ${collectionId}...`);
    const productIds = created.map((c) => c.product_id);
    const batchAssigned = await assignToCollection(collectionId, productIds, token);

    if (!batchAssigned) {
      // Fallback: individual updates
      for (const c of created) {
        const r = await medusaPost(`/admin/products/${c.product_id}`, token, {
          collection_id: collectionId,
        });
        if (!r.ok) {
          console.warn(`  Failed to assign ${c.handle} to collection: ${r.body.slice(0, 100)}`);
        }
      }
    }
  }

  // Verify
  const allSeedEntries = seedEntries;
  await verifyCreatedProducts(token, allSeedEntries, new Set(created.map((c) => c.handle)));

  // Collection product count
  const colData = await medusaGet(
    `/admin/collections/${collectionId}?fields=*products`,
    token
  );
  const colProductCount = colData.collection?.products?.length ?? "unknown";
  console.log(`\nCollection "${PROGRAMMES_COLLECTION_TITLE}" (${collectionId}) product count: ${colProductCount}`);

  // Write rollback manifest
  writeFileSync(CREATED_FILE, JSON.stringify(created, null, 2), "utf8");
  console.log(`\nRollback manifest written to ${CREATED_FILE}`);

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalSkipped = preSkipped.length + apiSkipped.length;

  console.log("\n=== MIGRATION SUMMARY ===");
  console.log(`  Source entries:     ${seedEntries.length}`);
  console.log(`  Created:            ${created.length}`);
  console.log(`  Skipped (existing): ${totalSkipped}`);
  console.log(`  Failed:             ${failed.length}`);
  console.log(`  Elapsed:            ${elapsed}s`);
  console.log(`  Price convention:   CENTS (amount = price * 100)`);
  console.log(`  Sales channel:      ${SALES_CHANNEL_ID}`);
  console.log(`  Collection:         ${collectionId}`);

  if (failed.length > 0) {
    console.log("\nFailed products:");
    for (const f of failed) {
      console.log(`  - [${f.status}] ${f.handle}: ${f.reason}`);
    }
  }

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
