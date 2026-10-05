import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PathwayDetail from './PathwayDetail'
import { pathways } from '@/data/pathways'

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

// Strip animation props and render each motion.<tag> as the plain element
vi.mock('framer-motion', () => {
  const strip = ({
    initial, animate, exit, transition, variants, whileInView, viewport, whileHover, whileTap,
    ...rest
  }: Record<string, unknown>) => rest
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

const ADULT_LINE = /You do not have to keep living the old pattern/

describe('PathwayDetail closing CTA (site check C14)', () => {
  for (const pathway of pathways) {
    it(`${pathway.slug}: the CTA section's aria-labelledby points at a rendered h2`, () => {
      const { container } = render(<PathwayDetail pathway={pathway} />)
      const section = container.querySelector('section[aria-labelledby="pathway-cta-heading"]')
      expect(section).not.toBeNull()
      const heading = container.querySelector('#pathway-cta-heading')
      expect(heading?.tagName).toBe('H2')
      expect(heading?.textContent?.trim()).not.toBe('')
    })
  }

  it('youth pathways use their CTA line as the heading and drop the adult line', () => {
    const youth = pathways.find((p) => p.slug === 'emotional-mastery-for-young-minds')!
    render(<PathwayDetail pathway={youth} />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Help them build emotional skills for life.' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(ADULT_LINE)).not.toBeInTheDocument()
  })

  it('adult pathways keep their headline and the old-pattern line', () => {
    const adult = pathways.find((p) => p.slug === 'break-the-loop')!
    render(<PathwayDetail pathway={adult} />)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Ready to stop repeating what you have already outgrown?',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(ADULT_LINE)).toBeInTheDocument()
  })
})
