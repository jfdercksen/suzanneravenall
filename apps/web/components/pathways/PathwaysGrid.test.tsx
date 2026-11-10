import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PathwaysGrid from './PathwaysGrid'

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
// Mock framer-motion — strip animation props and render as plain HTML elements
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
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
    p: ({
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
    }: React.HTMLAttributes<HTMLParagraphElement> & Record<string, unknown>) => (
      <p {...(props as React.HTMLAttributes<HTMLParagraphElement>)}>{children}</p>
    ),
    ul: ({
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
    }: React.HTMLAttributes<HTMLUListElement> & Record<string, unknown>) => (
      <ul {...(props as React.HTMLAttributes<HTMLUListElement>)}>{children}</ul>
    ),
    li: ({
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
    }: React.HTMLAttributes<HTMLLIElement> & Record<string, unknown>) => (
      <li {...(props as React.HTMLAttributes<HTMLLIElement>)}>{children}</li>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('PathwaysGrid', () => {
  describe('section heading', () => {
    it('renders the "Individual Transformation Pathways" section heading', () => {
      render(<PathwaysGrid />)
      expect(
        screen.getByRole('heading', { name: 'Individual Transformation Pathways' })
      ).toBeInTheDocument()
    })
  })

  describe('group labels', () => {
    it('renders the "Personal Pathways" group label', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Personal Pathways')).toBeInTheDocument()
    })

    it('renders the "Young People Pathways" group label', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Young People Pathways')).toBeInTheDocument()
    })
  })

  describe('personal pathway cards — 7 items', () => {
    it('renders "Break the Loop"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Break the Loop')).toBeInTheDocument()
    })

    it('renders "Reclaim Your Power"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Reclaim Your Power')).toBeInTheDocument()
    })

    it('renders "Reinvent Your Life"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Reinvent Your Life')).toBeInTheDocument()
    })

    it('renders "Upgrade Your Operating System"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Upgrade Your Operating System')).toBeInTheDocument()
    })

    it('renders "Trauma to Breakthrough"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Trauma to Breakthrough')).toBeInTheDocument()
    })

    it('renders "Resilience & Fortification"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Resilience & Fortification')).toBeInTheDocument()
    })

    it('renders "Pattern Mastery"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Pattern Mastery')).toBeInTheDocument()
    })
  })

  describe('youth pathway cards: 4 items (Suzanne, 8 Nov)', () => {
    for (const title of ['Pattern Foundations: Children', 'Pattern Foundations: Teens', 'The Family Pattern']) {
      it(`renders "${title}"`, () => {
        render(<PathwaysGrid />)
        expect(screen.getByText(title)).toBeInTheDocument()
      })
    }

    it('no longer lists the retired pathways', () => {
      render(<PathwaysGrid />)
      expect(screen.queryByText('Young Minds Architecture')).not.toBeInTheDocument()
      expect(screen.queryByText('Children & Young People Foundations for Life')).not.toBeInTheDocument()
    })

    it('renders "Inner Compass"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Inner Compass')).toBeInTheDocument()
    })
  })

  describe('card links point to the correct pathways route', () => {
    it('Break the Loop card links to /transformation-pathways/break-the-loop', () => {
      render(<PathwaysGrid />)
      const link = screen.getByRole('link', { name: /Break the Loop/i })
      expect(link).toHaveAttribute('href', '/transformation-pathways/break-the-loop')
    })

    it('Inner Compass card links to /transformation-pathways/inner-compass', () => {
      render(<PathwaysGrid />)
      const link = screen.getByRole('link', { name: /Inner Compass/i })
      expect(link).toHaveAttribute('href', '/transformation-pathways/inner-compass')
    })

    it('Pattern Foundations: Teens card links to the correct route', () => {
      render(<PathwaysGrid />)
      const link = screen.getByRole('link', { name: /Pattern Foundations: Teens/i })
      expect(link).toHaveAttribute('href', '/transformation-pathways/pattern-foundations-teens')
    })

    it('shows the Young People section intro and the four age bands', () => {
      render(<PathwaysGrid />)
      expect(screen.getByRole('heading', { name: 'Patterns start early. So can change.' })).toBeInTheDocument()
      for (const age of ['Ages 7–12', 'Ages 13–18', 'Ages 10–18', 'For parents']) {
        expect(screen.getByText(age)).toBeInTheDocument()
      }
    })
  })

  describe('section accessibility', () => {
    it('renders a <section> with aria-labelledby="pathways-grid-heading"', () => {
      const { container } = render(<PathwaysGrid />)
      const section = container.querySelector('section[aria-labelledby="pathways-grid-heading"]')
      expect(section).toBeInTheDocument()
    })
  })
})