import type { MetadataRoute } from 'next'
import { topics } from '@/app/explore/topics'
import { pathways } from '@/data/pathways'
import { allPrivateSessions } from '@/data/privateSessions'
import { PROGRAMS } from '@/data/programs'

// Built per request: Medusa is not reachable while the image builds, so a
// prerendered sitemap would ship without the shop products.
export const dynamic = 'force-dynamic'

// Shop products come from Medusa. A failed fetch leaves them out rather than
// breaking the sitemap.
async function fetchProductHandles(): Promise<string[]> {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_URL ?? ''
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
  const handles: string[] = []

  try {
    for (let offset = 0; offset < 1000; offset += 100) {
      const res = await fetch(
        `${medusaUrl}/store/products?limit=100&offset=${offset}&fields=handle`,
        { headers: { 'x-publishable-api-key': pubKey }, next: { revalidate: 3600 } },
      )
      if (!res.ok) break
      const data = (await res.json()) as { products?: { handle?: string }[]; count?: number }
      const page = Array.isArray(data.products) ? data.products : []
      for (const p of page) if (p.handle) handles.push(p.handle)
      if (page.length < 100 || handles.length >= (data.count ?? 0)) break
    }
  } catch {
    return handles
  }
  return handles
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suzanneravenall.com'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/speaking`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/programs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/masterclass`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/discover-your-pattern`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/transformation-pathways`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/book`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/about/the-story`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about/the-system`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about/the-science`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/testimonials`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  const exploreRoutes: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${siteUrl}/explore/${topic.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const pathwayRoutes: MetadataRoute.Sitemap = pathways.map((pathway) => ({
    url: `${siteUrl}/transformation-pathways/${pathway.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const privateSessionRoutes: MetadataRoute.Sitemap = allPrivateSessions.map(
    (session) => ({
      url: `${siteUrl}/services/private-sessions/${session.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  )

  const programRoutes: MetadataRoute.Sitemap = PROGRAMS.filter((p) => p.isPublished).map(
    (program) => ({
      url: `${siteUrl}/programs/${program.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  )

  const productRoutes: MetadataRoute.Sitemap = (await fetchProductHandles()).map((handle) => ({
    url: `${siteUrl}/shop/${handle}`,
    lastModified: new Date(),
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
