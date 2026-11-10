import Link from 'next/link'
import type { RichLine } from '@/lib/content/richLine'

type PlaceholderProps = {
  children: string
  /** 'dark' on a black ground or a picture, 'light' elsewhere. */
  tone?: 'light' | 'dark'
}

/**
 * A fact still to be supplied, shown on the page in a dashed box so nobody
 * mistakes it for real content. data-placeholder lets the link crawl and the
 * tests find every one.
 */
export function Placeholder({ children, tone = 'light' }: PlaceholderProps) {
  const toneClass =
    tone === 'dark'
      ? 'border-white/50 bg-white/10 text-white'
      : 'border-brand-primary-300 bg-brand-sand text-brand-ink'
  return (
    <span
      data-placeholder="true"
      className={`inline rounded border border-dashed px-1.5 py-0.5 text-[0.9em] font-normal not-italic ${toneClass}`}
    >
      [{children}]
    </span>
  )
}

type RichTextProps = {
  line: RichLine
  tone?: 'light' | 'dark'
  /** Class for inline links; defaults to an underlined link in the text colour. */
  linkClassName?: string
}

/** Renders a RichLine: plain text, inline links and visible placeholders. */
export function RichText({ line, tone = 'light', linkClassName }: RichTextProps) {
  if (typeof line === 'string') return <>{line}</>
  const linkClass =
    linkClassName ??
    (tone === 'dark'
      ? 'underline underline-offset-4 decoration-white/60 hover:decoration-white'
      : 'underline underline-offset-4 decoration-brand-primary-300 hover:decoration-brand-primary text-brand-primary')
  return (
    <>
      {line.map((segment, i) => {
        if (typeof segment === 'string') return <span key={i}>{segment}</span>
        if ('link' in segment) {
          return (
            <Link key={i} href={segment.href} className={linkClass}>
              {segment.link}
            </Link>
          )
        }
        return (
          <Placeholder key={i} tone={tone}>
            {segment.placeholder}
          </Placeholder>
        )
      })}
    </>
  )
}
