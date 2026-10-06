import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TrustBar from './TrustBar'

vi.mock('next/image', () => ({
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
  return { motion, useInView: () => false }
})

describe('TrustBar', () => {
  // Content sourcing 6 Oct, decisions 1 and 2: only stats from Suzanne's own sites
  it('shows the sourced stats: years, awards and qualifications', () => {
    render(<TrustBar />)
    expect(screen.getByText('Years Experience')).toBeInTheDocument()
    expect(screen.getByText('Awards')).toBeInTheDocument()
    expect(screen.getByText('Qualifications')).toBeInTheDocument()
    expect(screen.getByText('B.Msc · M.Msc · Msc.D.')).toBeInTheDocument()
  })

  it('no longer claims client or country counts', () => {
    render(<TrustBar />)
    expect(screen.queryByText(/Lives Transformed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Countries/i)).not.toBeInTheDocument()
  })

  it('uses the live site caption for the trauma accreditation logo', () => {
    render(<TrustBar />)
    expect(screen.getByAltText('Certified Trauma Support')).toBeInTheDocument()
    expect(screen.queryByAltText('Certified Clinical Trauma Specialist')).not.toBeInTheDocument()
  })
})
