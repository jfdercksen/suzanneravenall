import type { ProductVariant } from '@/types/medusa'

export type VariantPrice = ProductVariant['prices'][number]

/** Medusa as the web server reaches it: the internal address, else the public one. */
export function medusaServerUrl(): string {
  return process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
}

/** A homepage fetch never holds the page up longer than this; the card then shows no price. */
export const HOMEPAGE_FETCH_TIMEOUT_MS = 4000

/**
 * The prices of a product's first variant (cents, every currency), for a
 * homepage card that names one product (the book). Null when Medusa cannot be
 * reached: the card then shows no price rather than a guessed one (D021).
 * Cached like the cohort fetch (5 minutes).
 */
export async function getProductPrices(handle: string): Promise<VariantPrice[] | null> {
  const medusaUrl = medusaServerUrl()
  if (!medusaUrl) return null
  const params = new URLSearchParams({ handle, fields: 'id,*variants,*variants.prices', limit: '1' })
  try {
    const res = await fetch(`${medusaUrl}/store/products?${params.toString()}`, {
      headers: { 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(HOMEPAGE_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { products?: Array<{ variants?: ProductVariant[] }> }
    const prices = data.products?.[0]?.variants?.[0]?.prices
    return Array.isArray(prices) ? prices.map((p) => ({ currency_code: p.currency_code, amount: p.amount })) : null
  } catch {
    return null
  }
}
