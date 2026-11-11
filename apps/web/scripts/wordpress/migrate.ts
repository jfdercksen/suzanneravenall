/**
 * WordPress → Payload blog migration, the shared core (Johan, 11 Nov 2026).
 *
 * Reads the published posts of suzanneravenall.com over the public WordPress
 * REST API, picks the ones that belong in the blog (SCOPE), converts each body
 * to Payload's Lexical rich text (lib/blog/htmlToLexical.ts) and hands posts and
 * images to a store. Two runners use it:
 *   - apps/web/scripts/migrate-wordpress.ts: local dry run, no Payload; writes
 *     the report and data/wordpress-redirects.json.
 *   - apps/payload/src/scripts/migrate-wordpress.ts: the import, inside the
 *     payload-tools container with Payload's Local API (no login, no secret).
 *
 * Newsletters: the WordPress body is only an iframe to her AWeber page, so the
 * newsletter is read from that page. Kept verbatim, in order; dropped as AWeber
 * chrome (and listed in the report): the unsubscribe / change-subscriber row,
 * the sign-up form, the social icon row, the page footer region, and 1x1
 * tracking pixels. A page that is gone or blocked is reported as not migrated,
 * never imported empty. Her words are not edited anywhere.
 *
 * Re-running updates the migrated posts in place from WordPress, so it also
 * overwrites any edit made to them in the CMS since: re-run only to redo the
 * migration, not after the team has edited the posts.
 *
 * Plain DOM code: the caller passes a document parser (jsdom).
 */

import { createHash } from 'node:crypto'
import { collectImageSources, htmlToLexical, imageSrc, lexicalPlainText } from '../../lib/blog/htmlToLexical'
import type { LexicalRoot } from '../../lib/blog/lexical'

export const WP_URL_DEFAULT = 'https://suzanneravenall.com'
export const AUTHOR = 'Dr. Suzanne Ravenall'
/** Payload media accepts these (apps/payload/src/collections/Media.ts). */
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']

// ── Scope (agreed with the EA session, 11 Nov) ─────────────────────────────
export const SCOPE = {
  /** Categories migrated whole (WordPress category → tag on the post). */
  categories: { Newsletter: 'newsletter', 'Beyond Outsourcing': 'article' } as Record<string, string>,
  /** Written articles filed under Uncategorised. (Exploring the Alpha Mind and
   *  Nice or not nice communication are session and programme pages, already
   *  redirected to /services and /programs.) */
  articleSlugs: ['conversations-with-my-brain'],
  /** In the Newsletter category but not newsletters. */
  excludeSlugs: ['blog-post-1'],
  /** Slug prefixes of the same kind: the seven "conference-sr-..." speaking stubs. */
  excludePrefixes: ['conference-sr-'],
  skipReasons: {
    Articles: 'press article stub (empty body); listed on /resources/articles',
    Media: 'press/media entry; listed on /resources/media',
    Awards: 'award entry; listed on /resources/awards',
    Services: 'old service page; replaced by /services',
    'Self-Paced Courses': 'old programme page; replaced by /programs',
    'Practitioner-Programmes': 'old programme page; replaced by /programs',
    'Live Programmes': 'old programme page; replaced by /programs',
    Uncategorized: 'old programme or session page; replaced by /programs',
    Uncategorised: 'old programme page; replaced by /programs',
  } as Record<string, string>,
}

export interface WpPost {
  id: number
  date_gmt: string
  slug: string
  link: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
  categories: number[]
  _embedded?: {
    author?: Array<{ name?: string }>
    'wp:featuredmedia'?: Array<{ source_url?: string; alt_text?: string }>
  }
}

export type Decision = { include: true; tags: string[] } | { include: false; reason: string }

export function decide(post: Pick<WpPost, 'slug'>, categoryNames: string[]): Decision {
  if (SCOPE.excludeSlugs.includes(post.slug) || SCOPE.excludePrefixes.some((p) => post.slug.startsWith(p))) {
    return { include: false, reason: 'not a newsletter: empty conference stub or placeholder' }
  }
  const tags = [...new Set(categoryNames.map((c) => SCOPE.categories[c]).filter((t): t is string => Boolean(t)))]
  if (tags.length > 0) return { include: true, tags }
  if (SCOPE.articleSlugs.includes(post.slug)) return { include: true, tags: ['article'] }
  const reason = categoryNames.map((c) => SCOPE.skipReasons[c]).find(Boolean) ?? 'outside the blog scope'
  return { include: false, reason }
}

/** Her slug, decoded; slugs carrying emoji or other non-URL characters become plain ASCII. */
export function blogSlug(wpSlug: string): string {
  let decoded = wpSlug
  try {
    decoded = decodeURIComponent(wpSlug)
  } catch {
    // keep as is
  }
  if (/^[a-z0-9-]+$/.test(decoded)) return decoded
  return decoded
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Deterministic media filename, so a re-run finds the upload instead of adding a copy. */
export function mediaFilename(src: string): string {
  const url = new URL(src)
  let last = url.pathname.split('/').pop() || 'image'
  try {
    last = decodeURIComponent(last)
  } catch {
    // keep the encoded name
  }
  const base = last.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  const hash = createHash('sha1').update(src).digest('hex').slice(0, 10)
  return `wp-${hash}-${base}`.slice(0, 120)
}

/** The old root-level URL, decoded (newsletter paths carry a sparkle emoji). */
export function oldPath(link: string): string {
  let path = new URL(link).pathname.replace(/\/+$/, '')
  try {
    path = decodeURIComponent(path)
  } catch {
    // keep the encoded path
  }
  return path
}

/**
 * A path as a Next redirect source: characters that path-to-regexp reads as
 * syntax are escaped, so an old URL with ( ) : * + ? { } matches literally.
 */
export function redirectSource(path: string): string {
  return path.replace(/[()*+?:{}]/g, (c) => `\\${c}`)
}

/**
 * The redirect sources for an old path. Next matches the request path as sent,
 * percent-encoded, so a path with an emoji gets its encoded form in both hex
 * cases (WordPress links use lowercase, browsers may send uppercase); the
 * decoded form never matches (tested 11 Nov with next dev).
 */
export function redirectSources(path: string): string[] {
  if (/^[\x00-\x7f]*$/.test(path)) return [redirectSource(path)]
  const upper = encodeURI(path)
  const lower = upper.replace(/%[0-9A-F]{2}/g, (hex) => hex.toLowerCase())
  return [...new Set([upper, lower])].map(redirectSource)
}

/** First-level routes of the new site: a redirect must never shadow one (a test compares it with app/). */
export const APP_ROUTES = new Set([
  'about', 'api', 'blog', 'book', 'cart', 'checkout', 'community', 'contact', 'discover-your-pattern', 'events', 'explore',
  'intake', 'legal', 'masterclass', 'pattern-coach', 'portal', 'programs', 'resources', 'search', 'services', 'shop',
  'speaking', 'staff', 'testimonials', 'transformation-pathways', 'unsubscribe', 'cms', 'newsletters',
])

// ── HTTP ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * fetch with a timeout and three tries, reading the body inside the try (this
 * link resets connections mid-body). 4xx answers are final.
 */
export async function fetchRetry<T>(
  url: string,
  read: (res: Response) => Promise<T>,
  init: RequestInit = {},
  timeoutMs = 120_000,
): Promise<{ res: Response; body: T | null }> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
      if (res.ok) return { res, body: await read(res) }
      if (res.status >= 400 && res.status < 500) return { res, body: null }
      lastError = new Error(`HTTP ${res.status}`)
    } catch (error) {
      lastError = error
    }
    await sleep(3_000 * attempt)
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function getJson<T>(url: string): Promise<{ data: T; res: Response }> {
  const { res, body } = await fetchRetry(url, (r) => r.json() as Promise<T>, { headers: { accept: 'application/json' } })
  if (body === null) throw new Error(`GET ${url} -> ${res.status}`)
  return { data: body, res }
}

// ── WordPress ──────────────────────────────────────────────────────────────
export type ParseHtml = (html: string) => Document

/** The jsdom class, passed in so the core never imports jsdom (it is bundled for payload-tools). */
export type JsdomClass = new (html?: string) => { readonly window: { readonly document: Document } }

/**
 * The one HTML parser both runners use (the local dry run and the payload-tools
 * import), so they cannot drift. It never closes the jsdom window: the converter
 * reads a document after awaiting the image downloads, and a closed window
 * empties its document. On 11 Nov the payload side closed it on a microtask and
 * the three articles converted to 0 words there while the dry run showed them.
 */
export function makeParser(JSDOM: JsdomClass): ParseHtml {
  return (html) => new JSDOM(html).window.document
}

export async function fetchWordPress(wpUrl: string, parse: ParseHtml): Promise<{ posts: WpPost[]; categories: Map<number, string> }> {
  const posts: WpPost[] = []
  for (let page = 1; page <= 20; page++) {
    const { data, res } = await getJson<WpPost[]>(`${wpUrl}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=1&status=publish`)
    posts.push(...data)
    if (page >= Number(res.headers.get('x-wp-totalpages') ?? '1')) break
  }
  const { data } = await getJson<Array<{ id: number; name: string }>>(`${wpUrl}/wp-json/wp/v2/categories?per_page=100`)
  const categories = new Map(data.map((c) => [c.id, textOf(c.name, parse)]))
  return { posts, categories }
}

export const textOf = (html: string, parse: ParseHtml): string =>
  (parse(`<body>${html}</body>`).body.textContent ?? '').replace(/\s+/g, ' ').trim()

/** What was dropped from an AWeber page, for the report. */
export interface Dropped {
  footerRows: number
  signupForms: number
  socialRows: number
  footerRegions: number
  trackingPixels: number
}

/** The body to convert: the AWeber newsletter for newsletters, the WordPress content otherwise. */
export async function bodyOf(
  post: WpPost,
  parse: ParseHtml,
): Promise<{ root: Element; source: string; dropped: Dropped | null } | { error: string }> {
  const wp = parse(`<body>${post.content.rendered}</body>`)
  const frame = wp.querySelector('iframe[src*="optin.com"], iframe[src*="aweber"], iframe[src*="aweb.page"]')
  const src = frame?.getAttribute('src')?.trim()
  if (!src) return { root: wp.body, source: post.link, dropped: null }

  let html: string | null
  let finalUrl = src
  try {
    const { res, body } = await fetchRetry(src, (r) => r.text(), { redirect: 'follow' })
    html = body
    finalUrl = res.url || src
    if (html === null) return { error: `AWeber page ${src} answered ${res.status}` }
  } catch (error) {
    return { error: `AWeber page ${src} unreachable: ${error instanceof Error ? error.message : String(error)}` }
  }
  const doc = parse(html)
  // Two AWeber formats: the newsletter archive (.aw-email-document, 2025-26) and
  // the landing page (.awpage-document, 2024-25).
  const email = doc.querySelector('.aw-email-document') ?? doc.querySelector('.awpage-document')
  if (!email) return { error: `AWeber page ${src} has no newsletter content block` }
  const dropped: Dropped = { footerRows: 0, signupForms: 0, socialRows: 0, footerRegions: 0, trackingPixels: 0 }
  email.querySelectorAll('a').forEach((a) => {
    if (/unsubscribe|change\s*subscriber\s*options/i.test(a.textContent ?? '')) {
      const row = a.closest('tr') ?? a.parentElement
      if (row?.isConnected) {
        row.remove()
        dropped.footerRows += 1
      }
    }
  })
  const drop = (selector: string, key: keyof Dropped) =>
    email.querySelectorAll(selector).forEach((el) => {
      el.remove()
      dropped[key] += 1
    })
  drop('.awpage-signup-form', 'signupForms')
  drop('.awpage-social', 'socialRows')
  drop('.awpage-content-region--footer', 'footerRegions')
  email.querySelectorAll('img').forEach((img) => {
    const w = img.getAttribute('width')
    const h = img.getAttribute('height')
    if ((w === '1' && h === '1') || /open\.aweber|\/open\?|pixel/i.test(img.getAttribute('src') ?? '')) {
      img.remove()
      dropped.trackingPixels += 1
    }
  })
  return { root: email, source: finalUrl, dropped }
}

/** Original-size WordPress image first (drops the -300x200 size suffix), then the src as given. */
export function imageCandidates(src: string): string[] {
  const original = src.replace(/-\d+x\d+(\.[a-z0-9]+)(\?.*)?$/i, '$1')
  return original !== src ? [original, src] : [src]
}

// ── Stores (one per runner) ────────────────────────────────────────────────
export interface MediaStore {
  /** The media id for a filename, if already uploaded. */
  find(filename: string): Promise<string | number | undefined>
  /** Uploads and returns the media id (a dry run returns a stand-in id). */
  create(file: { filename: string; data: Buffer; mimetype: string }, alt: string): Promise<string | number>
}

export interface PostStore {
  upsert(slug: string, data: BlogPostData): Promise<'created' | 'updated' | 'dry-run'>
}

export interface BlogPostData {
  title: string
  slug: string
  content: LexicalRoot
  featuredImage?: string | number
  author: string
  publishedAt: string
  isPublished: true
  seoDescription: string
  tags: Array<{ tag: string }>
}

// ── Run ────────────────────────────────────────────────────────────────────
export interface PostReport {
  wpSlug: string
  slug: string
  title: string
  date: string
  tags: string[]
  source: string
  words: number
  blocks: number
  images: { total: number; uploaded: number; existing: number; missing: Array<{ src: string; why: string }> }
  embeds: string[]
  dropped: Dropped | null
  result?: 'created' | 'updated' | 'dry-run' | 'not migrated'
  error?: string
}

export interface MigrationOptions {
  wpUrl: string
  dryRun: boolean
  only: Set<string>
  parse: ParseHtml
  media: MediaStore
  posts: PostStore
  log: (line: string) => void
}

export interface MigrationResult {
  summary: Record<string, unknown>
  posts: PostReport[]
  skipped: Array<{ slug: string; title: string; categories: string[]; reason: string }>
  redirects: Array<{ source: string; destination: string }>
}

async function ensureMedia(
  src: string,
  alt: string,
  options: MigrationOptions,
): Promise<{ id: string | number; existed: boolean } | { error: string }> {
  const filename = mediaFilename(src)
  const existing = await options.media.find(filename)
  if (existing !== undefined) return { id: existing, existed: true }
  let lastWhy = 'image not reachable'
  for (const url of imageCandidates(src)) {
    try {
      const { res, body } = await fetchRetry(
        url,
        async (r) => (options.dryRun ? Buffer.alloc(0) : Buffer.from(await r.arrayBuffer())),
        { method: options.dryRun ? 'HEAD' : 'GET' },
        180_000,
      )
      if (body === null) {
        lastWhy = `image answered ${res.status}`
        continue
      }
      const mimetype = (res.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? ''
      if (!ALLOWED_TYPES.includes(mimetype)) return { error: `type ${mimetype || 'unknown'} not accepted by Payload media` }
      const id = await options.media.create({ filename, data: body, mimetype }, alt)
      return { id, existed: false }
    } catch (error) {
      lastWhy = `image unreachable: ${error instanceof Error ? error.message : String(error)}`
    }
  }
  return { error: lastWhy }
}

export async function migrate(options: MigrationOptions): Promise<MigrationResult> {
  const { posts, categories } = await fetchWordPress(options.wpUrl, options.parse)
  options.log(`WordPress: ${posts.length} published posts`)
  const skipped: MigrationResult['skipped'] = []
  const reports: PostReport[] = []
  const redirects: MigrationResult['redirects'] = []

  for (const post of posts) {
    const names = post.categories.map((id) => categories.get(id) ?? String(id))
    const title = textOf(post.title.rendered, options.parse)
    const decision = decide(post, names)
    if (!decision.include) {
      skipped.push({ slug: post.slug, title, categories: names, reason: decision.reason })
      continue
    }
    const slug = blogSlug(post.slug)
    const clash = reports.find((r) => r.slug === slug)
    if (clash) throw new Error(`slug ${slug} from ${post.slug} collides with ${clash.wpSlug}: rename one before importing`)
    if (options.only.size > 0 && !options.only.has(slug) && !options.only.has(post.slug)) continue

    const report: PostReport = {
      wpSlug: post.slug,
      slug,
      title,
      date: post.date_gmt,
      tags: decision.tags,
      source: post.link,
      words: 0,
      blocks: 0,
      images: { total: 0, uploaded: 0, existing: 0, missing: [] },
      embeds: [],
      dropped: null,
    }
    reports.push(report)
    try {
      const body = await bodyOf(post, options.parse)
      if ('error' in body) throw new Error(body.error)
      report.source = body.source
      report.dropped = body.dropped

      const mediaIds = new Map<string, string | number>()
      const featured = post._embedded?.['wp:featuredmedia']?.[0]
      const featuredSrc = featured?.source_url
      const sources = [...new Set([...collectImageSources(body.root), ...(featuredSrc ? [featuredSrc] : [])])]
      const altBySrc = new Map<string, string>()
      body.root.querySelectorAll('img').forEach((img) => {
        const src = imageSrc(img)
        const alt = img.getAttribute('alt')?.trim()
        if (src && alt) altBySrc.set(src, alt)
      })
      report.images.total = sources.length
      for (const src of sources) {
        const absolute = new URL(src, body.source).toString()
        // Her alt text where the image has one; the featured image falls back to the title.
        const alt = src === featuredSrc ? featured?.alt_text || title : altBySrc.get(src) ?? ''
        const result = await ensureMedia(absolute, alt, options)
        if ('error' in result) report.images.missing.push({ src: absolute, why: result.error })
        else {
          mediaIds.set(src, result.id)
          if (result.existed) report.images.existing += 1
          else report.images.uploaded += 1
        }
      }

      const { doc, report: conversion } = htmlToLexical(body.root, {
        mediaIdFor: (src) => mediaIds.get(src),
      })
      report.embeds = conversion.embeds
      report.blocks = doc.root.children.length
      const plain = lexicalPlainText(doc)
      report.words = plain.split(/\s+/).filter(Boolean).length
      if (report.words < 20) throw new Error(`body has ${report.words} words after conversion: not imported empty`)

      const excerpt = textOf(post.excerpt.rendered, options.parse).replace(/\s*\[(&hellip;|…)\]$/, '').trim()
      const hasExcerpt = excerpt.replace(/[\s ﻿]/g, '').length > 0
      const description = hasExcerpt ? excerpt : (plain.split('\n').find((l) => l.trim().length > 40) ?? plain).trim()
      const featuredId = featuredSrc ? mediaIds.get(featuredSrc) : undefined
      const data: BlogPostData = {
        title,
        slug,
        content: doc,
        ...(featuredId !== undefined ? { featuredImage: featuredId } : {}),
        author: post._embedded?.author?.[0]?.name || AUTHOR,
        publishedAt: `${post.date_gmt}Z`,
        isPublished: true,
        seoDescription: description.slice(0, 300),
        tags: report.tags.map((tag) => ({ tag })),
      }
      report.result = await options.posts.upsert(slug, data)

      const path = oldPath(post.link)
      const first = path.split('/')[1] ?? ''
      if (path && !APP_ROUTES.has(first) && path !== `/blog/${slug}`) {
        for (const source of redirectSources(path)) redirects.push({ source, destination: `/blog/${slug}` })
      }
      options.log(
        `${report.result === 'dry-run' ? 'would import' : report.result}: ${slug} (${report.words} words, ${report.images.total} images, ${report.images.missing.length} missing)`,
      )
    } catch (error) {
      report.result = 'not migrated'
      report.error = error instanceof Error ? error.message : String(error)
      options.log(`NOT MIGRATED ${slug}: ${report.error}`)
    }
  }

  redirects.sort((a, b) => a.source.localeCompare(b.source))
  const ok = reports.filter((r) => r.result && r.result !== 'not migrated')
  const summary = {
    mode: options.dryRun ? 'dry-run' : 'import',
    wordpressPosts: posts.length,
    selected: reports.length,
    newsletters: ok.filter((r) => r.tags.includes('newsletter')).length,
    articles: ok.filter((r) => !r.tags.includes('newsletter')).length,
    migrated: ok.length,
    notMigrated: reports.filter((r) => r.result === 'not migrated').map((r) => ({ slug: r.slug, why: r.error })),
    images: {
      total: reports.reduce((n, r) => n + r.images.total, 0),
      uploaded: reports.reduce((n, r) => n + r.images.uploaded, 0),
      existing: reports.reduce((n, r) => n + r.images.existing, 0),
      missing: reports.reduce((n, r) => n + r.images.missing.length, 0),
    },
    droppedFromAweber: reports.reduce<Dropped>(
      (acc, r) => {
        if (!r.dropped) return acc
        for (const key of Object.keys(acc) as Array<keyof Dropped>) acc[key] += r.dropped[key]
        return acc
      },
      { footerRows: 0, signupForms: 0, socialRows: 0, footerRegions: 0, trackingPixels: 0 },
    ),
    skipped: skipped.length,
    skippedByReason: skipped.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.reason]: (acc[s.reason] ?? 0) + 1 }), {}),
    redirects: redirects.length,
  }
  return { summary, posts: reports, skipped, redirects }
}
