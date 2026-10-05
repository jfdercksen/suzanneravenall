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
      ['Matheo', 'wPTh5Z8iwwU'],
      ['Amelia', 'iHe9dZq1YdY'],
      ['Jayne', 'nLrXITVsXz8'],
      ['Ivana', 'Gz3NUPWdxAI'],
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
