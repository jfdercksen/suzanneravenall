import React from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WorkWithSuzanne from './WorkWithSuzanne'
import PatternIntelligenceBand from './PatternIntelligenceBand'
import DiscoveryHubBand from './DiscoveryHubBand'
import PathwaysBand from './PathwaysBand'
import LiveProgrammesBand from './LiveProgrammesBand'
import SelfStudyBand from './SelfStudyBand'
import ThreeWaysToBegin from './ThreeWaysToBegin'
import { buildLiveCalendar } from '@/lib/events/liveCalendar'
import { getProgramBySlug, HOME_SELF_STUDY } from '@/data/programs'

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
vi.mock('framer-motion', () => {
  const strip = ({ initial, animate, exit, transition, variants, whileInView, viewport, ...rest }: Record<string, unknown>) => rest
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
          React.createElement(tag, strip(props), children),
    },
  )
  return { motion }
})

describe('home page section order (8 Nov item 9)', () => {
  it('renders the sections in the agreed order', () => {
    const source = readFileSync(join(__dirname, '../../app/page.tsx'), 'utf8')
    const body = source.slice(source.indexOf('export default async function HomePage'))
    const order = [
      '<Hero',
      '<WorkWithSuzanne',
      '<PatternIntelligenceBand',
      '<DiscoveryHubBand',
      '<PathwaysBand',
      '<LiveProgrammesBand',
      '<SelfStudyBand',
      '<BookPromotion',
      '<VideoTestimonials',
      '<LeadMagnet',
      '<MediaLogos',
      '<ThreeWaysToBegin',
      '<FinalCTA',
    ].map((tag) => body.indexOf(tag))
    expect(order.every((i) => i > -1)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })
})

describe('WorkWithSuzanne', () => {
  it('offers private sessions, speaking and corporate work near the top', () => {
    render(<WorkWithSuzanne />)
    expect(screen.getByRole('link', { name: 'Book a Session' })).toHaveAttribute('href', '/services#private')
    expect(screen.getByRole('link', { name: 'Book Suzanne to Speak' })).toHaveAttribute('href', '/speaking')
    expect(screen.getByRole('link', { name: 'Explore Group Work' })).toHaveAttribute('href', '/services#group')
  })
})

describe('PatternIntelligenceBand', () => {
  it('advertises the method and links The System and The Science', () => {
    render(<PatternIntelligenceBand />)
    expect(screen.getByRole('heading', { name: 'Pattern Intelligence™' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'The System' })).toHaveAttribute('href', '/about/the-system')
    expect(screen.getByRole('link', { name: 'The Science' })).toHaveAttribute('href', '/about/the-science')
  })
})

describe('DiscoveryHubBand', () => {
  it('makes the hub the entry point and gives the Pattern Coach a tile', () => {
    render(<DiscoveryHubBand />)
    expect(screen.getByRole('heading', { name: 'Pattern Discovery Hub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Take the Free Pattern Scan' })).toHaveAttribute('href', '/discover-your-pattern')
    expect(screen.getByRole('link', { name: 'Meet the Pattern Coach' })).toHaveAttribute('href', '/pattern-coach')
  })
})

describe('PathwaysBand', () => {
  it('lists the adult pathways, the young people pathways and a Book button', () => {
    render(<PathwaysBand />)
    expect(screen.getByRole('link', { name: /Pattern Mastery/ })).toHaveAttribute('href', '/transformation-pathways/pattern-mastery')
    expect(screen.getByText(/Pattern Foundations: Children · Pattern Foundations: Teens/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book a Session' })).toHaveAttribute('href', '/services#private')
  })
})

describe('LiveProgrammesBand', () => {
  const now = new Date('2026-11-10T10:00:00Z')
  const programmes = [
    { programmeSlug: 'meditation', format: 'Live via Zoom', sessions: [] },
    { programmeSlug: 'mindfulness', format: 'Live via Zoom', sessions: [] },
    { programmeSlug: 'love-and-relationships', format: 'Live via Zoom', sessions: [] },
    { programmeSlug: 'intuition-in-my-personal-capacity', format: 'Live via Zoom', sessions: [] },
    { programmeSlug: 'become-an-energy-ninja', format: 'Live via Zoom', sessions: [] },
  ]

  it('shows at most four programmes, Inner Sanctuary first, and links the full calendar', () => {
    render(<LiveProgrammesBand calendar={buildLiveCalendar({ programmes }, now)} />)
    const titles = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
    expect(titles).toHaveLength(4)
    expect(titles[0]).toBe('The Inner Sanctuary')
    expect(screen.getByText(/No live dates are scheduled yet/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Full Calendar' })).toHaveAttribute('href', '/events')
  })
})

describe('SelfStudyBand', () => {
  it('HOME_SELF_STUDY names three published self-study programmes', () => {
    expect(HOME_SELF_STUDY).toHaveLength(3)
    for (const slug of HOME_SELF_STUDY) {
      const p = getProgramBySlug(slug)
      expect(p?.isPublished, slug).toBe(true)
      expect(p?.category, slug).toBe('self-paced')
    }
  })

  it('shows the self-study cards and the recorded group healing tile', () => {
    const program = getProgramBySlug('trauma-to-transcendence')!
    render(<SelfStudyBand programs={[program]} />)
    expect(screen.getByRole('link', { name: /Trauma to Transcendence/ })).toHaveAttribute('href', '/programs/trauma-to-transcendence')
    expect(screen.getByRole('link', { name: /Recorded Group Healing Sessions/ })).toHaveAttribute('href', '/programs/recorded-group-healing')
  })
})

describe('ThreeWaysToBegin', () => {
  it('lists exactly three ways, without the Masterclass', () => {
    render(<ThreeWaysToBegin />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByText(/Masterclass/)).not.toBeInTheDocument()
  })
})
