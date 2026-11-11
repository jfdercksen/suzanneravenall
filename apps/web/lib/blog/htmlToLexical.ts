import {
  TEXT_FORMAT,
  videoEmbedSrc,
  type LexicalBlock,
  type LexicalInline,
  type LexicalLink,
  type LexicalList,
  type LexicalListItem,
  type LexicalParagraph,
  type LexicalRoot,
  type LexicalText,
  type LexicalUpload,
} from './lexical'

/**
 * WordPress (and AWeber newsletter) HTML to Payload Lexical JSON, for the blog
 * migration (scripts/migrate-wordpress.ts). Her words go across verbatim: text
 * is only whitespace-collapsed the way a browser shows it, never rewritten.
 * Works on standard DOM nodes, so the script passes a jsdom tree and the tests
 * a DOMParser tree.
 *
 * Kept: paragraphs, headings (h1 becomes h2, h5/h6 become h4: the editor
 * allows h2-h4), bold/italic/underline/strikethrough/code/sub/sup, links,
 * line breaks, bullet and numbered lists (nested), blockquotes, horizontal
 * rules, images (as Payload uploads, through mediaIdFor) and embeds (iframes
 * become a paragraph with one link; video links render as a player).
 * Dropped: scripts, styles, forms, buttons' chrome, empty paragraphs.
 */

export interface ConvertOptions {
  /** Media id for an image source; undefined leaves the image out (never hot-linked). */
  mediaIdFor: (src: string) => string | number | undefined
  /** Upload node ids: deterministic in tests, random in the script. */
  nodeId?: () => string
}

export interface ConvertReport {
  /** Image sources with no media id (left out). */
  missingImages: string[]
  /** Embeds kept as links. */
  embeds: string[]
  /** Embeds with a source that is not a web address (left out). */
  skippedEmbeds: string[]
}

const ELEMENT = 1
const TEXT = 3

const SKIP = new Set(['script', 'style', 'noscript', 'template', 'svg', 'form', 'input', 'select', 'textarea', 'button', 'head', 'title', 'meta', 'link'])
const BLOCK = new Set([
  'p', 'div', 'section', 'article', 'main', 'header', 'footer', 'aside', 'nav', 'figure', 'figcaption',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'hr', 'table', 'thead', 'tbody',
  'tfoot', 'tr', 'td', 'th', 'center', 'pre', 'address', 'dl', 'dt', 'dd', 'iframe', 'img', 'picture', 'video',
])
const BLOCK_SELECTOR = 'p, div, section, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, table, figure, hr'
const FORMAT_TAGS: Record<string, number> = {
  b: TEXT_FORMAT.bold,
  strong: TEXT_FORMAT.bold,
  i: TEXT_FORMAT.italic,
  em: TEXT_FORMAT.italic,
  u: TEXT_FORMAT.underline,
  s: TEXT_FORMAT.strikethrough,
  strike: TEXT_FORMAT.strikethrough,
  del: TEXT_FORMAT.strikethrough,
  code: TEXT_FORMAT.code,
  sub: TEXT_FORMAT.subscript,
  sup: TEXT_FORMAT.superscript,
}

const tagOf = (node: Node): string => (node.nodeType === ELEMENT ? (node as Element).tagName.toLowerCase() : '')

/** The image source WordPress or an email actually shows (lazy-load attributes first). */
export function imageSrc(img: Element): string | null {
  for (const attr of ['data-lazy-src', 'data-src', 'data-orig-file', 'src']) {
    const value = img.getAttribute(attr)?.trim()
    if (value && !value.startsWith('data:')) return value
  }
  return null
}

/** Every image source under a node, in document order, without duplicates. */
export function collectImageSources(root: ParentNode): string[] {
  const seen = new Set<string>()
  root.querySelectorAll('img').forEach((img) => {
    const src = imageSrc(img)
    if (src) seen.add(src)
  })
  return [...seen]
}

const text = (value: string, format: number): LexicalText => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const paragraph = (children: LexicalInline[]): LexicalParagraph => ({
  type: 'paragraph',
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

const link = (url: string, children: LexicalInline[], newTab: boolean): LexicalLink => ({
  type: 'link',
  version: 3,
  fields: { url, newTab, linkType: 'custom' },
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
})

/** Collapse runs of HTML whitespace (not non-breaking spaces) like a browser. */
const collapse = (value: string): string => value.replace(/[ \t\n\r\f]+/g, ' ')

/** Joins adjacent text runs with the same format; trims the edges of a block (not of a link inside it). */
function tidy(inlines: LexicalInline[], trimEdges = true): LexicalInline[] {
  const merged: LexicalInline[] = []
  for (const node of inlines) {
    const last = merged[merged.length - 1]
    if (node.type === 'text' && last?.type === 'text' && last.format === node.format) {
      last.text = collapse(last.text + node.text)
    } else if (node.type === 'link') {
      merged.push({ ...node, children: tidy(node.children, false) })
    } else {
      merged.push(node.type === 'text' ? { ...node } : node)
    }
  }
  // Trim leading/trailing spaces of the block and around line breaks. Inside a
  // link only around line breaks: "foo<a> bar</a>" keeps its space.
  for (let i = 0; i < merged.length; i++) {
    const node = merged[i]
    if (node?.type !== 'text') continue
    const prev = merged[i - 1]
    const next = merged[i + 1]
    if ((!prev && trimEdges) || prev?.type === 'linebreak') node.text = node.text.replace(/^ +/, '')
    if ((!next && trimEdges) || next?.type === 'linebreak') node.text = node.text.replace(/ +$/, '')
  }
  const kept = merged.filter((node) => node.type !== 'text' || node.text.length > 0)
  if (trimEdges) {
    while (kept[0]?.type === 'linebreak') kept.shift()
    while (kept[kept.length - 1]?.type === 'linebreak') kept.pop()
  }
  return kept
}

/** A block carries visible text (not only spaces or &nbsp;). */
function hasContent(inlines: LexicalInline[]): boolean {
  return inlines.some((node) =>
    node.type === 'text' ? node.text.replace(/[\s ﻿​]/g, '').length > 0 : node.type === 'link' && hasContent(node.children),
  )
}

const alignOf = (el: Element): LexicalParagraph['format'] => {
  const align = (el.getAttribute('align') ?? '').toLowerCase()
  const style = (el.getAttribute('style') ?? '').toLowerCase()
  const match = /text-align:\s*(left|center|right|justify)/.exec(style)
  const value = match?.[1] ?? align
  return value === 'center' || value === 'right' || value === 'justify' ? value : ''
}

class Converter {
  private blocks: LexicalBlock[] = []
  private inline: LexicalInline[] = []
  private inlineFormat: LexicalParagraph['format'] = ''
  /** Images and embeds met inside inline content: written right after the block that holds them. */
  private pending: Element[] = []
  readonly report: ConvertReport = { missingImages: [], embeds: [], skippedEmbeds: [] }
  private counter = 0

  constructor(private readonly options: ConvertOptions) {}

  private nodeId(): string {
    if (this.options.nodeId) return this.options.nodeId()
    this.counter += 1
    return `${Date.now().toString(16)}${this.counter.toString(16).padStart(8, '0')}`.slice(-24).padStart(24, '0')
  }

  /** Ends the running paragraph, keeping it only if it has text. */
  private flush(): void {
    const children = tidy(this.inline)
    if (hasContent(children)) {
      const p = paragraph(children)
      p.format = this.inlineFormat
      this.blocks.push(p)
    }
    this.inline = []
    this.inlineFormat = ''
    this.emitPending()
  }

  private emitPending(): void {
    const pending = this.pending
    this.pending = []
    for (const el of pending) {
      if (tagOf(el) === 'img') this.image(el)
      else this.embed(el)
    }
  }

  convert(root: Node): LexicalRoot {
    this.walkBlocks(root)
    this.flush()
    return {
      root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: this.blocks },
    }
  }

  private walkBlocks(parent: Node): void {
    parent.childNodes.forEach((child) => this.block(child))
  }

  private block(node: Node): void {
    if (node.nodeType === TEXT) {
      this.inline.push(...this.inlineOf(node, 0))
      return
    }
    if (node.nodeType !== ELEMENT) return
    const el = node as Element
    const tag = tagOf(el)
    if (SKIP.has(tag) || el.getAttribute('aria-hidden') === 'true' || /display:\s*none/i.test(el.getAttribute('style') ?? '')) return
    // A link or span that only wraps images (WordPress, Elementor) is a block of images.
    if (!BLOCK.has(tag) && el.querySelector('img') && !(el.textContent ?? '').replace(/[\s ]/g, '')) {
      this.flush()
      el.querySelectorAll('img').forEach((img) => this.image(img))
      return
    }
    // An inline wrapper (a, span, font) around paragraphs or headings: keep the blocks apart.
    if (!BLOCK.has(tag) && el.querySelector(BLOCK_SELECTOR)) {
      this.flush()
      this.walkBlocks(el)
      this.flush()
      return
    }
    if (!BLOCK.has(tag)) {
      // flush() resets the alignment; a paragraph opening with <strong> keeps its own.
      this.inline.push(...this.inlineOf(el, 0))
      return
    }
    switch (tag) {
      case 'p': {
        this.flush()
        this.inlineFormat = alignOf(el)
        this.walkBlocks(el)
        this.flush()
        return
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        this.flush()
        const children = tidy(this.inlinesOfChildren(el, 0))
        if (hasContent(children)) {
          const level = tag === 'h1' ? 'h2' : tag === 'h5' || tag === 'h6' ? 'h4' : (tag as 'h2' | 'h3' | 'h4')
          this.blocks.push({ type: 'heading', tag: level, children, direction: 'ltr', format: alignOf(el), indent: 0, version: 1 })
        }
        // Images inside the heading (queued while reading it) follow it.
        this.emitPending()
        return
      }
      case 'ul':
      case 'ol': {
        this.flush()
        const list = this.list(el)
        if (list.children.length > 0) this.blocks.push(list)
        this.emitPending()
        return
      }
      case 'blockquote': {
        this.flush()
        const children = tidy(this.quoteInlines(el))
        if (hasContent(children)) this.blocks.push({ type: 'quote', children, direction: 'ltr', format: '', indent: 0, version: 1 })
        this.emitPending()
        return
      }
      case 'hr': {
        this.flush()
        this.blocks.push({ type: 'horizontalrule', version: 1 })
        return
      }
      case 'img': {
        this.flush()
        this.image(el)
        return
      }
      case 'iframe':
      case 'video': {
        this.flush()
        this.embed(el)
        return
      }
      default: {
        // Containers: div, section, table cells, figure... Their inline runs become paragraphs.
        this.flush()
        this.walkBlocks(el)
        this.flush()
      }
    }
  }

  private image(img: Element): void {
    const src = imageSrc(img)
    if (!src) return
    const id = this.options.mediaIdFor(src)
    if (id === undefined) {
      this.report.missingImages.push(src)
      return
    }
    const alt = img.getAttribute('alt')?.trim()
    const upload: LexicalUpload = {
      type: 'upload',
      version: 3,
      format: '',
      id: this.nodeId(),
      fields: alt ? { alt } : null,
      relationTo: 'media',
      value: id,
    }
    this.blocks.push(upload)
  }

  private embed(el: Element): void {
    let src =
      ['data-lazy-src', 'data-src', 'src']
        .map((attr) => el.getAttribute(attr)?.trim() ?? '')
        .concat(el.querySelector('source')?.getAttribute('src')?.trim() ?? '')
        .find((value) => value && value !== 'about:blank') ?? ''
    if (src.startsWith('//')) src = 'https:' + src
    if (!/^https?:\/\//i.test(src)) {
      if (src) this.report.skippedEmbeds.push(src)
      return
    }
    const url = videoEmbedSrc(src) ? this.watchUrl(src) : src
    this.report.embeds.push(url)
    this.blocks.push(paragraph([link(url, [text(url, 0)], true)]))
  }

  /** A shareable video address for an embed source (the renderer turns it back into a player). */
  private watchUrl(src: string): string {
    const embed = videoEmbedSrc(src)
    if (!embed) return src
    const yt = /youtube-nocookie\.com\/embed\/([\w-]+)/.exec(embed)
    if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`
    const vimeo = /player\.vimeo\.com\/video\/(\d+)/.exec(embed)
    return vimeo ? `https://vimeo.com/${vimeo[1]}` : src
  }

  private list(el: Element): LexicalList {
    const ordered = tagOf(el) === 'ol'
    const start = Number(el.getAttribute('start') ?? '1') || 1
    const items: LexicalListItem[] = []
    let value = start
    el.childNodes.forEach((child) => {
      if (tagOf(child) !== 'li') return
      const li = child as Element
      const inlines: LexicalInline[] = []
      const nested: LexicalList[] = []
      li.childNodes.forEach((part) => {
        const tag = tagOf(part)
        if (tag === 'ul' || tag === 'ol') nested.push(this.list(part as Element))
        else if (tag === 'img') this.pending.push(part as Element)
        else if (tag === 'p' || tag === 'div') {
          if (inlines.length > 0) inlines.push({ type: 'linebreak', version: 1 })
          inlines.push(...this.inlinesOfChildren(part as Element, 0))
        } else inlines.push(...this.inlineOf(part, 0))
      })
      const children = tidy(inlines)
      if (hasContent(children)) {
        items.push({ type: 'listitem', value: value++, children, direction: 'ltr', format: '', indent: 0, version: 1 })
      }
      for (const sub of nested) {
        if (sub.children.length > 0) {
          items.push({ type: 'listitem', value: value++, children: [sub], direction: 'ltr', format: '', indent: 0, version: 1 })
        }
      }
    })
    return {
      type: 'list',
      listType: ordered ? 'number' : 'bullet',
      tag: ordered ? 'ol' : 'ul',
      start,
      children: items,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    }
  }

  /** A blockquote's paragraphs flattened into one quote, separated by line breaks. */
  private quoteInlines(el: Element): LexicalInline[] {
    const out: LexicalInline[] = []
    el.childNodes.forEach((child) => {
      const tag = tagOf(child)
      if (tag === 'img' || tag === 'iframe') {
        this.pending.push(child as Element)
        return
      }
      if (tag === 'p' || tag === 'div' || BLOCK.has(tag)) {
        const part = tidy(this.inlinesOfChildren(child as Element, 0))
        if (hasContent(part)) {
          if (out.length > 0) out.push({ type: 'linebreak', version: 1 })
          out.push(...part)
        }
      } else out.push(...this.inlineOf(child, 0))
    })
    return out
  }

  private inlinesOfChildren(el: Element, format: number): LexicalInline[] {
    const out: LexicalInline[] = []
    el.childNodes.forEach((child) => out.push(...this.inlineOf(child, format)))
    return out
  }

  private inlineOf(node: Node, format: number): LexicalInline[] {
    if (node.nodeType === TEXT) {
      const value = collapse(node.textContent ?? '')
      return value ? [text(value, format)] : []
    }
    if (node.nodeType !== ELEMENT) return []
    const el = node as Element
    const tag = tagOf(el)
    if (SKIP.has(tag) || el.getAttribute('aria-hidden') === 'true' || /display:\s*none/i.test(el.getAttribute('style') ?? '')) return []
    if (tag === 'br') return [{ type: 'linebreak', version: 1 }]
    if (tag === 'img' || tag === 'iframe') {
      // Written as its own block right after the block holding it.
      this.pending.push(el)
      return []
    }
    if (tag === 'a') {
      const href = (el.getAttribute('href') ?? '').trim()
      const children = this.inlinesOfChildren(el, format).filter((c) => c.type !== 'link')
      if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return children
      // A link around an image only: the image is queued, an empty link is not kept.
      if (children.length === 0) return []
      return [link(href, children, el.getAttribute('target') === '_blank')]
    }
    let next = format
    if (FORMAT_TAGS[tag]) next |= FORMAT_TAGS[tag]
    const style = (el.getAttribute('style') ?? '').toLowerCase()
    if (/font-weight:\s*(bold|[6-9]00)/.test(style)) next |= TEXT_FORMAT.bold
    if (/font-style:\s*italic/.test(style)) next |= TEXT_FORMAT.italic
    if (/text-decoration[^;]*underline/.test(style)) next |= TEXT_FORMAT.underline
    return this.inlinesOfChildren(el, next)
  }

}

/** Converts the children of `root` (a body, a content div) to a Lexical document. */
export function htmlToLexical(root: Node, options: ConvertOptions): { doc: LexicalRoot; report: ConvertReport } {
  const converter = new Converter(options)
  const doc = converter.convert(root)
  return { doc, report: converter.report }
}

/** Plain text of a Lexical document, for search, excerpts and checks. */
export function lexicalPlainText(doc: LexicalRoot): string {
  const parts: string[] = []
  const walk = (nodes: ReadonlyArray<{ type: string; text?: string; children?: unknown }>) => {
    for (const node of nodes) {
      if (node.type === 'text' && typeof node.text === 'string') parts.push(node.text)
      else if (node.type === 'linebreak') parts.push('\n')
      if (Array.isArray(node.children)) walk(node.children as typeof nodes)
      if (['paragraph', 'heading', 'quote', 'listitem'].includes(node.type)) parts.push('\n')
    }
  }
  walk(doc.root.children as ReadonlyArray<{ type: string; text?: string; children?: unknown }>)
  return parts.join('').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim()
}
