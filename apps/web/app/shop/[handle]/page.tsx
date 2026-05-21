import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { MedusaProduct } from '@/types/medusa'
import ProductPageContent from '@/components/shop/ProductPageContent'

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
      `${MEDUSA_URL}/store/products?handle=${handle}&fields=id,handle,title,description,thumbnail,*variants,*variants.prices,*categories,*collection`,
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
  return {
    title: product
      ? `${product.title} | Dr. Suzanne Ravenall`
      : 'Programme | Dr. Suzanne Ravenall',
    description:
      product?.description?.slice(0, 155) ??
      'Transform your life with Dr. Suzanne Ravenall.',
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const product = await getProduct(handle)

  if (!product) {
    notFound()
  }

  return <ProductPageContent product={product} />
}
