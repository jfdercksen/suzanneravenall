import { SALE_STATUS_KEY, saleStatusOf, type SaleStatus } from "@suzanne/integrations"
import brainwave from "../data/brainwave-club.json"

/**
 * What shop-changes-2026-11-12.ts changes, as pure functions (tested in
 * src/scripts/__tests__/shop-changes-plan.test.ts). Suzanne's notes of 11 and
 * 12 Nov 2026:
 *
 * 1. Live only, no self-study on sale: on the six products below every Self
 *    Study variant is retired and every live variant is register interest
 *    (no dates). Nothing is deleted: only metadata.sale_status is set, and
 *    RESTORE=<handle> takes the retired marker off again once a programme has
 *    been run. The recorded "Group Session: Love & Relationships"
 *    (love-relationships-group-session) is not touched.
 * 2. Brainwave Club comes over as a partner product: listed, never in a cart.
 * 3. The Suzanne Ravenall Coaching App comes over as a once-off R250 product.
 *    Nothing provisions app access (KI113).
 */

export const CHANGE_DATE = "2026-11-12"
export const CHANGE_NOTE = "Suzanne 12 Nov 2026: live only until the programme has been run"

/** The products behind the register-interest programmes in apps/web/data/programs.ts (REGISTER_INTEREST_HANDLES). */
export const LIVE_ONLY_HANDLES = [
  "love-relationships-live",
  "intuition-in-my-personal-capacity-live",
  "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live",
  "be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live",
  "meditation-live-via-zoom",
  "mindfulness-live",
] as const

/** Never touched by this script: the recorded group series stays on sale (Suzanne 12 Nov). */
export const KEEP_ON_SALE = ["love-relationships-group-session"] as const

const SELF_STUDY_TITLE = /self[\s-]?(study|paced)|selfstudy/i

export type VariantState = { id: string; title: string | null; metadata: Record<string, unknown> | null }
export type ProductState = { id: string; handle: string; variants: VariantState[] }

export type VariantUpdate = {
  handle: string
  variantId: string
  title: string | null
  from: SaleStatus | null
  to: SaleStatus | null
  /** The full metadata to write: existing keys kept, "" removes a key (Medusa's metadata merge). */
  metadata: Record<string, unknown>
}

export type LiveOnlyPlan = { updates: VariantUpdate[]; unchanged: number; missing: string[] }

/** What a variant of a live-only product becomes: the Self Study edition is retired, a live run is register interest. */
export function targetStatusFor(title: string | null): SaleStatus {
  return SELF_STUDY_TITLE.test(title ?? "") ? "retired" : "register_interest"
}

function metadataFor(current: Record<string, unknown> | null, to: SaleStatus | null): Record<string, unknown> {
  if (to === null) return { ...current, [SALE_STATUS_KEY]: "", sale_status_since: "", sale_status_note: "" }
  return { ...current, [SALE_STATUS_KEY]: to, sale_status_since: CHANGE_DATE, sale_status_note: CHANGE_NOTE }
}

/**
 * The variant changes. `restore` lists product handles whose retired Self
 * Study variant goes back on sale (their live variants stay register
 * interest until dates are set). Re-running changes nothing.
 */
export function planLiveOnly(products: ProductState[], restore: ReadonlySet<string> = new Set()): LiveOnlyPlan {
  const updates: VariantUpdate[] = []
  let unchanged = 0
  const found = new Set(products.map((p) => p.handle))
  const missing = LIVE_ONLY_HANDLES.filter((h) => !found.has(h))

  for (const product of products) {
    if (!(LIVE_ONLY_HANDLES as readonly string[]).includes(product.handle)) continue
    for (const variant of product.variants) {
      const from = saleStatusOf(variant.metadata)
      const target = targetStatusFor(variant.title)
      const to = target === "retired" && restore.has(product.handle) ? null : target
      if (from === to) {
        unchanged += 1
        continue
      }
      updates.push({ handle: product.handle, variantId: variant.id, title: variant.title, from, to, metadata: metadataFor(variant.metadata, to) })
    }
  }
  return { updates, unchanged, missing }
}

/** RESTORE=<handle>[,<handle>]: only handles of this script's products count. */
export function parseRestore(raw: string | undefined): { handles: Set<string>; unknown: string[] } {
  const asked = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  const known = new Set<string>(LIVE_ONLY_HANDLES)
  return { handles: new Set(asked.filter((h) => known.has(h))), unknown: asked.filter((h) => !known.has(h)) }
}

// ── New products ──────────────────────────────────────────────────────────────

export type NewProductContext = {
  /** The "Products & Tools" category (products-tools). */
  categoryId: string
  /**
   * The sales channel and shipping profile of a published digital product
   * already on sale, copied as they are. Either may be absent: on the review
   * box (12 Nov 2026) the published products carry neither link, and the new
   * products must be set up the same way as the ones already selling.
   */
  salesChannelId: string | null
  shippingProfileId: string | null
}

export const BRAINWAVE_HANDLE = "brainwave-club"
export const COACHING_APP_HANDLE = "suzanne-ravenall-coaching-app"

/** The partner product: the old shop's short and long description, its image, no price and never in a cart. */
export function brainwaveProduct(ctx: NewProductContext) {
  return {
    title: "Brainwave Club",
    handle: BRAINWAVE_HANDLE,
    status: "published" as const,
    description: [brainwave.shortDescription, ...brainwave.paragraphs].join("\n\n"),
    // Served by the web app (apps/web/public/images/products/brainwave-club.png), copied from the old shop.
    thumbnail: "/images/products/brainwave-club.png",
    category_ids: [ctx.categoryId],
    ...(ctx.salesChannelId ? { sales_channels: [{ id: ctx.salesChannelId }] } : {}),
    ...(ctx.shippingProfileId ? { shipping_profile_id: ctx.shippingProfileId } : {}),
    options: [{ title: "Type", values: ["Partner product"] }],
    variants: [
      {
        title: "Partner product",
        options: { Type: "Partner product" },
        manage_inventory: false,
        prices: [],
        metadata: { [SALE_STATUS_KEY]: "partner" },
      },
    ],
    metadata: { partner: "Brainwave Club", source: "WooCommerce product 7635 (external)", added: CHANGE_DATE },
  }
}

/**
 * The app, once-off R250 as on the old shop (amounts are in cents in this
 * store). No dollar price: none is held, and one is never derived from rand.
 * No description: the old product has none.
 */
export function coachingAppProduct(ctx: NewProductContext) {
  return {
    title: "Suzanne Ravenall Coaching App",
    handle: COACHING_APP_HANDLE,
    status: "published" as const,
    category_ids: [ctx.categoryId],
    ...(ctx.salesChannelId ? { sales_channels: [{ id: ctx.salesChannelId }] } : {}),
    ...(ctx.shippingProfileId ? { shipping_profile_id: ctx.shippingProfileId } : {}),
    options: [{ title: "Type", values: ["Once-off"] }],
    variants: [
      {
        title: "Once-off",
        options: { Type: "Once-off" },
        manage_inventory: false,
        prices: [{ currency_code: "zar", amount: 25000 }],
      },
    ],
    metadata: { source: "WooCommerce product 17133", added: CHANGE_DATE },
  }
}

/** The products to create: only those whose handle does not exist yet. */
export function planNewProducts(existingHandles: ReadonlySet<string>, ctx: NewProductContext) {
  return [brainwaveProduct(ctx), coachingAppProduct(ctx)].filter((p) => !existingHandles.has(p.handle))
}
