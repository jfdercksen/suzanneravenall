'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { masterPatternQuizUrl } from '@/data/patternQuizzes'

const BAR_OFFSET = '2.5rem' // 40px — drives both the bar's own height and Header's push-down offset

// Site check M9: a dismissal is remembered across reloads. The pre-hydration
// script on /discover-your-pattern reads the same key, so keep them in step.
export const DISMISS_STORAGE_KEY = 'pattern-hub-bar-dismissed'

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_STORAGE_KEY) === '1'
  } catch {
    // Storage blocked (private mode, cookies off): just show the bar.
    return false
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, '1')
  } catch {
    // Not remembered, but still dismissed for this page view.
  }
}

export default function PatternHubStickyBar() {
  const [dismissed, setDismissed] = useState(false)

  // Read after mount rather than in the initial state so the server and the
  // first client render agree. The pre-hydration script hides the bar until
  // then, so a remembered dismissal never flashes.
  useEffect(() => {
    if (readDismissed()) setDismissed(true)
  }, [])
  // MobileNav renders a full-screen focus-trapped modal at z-50. This bar sits
  // above it (z-60) and is outside that modal's DOM subtree, so without this
  // it would stay focusable/visible on top of the "trapped" overlay — hide it
  // for the duration the mobile menu is open.
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const handleToggle = (e: Event) => {
      setMobileNavOpen((e as CustomEvent<{ open: boolean }>).detail.open)
    }
    window.addEventListener('pattern-hub:mobile-nav-toggle', handleToggle)
    return () => window.removeEventListener('pattern-hub:mobile-nav-toggle', handleToggle)
  }, [])

  // Header is a global sticky component shared by every route. Rather than
  // teaching it about this one page, we push it down with a CSS var it reads
  // as a `top` offset (defaults to 0px everywhere else) and give body the
  // matching padding so Header's natural (unstuck) position shifts too.
  const hidden = dismissed || mobileNavOpen

  useEffect(() => {
    // readDismissed(): on the first effect pass `dismissed` is still false for
    // a remembered dismissal, and the offset must not flash in for one frame.
    if (hidden || readDismissed()) {
      document.documentElement.style.removeProperty('--pattern-bar-offset')
      document.body.style.paddingTop = ''
      return
    }

    document.documentElement.style.setProperty('--pattern-bar-offset', BAR_OFFSET)
    document.body.style.paddingTop = BAR_OFFSET

    return () => {
      document.documentElement.style.removeProperty('--pattern-bar-offset')
      document.body.style.paddingTop = ''
    }
  }, [hidden])

  if (hidden) return null

  return (
    <div
      // Hidden before hydration when the pre-hydration script found a remembered dismissal.
      className="fixed top-0 inset-x-0 z-[60] bg-brand-sand border-b border-brand-border [[data-pattern-bar-dismissed]_&]:hidden"
      style={{ height: BAR_OFFSET }}
    >
      <div className="relative flex h-full items-center justify-center gap-2 sm:gap-3 px-10">
        <span className="hidden sm:inline text-brand-muted text-xs font-medium tracking-wide">
          Not sure where to start?
        </span>
        <Link
          href={masterPatternQuizUrl}
          className="text-brand-ink font-medium text-[11px] sm:text-xs underline underline-offset-2 hover:no-underline text-center"
        >
          <span className="sm:hidden">Take the 60-second Pattern Quiz →</span>
          <span className="hidden sm:inline">Take the 60-second Master Pattern Quiz →</span>
        </Link>
        <button
          type="button"
          aria-label="Dismiss announcement bar"
          onClick={() => {
            rememberDismissed()
            setDismissed(true)
          }}
          className="absolute right-2 flex items-center justify-center w-6 h-6 text-brand-muted hover:text-brand-ink transition-colors duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}