import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import BlogListingContent, { BLOG_PAGE_SIZE } from './BlogListingContent'
import type { BlogPost } from '@/types/payload'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))
vi.mock('framer-motion', () => {
  const strip = ({ initial, animate, exit, transition, variants, whileInView, viewport, whileHover, ...rest }: Record<string, unknown>) => rest
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
          React.createElement(tag, strip(props), children),
    },
  )
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</> }
})

const post = (i: number, tag: string): BlogPost => ({
  id: String(i),
  title: `Post ${i}`,
  slug: `post-${i}`,
  content: null,
  isPublished: true,
  publishedAt: '2026-06-12T08:00:00Z',
  tags: [{ id: `t${i}`, tag }],
})

const posts = [
  ...Array.from({ length: 20 }, (_, i) => post(i + 1, 'newsletter')),
  ...Array.from({ length: 5 }, (_, i) => post(i + 21, 'Articles')),
]

describe('BlogListingContent paging and tags', () => {
  it(`shows ${BLOG_PAGE_SIZE} posts a page with Newer / Older`, () => {
    render(<BlogListingContent posts={posts} />)
    expect(screen.getAllByRole('article')).toHaveLength(BLOG_PAGE_SIZE)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Older/ }))
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Post 13' })).toBeInTheDocument()
  })

  it('opens on the newsletter tag from /blog?tag=newsletter', () => {
    render(<BlogListingContent posts={posts} initialTag="newsletter" />)
    expect(screen.getByRole('button', { name: 'newsletter' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('heading', { name: 'Post 21' })).not.toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('ignores an unknown tag and goes back to page 1 on a new tag', () => {
    render(<BlogListingContent posts={posts} initialTag="nope" />)
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /Older/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Articles' }))
    expect(screen.getAllByRole('article')).toHaveLength(5)
    expect(screen.queryByRole('navigation', { name: 'Blog pages' })).not.toBeInTheDocument()
  })
})
