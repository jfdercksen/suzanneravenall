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

  it('youth pathways close on the pathway name and drop the adult line', () => {
    const youth = pathways.find((p) => p.slug === 'pattern-foundations-teens')!
    render(<PathwayDetail pathway={youth} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Pattern Foundations: Teens' })).toBeInTheDocument()
    expect(screen.queryByText(ADULT_LINE)).not.toBeInTheDocument()
  })
  it('adult pathways keep the discovery session CTA and no register-interest notice', () => {
    const adult = pathways.find((p) => p.slug === 'break-the-loop')!
    render(<PathwayDetail pathway={adult} />)
    expect(screen.getAllByRole('link', { name: /Book a Discovery Session/ }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /Register Interest/ })).not.toBeInTheDocument()
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

describe('PathwayDetail: Book button on every pathway (item 7.1)', () => {
  for (const pathway of pathways) {
    it(`${pathway.slug}: links Book a Session to the private sessions`, () => {
      render(<PathwayDetail pathway={pathway} />)
      const links = screen.getAllByRole('link', { name: 'Book a Session' })
      expect(links.length).toBeGreaterThanOrEqual(1)
      for (const link of links) expect(link).toHaveAttribute('href', '/services#private')
    })
  }
})

describe('PathwayDetail: young people pathways (items 7.3, 7.4)', () => {
  const minors = pathways.filter((p) => p.category === 'youth' && p.slug !== 'the-family-pattern')

  for (const pathway of minors) {
    it(`${pathway.slug}: shows the safeguarding block with policy, consent, credentials and referral`, () => {
      render(<PathwayDetail pathway={pathway} />)
      expect(screen.getByRole('heading', { level: 2, name: /Safeguarding & scope/ })).toBeInTheDocument()
      expect(screen.getByText('Safeguarding policy')).toBeInTheDocument()
      expect(screen.getByText('Parental consent')).toBeInTheDocument()
      expect(screen.getByText(/Certified Family Trauma Specialist/)).toBeInTheDocument()
      expect(screen.getByText(/not treatment or therapy/)).toBeInTheDocument()
      expect(screen.getByText(/refer on to a registered health professional/)).toBeInTheDocument()
    })
  }

  it('renders the format line as a visible placeholder', () => {
    const { container } = render(<PathwayDetail pathway={minors[0]!} />)
    const placeholders = Array.from(container.querySelectorAll('[data-placeholder="true"]')).map((n) => n.textContent)
    expect(placeholders.some((t) => t?.startsWith('[Format:'))).toBe(true)
  })

  it('children: her Book a Parent Discovery Call button and the session themes', () => {
    const children = pathways.find((p) => p.slug === 'pattern-foundations-children')!
    render(<PathwayDetail pathway={children} />)
    expect(screen.getAllByRole('link', { name: /Book a Parent Discovery Call/ })[0]).toHaveAttribute('href', '/contact#book')
    expect(screen.getByText('Foundations for Life · Pattern Foundations')).toBeInTheDocument()
  })

  it('the parents pathway has no safeguarding block', () => {
    const family = pathways.find((p) => p.slug === 'the-family-pattern')!
    render(<PathwayDetail pathway={family} />)
    expect(screen.queryByText('Parental consent')).not.toBeInTheDocument()
  })
})

describe('PathwayDetail: Pattern Mastery (item 7.2)', () => {
  const mastery = pathways.find((p) => p.slug === 'pattern-mastery')!

  it('closes on "Want to do this work with others?" with the practitioner link', () => {
    render(<PathwayDetail pathway={mastery} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Want to do this work with others?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Practitioner Certification' })).toHaveAttribute('href', '/programs#practitioner')
  })

  it('shows the foundations pathway name as a placeholder', () => {
    render(<PathwayDetail pathway={mastery} />)
    expect(screen.getByText('[Foundations pathway name]')).toBeInTheDocument()
  })

  it('offers Apply for Pattern Mastery and Book a Discovery Call', () => {
    render(<PathwayDetail pathway={mastery} />)
    expect(screen.getAllByRole('link', { name: /Apply for Pattern Mastery/ }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Book a Discovery Call' })).toHaveAttribute('href', '/contact#book')
  })
})
