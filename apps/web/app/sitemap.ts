import type { MetadataRoute } from 'next'
import { topics } from '@/app/explore/topics'
import { pathways } from '@/data/pathways'
import { allPrivateSessions } from '@/data/privateSessions'
import { PROGRAMS } from '@/data/programs'

// Built per request: Medusa is not reachable while the image builds, so a
// prerendered sitemap would ship without the shop products.
export const dynamic = 'force-dynamic'

// lastmod must not be the request time (site check M4). Site pages only change
// on a deploy, so they carry the build date that next.config.mjs inlines; left
// out when it is missing (tests, dev) rather than guessed.
const BUILD_DATE: string | undefined = process.env.SITE_BUILD_DATE || undefined

interface ProductEntry {
  handle: string
  updatedAt?: string
}

// Shop products come from Medusa. A failed fetch leaves them out rather than
// breaking the sitemap.
async function fetchProducts(): Promise<ProductEntry[]> {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
  const products: ProductEntry[] = []

  try {
    for (let offset = 0; offset < 1000; offset += 100) {
      const res = await fetch(
        `${medusaUrl}/store/products?limit=100&offset=${offset}&fields=handle,updated_at`,
        { headers: { 'x-publishable-api-key': pubKey }, next: { revalidate: 3600 } },
      )
      if (!res.ok) break
      const data = (await res.json()) as {
        products?: { handle?: string; updated_at?: string }[]
        count?: number
      }
      const page = Array.isArray(data.products) ? data.products : []
      for (const p of page) {
        if (p.handle) products.push({ handle: p.handle, updatedAt: p.updated_at || undefined })
      }
      if (page.length < 100 || products.length >= (data.count ?? 0)) break
    }
  } catch {
    return products
  }
  return products
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/services`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/speaking`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/programs`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/masterclass`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/explore`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/discover-your-pattern`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/transformation-pathways`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/resources`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: BUILD_DATE,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/book`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: BUILD_DATE,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/community`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/legal/privacy`,
      lastModified: BUILD_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/terms`,
      lastModified: BUILD_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/cookies`,
      lastModified: BUILD_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/disclaimer`,
      lastModified: BUILD_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/about/the-story`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about/the-system`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about/the-science`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/testimonials`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/pattern-coach`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  const exploreRoutes: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${siteUrl}/explore/${topic.slug}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const pathwayRoutes: MetadataRoute.Sitemap = pathways.map((pathway) => ({
    url: `${siteUrl}/transformation-pathways/${pathway.slug}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const privateSessionRoutes: MetadataRoute.Sitemap = allPrivateSessions.map(
    (session) => ({
      url: `${siteUrl}/services/private-sessions/${session.slug}`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  )

  const programRoutes: MetadataRoute.Sitemap = PROGRAMS.filter((p) => p.isPublished).map(
    (program) => ({
      url: `${siteUrl}/programs/${program.slug}`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  )

  const productRoutes: MetadataRoute.Sitemap = (await fetchProducts()).map((product) => ({
    url: `${siteUrl}/shop/${product.handle}`,
    lastModified: product.updatedAt ?? BUILD_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    ...staticRoutes,
    ...exploreRoutes,
    ...pathwayRoutes,
    ...privateSessionRoutes,
    ...programRoutes,
    ...productRoutes,
  ]
}
