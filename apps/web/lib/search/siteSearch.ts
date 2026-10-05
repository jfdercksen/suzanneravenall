/**
 * In-app search over site copy that MeiliSearch does not hold (site check C21).
 *
 * MeiliSearch only indexes products plus a title/one-liner for each explore
 * topic. This module searches the full topic page copy, the static pages
 * (services, about, blog and the other top-level pages, using their existing
 * metadata copy), the private session catalogue and published blog posts.
 * Everything is read from the same data files the pages render, so there is
 * no second copy of the content to keep in sync and nothing to reseed.
 *
 * Matching is word based with a light suffix stemmer, so "anxious" and
 * "anxiety" both reach the emotional mastery topic. Every query word has to
 * match (as a prefix, so partly typed words work while the user types).
 */
import { topics } from '@/app/explore/topics'
import { allPrivateSessions } from '@/data/privateSessions'
import type { BlogPost, PayloadResponse } from '@/types/payload'
import type { SearchIndex, SearchResultItem } from './types'

export interface SiteDocument {
  type: SearchIndex
  id: string
  url: string
  label: string
  title: string
  description: string
  /** Extra copy that should match but is not shown unless it holds the match. */
  body: string[]
}

// Field weights: a title match outranks a description match, which outranks body copy.
const WEIGHT = { title: 5, description: 3, body: 1 } as const

// Longest first. Each pass strips one suffix; two passes reach e.g.
// "anxiously" -> "anxious" -> "anxi" and "leaders" -> "leader" -> "lead".
const SUFFIXES = ['ments', 'ment', 'ness', 'ships', 'ship', 'ings', 'ing', 'iety', 'ety', 'ious', 'ous', 'ies', 'ied', 'ers', 'er', 'ed', 'ly', 'y', 's']

// Words too common to narrow anything down; ignored unless the query is only these.
const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'for', 'how', 'i', 'in', 'is', 'it', 'my', 'of', 'on', 'or', 'the', 'to', 'what', 'with'])

export function stem(word: string): string {
  let w = word
  for (let pass = 0; pass < 2; pass++) {
    const suffix = SUFFIXES.find(
      (s) => w.endsWith(s) && w.length - s.length >= 3 && !(s === 's' && w.endsWith('ss'))
    )
    if (!suffix) break
    // "iety"/"ious" keep their "i" so "anxiety" and "anxious" both become "anxi".
    w = suffix === 'iety' || suffix === 'ious' ? w.slice(0, -suffix.length + 1) : w.slice(0, -suffix.length)
  }
  return w
}

export function tokenize(text: string): string[] {
  return (
    text
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? []
  )
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function wordMatches(word: string, queryStems: string[]): boolean {
  const w = word.toLowerCase()
  const s = stem(w)
  return queryStems.some((q) => s.startsWith(q) || w.startsWith(q))
}

/** Escapes text and wraps every word that matches the query in <mark>. */
export function highlight(text: string, queryStems: string[]): string {
  return text
    .split(/([A-Za-zÀ-ÿ0-9]+)/)
    .map((part, i) =>
      i % 2 === 1 && wordMatches(part.normalize('NFKD').replace(/[̀-ͯ]/g, ''), queryStems)
        ? `<mark>${escapeHtml(part)}</mark>`
        : escapeHtml(part)
    )
    .join('')
}

/** Cuts a long passage down to ~160 characters around the first match. */
function snippet(text: string, queryStems: string[]): string {
  const max = 160
  if (text.length <= max) return text
  const words = text.split(/(\s+)/)
  let offset = 0
  for (const part of words) {
    if (tokenize(part).some((t) => wordMatches(t, queryStems))) break
    offset += part.length
  }
  const start = Math.max(0, Math.min(offset - 40, text.length - max))
  const cut = text.slice(start, start + max).trim()
  return `${start > 0 ? '…' : ''}${cut}${start + max < text.length ? '…' : ''}`
}

function fieldScore(text: string, queryStems: string[]): boolean[] {
  const words = tokenize(text)
  return queryStems.map((q) => words.some((w) => wordMatches(w, [q])))
}

export function searchDocuments(
  docs: SiteDocument[],
  query: string,
  limit: number
): SearchResultItem[] {
  const words = tokenize(query)
  const meaningful = words.filter((w) => !STOP_WORDS.has(w))
  const queryStems = [...new Set((meaningful.length ? meaningful : words).map(stem))]
  if (queryStems.length === 0) return []

  const scored: { doc: SiteDocument; score: number; bodyHit?: string }[] = []
  for (const doc of docs) {
    const title = fieldScore(doc.title, queryStems)
    const description = fieldScore(doc.description, queryStems)
    const bodyHits = doc.body.map((b) => fieldScore(b, queryStems))
    let score = 0
    let allMatched = true
    queryStems.forEach((_, i) => {
      const best = title[i]
        ? WEIGHT.title
        : description[i]
          ? WEIGHT.description
          : bodyHits.some((b) => b[i])
            ? WEIGHT.body
            : 0
      if (best === 0) allMatched = false
      score += best
    })
    if (!allMatched) continue
    // Show the body passage only when the title and description hold no match.
    const shownMatches = queryStems.some((_, i) => title[i] || description[i])
    const bodyHit = shownMatches ? undefined : doc.body.find((_, j) => bodyHits[j]!.some(Boolean))
    scored.push({ doc, score, bodyHit })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, bodyHit }) => ({
      type: doc.type,
      id: doc.id,
      title: highlight(doc.title, queryStems),
      subtitle: highlight(bodyHit ? snippet(bodyHit, queryStems) : doc.description, queryStems),
      url: doc.url,
      thumbnail: null,
      price_zar: null,
      label: doc.label,
    }))
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const TOPIC_DOCUMENTS: SiteDocument[] = topics.map((t) => ({
  type: 'explore_topics',
  id: t.slug,
  url: `/explore/${t.slug}`,
  label: 'Topic',
  title: t.title,
  description: t.shortDescription,
  body: [
    t.heroHeadline,
    t.heroSubheadline,
    t.openingQuestion,
    ...t.recognitionItems,
    ...t.overview,
    t.corePrinciple,
    ...t.discover.flatMap((d) => [d.title, d.body]),
    ...t.approach.flatMap((a) => [a.title, a.body]),
    t.ctaHook,
    t.metaDescription,
  ],
}))

// Titles and descriptions are the pages' own metadata copy (see each page.tsx).
// Keep them in step when a page's metadata changes.
const STATIC_PAGES: Omit<SiteDocument, 'type' | 'label'>[] = [
  {
    id: 'services',
    url: '/services',
    title: 'Services',
    description:
      'Unlock your life and potential with Dr. Suzanne Ravenall: Private Sessions, Group & Corporate Wellness Retreats, Keynote Speaking, and Practitioner & Self-Study Programmes rooted in transformational coaching and pattern-level change.',
    body: ['Private Sessions, Group Programmes & Keynotes'],
  },
  {
    id: 'about',
    url: '/about',
    title: 'About Dr. Suzanne Ravenall',
    description:
      'Meet Dr. Suzanne Ravenall, B.Msc. M.Msc. Msc.D. Modern-day explorer of human potential, transformation and performance coach, speaker, and multiple award-winning entrepreneur championing the change in the human condition one person at a time.',
    body: ['Transformation & Performance Coach'],
  },
  {
    id: 'about-the-story',
    url: '/about/the-story',
    title: 'The Story',
    description:
      'From building one of South Africa’s respected corporate transformation companies to a stroke and multiple sclerosis diagnosis: the personal journey that led Dr. Suzanne Ravenall to Rapid Repatterning®, Neuro-repatterning® and Pattern Intelligence™.',
    body: [],
  },
  {
    id: 'about-the-science',
    url: '/about/the-science',
    title: 'The Science',
    description:
      'Why insight alone doesn’t change behaviour. The science behind Pattern Intelligence™: how the nervous system learns patterns, why they live below conscious thought, and what happens when they change.',
    body: ['Pattern-Level Transformation'],
  },
  {
    id: 'about-the-system',
    url: '/about/the-system',
    title: 'The System',
    description:
      'Pattern Intelligence™ is the philosophy underpinning all of Dr. Suzanne Ravenall’s work: a coherent system of instruments and methods, from the Pattern Discovery Instrument™ to the Pattern Mapping Process™ and Pattern Intelligence AI™.',
    body: ['Pattern Intelligence™'],
  },
  {
    id: 'blog',
    url: '/blog',
    title: 'Blog',
    description:
      'Science-backed perspectives on transformation, pattern mastery, and the art of lasting change, from Dr. Suzanne Ravenall.',
    body: ['Articles'],
  },
  {
    id: 'speaking',
    url: '/speaking',
    title: 'Keynote Speaker',
    description:
      'Dr. Suzanne Ravenall delivers keynote experiences that create measurable, lasting change. Book Suzanne for corporate events, leadership conferences, transformation summits, and wellness events.',
    body: ['Speaking'],
  },
  {
    id: 'book',
    url: '/book',
    title: 'The Breakthrough Trilogy',
    description:
      'A Quest to Find an Upgraded Version of You. Three books. One journey. The complete roadmap to decoding the patterns that keep you stuck, and upgrading every area of your life.',
    body: ['Book'],
  },
  {
    id: 'events',
    url: '/events',
    title: 'Events',
    description:
      'Live events, group sessions and training dates with Dr. Suzanne Ravenall: live-via-Zoom programmes, group repatterning sessions, and upcoming opportunities to work together.',
    body: [],
  },
  {
    id: 'programs',
    url: '/programs',
    title: 'Programmes',
    description:
      "Explore Dr. Suzanne Ravenall's transformation programmes: practitioner training, self-paced online courses, live sessions, and group workshops designed for dramatic change.",
    body: ['Programs'],
  },
  {
    id: 'transformation-pathways',
    url: '/transformation-pathways',
    title: 'Individual & Group Transformation Pathways',
    description:
      'Individual Transformation Pathways for adults and young people: focused journeys to uncover hidden patterns, interrupt old loops, and support lasting change, plus upcoming Group Transformation Pathway immersions guided live by Suzanne.',
    body: [],
  },
  {
    id: 'testimonials',
    url: '/testimonials',
    title: 'Testimonials',
    description:
      'Real transformations from real people. Watch and read what clients around the world say about working with Dr. Suzanne Ravenall: private sessions, group programmes and Rapid Repatterning®.',
    body: ['Reviews'],
  },
  {
    id: 'resources',
    url: '/resources',
    title: 'Resources',
    description:
      "Explore Dr. Suzanne Ravenall's resources hub: published articles, media appearances, awards and the monthly insights newsletter covering transformation, consciousness and human potential.",
    body: ['Articles, Media, Awards & Newsletter'],
  },
  {
    id: 'masterclass',
    url: '/masterclass',
    title: 'Free Masterclass',
    description:
      'Discover the pattern, decode and disrupt it, then rewire your mind and nervous system for radical inner and outer transformation. Free masterclass with Dr. Suzanne Ravenall.',
    body: ['Unlock Your Most Extraordinary Self'],
  },
  {
    id: 'pattern-coach',
    url: '/pattern-coach',
    title: 'Pattern Coach: 24/7 AI Coaching',
    description:
      'The Pattern Intelligence Coach™, a brilliant coach in your pocket, 24 hours a day. Start your 30-day free trial, then continue on a simple monthly subscription.',
    body: [],
  },
  {
    id: 'discover-your-pattern',
    url: '/discover-your-pattern',
    title: 'Discover Your Pattern',
    description:
      'Take a free diagnostic to uncover the emotional, relational, health or performance pattern quietly running your life, then learn how to change it.',
    body: ['Quiz'],
  },
  {
    id: 'contact',
    url: '/contact',
    title: 'Contact',
    description:
      'Book a discovery call, send a message, or find out which coaching path is right for you.',
    body: [],
  },
]

export const PAGE_DOCUMENTS: SiteDocument[] = [
  ...STATIC_PAGES.map((p) => ({ ...p, type: 'pages' as const, label: 'Page' })),
  ...allPrivateSessions.map((s) => ({
    type: 'pages' as const,
    id: `private-session-${s.slug}`,
    url: `/services/private-sessions/${s.slug}`,
    label: 'Service',
    title: s.title,
    description: s.shortDescription,
    body: ['Private session', ...(s.bodyContent ? s.bodyContent.split('\n\n') : [])],
  })),
]

// ---------------------------------------------------------------------------
// Blog posts (Payload CMS)
// ---------------------------------------------------------------------------

/** Collects the plain text of a Lexical rich-text tree. */
export function lexicalText(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((n) => lexicalText(n, out))
  } else if (node && typeof node === 'object') {
    const n = node as { text?: unknown; root?: unknown; children?: unknown }
    if (typeof n.text === 'string' && n.text.trim()) out.push(n.text)
    if (n.root) lexicalText(n.root, out)
    if (n.children) lexicalText(n.children, out)
  }
  return out
}

export function blogPostToDocument(post: BlogPost): SiteDocument {
  return {
    type: 'pages',
    id: `blog-${post.id}`,
    url: `/blog/${post.slug}`,
    label: 'Article',
    title: post.title,
    description: post.seoDescription ?? '',
    body: [...(post.tags ?? []).map((t) => t.tag), ...lexicalText(post.content)],
  }
}

/** Published blog posts, same source and cache window as the /blog page. Never throws. */
export async function fetchBlogDocuments(): Promise<SiteDocument[]> {
  try {
    const res = await fetch(
      'http://payload:3001/api/blog-posts?where[isPublished][equals]=true&limit=100&page=1&depth=0',
      { next: { revalidate: 300 } }
    )
    if (!res?.ok) return []
    const data = (await res.json()) as Partial<PayloadResponse<BlogPost>>
    return Array.isArray(data.docs) ? data.docs.map(blogPostToDocument) : []
  } catch {
    return []
  }
}
