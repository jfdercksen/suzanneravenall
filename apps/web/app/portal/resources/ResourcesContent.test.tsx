import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('framer-motion', () => {
  const strip = (tag: string) =>
    function MotionStub({
      children,
      initial,
      animate,
      transition,
      whileInView,
      viewport,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return { motion: { div: strip('div') } }
})

import ResourcesContent from './ResourcesContent'

describe('ResourcesContent', () => {
  it('links the free Getting Started items to real pages, not "#" (KI074)', () => {
    const { container } = render(<ResourcesContent tier="free" showMemberships={false} />)
    expect(screen.getByRole('link', { name: /Discover Your Pattern/ })).toHaveAttribute('href', '/discover-your-pattern')
    expect(screen.getByRole('link', { name: /The System/ })).toHaveAttribute('href', '/about/the-system')
    expect(screen.getByRole('link', { name: /Free Masterclass/ })).toHaveAttribute('href', '/masterclass')
    expect(container.querySelector('a[href="#"]')).toBeNull()
  })

  it('shows no tier names, locked groups or upgrade prompts while memberships are off', () => {
    const { container } = render(<ResourcesContent tier="free" showMemberships={false} />)
    expect(container.textContent).not.toMatch(/Silver|Gold|Practitioner|Upgrade|Unlock/)
    expect(container.querySelector('a[href^="/portal/upgrade"]')).toBeNull()
  })

  it('keeps the locked groups and upgrade prompts while memberships are on', () => {
    render(<ResourcesContent tier="free" showMemberships />)
    expect(screen.getByRole('heading', { name: 'Practitioner Resources' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Upgrade Options' })).toBeInTheDocument()
    const heading = screen.getByRole('heading', { name: 'Assessments & Workbooks' })
    expect(within(heading.parentElement as HTMLElement).getByText('Upgrade to unlock')).toBeInTheDocument()
  })
})
