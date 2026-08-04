/**
 * Real "spots remaining" logic for inventory-tracked group-session variants.
 * A variant is only capacity-limited when its title starts with "Live" AND
 * the store API returned a non-null `inventory_quantity` for it (see
 * apps/web/types/medusa.ts) — everything else is unlimited/untracked.
 */

export interface SpotsInfo {
  spotsRemaining: number
  soldOut: boolean
}

export function isLiveVariantTitle(title: string | null | undefined): boolean {
  return /^live\b/i.test((title ?? '').trim())
}

export function getSpotsInfo(inventoryQuantity: number | null | undefined): SpotsInfo | null {
  if (inventoryQuantity === null || inventoryQuantity === undefined) return null
  const spotsRemaining = Math.max(0, inventoryQuantity)
  return { spotsRemaining, soldOut: spotsRemaining <= 0 }
}
