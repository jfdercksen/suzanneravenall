import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TestimonialsContent from './TestimonialsContent'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

vi.mock('framer-motion', () => {
  const MOTION_PROPS = ['initial', 'animate', 'exit', 'transition', 'variants', 'whileInView', 'viewport', 'whileHover', 'whileTap']
  const make = (tag: string) =>
    function MotionStub(props: Record<string, unknown> & { children?: React.ReactNode }) {
      const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.includes(k)))
      return React.createElement(tag, rest, props.children)
    }
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

const writtenGrid = () => {
  const heading = screen.getByRole('heading', { name: 'What clients say' })
  return heading.closest('section') as HTMLElement
}

describe('TestimonialsContent written testimonials', () => {
  it('leads with the three-year testimonial and shows it without a name or a country', () => {
    render(<TestimonialsContent />)
    const first = within(writtenGrid()).getAllByRole('figure')[0]!
    expect(first.textContent).toContain('I have been working with Suzanne for the past 3 years now.')
    expect(first.querySelector('figcaption')?.textContent).toBe('Client')
    // Suzanne, 12 Nov 2026: no mention of Austria anywhere on the page
    expect(document.body.textContent).not.toContain('Austria')
  })

  it('shows no client names on the front of any card', () => {
    render(<TestimonialsContent />)
    const grid = writtenGrid()
    const captions = [...grid.querySelectorAll('figcaption')]
    expect(captions.length).toBe(within(grid).getAllByRole('figure').length)
    expect(captions.length).toBeGreaterThan(30)
    for (const caption of captions) {
      // "Client, <place>" (or "Client" alone) and nothing else: no name, no role
      expect(caption.textContent).toMatch(/^Client(, [A-Za-z ]+)?$/)
    }
    for (const name of ['Matheo', 'Ivana', 'Valanne', 'Jelka', 'Psychotherapist', 'Anonymous']) {
      expect(grid.textContent).not.toContain(name)
    }
  })
})
