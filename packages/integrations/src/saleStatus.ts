/**
 * Why a product variant is not on sale, kept in its Medusa metadata under
 * `sale_status` (Suzanne, 11 and 12 Nov 2026). A variant with no status is on
 * sale as before.
 *
 * - `retired`: a self-study edition taken off sale until the live programme
 *   has been run and recorded ("when the live program is sold and run, then
 *   it will become available as a self study"). Restorable: the variant and
 *   its price stay, only the marker is removed.
 * - `register_interest`: a live run with no date yet. Visitors register their
 *   interest instead of buying a seat.
 * - `partner`: a partner's product (Brainwave Club). It is bought on the
 *   partner's site, never through our cart.
 *
 * The store refuses all three in a cart (apps/medusa/src/workflows/hooks).
 * The search index drops `retired` variants, so a retired self-study price
 * is never shown as the "from" price.
 */

export const SALE_STATUS_KEY = 'sale_status'

export const SALE_STATUSES = ['retired', 'register_interest', 'partner'] as const

export type SaleStatus = (typeof SALE_STATUSES)[number]

/** The variant's sale status, or null when it is on sale. Unknown values count as on sale. */
export function saleStatusOf(metadata: Record<string, unknown> | null | undefined): SaleStatus | null {
  const raw = metadata?.[SALE_STATUS_KEY]
  return typeof raw === 'string' && (SALE_STATUSES as readonly string[]).includes(raw) ? (raw as SaleStatus) : null
}

/** True when the variant can be put in a cart. */
export function isForSale(metadata: Record<string, unknown> | null | undefined): boolean {
  return saleStatusOf(metadata) === null
}

/** What the store answers when a cart is refused the variant. */
export function notForSaleMessage(status: SaleStatus, title: string): string {
  switch (status) {
    case 'retired':
      return `${title} is not on sale at the moment.`
    case 'register_interest':
      return `${title} has no live dates yet. Please register your interest instead.`
    case 'partner':
      return `${title} is a partner product, bought on the partner's site.`
  }
}
