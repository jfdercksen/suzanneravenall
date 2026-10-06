import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getProgramBySlug } from '@/data/programs'
import ProgramDetailClient from './ProgramDetailClient'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

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
      whileHover,
      whileTap,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => strip(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

describe('ProgramDetailClient facilitator credentials', () => {
  it('keeps the credentials strip at two columns so "International" fits its cell', () => {
    const program = getProgramBySlug('energy-clearing-basic')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    const grid = screen.getByText('International').closest('.grid') as HTMLElement
    expect(grid.className).toMatch(/\bgrid-cols-2\b/)
    expect(grid.className).not.toMatch(/grid-cols-4/)
  })
})

describe('ProgramDetailClient sourced content (sourcing report 6 Oct)', () => {
  it('shows the sourced key takeaways instead of the generic outcome cards', () => {
    const program = getProgramBySlug('energy-clearing-basic')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getByRole('heading', { name: 'Clear yourself' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Shift Your Perspective' })).not.toBeInTheDocument()
  })

  it('keeps the generic outcome cards when no takeaways are sourced', () => {
    const program = getProgramBySlug('getting-unstuck')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getByRole('heading', { name: 'Shift Your Perspective' })).toBeInTheDocument()
  })

  it('shows the sourced who-it-is-for text and prerequisite link', () => {
    const program = getProgramBySlug('trauma-to-transcendence')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getByText(/A two-fold programme/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Coherence Muscle Testing' })).toHaveAttribute(
      'href',
      '/programs/coherence-muscle-testing',
    )
  })

  it('labels Energy Clearing as self-study, not live training', () => {
    const program = getProgramBySlug('energy-clearing-advanced')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getAllByText('Self-Study Online: Start Anytime').length).toBeGreaterThan(0)
    expect(screen.queryByText('Live Training via Zoom')).not.toBeInTheDocument()
  })

  it('asks for interest, not a booking, on a live programme with no dates', () => {
    const program = getProgramBySlug('mindfulness')!
    render(<ProgramDetailClient program={program} relatedPrograms={[]} />)
    expect(screen.getAllByText('Register Interest').length).toBeGreaterThan(0)
    expect(screen.queryByText('View in Shop')).not.toBeInTheDocument()
    expect(screen.getByText(/No live dates are scheduled yet/)).toBeInTheDocument()
  })
})
