// @vitest-environment node
// (esbuild refuses jsdom's TextEncoder; this test brings its own JSDOM.)
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect } from 'vitest'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import * as sourceCore from './migrate'
import type { WpPost } from './migrate'

/**
 * Both runners (the local dry run and the payload-tools import) must turn a
 * WordPress article into the same body. On 11 Nov the payload side closed the
 * jsdom window early and the three articles came out with 0 words there.
 */

const DIV_WRAPPED =
  '<div class="x"><div><p><strong>Article for</strong> The Star</p><p>I must admit that this one is hard. In an attempt to get to grips with work-life balance I have managed to read and study.</p></div></div>'
const ELEMENTOR =
  '<div data-elementor-type="wp-post" class="elementor"><section class="elementor-section"><div class="elementor-container"><div class="elementor-column"><div class="elementor-widget-wrap">' +
  '<a class="elementor-button" href="https://example.com/book"><span class="elementor-button-content-wrapper"><span class="elementor-button-text">book a discussion</span></span></a>' +
  '<div class="elementor-widget-text-editor"><h6><p>Introduction</p></h6><p>After suffering a traumatic brain injury, stroke and several life or death traumas Suzanne is living proof that you can re-train your brain.</p></div>' +
  '</div></div></div></section></div>'

const post = (content: string): WpPost => ({
  id: 1,
  date_gmt: '2021-07-14T08:00:00',
  slug: 'article',
  link: 'https://suzanneravenall.com/article/',
  title: { rendered: 'Article' },
  excerpt: { rendered: '' },
  content: { rendered: content },
  categories: [],
})

const wordsOf = (text: string) => text.split(/\s+/).filter(Boolean).length

type Core = typeof sourceCore

/** The article path as migrate() runs it: body, an await (the image downloads), then the conversion. */
async function articleWords(core: Core, convert: typeof import('../../lib/blog/htmlToLexical'), content: string): Promise<number> {
  const body = await core.bodyOf(post(content), core.makeParser(JSDOM))
  if ('error' in body) throw new Error(body.error)
  await new Promise((resolve) => setTimeout(resolve, 20))
  return wordsOf(convert.lexicalPlainText(convert.htmlToLexical(body.root, { mediaIdFor: () => 1 }).doc))
}

/** The core exactly as payload-tools loads it: bundled by esbuild into one ESM file, then imported. */
async function bundledCore(): Promise<{ core: Core; convert: typeof import('../../lib/blog/htmlToLexical') }> {
  const dir = await mkdtemp(join(tmpdir(), 'wp-core-test-'))
  try {
    const entry = join(dir, 'entry.ts')
    const coreFile = join(__dirname, 'migrate.ts').replace(/\\/g, '/')
    const convertFile = join(__dirname, '..', '..', 'lib', 'blog', 'htmlToLexical.ts').replace(/\\/g, '/')
    const { writeFile } = await import('node:fs/promises')
    await writeFile(entry, `export * as core from '${coreFile}'\nexport * as convert from '${convertFile}'\n`)
    const outfile = join(dir, 'bundle.mjs')
    await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', target: 'node20', outfile, logLevel: 'error' })
    return (await import(pathToFileURL(outfile).href)) as { core: Core; convert: typeof import('../../lib/blog/htmlToLexical') }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

describe('WordPress article path, both entry points', () => {
  it('the source core keeps the words of a div-wrapped and an Elementor fragment', async () => {
    const convert = await import('../../lib/blog/htmlToLexical')
    // Every word of every paragraph (counted per paragraph: textContent would run "Star" and "I" together).
    const paragraphs = Array.from(new JSDOM(DIV_WRAPPED).window.document.querySelectorAll('p')).map((p) => p.textContent ?? '')
    expect(await articleWords(sourceCore, convert, DIV_WRAPPED)).toBe(wordsOf(paragraphs.join(' ')))
    expect(await articleWords(sourceCore, convert, ELEMENTOR)).toBeGreaterThan(25)
  })

  it('the bundled core (the payload-tools path) gives the same words', async () => {
    const convertSource = await import('../../lib/blog/htmlToLexical')
    const { core, convert } = await bundledCore()
    for (const fragment of [DIV_WRAPPED, ELEMENTOR]) {
      expect(await articleWords(core, convert, fragment)).toBe(await articleWords(sourceCore, convertSource, fragment))
    }
  }, 30_000)

  it('both runners use the shared parser and neither closes the window', async () => {
    const payloadRun = await readFile(join(__dirname, '..', '..', '..', 'payload', 'src', 'scripts', 'wordpress', 'run.ts'), 'utf8')
    const webRun = await readFile(join(__dirname, '..', 'migrate-wordpress.ts'), 'utf8')
    for (const source of [payloadRun, webRun]) {
      expect(source).toMatch(/parse:\s*makeParser\(\s*JSDOM\s*\)/)
      expect(source).not.toMatch(/window\.close\(/)
    }
  })

  it('shows why: a parser that closes the window loses the article', async () => {
    const closing = (html: string) => {
      const { window } = new JSDOM(html)
      queueMicrotask(() => window.close())
      return window.document
    }
    const body = await sourceCore.bodyOf(post(DIV_WRAPPED), closing)
    if ('error' in body) throw new Error(body.error)
    await new Promise((resolve) => setTimeout(resolve, 20))
    const { htmlToLexical, lexicalPlainText } = await import('../../lib/blog/htmlToLexical')
    expect(wordsOf(lexicalPlainText(htmlToLexical(body.root, { mediaIdFor: () => 1 }).doc))).toBe(0)
  })
})
