import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import CalBookingSection, { BOOKING_FALLBACK_HREF } from './CalBookingSection'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>
  ),
}))

// Strip animation props and render plain elements.
vi.mock('framer-motion', () => {
  const strip = (tag: 'section' | 'div' | 'p' | 'h2') =>
    function MotionStub({
      children,
      initial,
      animate,
      transition,
      whileInView,
      viewport,
      ...props
    }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) {
      return React.createElement(tag, props, children)
    }
  return { motion: { section: strip('section'), div: strip('div'), p: strip('p'), h2: strip('h2') } }
})

// getCalApi resolves with the snippet queue whether or not embed.js loads;
// readiness comes from window.Cal.instance, which embed.js sets.
const calFn = vi.fn()
vi.mock('@calcom/embed-react', () => ({
  getCalApi: vi.fn(() => Promise.resolve(calFn)),
}))

type CalWindow = { Cal?: { instance?: unknown } }

beforeEach(() => {
  vi.useFakeTimers()
  delete (window as unknown as CalWindow).Cal
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  delete (window as unknown as CalWindow).Cal
})

describe('CalBookingSection', () => {
  it('renders a working fallback link to /contact#book before Cal is ready', async () => {
    await act(async () => {
      render(<CalBookingSection />)
    })
    const link = screen.getByRole('link', { name: 'Book a Discovery Call' })
    expect(link).toHaveAttribute('href', BOOKING_FALLBACK_HREF)
    expect(BOOKING_FALLBACK_HREF).toBe('/contact#book')
  })

  it('keeps the fallback link when the embed never loads', async () => {
    await act(async () => {
      render(<CalBookingSection />)
    })
    await act(async () => {
      vi.advanceTimersByTime(15_000)
    })
    expect(screen.getByRole('link', { name: 'Book a Discovery Call' })).toHaveAttribute('href', '/contact#book')
    expect(screen.queryByRole('button', { name: 'Book a Discovery Call' })).not.toBeInTheDocument()
  })

  it('switches to the modal button once embed.js has loaded', async () => {
    await act(async () => {
      render(<CalBookingSection />)
    })
    ;(window as unknown as CalWindow).Cal = { instance: {} }
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    const button = screen.getByRole('button', { name: 'Book a Discovery Call' })
    expect(button).toBeEnabled()
    expect(screen.queryByRole('link', { name: 'Book a Discovery Call' })).not.toBeInTheDocument()
  })
})
