import type { MedusaProduct } from '@/types/medusa'
import { withOfferedVariants } from '@/lib/shop/offer'

/**
 * The shop's add-ons, for the Add-ons section on /shop (Suzanne approved
 * "both", shop section and checkout offer, 17 Nov 2026).
 *
 * The store does not mark add-ons: on the review box (read 17 Nov) these five
 * products have no category and no metadata. This list is the migration's
 * program_type "addon" set (apps/medusa/src/scripts/migrate-woocommerce.ts,
 * the WooCommerce "Product Add-ons" products), in the order the section shows
 * them. Which add-on goes with which product is not in the data either, so
 * the cart and checkout do not offer them yet (KI121).
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
