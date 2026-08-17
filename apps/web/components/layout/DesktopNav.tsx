"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import type { NavItem, NavGroup, NavLink, NavGroupChild, NavDivider } from './Header'

function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

function isNavDivider(child: NavGroupChild): child is NavDivider {
  return 'divider' in child
}

// Root path only matches itself; every other href also matches its own sub-routes
// so e.g. /resources stays highlighted on /resources/articles.
function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface DesktopNavProps {
  items: NavItem[]
}

export default function DesktopNav({ items }: DesktopNavProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  const close = useCallback(() => setOpenGroup(null), [])

  // Close on route change
  useEffect(() => {
    close()
  }, [pathname, close])

  // Close on Escape and on click outside
  useEffect(() => {
    if (!openGroup) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openGroup, close])

  // gap-4/text-sm at lg — 8 top-level items must fit 1024-1279px next to
  // logo + search + cart; roomier gap-5 from xl where the container caps.
  return (
    <nav ref={navRef} aria-label="Main navigation" className="hidden lg:flex items-center gap-4 xl:gap-5">
      {items.map((item) => {
        if (isNavGroup(item)) {
          const isOpen = openGroup === item.label
          const isGroupActive = item.children.some(
            (child) => !isNavDivider(child) && isActivePath(pathname, child.href)
          )
          const panelId = `nav-panel-${item.label.toLowerCase().replace(/\s+/g, '-')}`
          return (
            <div key={item.label} className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenGroup(isOpen ? null : item.label)}
                aria-controls={panelId}
                className={`flex items-center gap-1 whitespace-nowrap font-medium text-sm xl:text-[15px] transition-colors duration-150 ${
                  isGroupActive
                    ? 'text-brand-accent-300 font-semibold'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {item.label}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {isOpen && (
                <div id={panelId} className="absolute top-full left-0 pt-2 z-50">
                  <div className="bg-white rounded-lg shadow-xl py-2 min-w-[220px] max-h-[calc(100vh-6rem)] overflow-y-auto">
                    {item.children.map((child: NavGroupChild, i: number) => {
                      if (isNavDivider(child)) {
                        return <hr key={`divider-${i}`} className="my-1 border-t border-gray-200" />
                      }
                      const childActive = isActivePath(pathname, child.href)
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={close}
                          aria-current={childActive ? 'page' : undefined}
                          className={`block px-4 py-2.5 text-sm hover:bg-brand-primary hover:text-white transition-colors duration-150 whitespace-nowrap ${
                            childActive ? 'bg-gray-100 text-brand-primary font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        }

        if (item.external) {
          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white/90 hover:text-white font-medium text-sm xl:text-[15px] transition-colors duration-150"
            >
              {item.label}
              <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in new tab)</span>
            </a>
          )
        }

        const isActive = isActivePath(pathname, item.href)
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`whitespace-nowrap font-medium text-sm xl:text-[15px] transition-colors duration-150 ${
              isActive ? 'text-brand-accent-300 font-semibold' : 'text-white/90 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
