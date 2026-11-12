import { REGISTER_INTEREST_HANDLES, registerInterestProgramsFor, type Program } from '@/data/programs'
import { partnerProductFor, type PartnerProduct } from '@/data/partnerProducts'

/**
 * What the shop offers for a product (Suzanne, 11 and 12 Nov 2026):
 * - `cart`: the usual variant choice and Add to Cart.
 * - `register-interest`: a live programme with no date and no self-study on
 *   sale (data/programs.ts LIVE_ONLY_NOTE). No variant is sold.
 * - `partner`: a partner's product (data/partnerProducts.ts), bought on the
 *   partner's site.
 *
 * The store refuses the same variants in a cart (metadata.sale_status, see
 * apps/medusa/src/workflows/hooks/not-for-sale.ts), so this is what the page
 * shows, not the only lock.
 */
export type ProductOffer =
  | { kind: 'cart' }
  | { kind: 'register-interest'; programmes: Program[] }
  | { kind: 'partner'; partner: PartnerProduct }

export function productOffer(handle: string): ProductOffer {
  const partner = partnerProductFor(handle)
  if (partner) return { kind: 'partner', partner }
  const programmes = registerInterestProgramsFor(handle)
  if (programmes.length > 0) return { kind: 'register-interest', programmes }
  return { kind: 'cart' }
}

const SELF_STUDY_TITLE = /self[\s-]?(study|paced)|selfstudy/i

interface VariantLike {
  title?: string | null
  metadata?: Record<string, unknown> | null
}

/** A variant the shop shows: not a retired self-study edition. */
export function isOfferedVariant(handle: string, variant: VariantLike): boolean {
  if (variant.metadata?.sale_status === 'retired') return false
  return !(REGISTER_INTEREST_HANDLES.has(handle) && SELF_STUDY_TITLE.test(variant.title ?? ''))
}

/**
 * The product as the shop shows it: a register-interest product loses its
 * retired Self Study variants, so no card, badge, price or Self-Study filter
 * presents it as self-study, whether or not the box data has been updated yet.
 */
export function withOfferedVariants<V extends VariantLike, P extends { handle: string; variants: V[] }>(product: P): P {
  const variants = product.variants.filter((v) => isOfferedVariant(product.handle, v))
  return variants.length === product.variants.length ? product : { ...product, variants }
}
