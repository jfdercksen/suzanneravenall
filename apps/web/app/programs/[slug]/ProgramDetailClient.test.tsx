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
