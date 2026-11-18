/**
 * Cart wording and limits that depend on what is in the cart (site check C19).
 *
 * A cart line only carries what Medusa puts on it: the product handle, and the
 * variant title as `subtitle` (e.g. "Live via Zoom", "Per month"). The rules
 * read those. When the data does not say, the cart says less.
 */

import { BOOK_HANDLE } from '@/lib/shop/lineItem'
import { LIFETIME_ACCESS_HANDLE } from '@/lib/shop/addons'

interface CartLineLike {
  product_handle?: string | null
  subtitle?: string | null
}

/**
 * Products that are physical goods, so more than one copy makes sense. Every
 * other product is a seat, a session, a course, a support package or a
 * download, where a second copy is never what the buyer meant.
 */
export const PHYSICAL_PRODUCT_HANDLES = new Set<string>([BOOK_HANDLE])

/**
 * Support packages priced per month or per session. Their copy asks the buyer
 * to choose the number of months or sessions (KI068), so the cart and the
 * product page let them take more than one, paid once, up to a year's worth.
 */
export const SUPPORT_PACKAGE_UNITS: Readonly<Record<string, 'month' | 'session'>> = {
  'email-support': 'month',
  'vip-package': 'month',
  'coaching-support-package': 'session',
}
export const SUPPORT_PACKAGE_MAX = 12

/** Limits that depend on the rest of the cart, worked out by the caller. */
export interface CartLimits {
  /** One Bonus Lifetime Access per qualifying programme line (lifetimeAccessCap, Johan 18 Nov). */
  lifetimeAccessCap?: number
}

export function maxQuantity(item: CartLineLike, limits: CartLimits = {}): number {
  if (!item.product_handle) return 1
  if (item.product_handle === LIFETIME_ACCESS_HANDLE) return Math.max(1, limits.lifetimeAccessCap ?? 1)
  if (PHYSICAL_PRODUCT_HANDLES.has(item.product_handle)) return Infinity
  if (Object.hasOwn(SUPPORT_PACKAGE_UNITS, item.product_handle)) return SUPPORT_PACKAGE_MAX
  return 1
}

/**
 * Bonus Lifetime Access above its cap, after a programme it covered left the
 * cart. The cart is not changed for the buyer: the line keeps its quantity,
 * the + is off, and this says why so they can lower it. Null otherwise.
 */
export function lifetimeOverCapNote(item: CartLineLike & { quantity: number }, cap: number): string | null {
  if (item.product_handle !== LIFETIME_ACCESS_HANDLE || item.quantity <= cap) return null
  const levels = cap === 1 ? 'one programme level' : `${cap} programme levels`
  return `Lifetime Access is one per programme level with a self-study option. Your cart has ${levels} it covers, so you may want to lower this to ${cap}.`
}

/** "month" or "session" for a support package, else null. */
export function supportPackageUnit(handle: string | null | undefined): 'month' | 'session' | null {
  return handle && Object.hasOwn(SUPPORT_PACKAGE_UNITS, handle) ? (SUPPORT_PACKAGE_UNITS[handle] ?? null) : null
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
