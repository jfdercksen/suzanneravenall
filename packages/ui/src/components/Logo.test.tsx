import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }) => {
    // Strip next/image-specific props that are not valid HTML img attributes
    const { priority: _priority, unoptimized: _unoptimized, ...rest } = props
    return <img {...rest} />
  },
}))

// Import after mock is registered
import Logo from './Logo'

describe('Logo', () => {
  it('renders an img element', () => {
    render(<Logo />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })

  it('renders the white logo src by default', () => {
    render(<Logo />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/logos/logo-white.svg')
  })

  it('renders the black logo src when variant is "black"', () => {
    render(<Logo variant="black" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/logos/logo-black.svg')
  })

  it('renders the white logo src when variant is "auto"', () => {
    render(<Logo variant="auto" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/logos/logo-white.svg')
  })

  it('applies className prop to the img element', () => {
    render(<Logo className="custom-logo-class" />)
    const img = screen.getByRole('img')
    expect(img).toHaveClass('custom-logo-class')
  })

  it('has alt text "Dr. Suzanne Ravenall"', () => {
    render(<Logo />)
    const img = screen.getByAltText('Dr. Suzanne Ravenall')
    expect(img).toBeInTheDocument()
  })
})
