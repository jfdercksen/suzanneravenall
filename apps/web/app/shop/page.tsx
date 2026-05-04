import type { Metadata } from 'next'
import { ShopCatalogueContent } from '@/components/shop/ShopCatalogueContent'

export const metadata: Metadata = {
  title: 'Shop | Dr. Suzanne Ravenall',
  description:
    'Private sessions, guided programmes, and group coaching designed to create lasting change. Browse and invest in your transformation.',
}

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
  const categories = await fetchCategories()

  return <ShopCatalogueContent initialCategories={categories} />
}
