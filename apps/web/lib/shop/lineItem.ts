/**
 * What a buyer needs to read on a cart, checkout or confirmation line besides
 * the product title.
 *
 * Medusa v2 puts the product title on a line item as `title` and the variant
 * title as `variant_title` (and `subtitle`, which GET /store/carts/:id leaves
 * out of its default fields: that is why the cart showed no variant, KI060).
 * A single-variant product's only variant is called
 * "Default" (or the seed's "Default variant"), which says nothing to a buyer,
 * so it is not shown. The order mail names the variant the same way:
 * "Title (Variant)" (lib/email/order-confirmation.ts).
 */
const PLACEHOLDER_VARIANT_TITLES = new Set(['default', 'default variant', 'default title'])

export function variantLabel(item: {
  title?: string | null
  variant_title?: string | null
  subtitle?: string | null
}): string | null {
  const variant = (item.variant_title ?? item.subtitle)?.trim()
  if (!variant) return null
  if (PLACEHOLDER_VARIANT_TITLES.has(variant.toLowerCase())) return null
  if (item.title && variant.toLowerCase() === item.title.trim().toLowerCase()) return null
  return variant
}

/** The Breakthrough Trilogy book: the shop's one physical product, sold before release. */
export const BOOK_HANDLE = 'the-latest-book-by-suzanne'

/**
 * Products sold before they ship (KI067). The current site sells the book as
 * "The Latest Book By Suzanne (Pre-order)" with no availability date, so the
 * shop promises no ship date either. Keyed by handle, because a cart line
 * carries the handle and not the product metadata: the cart, checkout,
 * product page and confirmation then always agree.
 */
export const PREORDER_HANDLES = new Set<string>([BOOK_HANDLE])

export function isPreorder(handle: string | null | undefined): boolean {
  return Boolean(handle && PREORDER_HANDLES.has(handle))
}

export const PREORDER_NOTE =
  'Pre-order: this book has not been released yet, so it does not ship straight away. We will email you as soon as it ships.'
