import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BookContent from './BookContent'
import BookPromotion from '@/components/home/BookPromotion'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

// Render motion.* as plain elements without animation props.
vi.mock('framer-motion', () => {
  const cache = new Map<string, React.FC<Record<string, unknown>>>()
  const factory = (tag: string) => {
    if (!cache.has(tag)) {
      cache.set(tag, function MotionStub({
        children,
        initial,
        animate,
        exit,
        transition,
        whileInView,
        whileHover,
        viewport,
        variants,
        ...props
      }: Record<string, unknown>) {
        return React.createElement(tag, props, children as React.ReactNode)
      })
    }
    return cache.get(tag)
  }
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => factory(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInView: () => true,
    useReducedMotion: () => false,
  }
})

// Decision 7 (content sourcing, 6 Oct): the only sourced book is the
// "Breakthrough Trilogy" pre-order at R165. The three individual titles and
// any "Available now" claim were ours, not Suzanne's.
const INVENTED_TITLES = [/Decoding the Pattern/, /Beyond the Pattern/, /Becoming Unstoppable/]

describe('BookContent (decision 7)', () => {
  it('shows the Breakthrough Trilogy as a R165 pre-order', () => {
    render(<BookContent />)
    expect(screen.getByRole('heading', { name: 'Breakthrough Trilogy' })).toBeInTheDocument()
    expect(screen.getAllByText('R165').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/pre-order/i).length).toBeGreaterThan(0)
  })

  it('drops the invented per-book titles, excerpt and "Available now" claim', () => {
    render(<BookContent />)
    for (const title of INVENTED_TITLES) expect(screen.queryByText(title)).not.toBeInTheDocument()
    expect(screen.queryByText(/available now/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Read an Excerpt/)).not.toBeInTheDocument()
  })
})

describe('BookPromotion (decision 7)', () => {
  it('labels the home book card as a pre-order, never "Available now"', () => {
    render(<BookPromotion />)
    expect(screen.queryByText(/available now/i)).not.toBeInTheDocument()
    expect(screen.getByText('Pre-order')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pre-order: R165' })).toHaveAttribute(
      'href',
      '/shop/the-latest-book-by-suzanne',
    )
  })
})
