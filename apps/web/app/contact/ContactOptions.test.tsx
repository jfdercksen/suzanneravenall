import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactOptions from './ContactOptions'

vi.mock('./ContactForm', () => ({ default: () => <form aria-label="Contact form" /> }))
vi.mock('./CalInlineBooking', () => ({ default: () => <div /> }))

vi.mock('framer-motion', () => {
  const MOTION_PROPS = ['initial', 'animate', 'exit', 'transition', 'variants', 'whileInView', 'viewport', 'whileHover', 'whileTap']
  const make = (tag: string) =>
    function MotionStub(props: Record<string, unknown> & { children?: React.ReactNode }) {
      const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.includes(k)))
      return React.createElement(tag, rest, props.children)
    }
  return { motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }) }
})

describe('ContactOptions', () => {
  // Suzanne, 8 Nov 2026: no physical address on the contact page
  it('shows the postal address and no street address', () => {
    const { container } = render(<ContactOptions />)
    expect(screen.getByText('Postal: PO Box 910, Kyalami, 1684')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Oxmoor|Kyalami Estates/)
  })

  it('links both Facebook pages, each with its own name', () => {
    render(<ContactOptions />)
    expect(screen.getByRole('link', { name: 'Facebook: Suzanne Ravenall' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/suzanneravenalltransformation',
    )
    const company = screen.getByRole('link', { name: 'Facebook: The Effectiveness Company' })
    expect(company).toHaveAttribute('href', 'https://www.facebook.com/EffectivenessCompany')
    expect(company).toHaveAttribute('target', '_blank')
    expect(company).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
