import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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
  return { motion: { div: strip('div') }, useInView: () => false }
})

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span data-alt={alt} />,
}))

import DashboardContent from './DashboardContent'

const base = {
  firstName: 'Johan',
  tierName: 'Free Member',
  tierSlug: 'free' as const,
  programmes: [],
  memberSince: '2026-10-16T09:30:00Z',
}

describe('DashboardContent', () => {
  it('says "Welcome" on the first session and "Welcome back" after (KI077)', () => {
    const { rerender } = render(<DashboardContent {...base} firstSession showMemberships={false} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Welcome, Johan$/)
    rerender(<DashboardContent {...base} firstSession={false} showMemberships={false} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Welcome back, Johan$/)
  })

  it('shows no tier and no upgrade prompt while memberships are off (KI071, KI072)', () => {
    const { container } = render(<DashboardContent {...base} showMemberships={false} />)
    expect(container.textContent).not.toMatch(/Silver|Gold|Membership tier|Free Member|View Membership Plans/)
    expect(container.querySelector('a[href^="/portal/upgrade"]')).toBeNull()
  })

  it('keeps the tier and the upgrade prompt while memberships are on', () => {
    render(<DashboardContent {...base} showMemberships />)
    expect(screen.getByText('Membership tier')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Membership Plans' })).toHaveAttribute('href', '/portal/upgrade')
  })
})
