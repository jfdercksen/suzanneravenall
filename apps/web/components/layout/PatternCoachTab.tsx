'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { CONSENT_STORAGE_KEY, CONSENT_CHOSEN_EVENT } from './CookieConsent'

const STORAGE_KEY = 'pattern-coach-tab-dismissed'
const PRODUCT_PAGE_PATH = '/pattern-coach'
/** Broadcast by MobileNav whenever the full-screen menu opens or closes. */
const MOBILE_NAV_TOGGLE_EVENT = 'pattern-hub:mobile-nav-toggle'
const springEase = [0.22, 1, 0.36, 1] as const

/** Anything a visitor may want to read or click. Section backgrounds and empty wrappers are not. */
const CONTENT_SELECTOR =
  'a,button,input,select,textarea,label,summary,[role="button"],[role="link"],footer'
/** Distance between sample points when checking what sits underneath the desktop tab. */
const SAMPLE_STEP_PX = 12

function isContentElement(el: Element): boolean {
  if (el.closest(CONTENT_SELECTOR)) return true
  return Array.from(el.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''
  )
}

/**
 * Site check B7: the desktop edge tab must never cover or catch clicks meant for page content.
 * Samples points across the tab's resting position (ignoring its own animation transform) and
 * reports true when any of them has a link, button, footer or text directly underneath.
 */
export function isTabObstructingContent(tab: HTMLElement): boolean {
  if (typeof document.elementsFromPoint !== 'function') return false
  const width = tab.offsetWidth
  const height = tab.offsetHeight
  if (width === 0 || height === 0) return false

  const right = document.documentElement.clientWidth
  const left = right - width
  const top = (window.innerHeight - height) / 2
  const xs = [left + 1, left + width / 2, right - 1]

  for (let y = top + 1; y < top + height; y += SAMPLE_STEP_PX) {
    for (const x of xs) {
      const underneath = document.elementsFromPoint(x, y).find((el) => !tab.contains(el))
      if (underneath && isContentElement(underneath)) return true
    }
  }
  return false
}

/** The mobile pill is centred at the bottom, so it gets out of the way once the footer scrolls in. */
function isFooterInView(): boolean {
  const footer = document.querySelector('footer')
  return footer !== null && footer.getBoundingClientRect().top < window.innerHeight
}

function BrainIcon({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 20 C35 20 22 28 20 40 C18 48 20 55 24 60 C20 65 22 75 30 78 C35 80 42 78 48 75 L50 75"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"
      />
      <path
        d="M50 20 C65 20 78 28 80 40 C82 48 80 55 76 60 C80 65 78 75 70 78 C65 80 58 78 52 75 L50 75"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"
      />
      <path d="M50 20 L50 75" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
      <path d="M28 38 C32 35 38 38 36 44" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M24 52 C28 49 35 52 32 58" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M30 65 C34 62 40 64 38 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M72 38 C68 35 62 38 64 44" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M76 52 C72 49 65 52 68 58" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M70 65 C66 62 60 64 62 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="30" r="3" fill="currentColor" />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
      <circle cx="50" cy="68" r="3" fill="currentColor" />
    </svg>
  )
}

function CloseXIcon({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" fill="none">
      <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function PatternCoachTab() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // KI027: on mobile the pill waits until the cookie banner has been answered, so the two
  // fixed-bottom overlays never stack on top of each other on first visit.
  const [consentChosen, setConsentChosen] = useState(false)
  // B8: MobileNav is a full-screen overlay at z-50; the pill (z-[60]) sat on top of its
  // "Book a Discovery Call" button. Hide while the menu is open, like PatternHubStickyBar.
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // B7: true while the tab would sit over content (desktop) or the footer (mobile).
  const [isObstructing, setIsObstructing] = useState(false)
  const desktopTabRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const onProductPage =
    pathname === PRODUCT_PAGE_PATH || (pathname ?? '').startsWith(`${PRODUCT_PAGE_PATH}/`)

  useEffect(() => {
    const handleToggle = (e: Event) => {
      setMobileNavOpen(Boolean((e as CustomEvent<{ open: boolean }>).detail?.open))
    }
    window.addEventListener(MOBILE_NAV_TOGGLE_EVENT, handleToggle)
    return () => window.removeEventListener(MOBILE_NAV_TOGGLE_EVENT, handleToggle)
  }, [])

  useEffect(() => {
    if (!isVisible || onProductPage) return

    let frame = 0
    const check = () => {
      frame = 0
      const tab = desktopTabRef.current
      setIsObstructing(isMobile ? isFooterInView() : tab ? isTabObstructingContent(tab) : false)
    }
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(check)
    }

    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // Content can move without a scroll (accordions, lazy images, client navigation).
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    resizeObserver?.observe(document.body)
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resizeObserver?.disconnect()
    }
  }, [isVisible, isMobile, onProductPage, pathname])

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === 'true'
    if (dismissed) return

    const updateMobile = () => setIsMobile(window.innerWidth < 1024)
    updateMobile()
    setIsVisible(true)

    const updateConsent = () =>
      setConsentChosen(window.localStorage.getItem(CONSENT_STORAGE_KEY) !== null)
    updateConsent()

    window.addEventListener('resize', updateMobile)
    window.addEventListener(CONSENT_CHOSEN_EVENT, updateConsent)
    return () => {
      window.removeEventListener('resize', updateMobile)
      window.removeEventListener(CONSENT_CHOSEN_EVENT, updateConsent)
    }
  }, [])

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    }
    setIsVisible(false)
  }

  // Never on the product page itself (the tab would link to the page you are on), and never
  // while the mobile menu is open (B8).
  const showTab = isVisible && !onProductPage && !mobileNavOpen

  return (
    <AnimatePresence>
      {/* Desktop: a slim collapsed edge tab that fits inside the 32px page gutter (B7). It fades
          out and stops taking clicks whenever content, a link or the footer is underneath it.
          Opacity-only animation so it never translates past the viewport edge (no x-overflow). */}
      {showTab && !isMobile && (
        <motion.aside
          key="pc-desktop"
          ref={desktopTabRef}
          aria-label="Pattern Coach App"
          aria-hidden={isObstructing || undefined}
          inert={isObstructing}
          data-obstructing={isObstructing ? 'true' : undefined}
          className={[
            'fixed top-1/2 right-0 z-[60] w-7 flex flex-col items-center bg-white border-l-[3px] border-brand-accent rounded-l-xl overflow-hidden',
            isObstructing ? 'pointer-events-none' : '',
          ].join(' ')}
          style={{
            translateY: '-50%',
            boxShadow: '-6px 0 24px rgba(0,0,0,0.18)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isObstructing ? 0 : 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
          transition={{ duration: 0.3, ease: springEase }}
        >
          <Link
            href={PRODUCT_PAGE_PATH}
            className="flex flex-col items-center gap-2 py-3 w-full text-brand-primary-900 hover:text-brand-accent transition-colors duration-200"
            aria-label="Discover Pattern Coach: Brilliant Coach in Your Pocket. Start your 30-day free trial"
            title="Brilliant Coach: 24/7 coaching app, free trial"
          >
            <BrainIcon size={18} />
            <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[11px] font-black uppercase tracking-wider leading-none">
              Brilliant Coach
            </span>
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Pattern Coach tab"
            className="flex items-center justify-center w-full h-7 border-t border-brand-border text-brand-muted hover:text-brand-accent transition-colors duration-200"
          >
            <CloseXIcon size={8} />
          </button>
        </motion.aside>
      )}

      {/* Mobile pill: gated on consentChosen (KI027) so it never stacks on the cookie banner;
          z-[60] sits above the sticky header (z-50) but below the consent banner (z-[70]);
          bottom offset includes the iOS safe-area inset. Hidden while the mobile menu is open
          (B8) and once the footer scrolls into view so footer links stay reachable (B7). */}
      {showTab && isMobile && consentChosen && !isObstructing && (
        <motion.aside
          key="pc-mobile"
          aria-label="Pattern Coach App"
          className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] flex flex-row items-center gap-3 bg-white rounded-[50px] border-t-4 border-brand-accent py-[10px] px-4 min-[415px]:px-5"
          style={{
            translateX: '-50%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          }}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0, transition: { duration: 0.4 } }}
          transition={{ delay: 2, duration: 0.6, ease: springEase }}
        >
          <Link
            href={PRODUCT_PAGE_PATH}
            className="flex items-center gap-3"
            aria-label="Discover Pattern Coach: Brilliant Coach in Your Pocket. Start your 30-day free trial"
          >
            <div className="text-brand-primary-900 shrink-0">
              <BrainIcon size={36} />
            </div>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[9px] font-bold text-brand-accent uppercase tracking-wide whitespace-nowrap">
                24/7 Coaching App
              </span>
              <span className="text-[11px] font-black text-brand-primary-900 uppercase tracking-wide whitespace-nowrap">
                BRILLIANT COACH
              </span>
            </span>
            {/* Hidden on the smallest phones so the pill stays well inside a 375px viewport (KI027) */}
            <span className="hidden min-[415px]:inline text-[11px] font-bold text-brand-accent uppercase tracking-wide whitespace-nowrap">
              Tap for Free Trial
            </span>
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Pattern Coach tab"
            className="-m-2.5 w-11 h-11 flex items-center justify-center text-brand-muted hover:text-brand-accent transition-colors duration-200 shrink-0"
          >
            <CloseXIcon size={10} />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}