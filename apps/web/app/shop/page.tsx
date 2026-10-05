import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ShopCatalogueContent } from '@/components/shop/ShopCatalogueContent'

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Private sessions, guided programmes, and group coaching designed to create lasting change. Browse and invest in your transformation.',
}

// CF-IPCountry is only available at request time — force dynamic to read it.
export const dynamic = 'force-dynamic'

interface MedusaCategory {
  id: string
  handle: string
  name: string
  parent_category_id: string | null
}

interface CategoriesResponse {
  product_categories: MedusaCategory[]
}

async function fetchCategories(): Promise<MedusaCategory[]> {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

  try {
    const res = await fetch(`${medusaUrl}/store/product-categories?limit=100`, {
      headers: { 'x-publishable-api-key': pubKey },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return []

    const data = (await res.json()) as CategoriesResponse
    return Array.isArray(data.product_categories) ? data.product_categories : []
  } catch {
    return []
  }
}

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [categories, reqHeaders, params] = await Promise.all([fetchCategories(), headers(), searchParams])
  const country = reqHeaders.get('CF-IPCountry') ?? ''
  const defaultCurrency = country === 'ZA' ? 'zar' : 'usd'

  // The catalogue reads its state from the URL on mount; keying on the query
  // remounts it when a link opens /shop with different params.
  const queryKey = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      v === undefined ? [] : (Array.isArray(v) ? v : [v]).map((item): [string, string] => [k, item])
    )
  ).toString()

  return <ShopCatalogueContent key={queryKey} initialCategories={categories} defaultCurrency={defaultCurrency} />
}
