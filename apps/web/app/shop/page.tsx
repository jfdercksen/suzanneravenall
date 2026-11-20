import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { MEMBERSHIP_TIERS } from '@/lib/access/tiers'
import { ShopCatalogueContent } from '@/components/shop/ShopCatalogueContent'
import { ipCountry } from '@/lib/geoip'
import { fetchAddOnProducts } from '@/lib/shop/addons'
import { CURRENCY_COOKIE, visitorCurrency } from '@/lib/visitor-region'

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Private sessions, guided programmes, and group coaching designed to create lasting change. Browse and invest in your transformation.',
}

// The visitor's currency (cookie, Accept-Language) is only known at request time.
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

// The catalogue size for the hero line (KI063): the same unfiltered
// /store/products count the list header prints, so the two always agree.
async function fetchCatalogueCount(): Promise<number | null> {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

  try {
    const res = await fetch(`${medusaUrl}/store/products?limit=1&fields=id`, {
      headers: { 'x-publishable-api-key': pubKey },
      // Live, like the list header it must agree with
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as { count?: unknown }
    if (typeof data.count !== 'number') return null
    // The list leaves memberships out (KI129), so the hero count does too.
    const memberships = new URLSearchParams({ limit: '1', fields: 'id' })
    for (const t of MEMBERSHIP_TIERS) memberships.append('handle[]', t.handle)
    const mres = await fetch(`${medusaUrl}/store/products?${memberships.toString()}`, {
      headers: { 'x-publishable-api-key': pubKey },
      cache: 'no-store',
    })
    if (!mres.ok) return null
    const mdata = (await mres.json()) as { count?: unknown }
    return typeof mdata.count === 'number' ? Math.max(0, data.count - mdata.count) : null
  } catch {
    return null
  }
}

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [categories, catalogueCount, addOns, reqHeaders, reqCookies, params] = await Promise.all([
    fetchCategories(),
    fetchCatalogueCount(),
    fetchAddOnProducts(),
    headers(),
    cookies(),
    searchParams,
  ])
  // Same rule as the cart (/api/region, D021), so a card never shows a
  // currency the product page and the cart will not use.
  const defaultCurrency = visitorCurrency(reqHeaders, reqCookies.get(CURRENCY_COOKIE)?.value, process.env, ipCountry(reqHeaders))

  // The catalogue reads its state from the URL on mount; keying on the query
  // remounts it when a link opens /shop with different params.
  const queryKey = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      v === undefined ? [] : (Array.isArray(v) ? v : [v]).map((item): [string, string] => [k, item])
    )
  ).toString()

  return <ShopCatalogueContent
      key={queryKey}
      initialCategories={categories}
      defaultCurrency={defaultCurrency}
      catalogueCount={catalogueCount}
      addOns={addOns}
    />
}
