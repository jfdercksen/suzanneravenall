import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Programs from './Programs'

// ---------------------------------------------------------------------------
// Mock next/link — render as plain <a> so href is inspectable in tests
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Mock next/image — render as plain <img> so src/alt are inspectable
// ---------------------------------------------------------------------------
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string
    alt: string
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}))

// ---------------------------------------------------------------------------
// Mock framer-motion — strip animation props and render as plain HTML elements
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
    section: ({
      children,
      initial,
      animate,
      exit,
      transition,
      variants,
      whileInView,
      viewport,
      whileHover,
      whileTap,
      ...props
    }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => (
      <section {...(props as React.HTMLAttributes<HTMLElement>)}>{children}</section>
    ),
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      variants,
      whileInView,
      viewport,
      whileHover,
      whileTap,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ---------------------------------------------------------------------------
// Helpers — slice of known programme data used as ground-truth for assertions
// ---------------------------------------------------------------------------
const PROGRAMME_NAMES = [
  // Practitioner column
  'Resonance Repatterning Basic 5 Series',
  'Akashic Navigator (Basic & Advanced)',
  'Energy Clearing (Basic & Advanced)',
  // Self-Paced column
  'Trauma to Transcendence',
  'Love & Relationships',
  'Intuition in My Personal Capacity',
  'Become an Energy Ninja',
  'Getting Unstuck',
  // Live column
  'Mindfulness',
  'Meditation',
  'Inner Cultivation (RR 06)',
  'Principles of Relationship (RR 08)',
] as const

const PROGRAMME_DESCRIPTIONS_NOT_RENDERED = [
  // Resonance Repatterning description
  'Ever wondered why you work so hard at something and it simply',
  // Trauma to Transcendence description
  'Breaking the hold of the childhood brain on your adult self',
  // Mindfulness description
  'the ability to be fully present in the moment',
  // Love & Relationships description
  'We attract people at our common level of woundedness',
] as const

describe('Programs', () => {
  describe('renders 3 column eyebrows', () => {
    it('renders "Practitioner" eyebrow', () => {
      render(<Programs />)
      expect(screen.getByText('Practitioner')).toBeInTheDocument()
    })

    it('renders "Self-Study" eyebrow', () => {
      render(<Programs />)
      expect(screen.getByText('Self-Study')).toBeInTheDocument()
    })

    it('renders "Live" eyebrow', () => {
      render(<Programs />)
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  describe('programme names appear in DOM', () => {
    for (const name of PROGRAMME_NAMES) {
      it(`renders "${name}"`, () => {
        render(<Programs />)
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    }
  })

  describe('programme descriptions do NOT appear in DOM', () => {
    for (const fragment of PROGRAMME_DESCRIPTIONS_NOT_RENDERED) {
      it(`does not render description fragment: "${fragment.slice(0, 50)}…"`, () => {
        render(<Programs />)
        expect(screen.queryByText(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).not.toBeInTheDocument()
      })
    }
  })

  describe('CTA links', () => {
    it('renders "Explore Practitioner Programmes" link pointing to /programs#practitioner', () => {
      render(<Programs />)
      const cta = screen.getByRole('link', { name: 'Explore Practitioner Programmes' })
      expect(cta).toBeInTheDocument()
      expect(cta).toHaveAttribute('href', '/programs#practitioner')
    })

    it('renders "Browse Self-Study" link pointing to /programs#self-paced', () => {
      render(<Programs />)
      const cta = screen.getByRole('link', { name: 'Browse Self-Study' })
      expect(cta).toBeInTheDocument()
      expect(cta).toHaveAttribute('href', '/programs#self-paced')
    })

    it('renders "See Live Dates" link pointing to /events', () => {
      render(<Programs />)
      const cta = screen.getByRole('link', { name: 'See Live Dates' })
      expect(cta).toBeInTheDocument()
      expect(cta).toHaveAttribute('href', '/events')
    })
  })

  describe('section accessibility', () => {
    it('renders a section with id="programs"', () => {
      const { container } = render(<Programs />)
      const section = container.querySelector('section#programs')
      expect(section).toBeInTheDocument()
    })

    it('renders the section heading "Practitioner & Self-Study Programmes"', () => {
      render(<Programs />)
      expect(screen.getByText('Practitioner & Self-Study Programmes')).toBeInTheDocument()
    })
  })
})