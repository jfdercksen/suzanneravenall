import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ProgramsPageClient from './ProgramsPageClient'

const cartState: { cart: { currency_code: string } | null } = { cart: null }
vi.mock('@/lib/cart', () => ({ useCart: () => cartState }))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('@/components/shared/PageHeader', () => ({
  PageHeader: ({ children }: { children?: React.ReactNode }) => <header>{children}</header>,
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

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void
const observers: { cb: IOCallback; options?: IntersectionObserverInit; targets: Element[] }[] = []

beforeEach(() => {
  observers.length = 0
  class MockIO {
    targets: Element[] = []
    constructor(cb: IOCallback, options?: IntersectionObserverInit) {
      observers.push({ cb, options, targets: this.targets })
    }
    observe(el: Element) {
      this.targets.push(el)
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', MockIO)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function chip(label: string) {
  return screen.getByRole('link', { name: label })
}

describe('ProgramsPageClient category chips (site check V4)', () => {
  it('uses a rootMargin band, not a visibility threshold that tall sections never reach', () => {
    render(<ProgramsPageClient />)
    expect(observers).toHaveLength(1)
    const { options, targets } = observers[0]!
    expect(options?.rootMargin).toMatch(/^-\d+% 0px -\d+% 0px$/)
    expect(options?.threshold ?? 0).toBe(0)
    expect(targets.map((t) => t.id)).toEqual(['practitioner', 'self-paced', 'live', 'group'])
  })

  it('moves the active chip to whichever section crosses the band', () => {
    render(<ProgramsPageClient />)
    expect(chip('Practitioner')).toHaveAttribute('aria-current', 'true')

    const { cb, targets } = observers[0]!
    const live = targets.find((t) => t.id === 'live')!
    const practitioner = targets.find((t) => t.id === 'practitioner')!
    act(() => {
      cb([
        { target: practitioner, isIntersecting: false },
        { target: live, isIntersecting: true },
      ])
    })
    expect(chip('Live')).toHaveAttribute('aria-current', 'true')
    expect(chip('Practitioner')).not.toHaveAttribute('aria-current')
  })

  it('scrolls the chip bar sideways so an off-screen active chip comes into view', () => {
    const scrollTo = vi.fn()
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const cat = this.getAttribute('data-category')
      if (cat === 'group') return { left: 400, right: 560, top: 0, bottom: 40, width: 160, height: 40 } as DOMRect
      if (this.querySelector('[data-category]') && !cat) {
        return { left: 16, right: 359, top: 0, bottom: 40, width: 343, height: 40 } as DOMRect
      }
      return { left: 16, right: 140, top: 0, bottom: 40, width: 124, height: 40 } as DOMRect
    }
    try {
      render(<ProgramsPageClient />)
      const bar = chip('Recorded Group Healing').parentElement!
      bar.scrollTo = scrollTo as unknown as typeof bar.scrollTo
      const { cb, targets } = observers[0]!
      act(() => {
        cb([{ target: targets.find((t) => t.id === 'group')!, isIntersecting: true }])
      })
      expect(scrollTo).toHaveBeenCalledWith({ left: 560 - 359 + 16, behavior: 'smooth' })
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
    }
  })
})

// Suzanne's 8 Nov list, items 8.1, 8.2 and 8.4
describe('ProgramsPageClient practitioner training (8 Nov)', () => {
  const textOrder = (names: string[]): number[] => {
    const body = document.body.textContent ?? ''
    return names.map((n) => body.indexOf(n))
  }
  const at = (list: number[], i: number): number => list[i] ?? -1

  it('puts Rapid Repatterning at the top and Resonance Repatterning at the bottom of the practitioner group', () => {
    render(<ProgramsPageClient />)
    const order = textOrder([
      'Change the pattern at its source.',
      'Your best people already know how. We make it repeatable.',
      'Decode the pattern. Unlock the potential.',
      'Energy Alignment & Optimisation: Self Clearing',
      'Akashic Navigator',
      'Resonance Repatterning',
    ])
    const [rapid, hpr, pi, energy, akashic, resonance] = [0, 1, 2, 3, 4, 5].map((i) => at(order, i)) as [number, number, number, number, number, number]
    for (const i of [rapid, hpr, pi, energy, akashic, resonance]) expect(i).toBeGreaterThan(-1)
    expect(rapid).toBeLessThan(hpr)
    expect(hpr).toBeLessThan(pi)
    expect(pi).toBeLessThan(energy)
    expect(energy).toBeLessThan(akashic)
    expect(akashic).toBeLessThan(resonance)
  })

  it('frames all training as practitioner training, names no accreditation and links the three pathways (12 Nov documents)', () => {
    const { container } = render(<ProgramsPageClient />)
    expect(screen.getByText(/use the work for yourself first, and then to do it for others/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/AADP|Drugless|accredit/i)
    expect(screen.getByRole('link', { name: 'Rapid Repatterning™' })).toHaveAttribute('href', '/programs/certification/rapid-repatterning')
    expect(screen.getByRole('link', { name: 'Energy Alignment & Optimisation™' })).toHaveAttribute('href', '/programs/certification/energy-alignment-optimisation')
    expect(screen.getByRole('link', { name: 'Akashic Navigation™' })).toHaveAttribute('href', '/programs/certification/akashic-navigation')
  })

  it("shows Suzanne's three programmes (18 Nov) with her next step, pointed at real pages", () => {
    render(<ProgramsPageClient />)
    for (const name of ['Rapid Repatterning™', 'Human Performance Replicator', 'The Pattern Intelligence™ Programme']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Book a discovery call' })).toHaveAttribute('href', '/contact#book')
    const scoping = screen.getByRole('link', { name: 'Request a scoping conversation' }).getAttribute('href') ?? ''
    expect(scoping.startsWith('/contact?')).toBe(true)
    expect(new URLSearchParams(scoping.slice('/contact?'.length).split('#')[0]).get('topic')).toBe(
      'Scoping conversation: Human Performance Replicator',
    )
    expect(screen.getByRole('link', { name: 'Take the pattern scan' })).toHaveAttribute('href', '/discover-your-pattern')
    expect(screen.queryByText('Register Interest')).not.toBeInTheDocument()
    expect(screen.queryByText('[Programme description, format and price]')).not.toBeInTheDocument()
  })

  it('ends Rapid Repatterning and HPR with their own sites, in a new tab', () => {
    render(<ProgramsPageClient />)
    const rr = screen.getByRole('link', { name: /Visit rapidrepatterning\.com/ })
    expect(rr).toHaveAttribute('href', 'https://rapidrepatterning.com')
    const hpr = screen.getByRole('link', { name: /Visit humanperformancereplicator\.com/ })
    expect(hpr).toHaveAttribute('href', 'https://humanperformancereplicator.com')
    for (const link of [rr, hpr]) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  it('publishes her bracketed values without the brackets, her marks as written, and no one-session claim', () => {
    const { container } = render(<ProgramsPageClient />)
    const body = container.textContent ?? ''
    for (const value of [
      'A series of 3–6 sessions, each 60–90 minutes',
      '3–6 months, depending on scope',
      'Online cohort or one-to-one, with in-house versions',
      '8–12 weeks, with live sessions',
      'A Pattern Signature™ assessment at the start or the short pattern scan until the full assessment is ready',
    ]) {
      expect(body).toContain(value)
    }
    const programmes = Array.from(container.querySelectorAll('article[aria-labelledby^="programme-"]'))
    expect(programmes).toHaveLength(3)
    const programmeText = programmes.map((a) => a.textContent ?? '').join(' ')
    expect(programmeText).not.toMatch(/\[|\]/)
    expect(programmeText).not.toMatch(/Human Performance Replicator(™|®)/)
    expect(programmeText).not.toMatch(/\bone session\b|single session/i)
    expect(programmeText).not.toContain('\u2014')
    expect(programmeText).toContain("It's not you. It's your pattern.")
  })

  it('marks Energy Alignment & Optimisation once (its pathway link), then her strapline, heading and cards without the mark (Suzanne 12 Nov)', () => {
    render(<ProgramsPageClient />)
    const body = document.body.textContent ?? ''
    expect(body).not.toContain('Energy Clearing')
    expect(body.split('Energy Alignment & Optimisation™')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Energy Alignment & Optimisation' })).toBeInTheDocument()
    expect(screen.getByText("Aligning the body's energy systems for coherence, capacity and performance.")).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Energy Alignment & Optimisation: Self Clearing Level 1 (Basic)' })).toBeInTheDocument()
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/programs/energy-alignment-optimisation-advanced')
    expect(hrefs.filter((h) => h?.startsWith('/programs/energy-clearing'))).toEqual([])
  })

  it('links both bundle products, priced from the shop (Johan 10 Nov)', () => {
    render(<ProgramsPageClient />)
    expect(screen.getByRole('heading', { name: 'Energy Alignment & Optimisation Level 1 & 2: Purchased Together' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Akashic Navigator Level 1 & 2: Purchased Together' })).toBeInTheDocument()
    const hrefs = screen.getAllByRole('link', { name: 'View in Shop' }).map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/shop/deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom')
    expect(hrefs).toContain('/shop/akashic-navigator-intuitive-coaching-fundamentals-advanced-purchased-together-live-via-zoom')
    expect(screen.queryByText('[bundle price and product]')).not.toBeInTheDocument()
  })

  it('licence to practise: certification plus annual membership, contact while memberships are off', () => {
    render(<ProgramsPageClient />)
    expect(screen.getByText(/current annual practitioner membership\. That membership is your licence to practise/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ask about membership levels' }).getAttribute('href')).toContain('/contact?')
    expect(screen.getByRole('link', { name: 'Certification Observation Fee' })).toHaveAttribute(
      'href',
      '/shop/ravenall-institute-certification-observation-fee',
    )
  })

  it('licence to practise links the membership levels once memberships are on', () => {
    render(<ProgramsPageClient membershipsOn />)
    expect(screen.getByRole('link', { name: 'See the membership levels' })).toHaveAttribute('href', '/portal/upgrade')
  })

  it('lists Love & Relationships, Intuition and both Energy Ninja levels as live only, not self-study (Suzanne 12 Nov)', () => {
    render(<ProgramsPageClient />)
    const selfPaced = document.getElementById('self-paced')!.textContent ?? ''
    const live = document.getElementById('live')!.textContent ?? ''
    for (const name of [
      'Love & Relationships',
      'Intuition in My Personal Capacity',
      'Intuition in Business',
      'Become an Energy Ninja: Level 1',
      'Become an Energy Ninja: Level 2',
    ]) {
      expect(selfPaced, name).not.toContain(name)
      expect(live, name).toContain(name)
    }
    expect(live).toContain('Live via Zoom: register your interest')
    // The Inner Sanctuary and Present lead, in the calendar's order.
    const order = textOrder(['The Inner Sanctuary', 'Present', 'Become an Energy Ninja: Level 2'])
    expect(at(order, 0)).toBeLessThan(at(order, 2))
    expect(at(order, 1)).toBeLessThan(at(order, 2))
  })

  it('offers no recorded self-study on any live card (Suzanne 12 Nov)', () => {
    render(<ProgramsPageClient />)
    expect(screen.queryByText(/Recorded self-study:/)).not.toBeInTheDocument()
  })

  it('links the recorded group section to its own page', () => {
    render(<ProgramsPageClient />)
    expect(screen.getByRole('link', { name: 'How the recorded sessions work' })).toHaveAttribute(
      'href',
      '/programs/recorded-group-healing',
    )
  })
})
