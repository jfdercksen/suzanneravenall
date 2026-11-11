import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecordedGroupHealingContent from './RecordedGroupHealingContent'
import { getProgramsByCategory } from '@/data/programs'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
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

describe('RecordedGroupHealingContent (8 Nov item 8.3)', () => {
  const series = getProgramsByCategory('group')

  it('carries her section headings', () => {
    render(<RecordedGroupHealingContent series={series} />)
    for (const name of [
      "Healing doesn't have to wait for the right moment",
      "You're not watching. You're taking part.",
      'Who These Sessions Are For',
      'What Happens in a Session',
      'How It Works',
      'Get the Most From Your Sessions',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
  })

  it('shows How It Works 01 to 04 and the access line from her current site', () => {
    render(<RecordedGroupHealingContent series={series} />)
    for (const n of ['01', '02', '03', '04']) expect(screen.getByText(n)).toBeInTheDocument()
    expect(screen.getByText('Access: yours for as long as you need it.')).toBeInTheDocument()
  })

  it('lists every recorded series with a link to its page', () => {
    render(<RecordedGroupHealingContent series={series} />)
    expect(screen.getAllByRole('link', { name: /^View / })).toHaveLength(series.length)
    expect(screen.getByText('Money Mastery')).toBeInTheDocument()
  })

  it('keeps her complementary-practice line', () => {
    render(<RecordedGroupHealingContent series={series} />)
    expect(screen.getByText(/These sessions are a complementary healing practice/)).toBeInTheDocument()
  })
})
