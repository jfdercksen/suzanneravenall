import Link from 'next/link'
import Image from 'next/image'
import MobileNav from './MobileNav'
import DesktopNav from './DesktopNav'
import { CartIcon } from './CartIcon'
import { SearchBar } from '../search/SearchBar'

export interface NavLink {
  label: string
  href: string
  /** When true, render as a target="_blank" external link with an external-link icon. */
  external?: boolean
}

export interface NavGroup {
  label: string
  children: NavLink[]
}

export type NavItem = NavLink | NavGroup

const navItems: NavItem[] = [
  {
    label: 'Learn',
    children: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Explore', href: '/explore' },
      { label: 'Resources', href: '/resources' },
    ],
  },
  {
    label: 'Work With Me',
    children: [
      { label: 'Services', href: '/services' },
      { label: 'Speaking', href: '/speaking' },
      { label: 'Programs', href: '/programs' },
      { label: 'Masterclass', href: '/masterclass' },
    ],
  },
  { label: 'Shop', href: '/shop' },
  { label: 'Contact', href: '/contact' },
  { label: 'Member Portal', href: '/portal' },
  // Pattern Coach is a separate Thinkific subscription product that runs
  // independently of this site — link out in a new tab.
  // TODO: Confirm final Thinkific URL with Suzanne
  {
    label: 'Pattern Coach App',
    href: 'https://ravenallinstitute-9629.thinkific.com/',
    external: true,
  },
]

function getMobileLinks(items: NavItem[]): NavLink[] {
  return items.flatMap((item) => ('children' in item ? item.children : [item]))
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-brand-primary" role="banner">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link href="/" aria-label="Dr. Suzanne Ravenall — return to homepage">
            <Image
                src="/logos/suzanne-white-logo.png"
                alt="Dr. Suzanne Ravenall"
                width={160}
                height={49}
                priority
              />
          </Link>

          {/* Desktop nav — client component for keyboard-accessible dropdowns */}
          <DesktopNav items={navItems} />

          {/* Desktop CTA + cart + search + mobile hamburger */}
          <div className="flex items-center gap-2 lg:gap-4">
            <SearchBar />
            <CartIcon />
            <Link
              href="/contact"
              className="hidden lg:inline-flex items-center px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-medium text-sm rounded-button transition-colors duration-150 whitespace-nowrap"
            >
              Book a Discovery Call
            </Link>
            {/* MobileNav renders hamburger on mobile and the full-screen overlay */}
            <MobileNav links={getMobileLinks(navItems)} />
          </div>

        </div>
      </div>
    </header>
  )
}
