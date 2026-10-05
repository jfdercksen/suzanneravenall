import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import MemberResourcesSection from './MemberResourcesSection'
import ResourcesFeaturedMedia, { featuredMedia } from './ResourcesFeaturedMedia'
import { MEDIA_ARTICLES } from '@/data/mediaArticles'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>,
}))

// Strip animation props from every motion.<tag> and render the plain tag.
vi.mock('framer-motion', () => {
  const strip = (tag: string) =>
    function MotionStub({
      children,
      initial,
      animate,
      exit,
      transition,
      variants,
      whileInView,
      viewport,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => strip(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

describe('MemberResourcesSection (site check M15, C20)', () => {
  it('sends "Unlock with ..." to the same upgrade page requireAccess uses', () => {
    render(<MemberResourcesSection tier="free" />)
    const unlocks = screen.getAllByRole('link', { name: /^Unlock with/ })
    expect(unlocks.length).toBeGreaterThan(0)
    for (const link of unlocks) {
      expect(link.getAttribute('href')).toMatch(/^\/portal\/upgrade\?from=/)
    }
  })

  it('tells members with access that assessments are not released yet', () => {
    render(<MemberResourcesSection tier="practitioner" />)
    const card = screen.getByRole('link', { name: /Assessments & Workbooks/ })
    expect(card).toHaveAttribute('href', '/resources/assessments')
    expect(within(card).getByText(/not released yet/)).toBeInTheDocument()
    expect(within(card).queryByText('Access now')).not.toBeInTheDocument()
  })
})

describe('ResourcesFeaturedMedia (site check C20)', () => {
  it('uses the shared press dataset, so titles match /resources/media', () => {
    expect(featuredMedia).toHaveLength(4)
    const titles = new Set(MEDIA_ARTICLES.map((a) => a.title))
    for (const item of featuredMedia) expect(titles.has(item.title)).toBe(true)
  })

  it('links a press card only when its entry has a source URL', () => {
    render(<ResourcesFeaturedMedia />)
    for (const item of featuredMedia) {
      const heading = screen.getByRole('heading', { name: item.title })
      const anchor = heading.closest('a')
      if (item.href) expect(anchor).toHaveAttribute('href', item.href)
      else expect(anchor).toBeNull()
    }
  })
})
