import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EventsContent from './EventsContent'
import { buildLiveCalendar } from '@/lib/events/liveCalendar'

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

const NOW = new Date('2026-11-10T10:00:00Z')
const empty = buildLiveCalendar(
  {
    programmes: [
      { programmeSlug: 'meditation', format: 'Live via Zoom', sessions: [] },
      { programmeSlug: 'mindfulness', format: 'Live via Zoom', sessions: [] },
    ],
  },
  NOW,
)
const dated = buildLiveCalendar(
  {
    programmes: [
      {
        programmeSlug: 'meditation',
        format: 'Live via Zoom',
        sessions: [{ start: '2027-01-12', end: '2027-02-16', time: '18:00-19:30 SAST', bookHref: '/shop/meditation-live-via-zoom' }],
      },
      { programmeSlug: 'mindfulness', format: 'Live via Zoom', sessions: [] },
    ],
  },
  NOW,
)

describe('EventsContent: live programme calendar (item 11)', () => {
  it('says dates are to be announced while the file has none', () => {
    render(<EventsContent calendar={empty} />)
    expect(screen.getByRole('heading', { name: 'Live dates to be announced' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /: register interest$/ })).toHaveLength(2)
  })

  it('lists The Inner Sanctuary and Present', () => {
    render(<EventsContent calendar={empty} />)
    expect(screen.getByRole('link', { name: 'The Inner Sanctuary' })).toHaveAttribute('href', '/programs/meditation')
    expect(screen.getByRole('link', { name: 'Present' })).toHaveAttribute('href', '/programs/mindfulness')
  })

  it('shows a dated row with its range, time and a Book button', () => {
    render(<EventsContent calendar={dated} />)
    expect(screen.getByRole('heading', { name: 'Upcoming live dates' })).toBeInTheDocument()
    expect(screen.getByText('January 2027')).toBeInTheDocument()
    expect(screen.getByText(/12 January 2027 to 16 February 2027/)).toBeInTheDocument()
    expect(screen.getByText(/18:00-19:30 SAST/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^The Inner Sanctuary: book/ })).toHaveAttribute('href', '/shop/meditation-live-via-zoom')
  })

  it('no longer lists recorded group series or self-study programmes as events', () => {
    render(<EventsContent calendar={empty} />)
    expect(screen.queryByText('Money Mastery')).not.toBeInTheDocument()
    expect(screen.queryByText(/Energy Clearing/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Akashic/)).not.toBeInTheDocument()
  })

  it('points own-pace visitors to self-study and the recorded group healing page', () => {
    render(<EventsContent calendar={empty} />)
    expect(screen.getByRole('link', { name: 'Browse self-study' })).toHaveAttribute('href', '/programs#self-paced')
    expect(screen.getByRole('link', { name: 'See the recorded series' })).toHaveAttribute(
      'href',
      '/programs/recorded-group-healing',
    )
  })

  it('makes no intake promise it cannot keep', () => {
    render(<EventsContent calendar={empty} />)
    expect(screen.queryByText(/Next intake/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/New dates coming soon/i)).not.toBeInTheDocument()
  })
})
