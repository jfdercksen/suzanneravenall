/**
 * Shop grid decision guidance — curated highlight badges (launch audit item 15).
 *
 * A product card on /shop shows a "Most Popular" or "Recommended" badge ONLY
 * when the data explicitly says so. There are two sources, checked in order:
 *
 *   1. Medusa product metadata (preferred — set in the Medusa admin):
 *        Product → Metadata → key `badge`, value `most_popular` or `recommended`
 *      Any other value (or no key) renders nothing.
 *
 *   2. The curated fallback map below (used when metadata is absent — e.g.
 *      search results, which don't carry metadata, or if the admin flag
 *      hasn't been set yet). Keyed by product handle.
 *
 * IMPORTANT: this map ships EMPTY on purpose. The badge is a real popularity /
 * recommendation claim, so it must only ever be added deliberately by
 * Johan / Suzanne — never defaulted. When nothing is flagged, the grid renders
 * exactly as before, with no badge and no layout shift.
 *
 * Example entry:
 *   'rapid-repatterning-programme': 'most_popular',
 */

export type HighlightBadgeType = 'most_popular' | 'recommended'

export interface HighlightBadge {
  type: HighlightBadgeType
  label: string
}

/** Curated fallback: product handle → badge type. Empty until deliberately curated. */
export const CURATED_HIGHLIGHTS: Record<string, HighlightBadgeType> = {}

const BADGE_LABELS: Record<HighlightBadgeType, string> = {
  most_popular: 'Most Popular',
  recommended: 'Recommended',
}

function isHighlightBadgeType(value: unknown): value is HighlightBadgeType {
  return value === 'most_popular' || value === 'recommended'
}

/**
 * Resolve the highlight badge for a product, or null when the product is not
 * flagged anywhere. Never invents a badge: unknown metadata values and
 * uncurated handles both return null.
 */
export function getHighlightBadge(product: {
  handle: string
  metadata?: Record<string, unknown> | null
}): HighlightBadge | null {
  const metaBadge = product.metadata?.badge
  if (isHighlightBadgeType(metaBadge)) {
    return { type: metaBadge, label: BADGE_LABELS[metaBadge] }
  }

  const curated = CURATED_HIGHLIGHTS[product.handle]
  if (curated !== undefined) {
    return { type: curated, label: BADGE_LABELS[curated] }
  }

  return null
}
