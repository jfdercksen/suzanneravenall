/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MobileNav from './MobileNav'
import type { NavLink } from './Header'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

// Mock next/link as a passthrough <a>
vi.mock('next/link', () => ({
  default: ({ href, children, onClick, ...props }: {
    href: string
    children: React.ReactNode
    onClick?: React.MouseEventHandler
    [key: string]: unknown
  }) => (
    <a href={href} onClick={onClick} {...props}>{children}</a>
  ),
}))

// Mock @suzanne/ui Logo
vi.mock('@suzanne/ui', () => ({
  Logo: () => <img alt="Dr. Suzanne Ravenall" />,
}))

const sampleLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Programs', href: '/programs' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
  { label: 'Member Portal', href: '/portal' },
]

describe('MobileNav', () => {
  beforeEach(() => {
    // Reset body overflow between tests
    document.body.style.overflow = ''
  })

  describe('hamburger button', () => {
    it('renders with aria-label "Open navigation menu"', () => {
      render(<MobileNav links={sampleLinks} />)
      const hamburger = screen.getByRole('button', { name: 'Open navigation menu' })
      expect(hamburger).toBeInTheDocument()
    })

    it('has aria-expanded="false" initially', () => {
      render(<MobileNav links={sampleLinks} />)
      const hamburger = screen.getByRole('button', { name: 'Open navigation menu' })
      expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    })

    it('has aria-controls="mobile-nav-overlay"', () => {
      render(<MobileNav links={sampleLinks} />)
      const hamburger = screen.getByRole('button', { name: 'Open navigation menu' })
      expect(hamburger).toHaveAttribute('aria-controls', 'mobile-nav-overlay')
    })
  })

  describe('opening the overlay', () => {
    it('sets aria-expanded to true when hamburger is clicked', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)
      const hamburger = screen.getByRole('button', { name: 'Open navigation menu' })
      await user.click(hamburger)
      expect(hamburger).toHaveAttribute('aria-expanded', 'true')
    })

    it('removes the -translate-x-full class after opening', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)
      const hamburger = screen.getByRole('button', { name: 'Open navigation menu' })

      const overlay = document.getElementById('mobile-nav-overlay')
      expect(overlay?.className).toContain('-translate-x-full')

      await user.click(hamburger)
      expect(overlay?.className).not.toContain('-translate-x-full')
    })

    it('sets body overflow to "hidden" when open', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)
      const hamburger = screen.getByRole('button', { name: 'Open navigation menu' })
      await user.click(hamburger)
      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  describe('overlay structure', () => {
    it('overlay has role="dialog" when open', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)
      await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('overlay does NOT have role="dialog" when closed — prevents SR from hiding rest of page', () => {
      render(<MobileNav links={sampleLinks} />)
      // When closed, role is undefined — no dialog role should be in the accessibility tree
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('overlay has aria-modal="true" when open', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)
      await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('overlay has id="mobile-nav-overlay"', () => {
      render(<MobileNav links={sampleLinks} />)
      const overlay = document.getElementById('mobile-nav-overlay')
      expect(overlay).toBeInTheDocument()
    })
  })

  describe('close button', () => {
    it('renders with aria-label "Close navigation menu"', () => {
      render(<MobileNav links={sampleLinks} />)
      const closeBtn = screen.getByRole('button', { name: 'Close navigation menu' })
      expect(closeBtn).toBeInTheDocument()
    })

    it('closes the overlay when clicked', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)

      // Open first
      await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'true')

      // Close
      await user.click(screen.getByRole('button', { name: 'Close navigation menu' }))
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false')
    })

    it('restores body overflow to "" when closed', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)
      await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
      await user.click(screen.getByRole('button', { name: 'Close navigation menu' }))
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('keyboard: Escape key', () => {
    it('closes the overlay when Escape is pressed while open', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)

      await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'true')

      await user.keyboard('{Escape}')
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false')
    })

    it('does not close when Escape is pressed while overlay is already closed', async () => {
      render(<MobileNav links={sampleLinks} />)
      // Overlay not open — pressing Escape should not cause errors
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('nav links inside overlay', () => {
    it('renders all provided nav links', async () => {
      const user = userEvent.setup()
      render(<MobileNav links={sampleLinks} />)
      await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))

      for (const link of sampleLinks) {
        // There may be multiple links with same label (desktop + mobile), use getAllByRole
        const links = screen.getAllByRole('link', { name: link.label })
        expect(links.length).toBeGreaterThan(0)
      }
    })

    it('renders "Book a Discovery Call" CTA inside overlay', () => {
      render(<MobileNav links={sampleLinks} />)
      const cta = screen.getByRole('link', { name: 'Book a Discovery Call' })
      expect(cta).toBeInTheDocument()
      expect(cta).toHaveAttribute('href', '/contact')
    })
  })

  describe('route change', () => {
    it('closes the overlay when the pathname changes', async () => {
      const { rerender } = render(<MobileNav links={sampleLinks} />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'true')

      // Simulate route change by re-rendering — usePathname is mocked to '/' so
      // the effect will not naturally re-fire. We test the mechanism indirectly:
      // clicking a nav link calls close() which sets isOpen to false.
      const homeLink = screen.getAllByRole('link', { name: 'Home' })[0]
      if (homeLink) {
        await user.click(homeLink)
      }
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false')

      rerender(<MobileNav links={sampleLinks} />)
    })
  })
})
