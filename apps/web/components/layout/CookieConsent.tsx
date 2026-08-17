'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ConsentState = 'accepted' | 'rejected' | null

const STORAGE_KEY = 'cookie_consent'

/** Shared with PatternCoachTab so the mobile pill can wait until consent is chosen (KI027). */
export const CONSENT_STORAGE_KEY = STORAGE_KEY
/** Fired on window when the user accepts or rejects, so other overlays can react without polling. */
export const CONSENT_CHOSEN_EVENT = 'sr:cookie-consent-chosen'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function updateGtagConsent(granted: boolean) {
  window.gtag?.('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
  })
}

function loadClarity(clarityId: string) {
  if (!clarityId || document.getElementById('clarity-script')) return
  const s = document.createElement('script')
  s.id = 'clarity-script'
  s.async = true
  s.src = `https://www.clarity.ms/tag/${clarityId}`
  document.head.appendChild(s)
}

interface CookieConsentProps {
  clarityId?: string
}

export default function CookieConsent({ clarityId }: CookieConsentProps) {
  const [consent, setConsent] = useState<ConsentState>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState
    if (stored === 'accepted') {
      updateGtagConsent(true)
      if (clarityId) loadClarity(clarityId)
    } else if (stored === 'rejected') {
      updateGtagConsent(false)
    } else {
      setVisible(true)
    }
    setConsent(stored)
  }, [clarityId])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setConsent('accepted')
    setVisible(false)
    updateGtagConsent(true)
    if (clarityId) loadClarity(clarityId)
    window.dispatchEvent(new Event(CONSENT_CHOSEN_EVENT))
  }

  function handleReject() {
    localStorage.setItem(STORAGE_KEY, 'rejected')
    setConsent('rejected')
    setVisible(false)
    updateGtagConsent(false)
    window.dispatchEvent(new Event(CONSENT_CHOSEN_EVENT))
  }

  if (!visible || consent !== null) return null

  return (
    // z-[70]: deliberately above the Pattern Coach pill (z-[60]) and sticky header (z-50) —
    // the consent dialog always wins the stacking order (KI027).
    // pb uses env(safe-area-inset-bottom) so the buttons clear the iOS home indicator.
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[70] bg-brand-primary border-t border-brand-accent/30 px-4 pt-3 lg:pt-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
    >
      <div className="max-w-7xl mx-auto flex flex-row flex-wrap items-center gap-3 lg:gap-4">
        {/* min-w-0 below sm keeps the buttons inline with the text at 375px instead of
            wrapping them onto a second row (which made the banner ~141px tall — KI027). */}
        <p className="flex-1 min-w-0 sm:min-w-[200px] text-[13px] sm:text-sm text-white/80 leading-relaxed">
          <span className="sm:hidden">We use cookies to improve your experience.</span>
          <span className="hidden sm:inline">We use cookies to understand how you use our site and to improve your experience.</span>{' '}
          <Link href="/legal/cookies" className="text-brand-accent-300 underline underline-offset-2 hover:text-brand-accent-200 transition-colors duration-200">
            Cookie policy
          </Link>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="text-sm text-white/60 hover:text-white transition-colors duration-200 px-3 py-1.5"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="text-sm font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white px-4 sm:px-5 py-2 rounded-button transition-all duration-300"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
