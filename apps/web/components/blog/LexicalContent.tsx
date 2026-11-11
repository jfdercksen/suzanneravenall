import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  TEXT_FORMAT,
  isLexicalRoot,
  videoEmbedSrc,
  type LexicalBlock,
  type LexicalInline,
  type LexicalList,
  type LexicalParagraph,
  type LexicalUpload,
  type UploadedMedia,
} from '@/lib/blog/lexical'
import { mediaSrc } from '@/lib/blog/media'

export { mediaSrc }

/**
 * Renders a blog post's Payload rich text (Lexical JSON). Covers the nodes the
 * editor allows and the WordPress migration writes (lib/blog/lexical.ts).
 * A paragraph that holds nothing but one video link is shown as a player: the
 * editor has no embed block, so that is how embeds are stored.
 */

const ALIGN: Record<string, string> = { center: 'text-center', right: 'text-right', justify: 'text-justify' }

/** Only web, mail and phone links (or site paths) are rendered as links: a CMS edit could hold anything. */
export function safeHref(url: string): string | null {
  const value = url.trim()
  if (!value || value.includes('\\')) return null
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return /^(https?:|mailto:|tel:)/i.test(value) ? value : null
}

function isInternal(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (!site) return false
  try {
    return new URL(url).host === new URL(site).host
  } catch {
    return false
  }
}

function textNode(node: Extract<LexicalInline, { type: 'text' }>, key: number): ReactNode {
  let out: ReactNode = node.text
  const f = node.format
  if (f & TEXT_FORMAT.code) out = <code className="rounded bg-brand-sand px-1 py-0.5 text-[0.9em]">{out}</code>
  if (f & TEXT_FORMAT.subscript) out = <sub>{out}</sub>
  if (f & TEXT_FORMAT.superscript) out = <sup>{out}</sup>
  if (f & TEXT_FORMAT.strikethrough) out = <s>{out}</s>
  if (f & TEXT_FORMAT.underline) out = <u>{out}</u>
  if (f & TEXT_FORMAT.italic) out = <em>{out}</em>
  if (f & TEXT_FORMAT.bold) out = <strong className="font-semibold text-brand-ink">{out}</strong>
  return <span key={key}>{out}</span>
}

function inlines(nodes: LexicalInline[] | undefined): ReactNode[] {
  return (nodes ?? []).map((node, i) => {
    if (node.type === 'text') return textNode(node, i)
    if (node.type === 'linebreak') return <br key={i} />
    if (node.type === 'link') {
      const url = safeHref(node.fields?.url ?? '')
      if (!url) return <span key={i}>{inlines(node.children)}</span>
      const className = 'text-brand-primary underline underline-offset-4 decoration-brand-primary-300 hover:decoration-brand-primary'
      if (isInternal(url)) {
        return (
          <Link key={i} href={url} className={className}>
            {inlines(node.children)}
          </Link>
        )
      }
      return (
        <a key={i} href={url} className={className} target="_blank" rel="noopener noreferrer">
          {inlines(node.children)}
        </a>
      )
    }
    return null
  })
}

/**
 * The one video link a paragraph holds, if that is all it holds and its text is
 * the address itself (how the migration stores an embed). A link with her own
 * words ("Watch here") stays a link.
 */
function soleVideo(p: LexicalParagraph): { src: string; url: string } | null {
  const children = p.children ?? []
  const only = children[0]
  if (children.length !== 1 || only?.type !== 'link') return null
  const url = only.fields?.url ?? ''
  const text = only.children.map((c) => (c.type === 'text' ? c.text : '')).join('').trim()
  if (text !== url) return null
  const src = videoEmbedSrc(url)
  return src ? { src, url } : null
}

function upload(node: LexicalUpload, key: number): ReactNode {
  const media = typeof node.value === 'object' ? (node.value as UploadedMedia) : null
  const src = mediaSrc(media?.url)
  if (!src) return null
  const alt = node.fields?.alt ?? media?.alt ?? ''
  const width = media?.width ?? 1200
  const height = media?.height ?? 800
  return (
    <figure key={key} className="my-10">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full rounded-card"
      />
    </figure>
  )
}

function list(node: LexicalList, key: number): ReactNode {
  const Tag = node.tag === 'ol' ? 'ol' : 'ul'
  return (
    <Tag
      key={key}
      start={node.tag === 'ol' && node.start !== 1 ? node.start : undefined}
      className={`my-6 space-y-2 pl-6 ${Tag === 'ol' ? 'list-decimal' : 'list-disc'} marker:text-brand-muted`}
    >
      {(node.children ?? []).map((item, i) => {
        // A nested list is stored as an item of its own: it takes no number or bullet.
        const wrapper = item.children?.length === 1 && item.children[0]?.type === 'list'
        return (
          <li
            key={i}
            value={Tag === 'ol' && !wrapper ? item.value : undefined}
            className={wrapper ? 'list-none' : 'pl-1'}
          >
            {(item.children ?? []).map((child, j) =>
              child.type === 'list' ? list(child, j) : <span key={j}>{inlines([child])}</span>,
            )}
          </li>
        )
      })}
    </Tag>
  )
}

function block(node: LexicalBlock, key: number): ReactNode {
  switch (node.type) {
    case 'paragraph': {
      const video = soleVideo(node)
      if (video) {
        return (
          <div key={key} className="relative my-10 aspect-video w-full overflow-hidden rounded-card bg-brand-primary-900">
            <iframe
              src={video.src}
              title="Embedded video"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        )
      }
      return (
        <p key={key} className={`my-5 ${ALIGN[node.format] ?? ''}`}>
          {inlines(node.children)}
        </p>
      )
    }
    case 'heading': {
      const Tag = node.tag
      const size = Tag === 'h2' ? 'text-2xl lg:text-3xl mt-12' : Tag === 'h3' ? 'text-xl lg:text-2xl mt-10' : 'text-lg lg:text-xl mt-8'
      return (
        <Tag key={key} className={`${size} mb-4 font-medium tracking-tight text-brand-primary leading-snug ${ALIGN[node.format] ?? ''}`}>
          {inlines(node.children)}
        </Tag>
      )
    }
    case 'quote':
      return (
        <blockquote key={key} className="my-8 border-l-2 border-brand-primary pl-6 text-xl font-light text-brand-primary">
          {inlines(node.children)}
        </blockquote>
      )
    case 'list':
      return list(node, key)
    case 'horizontalrule':
      return <hr key={key} className="my-10 border-brand-border" />
    case 'upload':
      return upload(node, key)
    default:
      return null
  }
}

/** The post body. Renders nothing for content that is not a Lexical document. */
export function LexicalContent({ content }: { content: unknown }) {
  if (!isLexicalRoot(content)) return null
  return (
    <div className="text-base lg:text-lg text-brand-muted font-light leading-relaxed">
      {content.root.children.map((node, i) => block(node, i))}
    </div>
  )
}
