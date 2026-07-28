import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PathwaysGroupSection from './PathwaysGroupSection'

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

describe('PathwaysGroupSection', () => {
  describe('section heading', () => {
    it('renders the "Group Transformation Pathways" section heading', () => {
      render(<PathwaysGroupSection />)
      expect(
        screen.getByRole('heading', { name: 'Group Transformation Pathways' })
      ).toBeInTheDocument()
    })
  })

  describe('immersion cards — 4 items', () => {
    it('renders "3-Day Immersion"', () => {
      render(<PathwaysGroupSection />)
      expect(screen.getByText('3-Day Immersion')).toBeInTheDocument()
    })

    it('renders "8-Week Immersion"', () => {
      render(<PathwaysGroupSection />)
      expect(screen.getByText('8-Week Immersion')).toBeInTheDocument()
    })

    it('renders "12-Week Immersion"', () => {
      render(<PathwaysGroupSection />)
      expect(screen.getByText('12-Week Immersion')).toBeInTheDocument()
    })

    it('renders "12-Month Immersion"', () => {
      render(<PathwaysGroupSection />)
      expect(screen.getByText('12-Month Immersion')).toBeInTheDocument()
    })
  })

  describe('in-development badges', () => {
    it('renders an "In Development" badge on every card', () => {
      render(<PathwaysGroupSection />)
      expect(screen.getAllByText('In Development')).toHaveLength(4)
    })
  })

  describe('register-interest CTAs', () => {
    it('renders a "Register Your Interest" link per card, each pointing to /contact', () => {
      render(<PathwaysGroupSection />)
      const links = screen.getAllByRole('link', { name: /Register Your Interest/i })
      expect(links).toHaveLength(4)
      for (const link of links) {
        expect(link).toHaveAttribute('href', '/contact')
      }
    })
  })

  describe('section accessibility', () => {
    it('renders a <section> with aria-labelledby="pathways-group-heading"', () => {
      const { container } = render(<PathwaysGroupSection />)
      const section = container.querySelector(
        'section[aria-labelledby="pathways-group-heading"]'
      )
      expect(section).toBeInTheDocument()
    })
  })
})
