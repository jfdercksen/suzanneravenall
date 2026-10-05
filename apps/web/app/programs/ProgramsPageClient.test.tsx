import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ProgramsPageClient from './ProgramsPageClient'

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
      const bar = chip('Recorded Group').parentElement!
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
