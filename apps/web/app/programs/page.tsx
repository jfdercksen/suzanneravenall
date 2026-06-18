import type { Metadata } from 'next'
import ProgramsPageClient from './ProgramsPageClient'
import { OnlineCoursesSection, type Course } from './OnlineCoursesSection'
import { PROGRAMS } from '@/data/programs'

export const metadata: Metadata = {
  title: 'Programmes | Dr. Suzanne Ravenall',
  description:
    "Explore Dr. Suzanne Ravenall's transformation programmes — practitioner training, self-paced online courses, live sessions, and group workshops designed for dramatic change.",
}

// Variant prices are resolved from Medusa at request time — the same reason the
// shop product page is force-dynamic (build-time prerender cannot resolve prices).
export const dynamic = 'force-dynamic'

const MEDUSA_URL =
  process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
const MEDUSA_PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

interface StoreCollection {
  id: string
  title: string
  handle: string
}

interface StoreProduct {
  id: string
  handle: string
  title: string
  description: string | null
  metadata?: Record<string, unknown> | null
  variants?: Array<{ prices?: Array<{ currency_code: string; amount: number }> }>
}

function stripHtml(value: string | null): string {
  if (!value) return ''
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// Fetch the "Programmes" collection's products from the Medusa storefront API,
// excluding any handle already shown by the static programs.ts catalogue so a
// course never appears in both sections. Fails soft to an empty list.
async function fetchProgrammeCourses(): Promise<Course[]> {
  if (!MEDUSA_URL || !MEDUSA_PUB_KEY) return []
  const headers = { 'x-publishable-api-key': MEDUSA_PUB_KEY }

  try {
    const colRes = await fetch(
      `${MEDUSA_URL}/store/collections?fields=id,title,handle&limit=100`,
      { headers, next: { revalidate: 3600 } },
    )
    if (!colRes.ok) return []
    const colData = (await colRes.json()) as { collections?: StoreCollection[] }
    const programmes = (colData.collections ?? []).find((c) => c.title === 'Programmes')
    if (!programmes) return []

    const prodRes = await fetch(
      `${MEDUSA_URL}/store/products?collection_id[]=${programmes.id}&limit=100&fields=id,handle,title,description,metadata,*variants,*variants.prices`,
      { headers, next: { revalidate: 3600 } },
    )
    if (!prodRes.ok) return []
    const prodData = (await prodRes.json()) as { products?: StoreProduct[] }
    const products = prodData.products ?? []

    const excludedHandles = new Set(PROGRAMS.map((p) => p.slug))

    return products
      .filter((p) => !excludedHandles.has(p.handle))
      .map((p): Course => ({
        id: p.id,
        handle: p.handle,
        title: p.title,
        description: stripHtml(p.description) || null,
        category:
          typeof p.metadata?.category === 'string' ? p.metadata.category : 'other',
        prices: p.variants?.[0]?.prices ?? [],
      }))
      .sort((a, b) => a.title.localeCompare(b.title))
  } catch {
    return []
  }
}

export default async function ProgramsPage() {
  const courses = await fetchProgrammeCourses()

  return (
    <>
      <ProgramsPageClient />
      <OnlineCoursesSection courses={courses} />
    </>
  )
}
