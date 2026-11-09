import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VideoTestimonials from './VideoTestimonials'

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
  default: ({
    src,
    alt,
    fill,
    priority,
    sizes,
    ...props
  }: {
    src: string
    alt: string
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
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
    motion: { div: strip('div'), button: strip('button') },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

function featuredPoster(name: string): HTMLImageElement {
  const play = screen.getByRole('button', { name: `Play ${name} testimonial` })
  return play.querySelector('img') as HTMLImageElement
}

describe('VideoTestimonials featured poster', () => {
  it('uses the high-resolution still first', () => {
    render(<VideoTestimonials />)
    expect(featuredPoster('Transformation Highlights').getAttribute('src')).toMatch(
      /\/maxresdefault\.jpg$/,
    )
  })

  it('requests hqdefault straight away for videos without a maxresdefault still', () => {
    render(<VideoTestimonials />)
    for (const [name, id] of [
      ['Client story 1', 'wPTh5Z8iwwU'],
      ['Client story 2', 'iHe9dZq1YdY'],
      ['Client story 3', 'nLrXITVsXz8'],
      ['Client story 4', 'Gz3NUPWdxAI'],
    ] as const) {
      fireEvent.click(screen.getByRole('radio', { name: `Watch ${name}` }))
      expect(featuredPoster(name).getAttribute('src')).toBe(
        `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      )
    }
  })

  it('falls back to hqdefault if the high-resolution still fails to load', () => {
    render(<VideoTestimonials />)
    const poster = featuredPoster('Transformation Highlights')
    fireEvent.error(poster)
    expect(featuredPoster('Transformation Highlights').getAttribute('src')).toBe(
      'https://img.youtube.com/vi/8Yw_n8NribA/hqdefault.jpg',
    )
  })
})

describe('VideoTestimonials labels', () => {
  // Suzanne, 8 Nov 2026: no client names on the front of a testimonial
  it('shows no client name on any poster or thumbnail', () => {
    const { container } = render(<VideoTestimonials />)
    for (const name of ['Matheo', 'Amelia', 'Jayne', 'Ivana']) {
      expect(container.innerHTML).not.toContain(name)
    }
    const labels = screen.getAllByRole('radio').map((r) => r.getAttribute('aria-label'))
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels).toContain('Watch Client story 1')
  })
})
