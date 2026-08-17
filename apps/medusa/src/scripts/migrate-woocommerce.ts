/**
 * WooCommerce → Medusa v2 Product Migration — Consolidation Edition
 *
 * Groups related WooCommerce products into single Medusa products with variants
 * using the CONSOLIDATION_MAP. Any WC product not absorbed becomes standalone.
 * Produces a 301 redirect map at infra/scripts/migrations/redirect-map.json.
 *
 * KI006 (August 2026): the 15 legitimate products that WooCommerce had parked
 * in category 73 ("not used-Akashic Coaching") are now covered by explicit
 * CONSOLIDATION_MAP entries (Program 6 Inner Cultivation, Program 7/9 Live
 * variants, Deep Energy Clearing Purchased Together, Practitioner Mentorship,
 * and the Growth Booster add-ons). The category-73 exclusion rule still stands
 * for the remaining junk in that category (drafts, price-R5 test rows, the
 * legacy "Suzanne Ravenall Coaching App" stub). Because consolidated entries
 * are created from the map, not from the audit scan, the exclusion rule cannot
 * drop them, and the rule prevents phase 2 from creating duplicates.
 *
 * Idempotency: products are matched by handle and skipped when present. When a
 * product exists but the map defines variants it does not have yet (e.g.
 * Program 7/9 gained a "Live via Zoom" variant), the missing variants are
 * added to the existing product (option values updated first) — re-running is
 * always safe and never duplicates products or variants.
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
  /**
   * Plain-text storefront description. Optional — the original 48 entries
   * predate this field and keep "" (their live descriptions are curated by
   * infra/scripts/update-product-descriptions.mjs). KI006 rescue entries
   * carry copy derived from the WooCommerce source data.
   */
  description?: string
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
  // KI006: Program 6 was stranded in WC category 73 and never migrated.
  {
    canonical_slug: "resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom",
    title: "Resonance Repatterning Program 6 — Inner Cultivation",
    collection: "deep-dive",
    program_type: "course",
    description:
      "Within each individual lies the seed of Dao: a divine essence, an inner path that depends on us to nurture it. " +
      "Over 4 sessions of 3.5 to 4 hours, this programme offers practice of each of the 12 Inner Cultivation repatternings, " +
      "transforming disturbed emotions and reconnecting you to your true self.\n\n" +
      "Prerequisite: the Inner Cultivation home-study material from the RRII Home Study website, completed before taking this course. " +
      "Available Live via Zoom or as Self Study.",
    variants: [
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: [
        "resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom",
        "resonance-repatterning-06-inner-cultivation-live-online",
        "resonance-repatterning-06-inner-cultivation-live-online-3",
      ]},
      { label: "Self Study", price_zar: 4205, source_wc_slugs: [
        "resonance-repatterning-program-6-inner-cultivation-practical-demos-self-study",
      ]},
    ],
  },
  {
    canonical_slug: "resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study",
    title: "Resonance Repatterning Program 7 — Principles of Relationships",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      // KI006: the Live product sat in WC category 73 — added as a variant here.
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: ["resonance-repatterning-program-7-principles-of-relationships-practical-demos-live-via-zoom"] },
      { label: "Self Study", price_zar: 4205, source_wc_slugs: ["resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study"] },
    ],
  },
  {
    canonical_slug: "resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study",
    title: "Resonance Repatterning Program 9 — Energetics of Relationships",
    collection: "deep-dive",
    program_type: "course",
    variants: [
      // KI006: the Live product sat in WC category 73 — added as a variant here.
      { label: "Live via Zoom", price_zar: 5315, source_wc_slugs: ["resonance-repatterning-program-9-energetics-of-relationships-practical-demos-live-via-zoom"] },
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
  // KI006: the "Purchased Together" bundle sat in WC category 73 and was never
  // migrated. Mirrors the Akashic Navigator Level 1 & 2 bundle pattern.
  {
    canonical_slug: "deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom",
    title: "Deep Energy Clearing Level 1 & 2 — Purchased Together",
    collection: "deep-dive",
    program_type: "bundle",
    description:
      "Deep Energy Clearing Fundamentals (Level 1, Clearing Self) and Advanced (Level 2, Clearing Others) purchased together at a bundled price. " +
      "Level 1 covers techniques to clear yourself and your projects at a deep level, practical tools to recognise and shift non-coherent energies, " +
      "and methods for grounding and running energy effectively. Level 2 covers protecting yourself from absorbing others' energies and clearing " +
      "energy at a core level for people, animals, projects, businesses and spaces, including the ethics of permission.\n\n" +
      "Prerequisite: proficiency in muscle checking or pendulum use. The Coherence Muscle Testing (Self Study) course will prepare you to attend.",
    variants: [
      { label: "Live via Zoom", price_zar: 17500, source_wc_slugs: [
        "deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom",
      ]},
      { label: "Live Retaker", price_zar: 1660, source_wc_slugs: [
        "deep-energy-clearing-fundamentals-advanced-purchased-together-live-retaker-via-zoom",
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

  // ── KI006 rescue: Practitioner support & Growth Booster add-ons ───────────
  // These 10 published WC products (category 177 "Product Add-ons : Growth
  // Boosters" and the Practitioner Mentorship set) were also tagged with the
  // excluded category 73 and silently dropped by the Task 2.3 migration.
  {
    canonical_slug: "mentorship-single-session-live",
    title: "Practitioner Mentorship",
    collection: "practitioner",
    program_type: "session",
    description:
      "Structured support for practitioners via a monthly 1-hour group mentorship session, held on the last Wednesday of every month " +
      "at 4pm South African time. A space to ask questions, explore new insights, practise your skills and receive guidance that keeps " +
      "you moving forward. Available as single sessions or as a bundle of 5 monthly sessions, in Live or Self Study format.",
    variants: [
      { label: "Single Session (Live)", price_zar: 575, source_wc_slugs: ["mentorship-single-session-live"] },
      { label: "Single Session (Self Study)", price_zar: 575, source_wc_slugs: ["mentorship-single-session-self-study"] },
      { label: "Bundle of 5 Sessions (Live)", price_zar: 1900, source_wc_slugs: ["mentorship-bundle-of-5-sessions-live"] },
      { label: "Bundle of 5 Sessions (Self Study)", price_zar: 1900, source_wc_slugs: ["mentorship-bundle-of-5-sessions-self-study"] },
    ],
  },
  {
    canonical_slug: "email-support",
    title: "Email Support",
    collection: "start-here",
    program_type: "addon",
    description:
      "Direct access to personalised email support: one email a week for feedback, advice, or answers to questions between sessions. " +
      "Whether it is clarity on something discussed, new challenges, or a moment of encouragement, this add-on keeps you moving forward. " +
      "Priced per month; choose the number of months you need.",
    variants: [
      { label: "Per month", price_zar: 200, source_wc_slugs: ["email-support"] },
    ],
  },
  {
    canonical_slug: "coaching-support-package",
    title: "Coaching Support Package",
    collection: "start-here",
    program_type: "addon",
    description:
      "1-on-1 monthly coaching to dive deeper into the areas that matter most to you: unpacking challenges, refining strategies and " +
      "clearing roadblocks. Each session is crafted to meet your evolving needs. Priced per session; a minimum of 6 sessions at one " +
      "per month is recommended.",
    variants: [
      { label: "Per session", price_zar: 1660, source_wc_slugs: ["coaching-support-package"] },
    ],
  },
  {
    canonical_slug: "vip-package",
    title: "VIP Package",
    collection: "start-here",
    program_type: "addon",
    description:
      "A single monthly VIP session of 1 hour plus priority access via email. Includes unlimited email support between sessions and " +
      "direct contact for real-time guidance to keep you aligned, inspired, and progressing consistently. Priced per month; best " +
      "combined with a package of transformation coaching sessions (minimum of 6 recommended).",
    variants: [
      { label: "Per month", price_zar: 1500, source_wc_slugs: ["vip-package"] },
    ],
  },
  {
    canonical_slug: "bonus-lifetime-access-self-study-online",
    title: "Bonus Lifetime Access",
    collection: "start-here",
    program_type: "addon",
    description:
      "Add lifetime access to the self-study programme for the level you have purchased. This bonus package complements the live " +
      "seminar, allowing you to revisit key concepts and continue your practice at your own pace after the event. Priced per " +
      "programme level.",
    variants: [
      { label: "Per programme level", price_zar: 2060, source_wc_slugs: ["bonus-lifetime-access-self-study-online"] },
    ],
  },
  {
    canonical_slug: "ravenall-institute-certification-observation-fee",
    title: "Ravenall Institute Certification Observation Fee",
    collection: "practitioner",
    program_type: "addon",
    description:
      "Advance your journey to becoming a certified practitioner. Complete your observation to achieve Practitioner Level, gain " +
      "valuable feedback to enhance your skills and demonstrate your expertise. An essential step toward certification and " +
      "professional growth.",
    variants: [
      { label: "Once-off", price_zar: 2800, source_wc_slugs: ["ravenall-institute-certification-observation-fee"] },
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
  // Medusa v2 defaults manage_inventory to true, which breaks complete-cart
  // when no stock location is linked to the sales channel. Only the
  // capacity-limited group-session "Live" seat variants track inventory
  // (12-seat cap, seeded by seed-group-session-inventory.ts) — everything
  // else is digital/service and must be created with manage_inventory: false.
  manage_inventory: boolean
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

interface MedusaProductDetail {
  id: string
  handle: string
  title: string
  variants: Array<{ id: string; title: string | null }> | null
  options: Array<{
    id: string
    title: string
    values: Array<{ id: string; value: string }> | null
  }> | null
}

interface MedusaProductDetailListResponse {
  products: MedusaProductDetail[]
}

/** An existing Medusa product that the map says needs extra variants. */
interface VariantSync {
  entry: ConsolidationEntry
  product_id: string
  missing: ConsolidationVariant[]
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
  const options: MedusaOptionInput[] = [
    { title: "Option", values: entry.variants.map((v) => v.label) },
  ]

  const variants: MedusaVariantInput[] = entry.variants.map((v) => ({
    title: v.label,
    prices: [{ amount: priceInCents(v.price_zar), currency_code: "zar" }],
    options: { Option: v.label },
    // Only group-session "Live" seats are capacity-limited (12-seat cap).
    // Gate on program_type — other programs also have "Live via Zoom"
    // variants that must NOT track inventory (see apps/web/lib/inventory/
    // group-sessions.ts for the same reasoning on the storefront side).
    // seed-group-session-inventory.ts seeds the actual levels afterwards.
    manage_inventory: variantManagesInventory(entry, v.label),
  }))

  return {
    title: entry.title,
    handle: entry.canonical_slug,
    description: entry.description ?? "",
    status: "published",
    collection_id: collectionId,
    options,
    variants,
  }
}

/**
 * Which of an entry's mapped variants are missing from the product that
 * already exists in Medusa (matched by variant title)? Pure — unit tested.
 */
function computeMissingVariants(
  entry: ConsolidationEntry,
  existingVariantTitles: Array<string | null>
): ConsolidationVariant[] {
  const existing = new Set(
    existingVariantTitles.filter((t): t is string => t !== null)
  )
  return entry.variants.filter((v) => !existing.has(v.label))
}

/** The manage_inventory rule, in one place for creation and variant sync. */
function variantManagesInventory(entry: ConsolidationEntry, label: string): boolean {
  return entry.program_type === "group" && label.startsWith("Live")
}

function buildStandalonePayload(
  product: WcProduct,
  collectionId: string | null
): MedusaProductPayload {
  return {
    title: product.name,
    handle: product.slug,
    description: "",
    status: "published",
    collection_id: collectionId,
    options: [{ title: "Option", values: ["Default"] }],
    variants: [
      {
        title: "Default",
        prices: [{ amount: priceStrInCents(product.price), currency_code: "zar" }],
        options: { Option: "Default" },
        // Standalone WC products are digital/service — never inventory-tracked.
        manage_inventory: false,
      },
    ],
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

async function fetchProductByHandle(
  handle: string,
  token: string
): Promise<MedusaProductDetail | null> {
  const encoded = encodeURIComponent(handle)
  const data = await medusaRequest<MedusaProductDetailListResponse>(
    `/admin/products?handle=${encoded}&limit=1` +
      `&fields=id,title,handle,variants.id,variants.title,options.id,options.title,options.values.id,options.values.value`,
    {},
    token
  )
  return data.products[0] ?? null
}

/**
 * Add the map-defined variants that an existing product is missing.
 * 1. Extends the product option's value list with the new labels.
 * 2. Creates each missing variant with its ZAR price and the same
 *    manage_inventory rule used at creation time.
 * Safe to re-run: callers only pass variants whose titles are absent.
 */
async function addMissingVariants(sync: VariantSync, token: string): Promise<void> {
  const product = await fetchProductByHandle(sync.entry.canonical_slug, token)
  if (product === null) {
    throw new Error(`Product "${sync.entry.canonical_slug}" disappeared between check and sync`)
  }

  const option = product.options?.find((o) => o.title === "Option") ?? product.options?.[0]
  if (option === undefined) {
    throw new Error(`Product "${product.handle}" has no options — cannot add variants`)
  }

  const existingValues = (option.values ?? []).map((v) => v.value)
  const newValues = sync.missing
    .map((m) => m.label)
    .filter((label) => !existingValues.includes(label))

  if (newValues.length > 0) {
    await medusaRequest(
      `/admin/products/${product.id}/options/${option.id}`,
      {
        method: "POST",
        body: JSON.stringify({ values: [...existingValues, ...newValues] }),
      },
      token
    )
  }

  for (const m of sync.missing) {
    await medusaRequest(
      `/admin/products/${product.id}/variants`,
      {
        method: "POST",
        body: JSON.stringify({
          title: m.label,
          options: { [option.title]: m.label },
          prices: [{ amount: priceInCents(m.price_zar), currency_code: "zar" }],
          manage_inventory: variantManagesInventory(sync.entry, m.label),
        }),
      },
      token
    )
  }
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
  const variantSyncs: VariantSync[] = []
  let alreadyExistsCount = 0

  log(`Processing ${CONSOLIDATION_MAP.length} consolidation map entries...`)

  for (const entry of CONSOLIDATION_MAP) {
    const collectionId = collectionHandleToId[entry.collection] ?? null

    let existing: MedusaProductDetail | null = null
    if (token !== null && medusaReachable) {
      try {
        existing = await fetchProductByHandle(entry.canonical_slug, token)
      } catch {
        log(`  Warning: could not check existence for "${entry.canonical_slug}"`)
      }
    }

    if (existing !== null) {
      alreadyExistsCount++
      // The product exists — but the map may define variants it predates
      // (KI006: Program 7/9 gained a "Live via Zoom" variant). Sync those
      // instead of skipping outright, so re-runs stay idempotent at the
      // variant level too.
      const missing = computeMissingVariants(
        entry,
        (existing.variants ?? []).map((v) => v.title)
      )
      if (missing.length > 0) {
        variantSyncs.push({ entry, product_id: existing.id, missing })
        log(`  "${entry.title}" exists but is missing ${missing.length} variant(s): ${missing.map((m) => m.label).join(", ")}`)
      } else {
        skipped.push({ wc_id: -1, name: entry.title, reason: "already_exists" })
      }
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
        existing_products_needing_variants: variantSyncs.length,
        redirect_map_entries: redirectMap.length,
        wc_skip_reasons: skipCounts,
        by_collection: byCollection,
        medusa_reachable: medusaReachable,
        medusa_auth_ok: medusaAuthOk,
      },
      products_to_create: productsToCreate,
      variants_to_add: variantSyncs.map((s) => ({
        handle: s.entry.canonical_slug,
        title: s.entry.title,
        missing_variants: s.missing.map((m) => ({ label: m.label, price_zar: m.price_zar })),
      })),
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
    log(`Existing needing variants:     ${variantSyncs.length}`)
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
    if (variantSyncs.length > 0) {
      log("")
      log("Existing products that would gain variants:")
      for (const s of variantSyncs) {
        log(`  ${s.entry.title}  (${s.entry.canonical_slug})  + ${s.missing.map((m) => `"${m.label}" R${m.price_zar}`).join(", ")}`)
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

  // ── Variant sync on existing products (KI006: Program 7/9 Live variants) ───

  const variantsAdded: Array<{ handle: string; added: string[] }> = []

  for (const sync of variantSyncs) {
    try {
      await addMissingVariants(sync, token)
      variantsAdded.push({
        handle: sync.entry.canonical_slug,
        added: sync.missing.map((m) => m.label),
      })
      log(`  Added ${sync.missing.length} variant(s) to existing "${sync.entry.title}": ${sync.missing.map((m) => m.label).join(", ")}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log(`  ERROR adding variants to "${sync.entry.title}": ${message}`)
      errors.push({ slug: sync.entry.canonical_slug, name: sync.entry.title, error: message })
    }
  }

  log("")
  log(`Migration complete. Migrated: ${migrated.length}  Variant syncs: ${variantsAdded.length}  Skipped: ${skipped.length}  Errors: ${errors.length}`)

  const resultsPath = path.join(MIGRATIONS_DIR, "wc-migration-results.json")
  writeJson(resultsPath, { migrated_at: startedAt, migrated, variants_added: variantsAdded, skipped, errors })
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

// ── Exports (unit tests) ──────────────────────────────────────────────────────

export {
  CONSOLIDATION_MAP,
  buildSourceSlugIndex,
  buildRedirectMap,
  buildConsolidatedPayload,
  buildStandalonePayload,
  computeMissingVariants,
  variantManagesInventory,
  getSkipReason,
  priceInCents,
}
export type { ConsolidationEntry, ConsolidationVariant, WcProduct, SkipReason }

// ── Entry point ───────────────────────────────────────────────────────────────

// Guarded so the module can be imported by tests without running a migration.
// (typeof checks keep the guard safe under both CJS ts-node and ESM test
// transforms, where `require`/`module` do not exist.)
if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module
) {
  migrate().catch((err: unknown) => {
    console.error("Migration failed:", err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
