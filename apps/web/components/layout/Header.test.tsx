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

  it('renders the DesktopNav with 7 top-level items', () => {
    render(<Header />)
    const desktopNav = screen.getByTestId('desktop-nav')
    expect(desktopNav).toBeInTheDocument()
    // 3 groups (About, Explore, Work With Me) + 4 standalone links
    expect(desktopNav).toHaveAttribute('data-item-count', '7')
  })

  it('renders "Book a Discovery Call" CTA link pointing to /contact', () => {
    render(<Header />)
    const cta = screen.getByRole('link', { name: 'Book a Discovery Call' })
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/contact')
  })

  it('"Book a Discovery Call" CTA has hidden-on-mobile class', () => {
    render(<Header />)
    const cta = screen.getByRole('link', { name: 'Book a Discovery Call' })
    // Tailwind: hidden lg:inline-flex — lg:hidden renders below lg, lg:inline-flex shows at lg+
    expect(cta.className).toContain('hidden')
    expect(cta.className).toContain('lg:inline-flex')
  })

  it('renders the MobileNav component', () => {
    render(<Header />)
    const mobileNav = screen.getByTestId('mobile-nav')
    expect(mobileNav).toBeInTheDocument()
  })

  it('passes all nav links to MobileNav (17 leaf links)', () => {
    render(<Header />)
    const mobileNav = screen.getByTestId('mobile-nav')
    // About(1) + Explore topics+All Topics+Resources+Blog(8) + WorkWithMe(4) + Masterclass + Shop + Contact + Portal(4) = 17
    expect(mobileNav).toHaveAttribute('data-link-count', '17')
  })

  it('renders a <nav> with aria-label "Main navigation"', () => {
    render(<Header />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav).toBeInTheDocument()
  })
})
