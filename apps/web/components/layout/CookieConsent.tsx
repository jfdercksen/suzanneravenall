'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ConsentState = 'accepted' | 'rejected' | null

const STORAGE_KEY = 'cookie_consent'

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
  }

  function handleReject() {
    localStorage.setItem(STORAGE_KEY, 'rejected')
    setConsent('rejected')
    setVisible(false)
    updateGtagConsent(false)
  }

  if (!visible || consent !== null) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 bg-brand-primary border-t border-brand-accent/30 px-4 py-4 lg:py-5"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-white/80 leading-relaxed">
          We use cookies to understand how you use our site and to improve your experience.{' '}
          <Link href="/legal/cookies" className="text-brand-accent underline underline-offset-2 hover:text-brand-accent/80 transition-colors duration-200">
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
            className="text-sm font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white px-5 py-2 rounded-button transition-all duration-300"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
