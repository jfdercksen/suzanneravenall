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

export interface NavDivider {
  divider: true
}

export type NavGroupChild = NavLink | NavDivider

export interface NavGroup {
  label: string
  children: NavGroupChild[]
}

export type NavItem = NavLink | NavGroup

const navItems: NavItem[] = [
  {
    label: 'About',
    children: [
      { label: 'About Suzanne', href: '/about' },
      { label: 'The Story', href: '/about/the-story' },
      { label: 'The System', href: '/about/the-system' },
      { label: 'The Science', href: '/about/the-science' },
      { divider: true },
      { label: 'Testimonials', href: '/testimonials' },
    ],
  },
  {
    label: 'Explore',
    children: [
      { label: 'Emotional Mastery', href: '/explore/emotional-nervous-system-mastery' },
      { label: 'Relationships', href: '/explore/relationships-attachment-patterns' },
      { label: 'Health & Vitality', href: '/explore/next-level-health-vitality-longevity' },
      { label: 'Identity & Purpose', href: '/explore/identity-purpose-activation' },
      { label: 'Leadership', href: '/explore/leadership-high-performance' },
      { label: 'Intuition', href: '/explore/intuition-as-patterned-intelligence' },
      { label: 'All Topics →', href: '/explore' },
    ],
  },
  {
    label: 'Work With Me',
    children: [
      { label: 'Transformation Pathways', href: '/transformation-pathways' },
      { label: 'Precision Sessions', href: '/services#private' },
      { label: 'Corporate & Retreats', href: '/services#group' },
      { label: 'Speaking', href: '/speaking' },
      { label: 'Programs', href: '/programs' },
    ],
  },
  { label: 'Events', href: '/events' },
  { label: 'Masterclass', href: '/masterclass' },
  {
    label: 'Resources',
    children: [
      { label: 'Resource Library', href: '/resources' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  { label: 'Shop', href: '/shop' },
  { label: 'Contact', href: '/contact' },
  // Pattern Coach is a separate Thinkific subscription product that runs
  // independently of this site. Hidden from the nav until the correct app
  // URL is confirmed — the current Thinkific link points to the wrong place.
  // TODO: Awaiting correct Pattern Coach app URL from Suzanne
  // {
  //   label: 'Pattern Coach App',
  //   href: 'https://ravenallinstitute-9629.thinkific.com/',
  //   external: true,
  // },
]

function getMobileLinks(items: NavItem[]): NavLink[] {
  return items.flatMap((item) => {
    if ('children' in item) {
      return item.children.filter((c): c is NavLink => !('divider' in c))
    }
    return [item]
  })
}

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 bg-brand-primary"
      style={{ top: 'var(--pattern-bar-offset, 0px)' }}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo — shrink-0 so the flex row never crushes it to make room for nav/CTAs */}
          <Link href="/" aria-label="Dr. Suzanne Ravenall — return to homepage" className="shrink-0 mr-8 lg:mr-12">
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
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <SearchBar />
            <CartIcon />
            {/* xl: not lg: — with 8 top-level nav items there is no room for a
                CTA button at 1024-1279px; the Contact tab and the site-wide
                Pattern Hub sticky bar cover both CTAs at lg, and the mobile
                overlay surfaces both links below lg. The hero's primary CTA
                ("Take the Free Pattern Scan") replaces the old header
                "Discover Your Pattern" button entirely. */}
            <Link
              href="/contact"
              className="hidden xl:inline-flex items-center px-3 py-2.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-medium text-sm rounded-button transition-colors duration-150 whitespace-nowrap"
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
