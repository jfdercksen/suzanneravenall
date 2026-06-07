export type ProductType = 'session' | 'self-paced' | 'live' | 'group' | 'other'

export interface CategoryAccess {
  access_level: number
  track: 'akashic' | 'energy-clearing' | 'general'
  product_type: ProductType
}

/**
 * Maps Medusa product category handles to portal access grants and product type classification.
 * Used by order-placed subscriber (access granting) and order confirmation email (dynamic steps).
 */
export const CATEGORY_ACCESS_MAP: Record<string, CategoryAccess> = {
  'rp-self-paced':                { access_level: 3, track: 'general',          product_type: 'self-paced' },
  'rp-live':                      { access_level: 3, track: 'general',          product_type: 'live' },
  'akashic-live':                 { access_level: 3, track: 'akashic',          product_type: 'live' },
  'akashic-self-paced':           { access_level: 3, track: 'akashic',          product_type: 'self-paced' },
  'energy-clearing-live':         { access_level: 3, track: 'energy-clearing',  product_type: 'live' },
  'energy-clearing-self-paced':   { access_level: 3, track: 'energy-clearing',  product_type: 'self-paced' },
  'life-enhancing-live':          { access_level: 3, track: 'general',          product_type: 'live' },
  'life-enhancing-self-paced':    { access_level: 3, track: 'general',          product_type: 'self-paced' },
  'group-sessions-live':          { access_level: 2, track: 'general',          product_type: 'group' },
  'group-sessions-recorded':      { access_level: 2, track: 'general',          product_type: 'self-paced' },
  'private-sessions':             { access_level: 1, track: 'general',          product_type: 'session' },
  'meditation-programmes':        { access_level: 3, track: 'general',          product_type: 'self-paced' },
  'books':                        { access_level: 1, track: 'general',          product_type: 'other' },
  'digital-downloads':            { access_level: 1, track: 'general',          product_type: 'other' },
}

interface MinimalCategory {
  handle: string
}

export function getProductTypeFromCategories(categories: MinimalCategory[]): ProductType {
  for (const cat of categories) {
    const match = CATEGORY_ACCESS_MAP[cat.handle]
    if (match) return match.product_type
  }
  // Pattern-matching fallback for handles not in the map (e.g. delivery-mode leaf categories)
  for (const cat of categories) {
    const h = cat.handle
    if (h === 'private-sessions' || h.includes('coaching') || h.includes('therapy')) return 'session'
    if (h.includes('self-paced') || h.includes('self-study') || h.includes('recorded')) return 'self-paced'
    if (h.includes('live-via-zoom') || (h.includes('-live') && !h.includes('group'))) return 'live'
    if (h.includes('group')) return 'group'
  }
  return 'other'
}

export function getAccessFromCategories(categories: MinimalCategory[]): CategoryAccess | null {
  for (const cat of categories) {
    const match = CATEGORY_ACCESS_MAP[cat.handle]
    if (match) return match
  }
  return null
}
