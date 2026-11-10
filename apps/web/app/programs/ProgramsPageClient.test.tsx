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
      'Rapid Repatterning®',
      'Human Performance Replicator',
      'Pattern Intelligence™',
      'Energy Clearing',
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

  it('frames all training as practitioner training with AADP certification', () => {
    render(<ProgramsPageClient />)
    expect(screen.getByText(/use the work for yourself first, and then to do it for others/)).toBeInTheDocument()
    expect(screen.getByText(/American Association of Drugless\s+Practitioners \(AADP\)/)).toBeInTheDocument()
  })

  it('shows the three missing programmes with a visible placeholder and register interest', () => {
    const { container } = render(<ProgramsPageClient />)
    const placeholders = Array.from(container.querySelectorAll('[data-placeholder="true"]')).map((n) => n.textContent)
    expect(placeholders.filter((t) => t === '[Programme description, format and price]')).toHaveLength(3)
  })

  it('links both bundle products, priced from the shop (Johan 10 Nov)', () => {
    render(<ProgramsPageClient />)
    expect(screen.getByRole('heading', { name: 'Deep Energy Clearing Level 1 & 2: Purchased Together' })).toBeInTheDocument()
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

  it('sells Love & Relationships, Intuition and Energy Ninja L1 as self-study, live by register interest (Johan 10 Nov)', () => {
    render(<ProgramsPageClient />)
    const selfPaced = document.getElementById('self-paced')!.textContent ?? ''
    for (const name of ['Love & Relationships', 'Intuition in My Personal Capacity', 'Become an Energy Ninja: Level 1']) {
      expect(selfPaced, name).toContain(name)
    }
    expect(selfPaced).toContain('Live via Zoom: register your interest')
    const live = document.getElementById('live')!.textContent ?? ''
    expect(live).toContain('Become an Energy Ninja: Level 2')
    expect(live).not.toContain('Love & Relationships')
    const order = textOrder(['The Inner Sanctuary', 'Present', 'Become an Energy Ninja: Level 2'])
    expect(at(order, 0)).toBeLessThan(at(order, 2))
    expect(at(order, 1)).toBeLessThan(at(order, 2))
  })

  it('live cards for The Inner Sanctuary and Present also show the recorded self-study price (KI106)', () => {
    render(<ProgramsPageClient />)
    expect(screen.getAllByText(/Recorded self-study:/)).toHaveLength(2)
  })

  it('links the recorded group section to its own page', () => {
    render(<ProgramsPageClient />)
    expect(screen.getByRole('link', { name: 'How the recorded sessions work' })).toHaveAttribute(
      'href',
      '/programs/recorded-group-healing',
    )
  })
})
