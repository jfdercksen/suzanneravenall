/**
 * seed-categories.mjs
 *
 * Idempotent seed script for Medusa v2 product category tree.
 * Run: node apps/medusa/src/scripts/seed-categories.mjs
 *
 * Environment variables (optional — defaults to infra/.env values):
 *   MEDUSA_BASE_URL      Base URL without path prefix (default: http://169.239.180.49)
 *   MEDUSA_ADMIN_EMAIL   Admin email (default: admin@suzanneravenall.com)
 *   MEDUSA_ADMIN_PASSWORD  Admin password
 *
 * Medusa v2 API routing (via Nginx):
 *   Auth:  POST /auth/user/emailpass  → returns { token }
 *   Admin: /admin/...                 → Medusa admin routes
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Load a value from infra/.env as a fallback when env var is not set. */
function loadFromDotEnv(key) {
  try {
    const envPath = resolve(__dirname, "../../../../infra/.env");
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const eqIdx = trimmed.indexOf("=");
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (k === key) return v;
    }
  } catch {
    // file not found — ignore
  }
  return undefined;
}

// Base URL — no trailing slash, no /api prefix.
// Admin API lives at MEDUSA_BASE_URL/admin/...
// Auth API lives at MEDUSA_BASE_URL/auth/...
const MEDUSA_BASE_URL =
  process.env.MEDUSA_BASE_URL ??
  loadFromDotEnv("MEDUSA_BASE_URL") ??
  "http://169.239.180.49";

const ADMIN_EMAIL =
  process.env.MEDUSA_ADMIN_EMAIL ??
  loadFromDotEnv("MEDUSA_ADMIN_EMAIL") ??
  "admin@suzanneravenall.com";

const ADMIN_PASSWORD =
  process.env.MEDUSA_ADMIN_PASSWORD ??
  loadFromDotEnv("MEDUSA_ADMIN_PASSWORD");

if (!ADMIN_PASSWORD) {
  console.error(
    "ERROR: MEDUSA_ADMIN_PASSWORD not set and could not be read from infra/.env"
  );
  process.exit(1);
}

console.log(`Using Medusa base URL: ${MEDUSA_BASE_URL}`);
console.log(`Authenticating as: ${ADMIN_EMAIL}`);

// ---------------------------------------------------------------------------
// Category tree definition
// ---------------------------------------------------------------------------

/**
 * Each entry: { name, handle, parentHandle }
 * parentHandle null means top-level category.
 * Order matters: parents must appear before their children.
 */
const CATEGORY_TREE = [
  // ── Private Sessions ────────────────────────────────────────────────────
  { name: "Private Sessions", handle: "private-sessions", parentHandle: null },
  {
    name: "Rapid Repatterning",
    handle: "rapid-repatterning",
    parentHandle: "private-sessions",
  },
  {
    name: "Resonance Repatterning",
    handle: "resonance-repatterning-sessions",
    parentHandle: "private-sessions",
  },
  {
    name: "Transformation Coaching",
    handle: "transformation-coaching",
    parentHandle: "private-sessions",
  },
  {
    name: "Executive Coaching",
    handle: "executive-coaching",
    parentHandle: "private-sessions",
  },
  {
    name: "Akashic Coaching",
    handle: "akashic-coaching",
    parentHandle: "private-sessions",
  },
  {
    name: "Rapid Transformation Therapy",
    handle: "rapid-transformation-therapy",
    parentHandle: "private-sessions",
  },
  {
    name: "Exploring the Alpha Mind",
    handle: "exploring-the-alpha-mind",
    parentHandle: "private-sessions",
  },
  {
    name: "Energetic Clearing",
    handle: "energetic-clearing",
    parentHandle: "private-sessions",
  },
  {
    name: "Family Coaching",
    handle: "family-coaching",
    parentHandle: "private-sessions",
  },

  // ── Guided Programmes ───────────────────────────────────────────────────
  {
    name: "Guided Programmes",
    handle: "guided-programmes",
    parentHandle: null,
  },
  {
    name: "Resonance Repatterning",
    handle: "rp-programmes",
    parentHandle: "guided-programmes",
  },
  { name: "Live", handle: "rp-live", parentHandle: "rp-programmes" },
  { name: "Self Paced", handle: "rp-self-paced", parentHandle: "rp-programmes" },
  {
    name: "Akashic Navigator",
    handle: "akashic-navigator",
    parentHandle: "guided-programmes",
  },
  { name: "Live", handle: "akashic-live", parentHandle: "akashic-navigator" },
  {
    name: "Self Paced",
    handle: "akashic-self-paced",
    parentHandle: "akashic-navigator",
  },
  {
    name: "Energy Clearing",
    handle: "energy-clearing-programmes",
    parentHandle: "guided-programmes",
  },
  {
    name: "Live",
    handle: "energy-clearing-live",
    parentHandle: "energy-clearing-programmes",
  },
  {
    name: "Self Paced",
    handle: "energy-clearing-self-paced",
    parentHandle: "energy-clearing-programmes",
  },
  {
    name: "Life Enhancing",
    handle: "life-enhancing",
    parentHandle: "guided-programmes",
  },
  {
    name: "Live",
    handle: "life-enhancing-live",
    parentHandle: "life-enhancing",
  },
  {
    name: "Self Paced",
    handle: "life-enhancing-self-paced",
    parentHandle: "life-enhancing",
  },
  {
    name: "Meditation",
    handle: "meditation-programmes",
    parentHandle: "guided-programmes",
  },

  // ── Group Sessions ───────────────────────────────────────────────────────
  { name: "Group Sessions", handle: "group-sessions", parentHandle: null },
  { name: "Live", handle: "group-sessions-live", parentHandle: "group-sessions" },
  {
    name: "Recorded",
    handle: "group-sessions-recorded",
    parentHandle: "group-sessions",
  },

  // ── Products & Tools ────────────────────────────────────────────────────
  { name: "Products & Tools", handle: "products-tools", parentHandle: null },
  { name: "Books", handle: "books", parentHandle: "products-tools" },
  {
    name: "Digital Downloads",
    handle: "digital-downloads",
    parentHandle: "products-tools",
  },
];

// ---------------------------------------------------------------------------
// Product → Category handle map
// ---------------------------------------------------------------------------

/** Maps product handle → category handle */
const PRODUCT_CATEGORY_MAP = {
  // Private Sessions
  "rapid-repatterning-session-60-min-online": "rapid-repatterning",
  "resonance-repatterning-session": "resonance-repatterning-sessions",
  "transformation-coaching-60-mins": "transformation-coaching",
  "executive-coaching-30-mins": "executive-coaching",
  "akashic-clearing-session": "akashic-coaching",
  "rapid-transformation-therapy-session": "rapid-transformation-therapy",
  "exploring-the-alpha-mind-45-minutes": "exploring-the-alpha-mind",
  "energetic-clearing-completed-remotely": "energetic-clearing",
  "group-family-coaching-60-mins": "family-coaching",

  // RP Live
  "resonance-repatterning-program-1-fundamentals-live-via-zoom": "rp-live",
  "resonance-repatterning-program-2-primary-patterns-live-via-zoom": "rp-live",
  "resonance-repatterning-program-3-unconscious-patterns-live-via-zoom":
    "rp-live",
  "resonance-repatterning-program-4-chakra-patterns-live-via-zoom": "rp-live",
  "resonance-repatterning-program-5-five-elements-meridians-live-via-zoom":
    "rp-live",
  "resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom":
    "rp-live",
  "resonance-repatterning-accelerated-basic-5-training-series-review-of-programs-1-5-live-via-zoom":
    "rp-live",

  // RP Self Paced
  "resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study":
    "rp-self-paced",
  "resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study":
    "rp-self-paced",

  // Akashic Live
  "akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom":
    "akashic-live",
  "akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom":
    "akashic-live",
  "akashic-navigator-intuitive-coaching-fundamentals-advanced-purchased-together-live-via-zoom":
    "akashic-live",

  // Energy Clearing Live
  "deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom":
    "energy-clearing-live",
  "deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom":
    "energy-clearing-live",
  "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live":
    "energy-clearing-live",
  "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live":
    "energy-clearing-live",

  // Life Enhancing Live
  "trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-your-adult-self-live":
    "life-enhancing-live",
  "finding-my-life-purpose-live": "life-enhancing-live",
  "love-relationships-live": "life-enhancing-live",
  "intuition-in-my-personal-capacity-live": "life-enhancing-live",

  // Life Enhancing Self Paced
  "coherence-muscle-testing-self-study-online-2": "life-enhancing-self-paced",
  "resonance-repatterning-all-repatternings-as-demos-talk-throughs-resources-self-study":
    "life-enhancing-self-paced",
  "post-traumatic-growth-self-study-online": "life-enhancing-self-paced",

  // Meditation
  "meditation-live-via-zoom": "meditation-programmes",
  "mindfulness-live": "meditation-programmes",

  // Group Sessions Live
  "group-session-being-a-great-boundary-setter-booked-as-a-series-only":
    "group-sessions-live",
  "career-progression-group-session": "group-sessions-live",
  "group-session-develop-super-confidence": "group-sessions-live",
  "love-relationships-group-session": "group-sessions-live",
  "money-mastery-group-session": "group-sessions-live",
  "group-session-nice-or-not-nice-in-communication-booked-as-a-series-only":
    "group-sessions-live",
  "group-session-shedding-excess-weight": "group-sessions-live",

  // Group Sessions Recorded
  "group-session-attraction-frequency-recorded": "group-sessions-recorded",

  // Books
  "the-latest-book-by-suzanne": "books",

  // Digital Downloads
  "quantum-healing-codes-ebook-audio-download": "digital-downloads",

  // Standalone products discovered post-migration (not in CONSOLIDATION_MAP)
  "bringing-your-energy-back": "energy-clearing-self-paced",
  "energetic-alignment-inner-neutrality": "energy-clearing-self-paced",
  "relaxation-energy-reclamation": "energy-clearing-self-paced",
  "getting-unstuck-self-study": "life-enhancing-self-paced",
};

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/**
 * Thin fetch wrapper that throws a descriptive error on non-2xx responses.
 * path must start with / and is appended directly to MEDUSA_BASE_URL.
 */
async function apiFetch(path, options = {}) {
  const url = `${MEDUSA_BASE_URL}${path}`;
  // Destructure headers out of options so the spread below does not overwrite
  // the merged header object (which would silently drop Content-Type).
  const { headers: callerHeaders, ...restOptions } = options;
  const res = await fetch(url, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(callerHeaders ?? {}),
    },
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `HTTP ${res.status} ${res.statusText} on ${options.method ?? "GET"} ${url}\n${body}`
    );
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Step 1: Authenticate
// ---------------------------------------------------------------------------

async function authenticate() {
  console.log("\n[1/4] Authenticating with Medusa admin API...");
  // Medusa v2 JWT endpoint: POST /auth/user/emailpass → { token }
  const data = await apiFetch("/auth/user/emailpass", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const token = data.token;
  if (!token) {
    throw new Error(
      "Authentication succeeded but no token was returned. Response: " +
        JSON.stringify(data)
    );
  }

  console.log("  Authentication successful.");
  return token;
}

// ---------------------------------------------------------------------------
// Step 2: Ensure categories exist (idempotent)
// ---------------------------------------------------------------------------

/**
 * Returns all existing categories indexed by handle.
 * Uses pagination to ensure we get all of them.
 */
async function fetchAllCategories(token) {
  const all = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await apiFetch(
      `/admin/product-categories?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const items = data.product_categories ?? [];
    all.push(...items);
    if (all.length >= (data.count ?? 0) || items.length < limit) break;
    offset += limit;
  }

  return all;
}

/**
 * Creates categories from CATEGORY_TREE, skipping any that already exist.
 * Returns a map of handle → category id.
 */
async function ensureCategories(token) {
  console.log("\n[2/4] Ensuring product categories exist...");

  const existing = await fetchAllCategories(token);
  const handleToId = {};
  for (const cat of existing) {
    handleToId[cat.handle] = cat.id;
  }

  for (const entry of CATEGORY_TREE) {
    if (handleToId[entry.handle]) {
      console.log(`  ⚠  Category already exists: ${entry.handle}`);
      continue;
    }

    const body = {
      name: entry.name,
      handle: entry.handle,
      is_active: true,
      is_internal: false,
    };

    if (entry.parentHandle) {
      const parentId = handleToId[entry.parentHandle];
      if (!parentId) {
        throw new Error(
          `Parent category "${entry.parentHandle}" not found for "${entry.handle}". ` +
            "Check CATEGORY_TREE ordering — parents must appear before children."
        );
      }
      body.parent_category_id = parentId;
    }

    const data = await apiFetch("/admin/product-categories", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const created = data.product_category;
    handleToId[entry.handle] = created.id;
    console.log(`  ✓  Category created: ${entry.handle} (id: ${created.id})`);
  }

  console.log(`  Done. ${Object.keys(handleToId).length} categories in index.`);
  return handleToId;
}

// ---------------------------------------------------------------------------
// Step 3: Fetch all products
// ---------------------------------------------------------------------------

async function fetchAllProducts(token) {
  console.log("\n[3/4] Fetching all products from Medusa admin...");

  const all = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await apiFetch(
      `/admin/products?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const items = data.products ?? [];
    all.push(...items);
    console.log(
      `  Fetched ${all.length} / ${data.count ?? "?"} products...`
    );
    if (all.length >= (data.count ?? 0) || items.length < limit) break;
    offset += limit;
  }

  console.log(`  Total products fetched: ${all.length}`);
  return all;
}

// ---------------------------------------------------------------------------
// Step 4: Assign products to categories
// ---------------------------------------------------------------------------

async function assignProductCategories(token, products, handleToId) {
  console.log("\n[4/4] Assigning products to categories...");

  let assigned = 0;
  let skipped = 0;
  let unmapped = 0;

  for (const product of products) {
    const targetCategoryHandle = PRODUCT_CATEGORY_MAP[product.handle];

    if (!targetCategoryHandle) {
      console.log(
        `  -  No mapping for product: ${product.handle} — skipping`
      );
      unmapped++;
      continue;
    }

    const categoryId = handleToId[targetCategoryHandle];
    if (!categoryId) {
      console.warn(
        `  !  Category "${targetCategoryHandle}" not found in index for product "${product.handle}"`
      );
      skipped++;
      continue;
    }

    // Preserve any existing categories, add the target if not already present.
    const existingCategoryIds = (product.categories ?? []).map((c) => c.id);
    if (existingCategoryIds.includes(categoryId)) {
      console.log(
        `  ⚠  ${product.handle} already in category ${targetCategoryHandle} — skipping`
      );
      skipped++;
      continue;
    }

    // Merge existing + new category
    const mergedCategories = [
      ...existingCategoryIds.map((id) => ({ id })),
      { id: categoryId },
    ];

    await apiFetch(`/admin/products/${product.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categories: mergedCategories }),
    });

    console.log(
      `  ->  Assigned "${product.handle}" → "${targetCategoryHandle}"`
    );
    assigned++;
  }

  console.log(`\n  Products assigned: ${assigned}`);
  console.log(`  Products skipped (already assigned or no category id): ${skipped}`);
  console.log(`  Products with no mapping: ${unmapped}`);

  return { assigned, skipped, unmapped };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("========================================");
  console.log("  Medusa Category Seed Script");
  console.log("========================================");

  const token = await authenticate();
  const handleToId = await ensureCategories(token);
  const products = await fetchAllProducts(token);
  const { assigned, skipped, unmapped } = await assignProductCategories(
    token,
    products,
    handleToId
  );

  console.log("\n========================================");
  console.log("  Seed complete.");
  console.log(`  Categories in tree: ${CATEGORY_TREE.length}`);
  console.log(`  Products assigned : ${assigned}`);
  console.log(`  Products skipped  : ${skipped}`);
  console.log(`  Products unmapped : ${unmapped}`);
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("\nFATAL:", err.message ?? err);
  process.exit(1);
});
