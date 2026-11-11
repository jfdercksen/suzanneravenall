/**
 * The Lexical JSON that Payload's richText field stores (Payload 3.83,
 * apps/payload/payload.config.ts editor features), limited to the node types
 * the WordPress migration writes and components/blog/LexicalContent.tsx
 * renders. One file so the converter and the renderer cannot drift apart.
 */

/** Text format bit flags, as Lexical defines them. */
export const TEXT_FORMAT = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
  subscript: 32,
  superscript: 64,
} as const

export interface LexicalText {
  type: 'text'
  text: string
  format: number
  detail: 0
  mode: 'normal'
  style: ''
  version: 1
}

export interface LexicalLineBreak {
  type: 'linebreak'
  version: 1
}

export interface LexicalLink {
  type: 'link'
  version: 3
  fields: { url: string; newTab: boolean; linkType: 'custom' }
  children: LexicalInline[]
  direction: 'ltr' | null
  format: ''
  indent: 0
}

export type LexicalInline = LexicalText | LexicalLineBreak | LexicalLink

interface ElementBase {
  direction: 'ltr' | null
  format: '' | 'left' | 'center' | 'right' | 'justify'
  indent: 0
  version: 1
}

export interface LexicalParagraph extends ElementBase {
  type: 'paragraph'
  textFormat: 0
  textStyle: ''
  children: LexicalInline[]
}

export interface LexicalHeading extends ElementBase {
  type: 'heading'
  tag: 'h2' | 'h3' | 'h4'
  children: LexicalInline[]
}

export interface LexicalQuote extends ElementBase {
  type: 'quote'
  children: LexicalInline[]
}

export interface LexicalListItem extends ElementBase {
  type: 'listitem'
  value: number
  children: Array<LexicalInline | LexicalList>
}

export interface LexicalList extends ElementBase {
  type: 'list'
  listType: 'bullet' | 'number'
  tag: 'ul' | 'ol'
  start: number
  children: LexicalListItem[]
}

export interface LexicalHorizontalRule {
  type: 'horizontalrule'
  version: 1
}

/** A Payload upload node. `value` is the media id when written, the media doc when read at depth >= 1. */
export interface LexicalUpload {
  type: 'upload'
  version: 3
  format: ''
  id: string
  fields: { alt?: string } | null
  relationTo: 'media'
  value: string | number | UploadedMedia
}

export interface UploadedMedia {
  id: string | number
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  filename?: string | null
}

export type LexicalBlock =
  | LexicalParagraph
  | LexicalHeading
  | LexicalQuote
  | LexicalList
  | LexicalHorizontalRule
  | LexicalUpload

export interface LexicalRoot {
  root: {
    type: 'root'
    format: ''
    indent: 0
    version: 1
    direction: 'ltr' | null
    children: LexicalBlock[]
  }
}

/** True when a value has the shape of a Lexical document. */
export function isLexicalRoot(value: unknown): value is LexicalRoot {
  const root = (value as { root?: { type?: unknown; children?: unknown } } | null)?.root
  return Boolean(root && root.type === 'root' && Array.isArray(root.children))
}

/**
 * Video providers whose links are shown as a player. Payload's editor has no
 * embed block, so an embed is stored as a paragraph holding one link to the
 * video (still a working link in the admin), and the renderer plays it.
 */
export function videoEmbedSrc(url: string): string | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const id = u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : u.searchParams.get('v')
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0]
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.split('/').find((part) => /^\d+$/.test(part))
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}
