import type { Program } from '@/data/programs'
import type { ProductVariant } from '@/types/medusa'
import { HOMEPAGE_FETCH_TIMEOUT_MS, medusaServerUrl } from '@/lib/shop/product-prices'
import { logWarn } from '@/lib/log'
import { programPriceTexts, type ProgramPriceTexts } from './program-prices'

/**
 * The variants (with every currency's prices) of each product handle, in one
 * store read. Null when Medusa cannot be reached: the pages then show the
 * rand price from the data file and "Price on request" in dollars, never a
 * guessed price (D021). Cached for 5 minutes like the homepage reads.
 */
export async function getVariantsByHandle(handles: string[]): Promise<Map<string, ProductVariant[]> | null> {
  const unique = [...new Set(handles.filter(Boolean))]
  const medusaUrl = medusaServerUrl()
  if (unique.length === 0 || !medusaUrl) return null
  const params = new URLSearchParams({ fields: 'handle,*variants,*variants.prices', limit: String(unique.length) })
  for (const handle of unique) params.append('handle[]', handle)
  try {
    const res = await fetch(`${medusaUrl}/store/products?${params.toString()}`, {
      headers: { 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(HOMEPAGE_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
      logWarn('[program-prices] Medusa price read failed; dollar prices show "Price on request"', undefined, { status: res.status })
      return null
    }
    const data = (await res.json()) as { products?: Array<{ handle: string; variants?: ProductVariant[] }> }
    const byHandle = new Map<string, ProductVariant[]>()
    for (const product of data.products ?? []) {
      if (!Array.isArray(product.variants)) continue
      byHandle.set(
        product.handle,
        product.variants.map((v) => ({
          id: v.id,
          title: v.title,
          prices: (v.prices ?? []).map((p) => ({ currency_code: p.currency_code, amount: p.amount })),
        })),
      )
    }
    return byHandle
  } catch (error) {
    logWarn('[program-prices] Medusa unreachable; dollar prices show "Price on request"', error)
    return null
  }
}

/** Rand and dollar price texts for each programme, keyed by slug. */
export async function getProgramPriceTexts(programs: Program[]): Promise<Record<string, ProgramPriceTexts>> {
  const variants = await getVariantsByHandle(programs.map((p) => p.shopHandle ?? ''))
  const texts: Record<string, ProgramPriceTexts> = {}
  for (const program of programs) {
    const productVariants = program.shopHandle ? variants?.get(program.shopHandle) : null
    texts[program.slug] = programPriceTexts(program, productVariants)
    // Medusa answered but no variant carries the programme's rand price: the
    // data file and the shop have drifted apart, so the dollar price is hidden.
    if (variants && program.shopHandle && texts[program.slug]?.usdCents === null) {
      logWarn('[program-prices] No Medusa dollar price for programme', undefined, {
        slug: program.slug,
        shopHandle: program.shopHandle,
        productFound: Boolean(productVariants),
      })
    }
  }
  return texts
}
