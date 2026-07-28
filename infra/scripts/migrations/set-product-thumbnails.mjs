/**
 * Set thumbnails on Medusa products that have none.
 *
 * Why: the Thinkific-seeded products carry no thumbnail, so the shop falls back
 * to one stock image per category — every programme in a category shows the
 * same picture (Suzanne feedback, 28 Jul 2026).
 *
 * Image rule (Suzanne): programmes in the same series share the SAME image so
 * the series is recognisable; distinct programmes get distinct images.
 *
 * Images live in the web app at apps/web/public/images/products/ and are
 * referenced by site-relative URL (/images/products/<file>) so they keep
 * working after the DNS cutover.
 *
 * Usage (dry-run by default; add --apply to write):
 *   MEDUSA_ADMIN_EMAIL=<email> MEDUSA_ADMIN_PASSWORD=<pass> \
 *     node set-product-thumbnails.mjs [--apply] [--base-url http://localhost:9000]
 *
 * Run where the Medusa admin API is reachable (on the VPS: localhost:9000).
 */

import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const baseUrlIdx = argv.indexOf("--base-url");
const MEDUSA_BASE_URL =
  baseUrlIdx !== -1 ? argv[baseUrlIdx + 1] : process.env.MEDUSA_BASE_URL || "http://localhost:9000";

const EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD are required");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Image catalogue — from apps/web/public/images/products (falls back to a
// hardcoded listing when the script runs on the VPS without the web tree).
// ---------------------------------------------------------------------------
const __dir = dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = join(__dir, "..", "..", "..", "apps", "web", "public", "images", "products");

let imageFiles = [];
try {
  imageFiles = readdirSync(IMAGE_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
} catch {
  console.error(
    `Cannot read ${IMAGE_DIR} — run from the repo checkout so the image list is available.`
  );
  process.exit(1);
}

// Series images — one shared image per practitioner series (Suzanne's rule).
// Chosen: the series' flagship/basic-training image.
const SERIES_RULES = [
  {
    name: "Resonance Repatterning",
    test: (h) => /resonance-repatterning|^rr-/.test(h),
    image: "resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom.jpeg",
  },
  {
    name: "Akashic Navigator",
    test: (h) => /akashic/.test(h),
    image: "akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom.png",
  },
  {
    name: "Energy Clearing",
    test: (h) => /energy-clearing|deep-energy-clearing|deep-clearing/.test(h),
    image: "deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom.png",
  },
];

// Hand overrides where fuzzy matching picks the wrong (or no) image.
const OVERRIDES = {
  "be-an-energy-ninja-level-1-self-study":
    "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live.jpeg",
  "be-an-energy-ninja-mastering-energy-for-an-abundant-life-level-2-energy-practices-for-repatterning-your-life-level2-live-zoom":
    "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live.png",
  "be-an-energy-ninja-mastering-energy-for-an-abundant-life-level-2-energy-practices-for-repatterning-your-life-self-study":
    "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live.png",
  "resonance-repatterning-group-session-communication":
    "group-session-nice-or-not-nice-in-communication-booked-as-a-series-only.jpeg",
};

// But: recorded group sessions and self-study lifestyle courses are distinct
// programmes — they get their own image via fuzzy matching even when their
// handle mentions resonance-repatterning (e.g. RR recorded group sessions).
const GROUP_SESSION_RE = /group-session|group-series|recorded-group/;

const tokenize = (s) =>
  s
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp)$/i, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !["the", "and", "with", "for", "via", "live", "zoom", "self", "study", "session", "sessions", "online"].includes(t));

const jaccard = (a, b) => {
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
};

function bestImageFor(handle) {
  const handleTokens = tokenize(handle);
  let best = null;
  let bestScore = 0;
  for (const file of imageFiles) {
    const score = jaccard(handleTokens, tokenize(file));
    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }
  return bestScore >= 0.4 ? { file: best, score: bestScore } : null;
}

function resolveImage(handle) {
  if (OVERRIDES[handle]) return { image: OVERRIDES[handle], via: "override" };
  // Distinct-programme fuzzy match first for group sessions
  if (GROUP_SESSION_RE.test(handle)) {
    const match = bestImageFor(handle);
    if (match) return { image: match.file, via: `fuzzy ${match.score.toFixed(2)}` };
  }
  for (const rule of SERIES_RULES) {
    if (rule.test(handle)) return { image: rule.image, via: `series:${rule.name}` };
  }
  const match = bestImageFor(handle);
  if (match) return { image: match.file, via: `fuzzy ${match.score.toFixed(2)}` };
  return null;
}

// ---------------------------------------------------------------------------
// Medusa admin API
// ---------------------------------------------------------------------------
async function authenticate() {
  const res = await fetch(`${MEDUSA_BASE_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Auth failed: HTTP ${res.status}`);
  const { token } = await res.json();
  if (!token) throw new Error("No token in auth response");
  return token;
}

async function api(path, token, opts = {}) {
  const res = await fetch(`${MEDUSA_BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${path}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} against ${MEDUSA_BASE_URL}`);
  const token = await authenticate();

  const products = [];
  let offset = 0;
  for (;;) {
    const data = await api(`/admin/products?limit=100&offset=${offset}&fields=id,handle,title,thumbnail`, token);
    products.push(...data.products);
    offset += 100;
    if (products.length >= data.count) break;
  }
  console.log(`${products.length} products fetched`);

  const missing = products.filter((p) => !p.thumbnail);
  console.log(`${missing.length} products without thumbnail\n`);

  const unmatched = [];
  for (const p of missing) {
    const resolved = resolveImage(p.handle);
    if (!resolved) {
      unmatched.push(p.handle);
      continue;
    }
    const url = `/images/products/${resolved.image}`;
    console.log(`${p.handle}\n  -> ${url}  (${resolved.via})`);
    if (APPLY) {
      await api(`/admin/products/${p.id}`, token, {
        method: "POST",
        body: JSON.stringify({ thumbnail: url }),
      });
    }
  }

  if (unmatched.length) {
    console.log(`\nUNMATCHED (${unmatched.length}) — left untouched:`);
    unmatched.forEach((h) => console.log(`  ${h}`));
  }
  console.log(`\n${APPLY ? "Applied" : "Would apply"}: ${missing.length - unmatched.length} thumbnails`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
