/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from './Header'

// Mock next/link as a passthrough <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock @suzanne/ui Logo
vi.mock('@suzanne/ui', () => ({
  Logo: () => <img alt="Dr. Suzanne Ravenall" />,
}))

// Mock MobileNav — it is a client component tested separately
vi.mock('./MobileNav', () => ({
  default: ({ links }: { links: unknown[] }) => (
    <div data-testid="mobile-nav" data-link-count={links.length} />
  ),
}))

// Mock DesktopNav — uses usePathname which requires App Router context
vi.mock('./DesktopNav', () => ({
  default: ({ items }: { items: unknown[] }) => (
    <nav aria-label="Main navigation" data-testid="desktop-nav" data-item-count={items.length} />
  ),
}))

// Mock SearchBar — uses useRouter which requires App Router context
vi.mock('../search/SearchBar', () => ({
  SearchBar: () => <div data-testid="search-bar" />,
}))

// Mock CartIcon — uses useCart hook which requires cart context
vi.mock('./CartIcon', () => ({
  CartIcon: () => <div data-testid="cart-icon" />,
}))

describe('Header', () => {
  it('renders a <header> element with role="banner"', () => {
    render(<Header />)
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(header.tagName).toBe('HEADER')
  })

  it('renders a logo link pointing to "/"', () => {
    render(<Header />)
    const logoLink = screen.getByRole('link', {
      name: /Dr\. Suzanne Ravenall.*return to homepage/i,
    })
    expect(logoLink).toBeInTheDocument()
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('renders the Logo image inside the home link', () => {
    render(<Header />)
    const logo = screen.getByAltText('Dr. Suzanne Ravenall')
    expect(logo).toBeInTheDocument()
  })

  it('renders the DesktopNav with 8 top-level items', () => {
    render(<Header />)
    const desktopNav = screen.getByTestId('desktop-nav')
    expect(desktopNav).toBeInTheDocument()
    // 4 groups (About, Explore, Work With Me, Resources) + 4 standalone links
    // (Events, Masterclass, Shop, Contact)
    expect(desktopNav).toHaveAttribute('data-item-count', '8')
  })

  it('renders "Book a Discovery Call" CTA link pointing to /contact', () => {
    render(<Header />)
    const cta = screen.getByRole('link', { name: 'Book a Discovery Call' })
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/contact')
  })

  it('"Book a Discovery Call" CTA is hidden below the xl breakpoint', () => {
    render(<Header />)
    const cta = screen.getByRole('link', { name: 'Book a Discovery Call' })
    // Tailwind: hidden xl:inline-flex — with 8 top-level nav items there is no
    // room for a CTA button at 1024-1279px; the Contact tab covers it at lg.
    expect(cta.className).toContain('hidden')
    expect(cta.className).toContain('xl:inline-flex')
  })

  it('does not render the retired "Discover Your Pattern" header CTA', () => {
    render(<Header />)
    // Replaced by the hero's "Take the Free Pattern Scan" primary CTA and the
    // site-wide Pattern Hub sticky bar (Suzanne feedback, 27 Jul 2026).
    expect(screen.queryByRole('link', { name: 'Discover Your Pattern' })).not.toBeInTheDocument()
  })

  it('renders the MobileNav component', () => {
    render(<Header />)
    const mobileNav = screen.getByTestId('mobile-nav')
    expect(mobileNav).toBeInTheDocument()
  })

  it('passes all nav links to MobileNav (23 leaf links)', () => {
    render(<Header />)
    const mobileNav = screen.getByTestId('mobile-nav')
    // About(5) + Explore topics+All Topics(7) + WorkWithMe(5) + Events(1)
    // + Masterclass(1) + Resources(2) + Shop(1) + Contact(1) = 23
    expect(mobileNav).toHaveAttribute('data-link-count', '23')
  })

  it('renders a <nav> with aria-label "Main navigation"', () => {
    render(<Header />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav).toBeInTheDocument()
  })
})