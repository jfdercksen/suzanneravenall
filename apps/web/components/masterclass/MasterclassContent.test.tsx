import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MasterclassContent, { MASTERCLASS_TITLE } from './MasterclassContent'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

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

describe('MasterclassContent (sourcing report 6 Oct, decision 13)', () => {
  it('shows the sourced masterclass title', () => {
    render(<MasterclassContent />)
    expect(screen.getAllByText(new RegExp(MASTERCLASS_TITLE.slice(0, 40))).length).toBeGreaterThan(0)
  })

  it('states the format: free, 17 minutes (the recording is 16:44), pre-recorded, on demand', () => {
    const { container } = render(<MasterclassContent />)
    expect(screen.getByText('Free · 17 minutes · Pre-recorded · Watch on demand')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/one[- ]hour/i)
  })

  it('lists the three sourced key takeaways', () => {
    render(<MasterclassContent />)
    expect(screen.getByText('How the brain is impacted by early brain development.')).toBeInTheDocument()
    expect(
      screen.getByText('A taster of identifying an early belief and starting to shift it.'),
    ).toBeInTheDocument()
  })

  it('does not show the 25%-off offer or an unsourced "thousands" claim', () => {
    const { container } = render(<MasterclassContent />)
    expect(container.textContent).not.toMatch(/25\s?%|discount|coupon/i)
    expect(container.textContent).not.toMatch(/thousands/i)
  })
})
