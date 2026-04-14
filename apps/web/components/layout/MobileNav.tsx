'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { NavLink } from './Header'

interface MobileNavProps {
  links: NavLink[]
}

export default function MobileNav({ links }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
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

  // inert attribute removes the closed overlay from tab order and accessibility tree.
  // @types/react 18 does not include inert in JSX props — use spread cast.
  const inertProp = !isOpen ? ({ inert: '' } as Record<string, string>) : {}

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
        className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
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
        {...inertProp}
        className={[
          'fixed inset-0 z-50 bg-brand-primary flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div ref={menuRef} className="flex flex-col h-full">

          {/* Overlay header — close button first so focus lands here on open */}
          <div className="flex items-center justify-between px-4 h-16">
            <Link href="/" onClick={close} aria-label="Dr. Suzanne Ravenall — return to homepage">
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
              className="flex items-center justify-center w-10 h-10 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav aria-label="Mobile navigation" className="flex-1 flex flex-col justify-center px-8 gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="text-white font-semibold text-3xl py-3 border-b border-white/10 hover:text-brand-accent-300 transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA at bottom */}
          <div className="px-8 pb-12">
            <Link
              href="/contact"
              onClick={close}
              className="flex items-center justify-center w-full px-6 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-lg rounded-button transition-colors duration-150"
            >
              Book a Discovery Call
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
