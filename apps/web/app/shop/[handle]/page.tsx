import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { MedusaProduct } from '@/types/medusa'
import { NOT_FOUND_TITLE } from '@/lib/seo/notFoundTitle'
import ProductPageContent from '@/components/shop/ProductPageContent'
import { ipCountry } from '@/lib/geoip'
import { CURRENCY_COOKIE, visitorCurrency } from '@/lib/visitor-region'

// Force dynamic rendering — product pages depend on live Medusa data.
// Static pre-rendering at build time would fail because variant prices
// may be incomplete or missing during the Docker build environment.
export const dynamic = 'force-dynamic'

const MEDUSA_URL =
  process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
const MEDUSA_PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

async function getProduct(handle: string): Promise<MedusaProduct | null> {
  try {
    const res = await fetch(
      `${MEDUSA_URL}/store/products?handle=${handle}&fields=id,handle,title,description,thumbnail,metadata,*variants,*variants.prices,+variants.inventory_quantity,*categories,*collection`,
      {
        headers: { 'x-publishable-api-key': MEDUSA_PUB_KEY },
      }
    )
    if (!res.ok) return null
    const data = (await res.json()) as { products?: MedusaProduct[] }
    return data.products?.[0] ?? null
  } catch {
    return null
  }
}

export async function generateStaticParams(): Promise<Array<{ handle: string }>> {
  try {
    const res = await fetch(`${MEDUSA_URL}/store/products?limit=100`, {
      headers: { 'x-publishable-api-key': MEDUSA_PUB_KEY },
    })
    if (!res.ok) return []
    const data = (await res.json()) as { products?: Array<{ handle: string }> }
    return (data.products ?? []).map((p) => ({ handle: p.handle }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)
  // The page itself calls notFound(); calling it here too left the 404 tab
  // with an empty title (KI058), so name it like the generic 404 instead.
  if (!product) {
    return { title: { absolute: NOT_FOUND_TITLE }, robots: { index: false } }
  }
  return {
    title: product.title,
    description:
      product.description?.slice(0, 155) ??
      'Transform your life with Dr. Suzanne Ravenall.',
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ variant?: string | string[] }>
}) {
  const [{ handle }, { variant }, reqHeaders, reqCookies] = await Promise.all([params, searchParams, headers(), cookies()])
  const product = await getProduct(handle)

  if (!product) {
    notFound()
  }

  // ?variant=<id> keeps the buyer's choice across a reload (KI066). The
  // component checks it against the product's variants.
  const initialVariantId = typeof variant === 'string' ? variant : undefined

  // Same rule as the cart and the shop cards (D021).
  const defaultCurrency = visitorCurrency(reqHeaders, reqCookies.get(CURRENCY_COOKIE)?.value, process.env, ipCountry(reqHeaders))

  return <ProductPageContent product={product} initialVariantId={initialVariantId} defaultCurrency={defaultCurrency} />
}
