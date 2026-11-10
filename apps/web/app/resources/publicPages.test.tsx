import React from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AwardsContent, { awardItems } from '@/components/resources/AwardsContent'
import ResourcesCategories from '@/components/resources/ResourcesCategories'
import ResourcesFeaturedAwards from '@/components/resources/ResourcesFeaturedAwards'
import ResourcesFeaturedMedia from '@/components/resources/ResourcesFeaturedMedia'

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

// Johan, 10 Nov 2026: "Move to Public". Press, articles and awards are marketing content.
describe('media, articles and awards are public', () => {
  for (const page of ['media', 'articles', 'awards']) {
    it(`/resources/${page} has no access check`, () => {
      const source = readFileSync(join(__dirname, page, 'page.tsx'), 'utf8')
      expect(source).not.toMatch(/requireAccess|check-access|getMemberTier/)
    })
  }

  it('the awards page lists every award', () => {
    render(<AwardsContent />)
    expect(awardItems.length).toBeGreaterThanOrEqual(7)
    for (const award of awardItems) {
      expect(screen.getByRole('heading', { name: award.name })).toBeInTheDocument()
    }
  })

  it('the resources hub no longer marks them members-only', () => {
    render(
      <>
        <ResourcesCategories />
        <ResourcesFeaturedMedia />
        <ResourcesFeaturedAwards />
      </>,
    )
    expect(screen.queryByText('Members')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Recognition & Honours/ })).toHaveAttribute('href', '/resources/awards')
  })
})
