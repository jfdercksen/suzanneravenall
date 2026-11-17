import type { MedusaProduct } from '@/types/medusa'
import { productOffer, withOfferedVariants } from '@/lib/shop/offer'
import { getProductKind, variantFormat } from '@/components/shop/productKind'

/**
 * The shop's add-ons, for the Add-ons section on /shop (Suzanne approved
 * "both", shop section and checkout offer, 17 Nov 2026).
 *
 * The store does not mark add-ons: on the review box (read 17 Nov) these five
 * products have no category and no metadata. This list is the migration's
 * program_type "addon" set (apps/medusa/src/scripts/migrate-woocommerce.ts,
 * the WooCommerce "Product Add-ons" products), in the order the section shows
 * them. Which add-on goes with which product is not in the data either:
 * Johan set the pairings on 17 Nov (KI121) and they live in code below,
 * keyed on product handles and categories, with no Medusa data write.
 */
export const ADDON_HANDLES = [
  'bonus-lifetime-access-self-study-online',
  'email-support',
  'coaching-support-package',
  'vip-package',
  'ravenall-institute-certification-observation-fee',
] as const

const ADDON_SET: ReadonlySet<string> = new Set(ADDON_HANDLES)

export function isAddOnHandle(handle: string | null | undefined): boolean {
  return handle != null && ADDON_SET.has(handle)
}

const FIELDS =
  'id,handle,title,description,thumbnail,metadata,*variants,*variants.prices,+variants.inventory_quantity,*categories,*collection'

/**
 * The add-on products the store returns, in ADDON_HANDLES order. A draft or
 * missing product is simply absent; any failure gives an empty list, and the
 * section then does not render. Server side.
 */
export async function fetchAddOnProducts(fetchImpl: typeof fetch = fetch): Promise<MedusaProduct[]> {
  const medusaUrl = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
  if (!medusaUrl) return []
  const params = new URLSearchParams({ fields: FIELDS, limit: String(ADDON_HANDLES.length) })
  ADDON_HANDLES.forEach((h) => params.append('handle[]', h))
  try {
    const res = await fetchImpl(`${medusaUrl}/store/products?${params.toString()}`, {
      headers: { 'x-publishable-api-key': pubKey },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = (await res.json()) as { products?: MedusaProduct[] }
    const byHandle = new Map((data.products ?? []).map((p) => [p.handle, p]))
    return ADDON_HANDLES.flatMap((h) => {
      const product = byHandle.get(h)
      return product ? [withOfferedVariants(product)] : []
    })
  } catch {
    return []
  }
}

// ── Cart offer (Johan's pairings, 17 Nov 2026, KI121) ─────────────────────

export const LIFETIME_ACCESS_HANDLE = 'bonus-lifetime-access-self-study-online'
export const OBSERVATION_FEE_ADDON_HANDLE = 'ravenall-institute-certification-observation-fee'

/** The add-ons the cart may offer. The observation fee never is: it stays in the shop's Add-ons band. */
export const CART_ADDON_HANDLES = ADDON_HANDLES.filter((h) => h !== OBSERVATION_FEE_ADDON_HANDLE)

/**
 * Coaching sessions: the private-session categories that are coaching. The
 * other private sessions (Rapid Repatterning, Resonance Repatterning,
 * Energetic Clearing, Exploring the Alpha Mind, Rapid Transformation Therapy)
 * are left out until Johan or Suzanne say otherwise (KI121).
 */
export const COACHING_CATEGORY_HANDLES: ReadonlySet<string> = new Set([
  'transformation-coaching',
  'executive-coaching',
  'family-coaching',
  'akashic-coaching',
])

/** The same products by handle (review box, 17 Nov), for a cart product whose categories were not read. */
export const COACHING_PRODUCT_HANDLES: ReadonlySet<string> = new Set([
  'transformation-coaching-60-mins',
  'executive-coaching-30-mins',
  'group-family-coaching-60-mins',
  'akashic-clearing-session',
])

/** A coaching package is a coaching variant sold as several sessions ("Package of 08"). */
const PACKAGE_RE = /\b(package|bundle)\b/i

/** The values that keep a variant out of a cart (packages/integrations/src/saleStatus.ts). */
const NOT_FOR_SALE = new Set(['retired', 'register_interest', 'partner'])

interface VariantFacts {
  id?: string
  title?: string | null
  metadata?: Record<string, unknown> | null
  prices?: Array<{ currency_code: string; amount: number }>
}

/** What the rules read about a product in the cart (the store product, fetched by handle). */
export interface CartProductFacts {
  handle: string
  title: string
  metadata?: Record<string, unknown> | null
  variants: VariantFacts[]
  categories: Array<{ handle: string }>
}

export interface CartLineFacts {
  product_handle: string | null
  title?: string | null
  variant_title?: string | null
  subtitle?: string | null
}

export function isVariantForSale(variant: Pick<VariantFacts, 'metadata'>): boolean {
  const status = variant.metadata?.sale_status
  return !(typeof status === 'string' && NOT_FOR_SALE.has(status))
}

/** A programme that sells a self-study format (Bonus Lifetime Access goes with it). */
export function hasSelfStudyFormat(product: CartProductFacts): boolean {
  const asShop = withOfferedVariants(product)
  const kind = getProductKind({
    handle: asShop.handle,
    title: asShop.title,
    metadata: asShop.metadata ?? null,
    categories: asShop.categories.map((c) => ({ id: c.handle, handle: c.handle, name: c.handle, parent_category_id: null })),
    variants: asShop.variants.map((v) => ({ id: v.id ?? '', title: v.title ?? '', prices: [], metadata: v.metadata ?? null })),
  })
  if (kind !== 'programme') return false
  return asShop.variants.some((v) => variantFormat(v.title) === 'self-study' && isVariantForSale(v))
}

export function isCoachingProduct(handle: string, product: CartProductFacts | undefined): boolean {
  if (COACHING_PRODUCT_HANDLES.has(handle)) return true
  return (product?.categories ?? []).some((c) => COACHING_CATEGORY_HANDLES.has(c.handle))
}

function lineVariant(line: CartLineFacts): string {
  return (line.variant_title ?? line.subtitle ?? '').trim()
}

export interface AddOnPairing {
  handle: (typeof CART_ADDON_HANDLES)[number]
  /** The cart lines it goes with, by title, for the "Goes with" line. */
  goesWith: string[]
}

/**
 * The add-ons that go with what is in the cart, per Johan's pairings
 * (17 Nov): Bonus Lifetime Access with every programme that has a self-study
 * format; Email Support and the Coaching Support Package with coaching
 * sessions and packages; the VIP Package with coaching packages. An add-on
 * already in the cart is not offered again. Order follows CART_ADDON_HANDLES.
 */
export function cartAddOnPairings(
  lines: CartLineFacts[],
  products: ReadonlyMap<string, CartProductFacts>,
): AddOnPairing[] {
  const inCart = new Set(lines.map((l) => l.product_handle).filter((h): h is string => Boolean(h)))
  const goesWith = new Map<string, string[]>()
  const add = (addOn: string, line: CartLineFacts) => {
    const list = goesWith.get(addOn) ?? []
    const name = (line.title ?? line.product_handle ?? '').trim()
    if (name && !list.includes(name)) list.push(name)
    goesWith.set(addOn, list)
  }

  for (const line of lines) {
    const handle = line.product_handle
    if (!handle || isAddOnHandle(handle)) continue
    const product = products.get(handle)
    if (product && hasSelfStudyFormat(product)) add(LIFETIME_ACCESS_HANDLE, line)
    if (isCoachingProduct(handle, product)) {
      add('email-support', line)
      add('coaching-support-package', line)
      if (PACKAGE_RE.test(lineVariant(line))) add('vip-package', line)
    }
  }

  return CART_ADDON_HANDLES.flatMap((h) =>
    goesWith.has(h) && !inCart.has(h) ? [{ handle: h, goesWith: goesWith.get(h) ?? [] }] : [],
  )
}

export interface CartAddOnOffer extends AddOnPairing {
  title: string
  variantId: string
  variantTitle: string
  /** In the cart's currency, cents. */
  amount: number
}

/**
 * The offers to show: each pairing with the add-on product the store
 * returned, its first variant that is on sale and priced in the cart's
 * currency. An add-on that is not sold through the cart (register interest,
 * partner) or has no such variant is not offered.
 */
export function cartAddOnOffers(
  pairings: AddOnPairing[],
  addOnProducts: ReadonlyMap<string, CartProductFacts>,
  currency: string,
): CartAddOnOffer[] {
  const code = currency.toLowerCase()
  return pairings.flatMap((pairing) => {
    const product = addOnProducts.get(pairing.handle)
    if (!product || productOffer(product.handle).kind !== 'cart') return []
    for (const variant of product.variants) {
      if (!variant.id || !isVariantForSale(variant)) continue
      const price = variant.prices?.find((p) => p.currency_code.toLowerCase() === code)
      if (!price) continue
      return [
        {
          ...pairing,
          title: product.title,
          variantId: variant.id,
          variantTitle: (variant.title ?? '').trim(),
          amount: price.amount,
        },
      ]
    }
    return []
  })
}
