import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ShopCatalogueContent } from '@/components/shop/ShopCatalogueContent'

export const metadata: Metadata = {
  title: 'Shop | Dr. Suzanne Ravenall',
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

export default async function ShopPage() {
  const [categories, reqHeaders] = await Promise.all([fetchCategories(), headers()])
  const country = reqHeaders.get('CF-IPCountry') ?? ''
  const defaultCurrency = country === 'ZA' ? 'zar' : 'usd'

  return <ShopCatalogueContent initialCategories={categories} defaultCurrency={defaultCurrency} />
}
