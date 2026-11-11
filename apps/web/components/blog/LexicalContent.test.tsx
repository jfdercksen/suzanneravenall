import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LexicalContent, mediaSrc } from './LexicalContent'
import { htmlToLexical } from '@/lib/blog/htmlToLexical'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-next-link="true" {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

/** Round trip: the converter's output is what the renderer must show. */
const fromHtml = (html: string, media: Record<string, number> = {}) =>
  htmlToLexical(new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body, {
    mediaIdFor: (src) => media[src],
    nodeId: () => 'n',
  }).doc

describe('LexicalContent', () => {
  it('renders nothing for content that is not a Lexical document', () => {
    const { container } = render(<LexicalContent content={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders headings, paragraphs, formatting, lists, quotes and rules from the converter', () => {
    const doc = fromHtml(
      '<h2>Your Brain Is Always Taking Notes</h2><p>It is <strong>belonging</strong>, <em>always</em>.</p>' +
        '<ul><li>One</li><li>Two</li></ul><ol><li>First</li></ol><blockquote><p>Quote</p></blockquote><hr>',
    )
    const { container } = render(<LexicalContent content={doc} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Your Brain Is Always Taking Notes' })).toBeInTheDocument()
    expect(container.querySelector('strong')?.textContent).toBe('belonging')
    expect(container.querySelector('em')?.textContent).toBe('always')
    expect(container.querySelectorAll('ul li')).toHaveLength(2)
    expect(container.querySelector('ol li')?.textContent).toBe('First')
    expect(container.querySelector('blockquote')?.textContent).toBe('Quote')
    expect(container.querySelector('hr')).not.toBeNull()
  })

  it('opens outside links in a new tab and keeps site links in the app', () => {
    const doc = fromHtml('<p><a href="https://aweber.com/x">out</a> and <a href="/programs">in</a></p>')
    render(<LexicalContent content={doc} />)
    expect(screen.getByRole('link', { name: 'out' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'in' })).toHaveAttribute('data-next-link', 'true')
  })

  it('shows an uploaded image from our own media with its alt text', () => {
    const doc = fromHtml('<img src="https://wp/a.jpg" alt="Suzanne">', { 'https://wp/a.jpg': 5 })
    const node = doc.root.children[0]
    if (node?.type !== 'upload') throw new Error('expected an upload')
    node.value = { id: 5, url: 'http://169.239.180.49/cms/api/media/file/wp-a.jpg', width: 800, height: 600 }
    render(<LexicalContent content={doc} />)
    expect(screen.getByRole('img', { name: 'Suzanne' })).toHaveAttribute('src', 'http://169.239.180.49/cms/api/media/file/wp-a.jpg')
  })

  it('leaves out an upload whose media is not populated', () => {
    const doc = fromHtml('<img src="https://wp/a.jpg" alt="x">', { 'https://wp/a.jpg': 5 })
    const { container } = render(<LexicalContent content={doc} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('plays a video embed and keeps other embeds as links', () => {
    const doc = fromHtml('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe><iframe src="https://maps.example.com/e"></iframe>')
    const { container } = render(<LexicalContent content={doc} />)
    expect(container.querySelector('iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(screen.getByRole('link', { name: 'https://maps.example.com/e' })).toBeInTheDocument()
  })
})

describe('safeHref', () => {
  it('renders an unsafe link as plain text', () => {
    const doc = fromHtml('<p><a href="https://ok.example/x">ok</a></p>')
    const p = doc.root.children[0]
    if (p?.type !== 'paragraph' || p.children[0]?.type !== 'link') throw new Error('expected a link')
    p.children[0].fields.url = 'javascript:alert(1)'
    render(<LexicalContent content={doc} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('ok')).toBeInTheDocument()
  })
})

describe('safeHref and video embeds', () => {
  it('blocks script, data and backslash links in any case', async () => {
    const { safeHref } = await import('./LexicalContent')
    expect(safeHref('JaVaScript:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,x')).toBeNull()
    expect(safeHref('/\\evil.example')).toBeNull()
    expect(safeHref('')).toBeNull()
    expect(safeHref('/blog/x')).toBe('/blog/x')
    expect(safeHref('mailto:a@b.co')).toBe('mailto:a@b.co')
  })

  it('keeps a video link with her own words as a link', () => {
    const doc = fromHtml('<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Watch here</a></p>')
    const { container } = render(<LexicalContent content={doc} />)
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.getByRole('link', { name: 'Watch here' })).toBeInTheDocument()
  })

  it('numbers a list correctly around a nested list', () => {
    const doc = fromHtml('<ol><li>One<ol><li>Sub</li></ol></li><li>Two</li></ol>')
    const { container } = render(<LexicalContent content={doc} />)
    const items = Array.from(container.querySelectorAll(':scope div > ol > li'))
    expect(items.map((li) => li.getAttribute('value'))).toEqual(['1', null, '3'])
    expect(items[1]?.className).toContain('list-none')
  })
})

describe('mediaSrc', () => {
  it('keeps absolute URLs and drops what it cannot place', () => {
    expect(mediaSrc('http://169.239.180.49/cms/api/media/file/a.jpg')).toBe('http://169.239.180.49/cms/api/media/file/a.jpg')
    expect(mediaSrc(undefined)).toBeNull()
  })
})
