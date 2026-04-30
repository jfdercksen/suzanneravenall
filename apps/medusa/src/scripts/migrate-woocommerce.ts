/**
 * WooCommerce → Medusa v2 Product Migration — Consolidation Edition
 *
 * Groups related WooCommerce products into single Medusa products with variants
 * using the CONSOLIDATION_MAP. Any WC product not absorbed becomes standalone.
 * Produces a 301 redirect map at infra/scripts/migrations/redirect-map.json.
 *
 * Dry run:  DRY_RUN=true  MEDUSA_ADMIN_PASSWORD=xxx ts-node src/scripts/migrate-woocommerce.ts
 * Live run: DRY_RUN=false MEDUSA_ADMIN_PASSWORD=xxx ts-node src/scripts/migrate-woocommerce.ts
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

const TEST_NAME_PATTERNS: RegExp[] = [
  /\btest\b/i,
  /sr-product-test/i,
  /group\s+test/i,
]

// ── Category → collection mapping (for standalone WC products) ────────────────

const CATEGORY_TO_COLLECTION: Record<number, string> = {
  50: "start-here", 119: "start-here", 125: "start-here", 178: "start-here",
  85: "start-here", 128: "start-here", 82: "start-here", 81: "start-here",
  83: "start-here", 84: "start-here", 177: "start-here", 134: "start-here",
  113: "start-here", 106: "start-here", 52: "start-here", 174: "start-here",
  132: "start-here",
  51: "deep-dive", 133: "deep-dive", 63: "deep-dive", 46: "deep-dive",
  118: "deep-dive", 116: "deep-dive", 137: "deep-dive", 114: "deep-dive",
  115: "deep-dive", 131: "deep-dive", 86: "deep-dive", 92: "deep-dive",
  93: "deep-dive", 130: "deep-dive", 88: "deep-dive", 173: "deep-dive",
  120: "deep-dive", 121: "deep-dive", 122: "deep-dive", 123: "deep-dive",
  124: "deep-dive", 126: "deep-dive", 127: "deep-dive", 69: "deep-dive",
  129: "master-level", 135: "master-level", 91: "master-level",
  60: "practitioner",
}

const DEFAULT_COLLECTION = "start-here"

// ── Consolidation map ─────────────────────────────────────────────────────────

interface ConsolidationVariant {
  label: string
  price_zar: number
  source_wc_slugs: string[]
}

interface ConsolidationEntry {
  canonical_slug: string
  title: string
  collection: string
  program_type: string
  variants: ConsolidationVariant[]
}

const CONSOLIDATION_MAP: ConsolidationEntry[] = [
  // ── Private Sessions ─────────────────────────────────────────────────────
  {
    canonical_slug: "rapid-repatterning-session-60-min-online",
    title: "Rapid Repatterning Session",
    collection: "start-here",
    program_type: "session",
    variants: [
      { label: "60 min online", price_zar: 1660, source_wc_slugs: ["rapid-repatterning-session-60-min-online", "rapid-repatterning-session-2", "rapid-repatterning-session-3", "rapid-repatterning-session-60-min-options", "rapid-repatterning-session-60-mins-single-online-session-copy"] },
      { label: "60 min in-person", price_zar: 1995, source_wc_slugs: ["rapid-repatterning-session-60-mins-in-person"] },
      { label: "90 min online", price_zar: 2490, source_wc_slugs: ["rapid-repatterning-session-90-mins-online", "rapid-repatterning-session-90-min-options"] },
      { label: "90 min in-person", price_zar: 2990, source_wc_slugs: ["rapid-repatterning-session-90-mins-in-person", "rapid-repatterning-session-90-mins-in-person-session"] },
      { label: "Package of 04 (60 min online)", price_zar: 6310, source_wc_slugs: ["rapid-repatterning-session-60-mins-package-of-4-sessions"] },
      { label: "Package of 08 (60 min online)", price_zar: 11960, source_wc_slugs: ["rapid-repatterning-session-60-mins-package-of-8-sessions"] },
      { label: "Package of 12 (60 min online)", price_zar: 16940, source_wc_slugs: ["rapid-repatterning-session-60-mins-package-of-12-sessions"] },
      { label: "Package of 16 (60 min online)", price_zar: 21260, source_wc_slugs: ["rapid-repatterning-session-60-mins-package-of-16-sessions"] },
      { label: "Package of 04 (90 min online)", price_zar: 9465, source_wc_slugs: ["rapid-repatterning-coaching-90-mins-package-of-04"] },
      { label: "Package of 08 (90 min online)", price_zar: 17935, source_wc_slugs: ["rapid-repatterning-coaching-90-mins-package-of-08"] },
      { label: "Package of 12 (90 min online)", price_zar: 25410, source_wc_slugs: ["rapid-repatterning-coaching-90-mins-package-of-12"] },
      { label: "Package of 16 (90 min online)", price_zar: 31885, source_wc_slugs: ["rapid-repatterning-coaching-90-mins-package-of-16"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-session",
    title: "Resonance Repatterning / Coaching Session",
    collection: "start-here",
    program_type: "session",
    variants: [
      { label: "60 min online", price_zar: 1660, source_wc_slugs: ["resonance-repatterning-session", "resonance-repatterning-coaching-60-mins", "resonance-repatterning-coaching-90-mins-2"] },
      { label: "90 min online", price_zar: 2490, source_wc_slugs: ["resonance-repatterning-coaching-90-mins"] },
      { label: "90 min in-person", price_zar: 2990, source_wc_slugs: ["resonance-repatterning-coaching-90-mins-in-person-session"] },
      { label: "Package of 04 (60 min)", price_zar: 6310, source_wc_slugs: ["resonance-repatterning-coaching-session-60-mins-package-of-4"] },
      { label: "Package of 08 (60 min)", price_zar: 11960, source_wc_slugs: ["resonance-repatterning-coaching-session-60-mins-package-of-8"] },
      { label: "Package of 12 (60 min)", price_zar: 16940, source_wc_slugs: ["resonance-repatterning-coaching-session-60-mins-package-of-12"] },
      { label: "Package of 16 (60 min)", price_zar: 21260, source_wc_slugs: ["resonance-repatterning-coaching-session-60-mins-package-of-16"] },
      { label: "Package of 04 (90 min)", price_zar: 9465, source_wc_slugs: ["resonance-repatterning-session-4x1"] },
      { label: "Package of 08 (90 min)", price_zar: 17935, source_wc_slugs: ["resonance-repatterning-coaching-90-mins-package-of-8"] },
      { label: "Package of 12 (90 min)", price_zar: 25410, source_wc_slugs: ["resonance-repatterning-coaching-90-mins-package-of-12"] },
      { label: "Package of 16 (90 min)", price_zar: 31885, source_wc_slugs: ["resonance-repatterning-coaching-90-mins-package-of-16"] },
    ],
  },
  {
    canonical_slug: "transformation-coaching-60-mins",
    title: "Transformation Coaching Session",
    collection: "start-here",
    program_type: "session",
    variants: [
      { label: "60 min", price_zar: 1660, source_wc_slugs: ["transformation-coaching-60-mins", "transformational-behavioural-coaching"] },
      { label: "90 min", price_zar: 2325, source_wc_slugs: ["transformation-coaching-90-mins"] },
      { label: "Package of 04", price_zar: 6310, source_wc_slugs: ["transformation-coaching-60-mins-package-of-4"] },
      { label: "Package of 08", price_zar: 11960, source_wc_slugs: ["transformation-coaching-60-mins-package-of-8"] },
      { label: "Package of 12", price_zar: 16940, source_wc_slugs: ["transformation-coaching-60-mins-package-of-12"] },
      { label: "Package of 16", price_zar: 21255, source_wc_slugs: ["transformation-coaching-60-mins-package-of-16"] },
    ],
  },
  {
    canonical_slug: "executive-coaching-30-mins",
    title: "Executive Coaching Session",
    collection: "master-level",
    program_type: "session",
    variants: [
      { label: "30 min", price_zar: 1660, source_wc_slugs: ["executive-coaching-30-mins", "executive-coaching"] },
      { label: "60 min", price_zar: 2770, source_wc_slugs: ["executive-coaching-60-mins"] },
      { label: "Package of 04", price_zar: 10515, source_wc_slugs: ["executive-coaching-60-mins-package-of-4"] },
      { label: "Package of 08", price_zar: 19930, source_wc_slugs: ["executive-coaching-60-mins-package-of-8"] },
      { label: "Package of 12", price_zar: 28230, source_wc_slugs: ["executive-coaching-60-mins-package-of-12"] },
      { label: "Package of 16", price_zar: 35425, source_wc_slugs: ["executive-coaching-60-mins-package-of-16"] },
    ],
  },
  {
    canonical_slug: "akashic-clearing-session",
    title: "Akashic Coaching / Clearing Session",
    collection: "deep-dive",
    program_type: "session",
    variants: [
      { label: "60 min", price_zar: 1660, source_wc_slugs: ["akashic-clearing-session"] },
      { label: "90 min", price_zar: 2325, source_wc_slugs: ["akashic-coaching-clearing-session-90min"] },
      { label: "Package of 04", price_zar: 6310, source_wc_slugs: ["akashic-coaching-clearing-session-60-mins-package-of-4"] },
      { label: "Package of 08", price_zar: 11955, source_wc_slugs: ["akashic-coaching-clearing-session-60-mins-package-of-8"] },
      { label: "Package of 12", price_zar: 16940, source_wc_slugs: ["akashic-coaching-clearing-session-60-mins-package-of-12"] },
    ],
  },
  {
    canonical_slug: "group-family-coaching-60-mins",
    title: "Group Family Coaching",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Single session", price_zar: 1660, source_wc_slugs: ["group-family-coaching-60-mins", "group-family-coaching"] },
      { label: "Package of 04", price_zar: 6310, source_wc_slugs: ["group-family-coaching-60-mins-package-of-4"] },
      { label: "Package of 08", price_zar: 11955, source_wc_slugs: ["group-family-coaching-60-mins-package-of-8"] },
    ],
  },
  {
    canonical_slug: "exploring-the-alpha-mind-45-minutes",
    title: "Exploring the Alpha Mind",
    collection: "deep-dive",
    program_type: "session",
    variants: [
      { label: "Single session (45 min)", price_zar: 775, source_wc_slugs: ["exploring-the-alpha-mind-45-minutes", "exploring-the-alpha-mind"] },
      { label: "Package of 05", price_zar: 3680, source_wc_slugs: ["exploring-the-alpha-mind-45-mins-package-of-5"] },
      { label: "Package of 08", price_zar: 5580, source_wc_slugs: ["exploring-the-alpha-mind-45-mins-package-of-8"] },
    ],
  },
  {
    canonical_slug: "rapid-transformation-therapy-session",
    title: "Rapid Transformation Therapy Session",
    collection: "master-level",
    program_type: "session",
    variants: [
      { label: "1 hypnosis session + recording", price_zar: 2325, source_wc_slugs: ["rapid-transformation-therapy-session", "rapid-transformation-therapy-session-2"] },
      { label: "1 hypnosis session + recording + 2 coaching sessions", price_zar: 4540, source_wc_slugs: ["rapid-transformation-therapy-session-1-hypnosis-session-hypnosis-recording"] },
    ],
  },
  {
    canonical_slug: "energetic-clearing-completed-remotely",
    title: "Energetic Clearing",
    collection: "start-here",
    program_type: "session",
    variants: [
      { label: "Single session", price_zar: 830, source_wc_slugs: ["energetic-clearing-completed-remotely", "energetic-clearing-completed-remotely-2"] },
      { label: "Package of 04", price_zar: 3155, source_wc_slugs: ["energetic-clearing-completed-remotely-package-of-4"] },
      { label: "Package of 08", price_zar: 5980, source_wc_slugs: ["energetic-clearing-completed-remotely-package-of-8"] },
      { label: "Package of 12", price_zar: 8470, source_wc_slugs: ["energetic-clearing-completed-remotely-package-of-12"] },
    ],
  },

  // ── Resonance Repatterning Programmes ────────────────────────────────────
  {
    canonical_slug: "resonance-repatterning-program-1-fundamentals-live-via-zoom",
    title: "Resonance Repatterning Program 1 — Fundamentals",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: ["resonance-repatterning-program-1-fundamentals-live-via-zoom", "resonance-repatterning-01-fundamentals-live-online"] },
      { label: "Live Retaker", price_zar: 2215, source_wc_slugs: ["resonance-repatterning-program-1-fundamentals-live-retaker-via-zoom"] },
      { label: "Self Study", price_zar: 3100, source_wc_slugs: ["resonance-repatterning-program-1-fundamentals-self-study", "resonance-repatterning-01-fundamentals-self-study-online", "resonance-repatterning-01-fundamentals-self-study-rr-online"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-program-2-primary-patterns-live-via-zoom",
    title: "Resonance Repatterning Program 2 — Primary Patterns",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: ["resonance-repatterning-program-2-primary-patterns-live-via-zoom", "resonance-repatterning-02-primary-patterns-live-online"] },
      { label: "Live Retaker", price_zar: 2215, source_wc_slugs: ["resonance-repatterning-program-2-primary-patterns-live-retaker-via-zoom"] },
      { label: "Self Study", price_zar: 3100, source_wc_slugs: ["resonance-repatterning-program-2-primary-patterns-self-study", "resonance-repatterning-02-primary-patterns-self-study-online", "resonance-repatterning-02-primary-patterns-self-study-rr-online"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-program-3-unconscious-patterns-live-via-zoom",
    title: "Resonance Repatterning Program 3 — Unconscious Patterns",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: ["resonance-repatterning-program-3-unconscious-patterns-live-via-zoom", "resonance-repatterning-03-unconscious-patterns-live"] },
      { label: "Live Retaker", price_zar: 2215, source_wc_slugs: ["resonance-repatterning-program-3-unconscious-patterns-live-retaker-via-zoom"] },
      { label: "Self Study", price_zar: 3100, source_wc_slugs: ["resonance-repatterning-program-3-unconscious-patterns-self-study", "resonance-repatterning-03-unconscious-patterns-self-study-online", "resonance-repatterning-03-unconscious-patterns-self-study-rr-online"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-program-4-chakra-patterns-live-via-zoom",
    title: "Resonance Repatterning Program 4 — Chakra Patterns",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: ["resonance-repatterning-program-4-chakra-patterns-live-via-zoom", "resonance-repatterning-04-chakra-patterns-live-online"] },
      { label: "Live Retaker", price_zar: 2215, source_wc_slugs: ["resonance-repatterning-program-4-chakra-patterns-live-retaker-via-zoom"] },
      { label: "Self Study", price_zar: 3100, source_wc_slugs: ["resonance-repatterning-program-4-chakra-patterns-self-study", "resonance-repatterning-04-chakra-patterns-self-study-online", "resonance-repatterning-04-chakra-patterns-self-study-rr-online"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-program-5-five-elements-meridians-live-via-zoom",
    title: "Resonance Repatterning Program 5 — Five Elements & Meridians",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: ["resonance-repatterning-program-5-five-elements-meridians-live-via-zoom", "resonance-repatterning-05-five-elements-meridians-live-online"] },
      { label: "Live Retaker", price_zar: 2215, source_wc_slugs: ["resonance-repatterning-program-5-five-elements-meridians-live-retaker-via-zoom"] },
      { label: "Self Study", price_zar: 3100, source_wc_slugs: ["resonance-repatterning-05-five-elements-meridians-self-study-online", "resonance-repatterning-05-five-elements-meridian-patterns-self-study-rr-online", "https-suzanneravenall-com-product-resonance-represonance-repatterning-program-5-five-elements-meridians-self-study"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study",
    title: "Resonance Repatterning Program 7 — Principles of Relationships",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Self Study", price_zar: 4205, source_wc_slugs: ["resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study",
    title: "Resonance Repatterning Program 9 — Energetics of Relationships",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Self Study", price_zar: 4205, source_wc_slugs: ["resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom",
    title: "Resonance Repatterning Full Basic Series Programs 1–5",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 5535, source_wc_slugs: [
        "resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom",
        "resonance-repatterning-full-basic-training-programs-1-5-demos-resources-live-via-zoom",
        "resonance-repatterning-full-basic-5-training-series-live-mentoring-copy",
      ]},
      { label: "Self Study", price_zar: 13950, source_wc_slugs: [
        "resonance-repatterning-full-basic-training-programs-1-5-demos-resources-self-study",
        "resonance-repatterning-full-basic-5-training-series-demos-self-study-online",
        "resonance-repatterning-full-basic-5-training-series-demos-self-study-online-with-mentoring",
        "resonance-repatterning-full-basic-5-training-series-demos-self-study-online-with-mentoring-2",
        "resonance-repatterning-full-basic-5-training-series-demos-self-study-rr-online",
        "resonance-repatterning-demos-talk-throughs-resources-of-basic-5-series-self-study-online-2",
      ]},
    ],
  },
  {
    canonical_slug: "resonance-repatterning-accelerated-basic-5-training-series-review-of-programs-1-5-live-via-zoom",
    title: "Resonance Repatterning Accelerated Basic 5 Review",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: [
        "resonance-repatterning-accelerated-basic-5-training-series-review-of-programs-1-5-live-via-zoom",
        "resonance-repatterning-accelerated-basic-5-training-series-part-2-live-online-v2",
      ]},
      { label: "Self Study", price_zar: 5315, source_wc_slugs: [
        "resonance-repatterning-accelerated-basic-5-training-series-review-of-programs-1-5-self-study",
      ]},
    ],
  },

  // ── Akashic Navigator Programmes ─────────────────────────────────────────
  {
    canonical_slug: "akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom",
    title: "Akashic Navigator Level 1 — Fundamentals",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 10295, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom",
        "akashic-intuitive-coach-live-online",
      ]},
      { label: "Live Retaker", price_zar: 2215, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-retaker-via-zoom",
      ]},
      { label: "Self Study", price_zar: 4650, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-self-study",
        "akashic-navigator-basic-self-study-online",
      ]},
    ],
  },
  {
    canonical_slug: "akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom",
    title: "Akashic Navigator Level 2 — Advanced",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 10295, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom",
      ]},
      { label: "Live Retaker", price_zar: 2215, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-retaker-via-zoom",
      ]},
      { label: "Self Study", price_zar: 4650, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-self-study",
        "akashic-navigator-advanced-self-study-online",
      ]},
    ],
  },
  {
    canonical_slug: "akashic-navigator-intuitive-coaching-fundamentals-advanced-purchased-together-live-via-zoom",
    title: "Akashic Navigator Level 1 & 2 — Purchased Together",
    collection: "deep-dive",
    program_type: "bundle",
    variants: [
      { label: "Live via Zoom", price_zar: 13360, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-fundamentals-advanced-purchased-together-live-via-zoom",
        "akashic-navigator-basic-advanced-purchased-together-live-online",
      ]},
      { label: "Live Retaker", price_zar: 1660, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-fundamentals-adv-purchased-together-live-retaker-zoom",
      ]},
      { label: "Self Study", price_zar: 7905, source_wc_slugs: [
        "akashic-navigator-intuitive-coaching-fundamentals-advanced-purchased-together-self-study",
        "akashic-navigator-basic-advanced-purchased-together-self-study-online",
      ]},
    ],
  },

  // ── Deep Energy Clearing Programmes ──────────────────────────────────────
  {
    canonical_slug: "deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom",
    title: "Deep Energy Clearing Level 1 — Fundamentals",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 7860, source_wc_slugs: [
        "deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom",
        "energy-clearing-level-1-fundamentals-clearing-self-live-online",
      ]},
      { label: "Live Retaker", price_zar: 3320, source_wc_slugs: [
        "deep-energy-clearing-fundamentals-clearing-self-level-1-live-retaker-via-zoom",
      ]},
      { label: "Self Study", price_zar: 4650, source_wc_slugs: [
        "deep-energy-clearing-fundamentals-clearing-self-level-1-self-study",
        "energy-clearing-level-1-self-clearing-self-study-online",
      ]},
    ],
  },
  {
    canonical_slug: "deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom",
    title: "Deep Energy Clearing Level 2 — Advanced",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 7860, source_wc_slugs: [
        "deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom",
        "energy-clearing-level-2-practitioner-clearing-others-live-online",
      ]},
      { label: "Live Retaker", price_zar: 3320, source_wc_slugs: [
        "deep-energy-clearing-advanced-clearing-others-level-2-live-retaker-via-zoom",
      ]},
      { label: "Self Study", price_zar: 4650, source_wc_slugs: [
        "deep-energy-clearing-advanced-clearing-others-level-2-self-study",
        "energy-clearing-level-2-clearing-others-self-study-online",
      ]},
    ],
  },

  // ── Life Enhancing Programmes ─────────────────────────────────────────────
  {
    canonical_slug: "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live",
    title: "Be an Energy Ninja Level 1",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 4980, source_wc_slugs: [
        "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live",
        "be-an-energy-ninja-mastering-energy-for-an-abundant-life-level-1-live-online",
      ]},
      { label: "Self Study", price_zar: 3320, source_wc_slugs: [
        "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-self-study",
      ]},
    ],
  },
  {
    canonical_slug: "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live",
    title: "Be an Energy Ninja Level 2",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 1660, source_wc_slugs: [
        "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live",
      ]},
    ],
  },
  {
    canonical_slug: "trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-your-adult-self-live",
    title: "Trauma to Transcendence",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 3320, source_wc_slugs: [
        "trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-your-adult-self-live",
      ]},
      { label: "Self Study", price_zar: 3500, source_wc_slugs: [
        "trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-your-adult-self-self-study",
      ]},
    ],
  },
  {
    canonical_slug: "finding-my-life-purpose-live",
    title: "Finding My Life Purpose",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 995, source_wc_slugs: ["finding-my-life-purpose-live"] },
      { label: "Self Study", price_zar: 995, source_wc_slugs: ["finding-my-life-purpose-self-study"] },
    ],
  },
  {
    canonical_slug: "love-relationships-live",
    title: "Love & Relationships",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 1610, source_wc_slugs: ["love-relationships-live"] },
      { label: "Self Study", price_zar: 995, source_wc_slugs: ["love-relationships-self-study"] },
    ],
  },
  {
    canonical_slug: "intuition-in-my-personal-capacity-live",
    title: "Intuition (Personal & Business Capacity)",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Personal Capacity — Live via Zoom", price_zar: 1610, source_wc_slugs: ["intuition-in-my-personal-capacity-live"] },
      { label: "Personal Capacity — Self Study", price_zar: 995, source_wc_slugs: ["intuition-in-my-personal-capacity-self-study"] },
      { label: "Business Capacity — Live via Zoom", price_zar: 1610, source_wc_slugs: ["intuition-in-my-business-capacity-live"] },
      { label: "Business Capacity — Self Study", price_zar: 995, source_wc_slugs: ["intuition-in-my-business-capacity-self-study"] },
    ],
  },
  {
    canonical_slug: "meditation-live-via-zoom",
    title: "Meditation",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 2770, source_wc_slugs: ["meditation-live-via-zoom"] },
      { label: "Self Study", price_zar: 1660, source_wc_slugs: ["meditation-self-study"] },
    ],
  },
  {
    canonical_slug: "mindfulness-live",
    title: "Mindfulness",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Live via Zoom", price_zar: 2770, source_wc_slugs: ["mindfulness-live"] },
      { label: "Self Study", price_zar: 1660, source_wc_slugs: ["mindfulness-self-study"] },
    ],
  },

  // ── Group Sessions ────────────────────────────────────────────────────────
  {
    canonical_slug: "group-session-attraction-frequency-recorded",
    title: "Group Session — Attraction Frequency",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Recorded series", price_zar: 1500, source_wc_slugs: ["group-session-attraction-frequency-recorded"] },
    ],
  },
  {
    canonical_slug: "group-session-being-a-great-boundary-setter-booked-as-a-series-only",
    title: "Group Session — Being a Great Boundary Setter",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Live (booked as series)", price_zar: 1500, source_wc_slugs: [
        "group-session-being-a-great-boundary-setter-booked-as-a-series-only",
        "being-a-great-boundry-setter-group-session",
      ]},
      { label: "Recorded series", price_zar: 1500, source_wc_slugs: [] },
    ],
  },
  {
    canonical_slug: "career-progression-group-session",
    title: "Group Session — Career Progression",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Live (booked as series)", price_zar: 1500, source_wc_slugs: ["group-session-career-progression"] },
      { label: "Recorded series", price_zar: 1500, source_wc_slugs: ["career-progression-group-session"] },
    ],
  },
  {
    canonical_slug: "group-session-develop-super-confidence",
    title: "Group Session — Develop Super Confidence",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Live", price_zar: 1500, source_wc_slugs: ["group-session-develop-super-confidence"] },
      { label: "Recorded series", price_zar: 1500, source_wc_slugs: ["group-session-develop-super-confidence-recorded"] },
    ],
  },
  {
    canonical_slug: "love-relationships-group-session",
    title: "Group Session — Love & Relationships",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Live (booked as series)", price_zar: 1500, source_wc_slugs: ["group-session-love-relationships"] },
      { label: "Recorded series", price_zar: 1500, source_wc_slugs: ["love-relationships-group-session"] },
    ],
  },
  {
    canonical_slug: "money-mastery-group-session",
    title: "Group Session — Money Mastery",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Live (booked as series)", price_zar: 1500, source_wc_slugs: ["group-session-money-mastery"] },
      { label: "Recorded series", price_zar: 1500, source_wc_slugs: ["money-mastery-group-session"] },
    ],
  },
  {
    canonical_slug: "group-session-nice-or-not-nice-in-communication-booked-as-a-series-only",
    title: "Group Session — Nice or Not Nice in Communication",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Live (booked as series)", price_zar: 1500, source_wc_slugs: [
        "group-session-nice-or-not-nice-in-communication-booked-as-a-series-only",
        "group-session-nice-or-not-nice-in-communication-available-as-recorded-series",
      ]},
    ],
  },
  {
    canonical_slug: "group-session-shedding-excess-weight",
    title: "Group Session — Shedding Excess Weight",
    collection: "deep-dive",
    program_type: "group",
    variants: [
      { label: "Live (booked as series)", price_zar: 1500, source_wc_slugs: ["group-session-shedding-excess-weight-booked-as-a-series-only"] },
      { label: "Recorded series", price_zar: 1500, source_wc_slugs: ["group-session-shedding-excess-weight"] },
    ],
  },

  // ── Other Programmes ──────────────────────────────────────────────────────
  {
    canonical_slug: "coherence-muscle-testing-self-study-online-2",
    title: "Coherence Muscle Testing",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Self Study", price_zar: 1610, source_wc_slugs: [
        "coherence-muscle-testing-self-study-online-2",
        "how-to-muscle-check-self-study-online",
      ]},
    ],
  },
  {
    canonical_slug: "resonance-repatterning-all-repatternings-as-demos-talk-throughs-resources-self-study",
    title: "Resonance Repatterning — All Demos & Talk Throughs",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      { label: "Self Study", price_zar: 3210, source_wc_slugs: [
        "resonance-repatterning-all-repatternings-as-demos-talk-throughs-resources-self-study",
      ]},
    ],
  },
  {
    canonical_slug: "post-traumatic-growth-self-study-online",
    title: "Post Traumatic Growth",
    collection: "start-here",
    program_type: "course",
    variants: [
      { label: "Self Study", price_zar: 220, source_wc_slugs: ["post-traumatic-growth-self-study-online"] },
    ],
  },
  {
    canonical_slug: "the-latest-book-by-suzanne",
    title: "The Latest Book By Suzanne",
    collection: "start-here",
    program_type: "bundle",
    variants: [
      { label: "Pre-order", price_zar: 165, source_wc_slugs: ["the-latest-book-by-suzanne"] },
    ],
  },
  {
    canonical_slug: "quantum-healing-codes-ebook-audio-download",
    title: "Quantum Healing Codes",
    collection: "start-here",
    program_type: "course",
    variants: [
      { label: "eBook & Audio Download", price_zar: 345, source_wc_slugs: ["quantum-healing-codes-ebook-audio-download"] },
    ],
  },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface WcCategory {
  id: number
  name: string
  slug: string
}

interface WcAttribute {
  name: string
  options?: string[]
  option?: string
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

interface ProductToCreate {
  source: "consolidated" | "standalone"
  canonical_slug: string
  title: string
  collection: string
  collection_id: string | null
  variant_count: number
  absorbed_wc_slugs: string[]
  wc_id: number | null
  no_description: boolean
  payload: MedusaProductPayload
}

interface RedirectEntry {
  from_slug: string
  to_slug: string
}

interface AuthResponse {
  token: string
}

interface MedusaProductResponse {
  product: { id: string; handle: string; title: string }
}

interface MedusaProductListResponse {
  products: Array<{ id: string; handle: string; title: string }>
}

interface MedusaCollectionListResponse {
  collections: MedusaCollection[]
}

// ── Source slug index ─────────────────────────────────────────────────────────

function buildSourceSlugIndex(): Set<string> {
  const index = new Set<string>()
  const seen = new Map<string, string>()

  for (const entry of CONSOLIDATION_MAP) {
    for (const variant of entry.variants) {
      for (const slug of variant.source_wc_slugs) {
        if (slug === "") continue
        if (seen.has(slug)) {
          console.warn(`  Warning: slug "${slug}" appears in both "${seen.get(slug)}" and "${entry.canonical_slug}"`)
        } else {
          seen.set(slug, entry.canonical_slug)
          index.add(slug)
        }
      }
    }
  }

  return index
}

// ── Redirect map builder ──────────────────────────────────────────────────────

function buildRedirectMap(): RedirectEntry[] {
  const redirects: RedirectEntry[] = []

  for (const entry of CONSOLIDATION_MAP) {
    for (const variant of entry.variants) {
      for (const slug of variant.source_wc_slugs) {
        if (slug !== "" && slug !== entry.canonical_slug) {
          redirects.push({ from_slug: slug, to_slug: entry.canonical_slug })
        }
      }
    }
  }

  return redirects
}

// ── Payload builders ──────────────────────────────────────────────────────────

function priceInCents(zarAmount: number): number {
  return Math.round(zarAmount * 100)
}

function priceStrInCents(priceStr: string): number {
  const parsed = parseFloat(priceStr)
  return isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed * 100)
}

function buildConsolidatedPayload(
  entry: ConsolidationEntry,
  collectionId: string | null
): MedusaProductPayload {
  const multiVariant = entry.variants.length > 1

  const options: MedusaOptionInput[] = multiVariant
    ? [{ title: "Option", values: entry.variants.map((v) => v.label) }]
    : []

  const variants: MedusaVariantInput[] = entry.variants.map((v) => ({
    title: multiVariant ? v.label : "Default",
    prices: [{ amount: priceInCents(v.price_zar), currency_code: "zar" }],
    options: multiVariant ? { Option: v.label } : undefined,
  }))

  return {
    title: entry.title,
    handle: entry.canonical_slug,
    description: "",
    status: "published",
    collection_id: collectionId,
    options,
    variants,
  }
}

function buildStandalonePayload(
  product: WcProduct,
  collectionId: string | null
): MedusaProductPayload {
  const variants: MedusaVariantInput[] = [
    {
      title: "Default",
      prices: [{ amount: priceStrInCents(product.price), currency_code: "zar" }],
    },
  ]

  return {
    title: product.name,
    handle: product.slug,
    description: "",
    status: "published",
    collection_id: collectionId,
    options: [],
    variants,
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function medusaRequest<T>(
  urlPath: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${MEDUSA_BASE}${urlPath}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${options.method ?? "GET"} ${urlPath} → ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

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
  for (const filename of ["products_page1.json", "products_page2.json", "products_page3.json"]) {
    const filePath = path.join(SOURCE_DIR, filename)
    if (!fs.existsSync(filePath)) continue
    try {
      const products = JSON.parse(fs.readFileSync(filePath, "utf8")) as Array<{
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

function resolveCollectionForStandalone(
  product: WcProduct,
  collectionHandleToId: Record<string, string>
): { handle: string; id: string | null } {
  let resolvedHandle = DEFAULT_COLLECTION
  for (const cat of product.categories) {
    const handle = CATEGORY_TO_COLLECTION[cat.id]
    if (handle !== undefined && handle !== DEFAULT_COLLECTION) {
      resolvedHandle = handle
      break
    } else if (handle !== undefined) {
      resolvedHandle = handle
    }
  }
  return { handle: resolvedHandle, id: collectionHandleToId[resolvedHandle] ?? null }
}

// ── Log helpers ───────────────────────────────────────────────────────────────

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8")
}

// ── Main migration ────────────────────────────────────────────────────────────

async function migrate(): Promise<void> {
  const startedAt = new Date().toISOString()

  log(`WooCommerce → Medusa migration starting (consolidation edition)`)
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE — writes will happen"}`)
  log(`Medusa base URL: ${MEDUSA_BASE}`)

  // ── Load audit JSON ─────────────────────────────────────────────────────────

  if (!fs.existsSync(AUDIT_FILE)) {
    throw new Error(`Audit file not found: ${AUDIT_FILE}`)
  }
  const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8")) as WcAuditJson
  const wcProducts = audit.products
  log(`Loaded ${wcProducts.length} products from audit (fetched ${audit.fetched_at})`)

  // ── Build source slug index ─────────────────────────────────────────────────

  const sourceSlugIndex = buildSourceSlugIndex()
  log(`Source slug index: ${sourceSlugIndex.size} WC slugs absorbed by consolidation map`)

  // ── Connect to Medusa ───────────────────────────────────────────────────────

  let token: string | null = null
  let collectionHandleToId: Record<string, string> = {}
  let medusaReachable = false
  let medusaAuthOk = false

  try {
    log("Authenticating to Medusa Admin API...")
    token = await authenticate()
    medusaAuthOk = true
    log("Authenticated successfully")
    collectionHandleToId = await fetchMedusaCollections(token)
    medusaReachable = true
    log(`Found ${Object.keys(collectionHandleToId).length} collections: ${Object.keys(collectionHandleToId).join(", ")}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log(`Warning: Medusa connection issue (${message}) — collection IDs will be null`)
    log("Continuing with offline mode")
  }

  // ── Build redirect map ──────────────────────────────────────────────────────

  const redirectMap = buildRedirectMap()
  log(`Redirect map: ${redirectMap.length} entries`)

  // ── Phase 1: Consolidated products ─────────────────────────────────────────

  const productsToCreate: ProductToCreate[] = []
  const skipped: SkippedProduct[] = []
  let alreadyExistsCount = 0

  log(`Processing ${CONSOLIDATION_MAP.length} consolidation map entries...`)

  for (const entry of CONSOLIDATION_MAP) {
    const collectionId = collectionHandleToId[entry.collection] ?? null

    let alreadyExists = false
    if (token !== null && medusaReachable) {
      try {
        alreadyExists = await productExistsByHandle(entry.canonical_slug, token)
      } catch {
        log(`  Warning: could not check existence for "${entry.canonical_slug}"`)
      }
    }

    if (alreadyExists) {
      alreadyExistsCount++
      skipped.push({ wc_id: -1, name: entry.title, reason: "already_exists" })
      continue
    }

    const allSourceSlugs = entry.variants.flatMap((v) => v.source_wc_slugs).filter((s) => s !== "")

    productsToCreate.push({
      source: "consolidated",
      canonical_slug: entry.canonical_slug,
      title: entry.title,
      collection: entry.collection,
      collection_id: collectionId,
      variant_count: entry.variants.length,
      absorbed_wc_slugs: allSourceSlugs,
      wc_id: null,
      no_description: true,
      payload: buildConsolidatedPayload(entry, collectionId),
    })
  }

  // ── Phase 2: Standalone WC products ────────────────────────────────────────

  const externalProducts: ExternalProduct[] = []
  const externalUrlMap = loadExternalUrlMap()

  const skipCounts: Record<SkipReason, number> = {
    not_published: 0,
    excluded_category_73: 0,
    empty_slug: 0,
    type_external: 0,
    type_grouped: 0,
    test_product: 0,
  }

  const standaloneCount = { total: 0, by_collection: {} as Record<string, number> }

  for (const product of wcProducts) {
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
      skipped.push({ wc_id: product.id, name: product.name, reason: skipReason })
      continue
    }

    // Already absorbed into a consolidated product
    if (sourceSlugIndex.has(product.slug)) continue

    // This product is not absorbed — create as standalone
    let alreadyExists = false
    if (token !== null && medusaReachable) {
      try {
        alreadyExists = await productExistsByHandle(product.slug, token)
      } catch {
        log(`  Warning: could not check existence for standalone "${product.slug}"`)
      }
    }

    if (alreadyExists) {
      alreadyExistsCount++
      skipped.push({ wc_id: product.id, name: product.name, reason: "already_exists" })
      continue
    }

    const col = resolveCollectionForStandalone(product, collectionHandleToId)
    const hasNoDescription = product.description_length === 0 && product.short_description_length === 0

    standaloneCount.total++
    standaloneCount.by_collection[col.handle] = (standaloneCount.by_collection[col.handle] ?? 0) + 1

    productsToCreate.push({
      source: "standalone",
      canonical_slug: product.slug,
      title: product.name,
      collection: col.handle,
      collection_id: col.id,
      variant_count: 1,
      absorbed_wc_slugs: [],
      wc_id: product.id,
      no_description: hasNoDescription,
      payload: buildStandalonePayload(product, col.id),
    })
  }

  // ── Write external products file ────────────────────────────────────────────

  writeJson(path.join(MIGRATIONS_DIR, "skipped-external-products.json"), {
    skipped_at: startedAt,
    count: externalProducts.length,
    note: "External products excluded from Medusa migration. Will become static /resources page.",
    products: externalProducts,
  })

  // ── Write redirect map ──────────────────────────────────────────────────────

  writeJson(path.join(MIGRATIONS_DIR, "redirect-map.json"), {
    generated_at: startedAt,
    note: "301 redirects for Task 1.9 — from WC slug to new Medusa canonical handle",
    count: redirectMap.length,
    redirects: redirectMap,
  })
  log(`Written: redirect-map.json (${redirectMap.length} entries)`)

  const consolidatedCount = productsToCreate.filter((p) => p.source === "consolidated").length
  const byCollection: Record<string, number> = {}
  for (const p of productsToCreate) {
    byCollection[p.collection] = (byCollection[p.collection] ?? 0) + 1
  }

  // ── Dry run ─────────────────────────────────────────────────────────────────

  if (DRY_RUN) {
    const report = {
      dry_run: true,
      generated_at: startedAt,
      summary: {
        total_wc_in_audit: wcProducts.length,
        consolidated_products: consolidatedCount,
        standalone_products: standaloneCount.total,
        total_medusa_products: productsToCreate.length,
        already_exists_in_medusa: alreadyExistsCount,
        redirect_map_entries: redirectMap.length,
        wc_skip_reasons: skipCounts,
        by_collection: byCollection,
        medusa_reachable: medusaReachable,
        medusa_auth_ok: medusaAuthOk,
      },
      products_to_create: productsToCreate,
      skipped,
    }

    writeJson(path.join(MIGRATIONS_DIR, "wc-migration-dry-run-final.json"), report)
    log(`Written: wc-migration-dry-run-final.json`)

    log("")
    log("=== DRY RUN SUMMARY ===")
    log(`Total WC products in audit:    ${wcProducts.length}`)
    log(`Consolidated Medusa products:  ${consolidatedCount}`)
    log(`Standalone Medusa products:    ${standaloneCount.total}`)
    log(`Total Medusa products:         ${productsToCreate.length}`)
    log(`Already exists (skipped):      ${alreadyExistsCount}`)
    log(`Redirect map entries:          ${redirectMap.length}`)
    log("")
    log("WC skip reasons:")
    log(`  not_published:               ${skipCounts.not_published}`)
    log(`  excluded_category_73:        ${skipCounts.excluded_category_73}`)
    log(`  empty_slug:                  ${skipCounts.empty_slug}`)
    log(`  type_external:               ${skipCounts.type_external}`)
    log(`  type_grouped:                ${skipCounts.type_grouped}`)
    log(`  test_product:                ${skipCounts.test_product}`)
    log("")
    log("By collection (to create):")
    for (const [handle, count] of Object.entries(byCollection)) {
      log(`  ${handle.padEnd(18)} ${count}`)
    }
    log("")
    log("Consolidated products:")
    for (const p of productsToCreate.filter((x) => x.source === "consolidated")) {
      log(`  ${p.title.padEnd(60)} ${p.variant_count} variant(s)  → ${p.canonical_slug}`)
    }
    if (standaloneCount.total > 0) {
      log("")
      log("Standalone products:")
      for (const p of productsToCreate.filter((x) => x.source === "standalone")) {
        log(`  [WC #${p.wc_id}] ${p.title}  (${p.collection})  → ${p.canonical_slug}`)
      }
    }
    log("")
    log(`Medusa reachable: ${medusaReachable}`)
    log(`Medusa auth OK:   ${medusaAuthOk}`)
    log("")
    log("DRY RUN complete — no products written to Medusa.")
    log("Run with DRY_RUN=false to migrate.")
    return
  }

  // ── Live migration ──────────────────────────────────────────────────────────

  if (!token) {
    throw new Error("Medusa authentication failed — cannot run live migration.")
  }

  log(`Starting live migration of ${productsToCreate.length} products...`)

  const migrated: Array<{ slug: string; medusa_id: string; source: string }> = []
  const errors: Array<{ slug: string; name: string; error: string }> = []

  for (let i = 0; i < productsToCreate.length; i++) {
    const product = productsToCreate[i]
    if (product === undefined) continue

    try {
      const exists = await productExistsByHandle(product.canonical_slug, token)
      if (exists) {
        log(`  Skipping "${product.title}" — already exists`)
        skipped.push({ wc_id: product.wc_id ?? -1, name: product.title, reason: "already_exists" })
        continue
      }

      const apiPayload: Record<string, unknown> = {
        title: product.payload.title,
        handle: product.payload.handle,
        description: product.payload.description,
        status: product.payload.status,
        collection_id: product.payload.collection_id,
      }
      if (product.payload.options.length > 0) apiPayload.options = product.payload.options
      if (product.payload.variants.length > 0) apiPayload.variants = product.payload.variants

      const response = await medusaRequest<MedusaProductResponse>(
        "/admin/products",
        { method: "POST", body: JSON.stringify(apiPayload) },
        token
      )

      migrated.push({
        slug: product.canonical_slug,
        medusa_id: response.product.id,
        source: product.source,
      })

      log(`  [${migrated.length}/${productsToCreate.length}] Created "${product.title}" → ${response.product.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log(`  ERROR creating "${product.title}": ${message}`)
      errors.push({ slug: product.canonical_slug, name: product.title, error: message })
    }
  }

  log("")
  log(`Migration complete. Migrated: ${migrated.length}  Skipped: ${skipped.length}  Errors: ${errors.length}`)

  const resultsPath = path.join(MIGRATIONS_DIR, "wc-migration-results.json")
  writeJson(resultsPath, { migrated_at: startedAt, migrated, skipped, errors })
  log(`Results written to: ${resultsPath}`)

  if (errors.length > 0) {
    log("")
    log("ERRORS — the following products failed:")
    for (const e of errors) log(`  "${e.name}" (${e.slug}): ${e.error}`)
    log("")
    log("ROLLBACK: DELETE /admin/products/{medusa_id} for each entry in wc-migration-results.json")
    process.exit(1)
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

migrate().catch((err: unknown) => {
  console.error("Migration failed:", err instanceof Error ? err.message : err)
  process.exit(1)
})
