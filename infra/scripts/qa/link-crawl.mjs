#!/usr/bin/env node
// Link crawl: every page, every link, does it land in the right place.
// Node 24, no npm dependencies. Output: docs/testing/results/links-<stamp>.{csv,json}
//
//   node infra/scripts/qa/link-crawl.mjs [--base=http://169.239.180.49] [--max=600] [--concurrency=6] [--external]
//
// Checks per link: HTTP status (following redirects), redirect to home, the
// old WordPress domain, href="#" / empty / javascript:, missing in-page anchors,
// mailto/tel shape, and known-page text vs destination (Contact must go to
// /contact, and so on). Checks per page: title, duplicate titles, placeholder
// text (lorem, TODO, undefined, NaN, [object Object], {{ }}), broken next/image
// sources (optional --images).

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..')

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true] }))
const BASE = String(args.base ?? 'http://169.239.180.49').replace(/\/$/, '')
const ORIGIN = new URL(BASE).origin
const MAX_PAGES = Number(args.max ?? 600)
const CONCURRENCY = Number(args.concurrency ?? 6)
const CHECK_EXTERNAL = Boolean(args.external)
const CHECK_IMAGES = Boolean(args.images)
const UA = 'SuzanneSelfTest/1.0 (+link-crawl; internal QA)'
const OLD_SITE = /^https?:\/\/(www\.)?suzanneravenall\.com/i

// Link text that must land on a known page. Text is lower-cased and trimmed.
const TEXT_TO_PATH = [
  [/^(contact( us)?|get in touch|book a (discovery )?call)$/, ['/contact']],
  [/^(shop|store|browse the shop|visit the shop)$/, ['/shop']],
  [/^(about|about (suzanne|dr\.? suzanne|me|us))$/, ['/about']],
  [/^(the story)$/, ['/about/the-story']],
  [/^(the system)$/, ['/about/the-system']],
  [/^(the science)$/, ['/about/the-science']],
  [/^(program(me)?s|all program(me)?s|view (all )?program(me)?s)$/, ['/programs', '/shop']],
  [/^(events|live events|upcoming events)$/, ['/events']],
  [/^(blog|articles|resources)$/, ['/blog', '/resources']],
  [/^(the book|book)$/, ['/book']],
  [/^(cart|view cart|basket)$/, ['/cart']],
  [/^(checkout|proceed to checkout)$/, ['/checkout']],
  [/^(log ?in|sign ?in|member (log ?in|area)|portal)$/, ['/portal/login', '/portal']],
  [/^(sign ?up|create (an )?account|join( now)?)$/, ['/portal/signup']],
  [/^(testimonials|client stories|success stories)$/, ['/testimonials']],
  [/^(speaking)$/, ['/speaking']],
  [/^(services|work with (me|suzanne))$/, ['/services']],
  [/^(private sessions|1:1 sessions|one[- ]on[- ]one)$/, ['/services/private-sessions', '/services']],  // the hub lives on /services#private
  [/^(search)$/, ['/search']],
  [/^(privacy( policy)?)$/, ['/legal/privacy']],
  [/^(terms( (of|and) (service|conditions|use))?)$/, ['/legal/terms']],
  [/^(cookie(s| policy))$/, ['/legal/cookies']],
  [/^(disclaimer)$/, ['/legal/disclaimer']],
  [/^(community|forum)$/, ['/community']],
  [/^(masterclass|free masterclass)$/, ['/masterclass']],
  [/^(take the quiz|discover your pattern|pattern quiz|start the quiz)$/, ['/discover-your-pattern']],
  [/^(pattern (intelligence )?coach|brilliant coach)$/, ['/pattern-coach']],
  [/^(explore|areas of focus)$/, ['/explore']],
  [/^(transformation pathways|pathways)$/, ['/transformation-pathways']],
  [/^(home|back to home|homepage)$/, ['/']],
]

const PLACEHOLDERS = [
  [/lorem ipsum/i, 'lorem ipsum'],
  [/\bTODO\b/, 'TODO'],
  [/\bundefined\b/, 'undefined'],
  [/\bNaN\b/, 'NaN'],
  [/\[object Object\]/, '[object Object]'],
  [/\{\{[^}]*\}\}/, 'unfilled template {{ }}'],
  [/\bR ?NaN\b/, 'RNaN price'],
  [/Client Name, Location/, 'placeholder testimonial'],
  [/change_me|CHANGE_ME/, 'change_me placeholder'],
]

async function fetchText(url, { method = 'GET', timeoutMs = 30000 } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: ctrl.signal })
    const ct = res.headers.get('content-type') ?? ''
    const text = method === 'GET' && /text\/html|xml|json/.test(ct) ? await res.text() : ''
    return { status: res.status, url: res.url, ct, text, error: null }
  } catch (e) {
    return { status: 0, url, ct: '', text: '', error: e.name === 'AbortError' ? 'timeout' : e.message }
  } finally { clearTimeout(t) }
}

function decode(s) { return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ') }
function stripTags(s) { return decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() }

function extractLinks(html) {
  const out = []
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html))) {
    const attrs = m[1]
    const hrefM = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)
    const href = hrefM ? decode(hrefM[2] ?? hrefM[3] ?? hrefM[4] ?? '') : null
    const ariaM = attrs.match(/aria-label\s*=\s*"([^"]*)"/i)
    const inner = m[2]
    let text = stripTags(inner)
    if (!text && ariaM) text = ariaM[1]
    if (!text) { const t = inner.match(/alt\s*=\s*"([^"]*)"/i); if (t) text = t[1] }
    out.push({ href, text: text.slice(0, 80) })
  }
  return out
}
function extractImages(html) {
  const out = []
  const re = /<img\b[^>]*\ssrc\s*=\s*"([^"]*)"[^>]*>/gi
  let m
  while ((m = re.exec(html))) out.push(decode(m[1]))
  return out
}
function bodyText(html) {
  const noScript = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
  const body = noScript.match(/<body[\s\S]*<\/body>/i)?.[0] ?? noScript
  return stripTags(body)
}
function hasId(html, id) {
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\s(id|name)\\s*=\\s*["']${esc}["']`, 'i').test(html)
}

// ── Crawl ───────────────────────────────────────────────────────────────────
const pages = new Map()        // path -> { status, finalUrl, title, links, images, text, error }
const queue = []
const seen = new Set()
function enqueue(path) { if (!seen.has(path) && seen.size < MAX_PAGES) { seen.add(path); queue.push(path) } }

function normalise(href, fromPath) {
  try {
    const u = new URL(href, ORIGIN + fromPath)
    return u
  } catch { return null }
}
function isInternal(u) { return u.origin === ORIGIN }
function pathOf(u) { return u.pathname.replace(/\/$/, '') || '/' }

async function crawlPage(path) {
  const r = await fetchText(ORIGIN + path)
  const page = { path, status: r.status, finalUrl: r.url, error: r.error, title: '', links: [], images: [], text: '' }
  if (r.text && /text\/html/.test(r.ct)) {
    page.title = stripTags(r.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
    page.links = extractLinks(r.text)
    page.images = extractImages(r.text)
    page.text = bodyText(r.text)
    page.html = r.text
    for (const l of page.links) {
      if (!l.href) continue
      const u = normalise(l.href, path)
      if (!u || !isInternal(u)) continue
      if (/^(mailto|tel|javascript):/i.test(l.href)) continue
      const p = pathOf(u)
      if (/\.(pdf|jpg|jpeg|png|svg|webp|mp4|ico|xml|txt)$/i.test(p)) continue
      if (/^\/(api|cms|_next|admin|store|auth|uploads)(\/|$)/.test(p)) continue
      enqueue(p)
    }
  }
  pages.set(path, page)
}

async function runQueue(fn, n) {
  await Promise.all(Array.from({ length: n }, async () => {
    while (queue.length) { const item = queue.shift(); await fn(item) }
  }))
}

// ── Seeds ───────────────────────────────────────────────────────────────────
enqueue('/')
{
  const sm = await fetchText(ORIGIN + '/sitemap.xml')
  for (const m of sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = normalise(m[1].trim(), '/')
    if (u && isInternal(u)) enqueue(pathOf(u))
  }
}
// Product and programme pages are not in the sitemap; they are found by following /shop and /programs.
console.log(`crawling ${ORIGIN} from ${queue.length} seeds`)
// The queue grows while crawling; loop until it is empty and no worker is mid-page.
await runQueue(crawlPage, CONCURRENCY)
while (queue.length) await runQueue(crawlPage, CONCURRENCY)
console.log(`fetched ${pages.size} pages`)

// ── Link checks ─────────────────────────────────────────────────────────────
const findings = []
const add = (page, kind, problem, link = '', text = '') => findings.push({ page, kind, problem, link, text })

const externalCache = new Map()
async function checkExternal(u) {
  const key = u.href
  if (externalCache.has(key)) return externalCache.get(key)
  let r = await fetchText(key, { method: 'HEAD', timeoutMs: 20000 })
  if (r.status === 0 || r.status === 405 || r.status === 403) r = await fetchText(key, { method: 'GET', timeoutMs: 20000 })
  externalCache.set(key, r)
  return r
}

const titleOwners = new Map()
for (const page of pages.values()) {
  if (page.status !== 200) add(page.path, 'page', page.error ? `page fetch error: ${page.error}` : `page answers ${page.status}`)
  if (page.status === 200 && !page.title) add(page.path, 'content', 'page has no <title>')
  if (page.title) { const owners = titleOwners.get(page.title) ?? []; owners.push(page.path); titleOwners.set(page.title, owners) }
  for (const [re, label] of PLACEHOLDERS) {
    if (re.test(page.text)) {
      const i = page.text.search(re)
      add(page.path, 'content', `placeholder text: ${label}`, '', page.text.slice(Math.max(0, i - 40), i + 60))
    }
  }
}
for (const [title, owners] of titleOwners) {
  if (owners.length > 1 && !/404|not found/i.test(title)) add(owners.join(' '), 'content', `duplicate <title> "${title}" on ${owners.length} pages`)
}

const externalToCheck = []
for (const page of pages.values()) {
  const seenOnPage = new Set()
  for (const l of page.links) {
    const key = `${l.href}|${l.text}`
    if (seenOnPage.has(key)) continue
    seenOnPage.add(key)
    const href = l.href
    if (href === null) { add(page.path, 'link', 'anchor without href', '', l.text); continue }
    if (href === '' || href === '#') { add(page.path, 'link', 'empty or "#" href', href, l.text); continue }
    if (/^javascript:/i.test(href)) { add(page.path, 'link', 'javascript: href', href, l.text); continue }
    if (/^mailto:/i.test(href)) { if (!/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/.test(href)) add(page.path, 'link', 'malformed mailto', href, l.text); continue }
    if (/^tel:/i.test(href)) { if (!/^tel:\+?[\d\s()-]{7,}$/.test(href)) add(page.path, 'link', 'malformed tel', href, l.text); continue }
    if (OLD_SITE.test(href)) { add(page.path, 'wrong-target', 'points at the OLD WordPress site (suzanneravenall.com)', href, l.text); continue }
    const u = normalise(href, page.path)
    if (!u) { add(page.path, 'link', 'unparseable href', href, l.text); continue }

    if (isInternal(u)) {
      const p = pathOf(u)
      const target = pages.get(p)
      if (/^\/(api|cms|_next|admin|store|auth|uploads)(\/|$)/.test(p) || /\.(pdf|jpg|jpeg|png|svg|webp|mp4|ico|xml|txt)$/i.test(p)) {
        externalToCheck.push({ page: page.path, u, text: l.text, internalAsset: true })
        continue
      }
      if (!target) { add(page.path, 'link', 'internal target not crawled (page cap?)', href, l.text); continue }
      if (target.status !== 200) add(page.path, 'link', `internal link answers ${target.status}`, href, l.text)
      else {
        const finalPath = pathOf(new URL(target.finalUrl))
        if (finalPath !== p && finalPath === '/') add(page.path, 'wrong-target', 'redirects to the home page', href, l.text)
        if (u.hash && u.hash.length > 1 && target.html && !hasId(target.html, u.hash.slice(1))) add(page.path, 'link', `anchor #${u.hash.slice(1)} not found on ${p}`, href, l.text)
      }
      const text = l.text.toLowerCase().replace(/\s+/g, ' ').replace(/[→›»]+$/, '').trim()
      for (const [re, paths] of TEXT_TO_PATH) {
        if (re.test(text) && !paths.some((x) => p === x || p.startsWith(x + '/'))) add(page.path, 'wrong-target', `"${l.text}" goes to ${p}, expected ${paths.join(' or ')}`, href, l.text)
      }
    } else {
      externalToCheck.push({ page: page.path, u, text: l.text, internalAsset: false })
    }
  }
  if (CHECK_IMAGES) for (const src of new Set(page.images)) {
    const u = normalise(src, page.path)
    if (u) externalToCheck.push({ page: page.path, u, text: '(image)', internalAsset: true })
  }
}

const toCheck = externalToCheck.filter((x) => x.internalAsset || CHECK_EXTERNAL)
console.log(`checking ${toCheck.length} asset/external links (${externalToCheck.length - toCheck.length} external skipped; pass --external to check them)`)
{
  let i = 0
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    for (;;) {
      const x = toCheck[i++]
      if (!x) return
      const r = await checkExternal(x.u)
      if (r.status === 999 || (r.status === 403 && !x.internalAsset)) { add(x.page, 'external-manual', `external site blocks robots (${r.status}); open by hand`, x.u.href, x.text); continue }
      if (r.status === 0 || r.status >= 400) add(x.page, x.internalAsset ? 'link' : 'external', `${x.internalAsset ? 'asset' : 'external link'} answers ${r.status || r.error}`, x.u.href, x.text)
    }
  }))
}

// Collapse findings that repeat on many pages (header, footer, cookie bar) into one row each.
{
  const groups = new Map()
  for (const f of findings) {
    const key = `${f.kind}|${f.problem}|${f.link}|${f.text}`
    const g = groups.get(key)
    if (g) g.pages.push(f.page); else groups.set(key, { ...f, pages: [f.page] })
  }
  findings.length = 0
  for (const g of groups.values()) {
    const { pages: ps, ...f } = g
    if (ps.length > 1) { f.page = `${ps.length} pages (${ps.slice(0, 3).join(', ')}${ps.length > 3 ? ', ...' : ''})`; f.problem = `${f.problem} [sitewide, ${ps.length} pages]` }
    findings.push(f)
  }
}

// ── Output ──────────────────────────────────────────────────────────────────
const resultsDir = join(repoRoot, 'docs', 'testing', 'results')
mkdirSync(resultsDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)
const base = join(resultsDir, `links-${stamp}`)
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const cols = ['page_or_product', 'test', 'problem', 'screenshot', 'link', 'status', 'found_on', 'fixed_in', 'link_text', 'kind']
const lines = [cols.join(',')]
const today = new Date().toISOString().slice(0, 10)
for (const f of findings) lines.push([f.page, f.kind === 'content' ? 'T5 content' : 'T4 links', f.problem, '', f.link, f.kind === 'external-manual' ? 'manual' : 'fail', today, '', f.text, f.kind].map(csvCell).join(','))
writeFileSync(`${base}.csv`, lines.join('\n') + '\n')
writeFileSync(`${base}.json`, JSON.stringify({ base: ORIGIN, at: new Date().toISOString(), pages: [...pages.values()].map(({ html, text, ...p }) => ({ ...p, links: p.links.length })), findings }, null, 2))

const byKind = findings.reduce((a, f) => { a[f.kind] = (a[f.kind] ?? 0) + 1; return a }, {})
console.log(`pages: ${pages.size}; findings: ${findings.length} ${JSON.stringify(byKind)}`)
for (const f of findings.slice(0, 60)) console.log(`  [${f.kind}] ${f.page}: ${f.problem}${f.link ? ` -> ${f.link}` : ''}${f.text ? ` ("${f.text}")` : ''}`)
if (findings.length > 60) console.log(`  ... ${findings.length - 60} more in ${base}.csv`)
console.log(`written ${base}.csv and .json`)
