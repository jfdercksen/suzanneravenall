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

  describe('youth pathway cards — 5 items', () => {
    it('renders "Children & Young People Foundations for Life"', () => {
      render(<PathwaysGrid />)
      expect(
        screen.getByText('Children & Young People Foundations for Life')
      ).toBeInTheDocument()
    })

    it('renders "Emotional Mastery for Young Minds"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Emotional Mastery for Young Minds')).toBeInTheDocument()
    })

    it('renders "Young Minds Architecture"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Young Minds Architecture')).toBeInTheDocument()
    })

    it('renders "Pattern Foundations"', () => {
      render(<PathwaysGrid />)
      expect(screen.getByText('Pattern Foundations')).toBeInTheDocument()
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

    it('Young Minds Architecture card links to the correct route', () => {
      render(<PathwaysGrid />)
      const link = screen.getByRole('link', { name: /Young Minds Architecture/i })
      expect(link).toHaveAttribute(
        'href',
        '/transformation-pathways/young-minds-architecture'
      )
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