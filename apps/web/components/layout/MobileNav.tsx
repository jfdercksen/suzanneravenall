'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { NavItem, NavGroup, NavLink, NavGroupChild } from './Header'
import { isActivePath } from './navActive'

interface MobileNavProps {
  items: NavItem[]
}

function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

function groupLinks(group: NavGroup): NavLink[] {
  return group.children.filter((c: NavGroupChild): c is NavLink => !('divider' in c))
}

function activeGroupLabel(items: NavItem[], pathname: string): string | null {
  const group = items.find(
    (item): item is NavGroup =>
      isNavGroup(item) && groupLinks(item).some((link) => isActivePath(pathname, link.href))
  )
  return group?.label ?? null
}

export default function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  // Site check V11: the menu groups match the desktop nav as an accordion, one
  // group open at a time. Opening the menu expands the current page's group.
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  useEffect(() => {
    if (isOpen) setOpenGroup(activeGroupLabel(items, pathname))
  }, [isOpen, items, pathname])
  const menuRef = useRef<HTMLDivElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  // Dedicated ref for the close button — focus lands here on open, not the logo
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => setIsOpen(false), [])

  // Close on route change
  useEffect(() => {
    close()
  }, [pathname, close])

  // Prevent background scroll when open — restore previous overflow on cleanup
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = isOpen ? 'hidden' : previous
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // Page-scoped widgets (e.g. the pattern-hub sticky announcement bar) render
  // outside this overlay's DOM subtree at a higher z-index than our focus
  // trap accounts for — broadcast open state so they can hide themselves.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('pattern-hub:mobile-nav-toggle', { detail: { open: isOpen } })
    )
  }, [isOpen])

  // Move focus to close button on open; restore to hamburger on close
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    const focusable = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    // Convert to array so .at() gives TypeScript a clear T | undefined return
    const focusableList = Array.from(focusable)
    const first = focusableList.at(0)
    const last = focusableList.at(-1)

    // Guard: if no focusable elements exist, do not attach listener
    if (!first || !last) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        openButtonRef.current?.focus()
        return
      }
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  return (
    <>
      {/* Hamburger button — visible only below lg */}
      <button
        ref={openButtonRef}
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-overlay"
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span className="block w-6 h-0.5 bg-current" />
        <span className="block w-6 h-0.5 bg-current" />
        <span className="block w-6 h-0.5 bg-current" />
      </button>

      {/* Full-screen overlay
          - role/aria-modal only applied when open so SR users do not perceive a
            hidden modal trapping the rest of the page
          - inert when closed removes all children from tab order and a11y tree */}
      <div
        id="mobile-nav-overlay"
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
        aria-label={isOpen ? 'Navigation menu' : undefined}
        inert={!isOpen}
        className={[
          'fixed inset-0 z-50 bg-brand-primary flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div ref={menuRef} className="flex flex-col h-full">

          {/* Overlay header — close button first so focus lands here on open */}
          <div className="flex items-center justify-between px-4 h-16">
            <Link href="/" onClick={close} aria-label="Dr. Suzanne Ravenall, return to homepage">
              <Image
                src="/logos/suzanne-white-logo.png"
                alt="Dr. Suzanne Ravenall"
                width={140}
                height={43}
              />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close navigation menu"
              onClick={() => {
                close()
                openButtonRef.current?.focus()
              }}
              className="flex items-center justify-center w-10 h-10 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto flex flex-col justify-start py-6 px-8 gap-2">
            {items.map((item) => {
              if (isNavGroup(item)) {
                const links = groupLinks(item)
                const expanded = openGroup === item.label
                const groupActive = links.some((link) => isActivePath(pathname, link.href))
                const panelId = `mobile-nav-panel-${item.label.toLowerCase().replace(/\s+/g, '-')}`
                return (
                  <div key={item.label} className={`border-b ${groupActive ? 'border-white' : 'border-white/10'}`}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => setOpenGroup(expanded ? null : item.label)}
                      className={`flex w-full items-center justify-between gap-3 font-semibold text-2xl py-3 text-left transition-colors duration-150 ${
                        groupActive ? 'text-white' : 'text-white/75 hover:text-white'
                      }`}
                    >
                      {item.label}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                        className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                      >
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    {expanded && (
                      <ul id={panelId} className="pb-3 pl-4 flex flex-col">
                        {links.map((link) => {
                          const isActive = isActivePath(pathname, link.href)
                          return (
                            <li key={link.label}>
                              <Link
                                href={link.href}
                                onClick={close}
                                aria-current={isActive ? 'page' : undefined}
                                className={`block py-2.5 text-lg transition-colors duration-150 ${
                                  isActive ? 'text-white font-semibold' : 'text-white/75 hover:text-white'
                                }`}
                              >
                                {link.label}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              }

              const link = item
              const isActive = isActivePath(pathname, link.href)
              const linkClassName = `flex items-center gap-3 font-semibold text-2xl py-3 border-b transition-colors duration-150 ${
                isActive
                  ? 'text-white border-white'
                  : 'text-white/75 border-white/10 hover:text-white'
              }`
              return link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className={linkClassName}
                >
                  {link.label}
                  <ExternalLink size={22} aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={close}
                  aria-current={isActive ? 'page' : undefined}
                  className={linkClassName}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* CTA at bottom */}
          <div className="px-8 pb-12 flex flex-col gap-3">
            <Link
              href="/discover-your-pattern"
              onClick={close}
              className="flex items-center justify-center w-full px-6 py-4 border-2 border-white/60 text-white hover:bg-white hover:text-brand-primary font-semibold text-lg rounded-button transition-colors duration-150"
            >
              Discover Your Pattern
            </Link>
            <Link
              href="/contact#book"
              onClick={close}
              className="flex items-center justify-center w-full px-6 py-4 bg-white hover:bg-brand-sand text-brand-primary font-semibold text-lg rounded-button transition-colors duration-150"
            >
              Book a Discovery Call
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
