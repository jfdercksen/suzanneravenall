import Link from 'next/link'
import { Logo } from '@suzanne/ui'
import MobileNav from './MobileNav'

export interface NavLink {
  label: string
  href: string
}

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Programs', href: '/services' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
  { label: 'Member Portal', href: '/portal' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-brand-primary" role="banner">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link href="/" aria-label="Dr. Suzanne Ravenall — return to homepage">
            <Logo variant="white" width={160} height={48} priority />
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/90 hover:text-white font-medium text-sm transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA + mobile hamburger */}
          <div className="flex items-center gap-4">
            <Link
              href="/contact"
              className="hidden lg:inline-flex items-center px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-medium text-sm rounded-button transition-colors duration-150 whitespace-nowrap"
            >
              Book a Discovery Call
            </Link>
            {/* MobileNav renders hamburger on mobile and the full-screen overlay */}
            <MobileNav links={navLinks} />
          </div>

        </div>
      </div>
    </header>
  )
}
