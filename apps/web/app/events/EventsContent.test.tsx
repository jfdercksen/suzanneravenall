import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EventsContent, { awaitingDateDuration } from './EventsContent'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

// Strip animation props and render each motion.<tag> as the plain element
vi.mock('framer-motion', () => {
  const strip = ({
    initial, animate, exit, transition, variants, whileInView, viewport, whileHover, whileTap,
    ...rest
  }: Record<string, unknown>) => rest
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
          React.createElement(tag, strip(props), children),
    },
  )
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</> }
})

describe('EventsContent (site check C12)', () => {
  it('does not claim the discovery call is "Available this week"', () => {
    render(<EventsContent />)
    expect(screen.queryByText('Available this week')).not.toBeInTheDocument()
  })

  it('only labels the free discovery call as Complimentary', () => {
    render(<EventsContent />)
    expect(screen.getAllByText('Complimentary')).toHaveLength(1)
  })

  it('does not list the self-study Basic Five under Live via Zoom', () => {
    render(<EventsContent />)
    expect(screen.queryByText('The Basic Five (Programs 1–5)')).not.toBeInTheDocument()
  })

  it('does not call a session awaiting new dates a recorded series', () => {
    render(<EventsContent />)
    expect(screen.queryByText(/Recorded series/)).not.toBeInTheDocument()
  })
})

describe('awaitingDateDuration', () => {
  it('drops the "Recorded series:" prefix and keeps the format', () => {
    expect(awaitingDateDuration('Recorded series: 4 sessions')).toBe('4 sessions')
  })

  it('leaves other durations alone', () => {
    expect(awaitingDateDuration('Live via Zoom: new dates to be announced')).toBe(
      'Live via Zoom: new dates to be announced',
    )
  })
})
