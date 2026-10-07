import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GroupCorporate, { groupOfferings } from './GroupCorporate'
import Speaking from './Speaking'
import { getProgramBySlug } from '@/data/programs'

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
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return { motion: new Proxy({}, { get: (_t, tag: string) => strip(tag) }) }
})

describe('GroupCorporate (site check M13)', () => {
  // Love & Relationships has no group series; its card opens the self-study
  // programme page instead (Johan, 7 Oct).
  const NOT_GROUP = new Set(['love-and-relationships'])

  it('every group card slug is a published programme, a group one unless listed', () => {
    for (const offering of groupOfferings) {
      if (!offering.slug) continue
      const program = getProgramBySlug(offering.slug)
      expect(program?.isPublished, offering.slug).toBe(true)
      if (!NOT_GROUP.has(offering.slug)) expect(program?.category, offering.slug).toBe('group')
    }
  })

  it('renders linked group cards as links to their programme page', () => {
    render(<GroupCorporate />)
    for (const offering of groupOfferings) {
      const heading = screen.getByRole('heading', { name: offering.name })
      const anchor = heading.closest('a')
      if (offering.slug) expect(anchor).toHaveAttribute('href', `/programs/${offering.slug}`)
      else expect(anchor).toBeNull()
    }
  })
})

describe('Speaking (site check M13)', () => {
  it('links to the dedicated speaking page', () => {
    render(<Speaking />)
    expect(screen.getByRole('link', { name: 'More on Speaking' })).toHaveAttribute('href', '/speaking')
  })
})
