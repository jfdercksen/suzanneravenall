import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import ExploreTopicGrid from './ExploreTopicGrid'
import { topics } from '@/app/explore/topics'

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
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
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
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => strip(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

describe('ExploreTopicGrid desktop list (site check M13)', () => {
  it('renders every topic title as a link that opens the topic', () => {
    const { container } = render(<ExploreTopicGrid />)
    topics.forEach((topic, i) => {
      const link = container.querySelector(`#explore-topic-${i}`)
      expect(link?.tagName).toBe('A')
      expect(link).toHaveAttribute('href', `/explore/${topic.slug}`)
    })
  })

  it('previews a topic on hover without leaving the page', () => {
    const { container } = render(<ExploreTopicGrid />)
    const third = container.querySelector('#explore-topic-2')!
    fireEvent.mouseEnter(third)
    expect(third).toHaveAttribute('aria-current', 'true')
    expect(container.querySelector('#explore-topic-0')).not.toHaveAttribute('aria-current')
  })

  it('moves focus with the arrow keys so Enter opens the previewed topic', () => {
    const { container } = render(<ExploreTopicGrid />)
    const first = container.querySelector<HTMLAnchorElement>('#explore-topic-0')!
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(container.querySelector('#explore-topic-1'))
  })
})
