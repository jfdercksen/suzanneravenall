/**
 * Shared Medusa type definitions for the web application.
 *
 * Import from here rather than re-declaring types in individual components.
 */

// ── Core product types ────────────────────────────────────────────────────────

export interface MedusaProduct {
  id: string
  handle: string
  title: string
  description: string | null
  thumbnail: string | null
  metadata?: Record<string, unknown> | null
  variants: Array<{
    id: string
    title: string
    prices: Array<{ currency_code: string; amount: number }>
  }>
  categories: Array<{ id: string; handle: string; name: string }>
  collection: { id: string; handle: string; title: string } | null
}

// ── Membership types ──────────────────────────────────────────────────────────

export type MembershipTier = 'free' | 'silver' | 'gold' | 'practitioner'

export interface MembershipProduct extends MedusaProduct {
  metadata: {
    tier: MembershipTier
    access_level: number
    product_type: 'membership'
  }
}
