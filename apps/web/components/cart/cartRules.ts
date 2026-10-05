/**
 * Cart wording and limits that depend on what is in the cart (site check C19).
 *
 * A cart line only carries what Medusa puts on it: the product handle, and the
 * variant title as `subtitle` (e.g. "Live via Zoom", "Per month"). The rules
 * read those. When the data does not say, the cart says less.
 */

interface CartLineLike {
  product_handle?: string | null
  subtitle?: string | null
}

/**
 * Products that are physical goods, so more than one copy makes sense. Every
 * other product is a seat, a session, a course, a support package or a
 * download, where a second copy is never what the buyer meant.
 */
export const PHYSICAL_PRODUCT_HANDLES = new Set<string>(['the-latest-book-by-suzanne'])

export function maxQuantity(item: CartLineLike): number {
  return item.product_handle && PHYSICAL_PRODUCT_HANDLES.has(item.product_handle) ? Infinity : 1
}

/**
 * A line that bills on a schedule the buyer can stop. Checkout takes a single
 * PayFast or PayPal payment, so today this only matches a product named as a
 * membership or subscription. "Per month" packages are paid once and do not
 * count.
 */
export function isSubscriptionLine(item: CartLineLike): boolean {
  const text = `${item.product_handle ?? ''} ${item.subtitle ?? ''}`.toLowerCase().replace(/-/g, ' ')
  return /\b(membership|subscription)\b/.test(text)
}
