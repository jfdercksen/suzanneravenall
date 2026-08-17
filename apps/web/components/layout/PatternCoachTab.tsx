'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { CONSENT_STORAGE_KEY, CONSENT_CHOSEN_EVENT } from './CookieConsent'

const STORAGE_KEY = 'pattern-coach-tab-dismissed'
const PRODUCT_PAGE_PATH = '/pattern-coach'
const springEase = [0.22, 1, 0.36, 1] as const

function BrainIcon({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 20 C35 20 22 28 20 40 C18 48 20 55 24 60 C20 65 22 75 30 78 C35 80 42 78 48 75 L50 75"
        stroke="#1719F4" strokeWidth="3" strokeLinecap="round" fill="none"
      />
      <path
        d="M50 20 C65 20 78 28 80 40 C82 48 80 55 76 60 C80 65 78 75 70 78 C65 80 58 78 52 75 L50 75"
        stroke="#1719F4" strokeWidth="3" strokeLinecap="round" fill="none"
      />
      <path d="M50 20 L50 75" stroke="#1719F4" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
      <path d="M28 38 C32 35 38 38 36 44" stroke="#1719F4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M24 52 C28 49 35 52 32 58" stroke="#1719F4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M30 65 C34 62 40 64 38 70" stroke="#1719F4" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M72 38 C68 35 62 38 64 44" stroke="#1719F4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M76 52 C72 49 65 52 68 58" stroke="#1719F4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M70 65 C66 62 60 64 62 70" stroke="#1719F4" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="30" r="3" fill="#1719F4" />
      <circle cx="50" cy="50" r="3" fill="#1719F4" />
      <circle cx="50" cy="68" r="3" fill="#1719F4" />
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

  return (
    <AnimatePresence>
      {isVisible && !isMobile && (
        <motion.aside
          key="pc-desktop"
          aria-label="Pattern Coach App"
          className="fixed top-1/2 right-0 z-[60] bg-white border-l-[5px] border-brand-accent w-[120px] py-5 px-4 rounded-[20px_0_0_20px] cursor-pointer"
          style={{
            translateY: '-50%',
            boxShadow: '-12px 0 50px rgba(0,0,0,0.3), -6px 0 25px rgba(23,25,244,0.4)',
          }}
          initial={{ x: 160, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 160, opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }}
          whileHover={{
            x: -6,
            boxShadow: '-16px 0 60px rgba(0,0,0,0.35), -8px 0 35px rgba(23,25,244,0.6)',
            transition: { duration: 0.2, ease: 'easeOut' },
          }}
          transition={{ delay: 2, duration: 0.8, ease: springEase }}
        >
          <div className="flex flex-col items-center gap-4">
            <Link
              href={PRODUCT_PAGE_PATH}
              className="flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-200"
              aria-label="Discover Pattern Coach: Brilliant Coach in Your Pocket. Start your 30-day free trial"
            >
              <div className="motion-safe:animate-brain-pulse">
                <BrainIcon size={52} />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[13px] font-black text-brand-primary-900 uppercase tracking-wider leading-tight">
                  BRILLIANT<br />COACH
                </span>
                <span className="text-[11px] font-bold text-brand-accent uppercase tracking-wide leading-tight">
                  IN YOUR<br />POCKET
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss Pattern Coach tab"
              className="mt-2 flex items-center justify-center w-full gap-1 min-h-[44px] rounded-lg border border-gray-200 text-[9px] text-gray-400 hover:text-brand-accent hover:border-brand-accent transition-all duration-200"
            >
              <CloseXIcon size={8} />
              close
            </button>
          </div>
        </motion.aside>
      )}

      {/* Mobile pill: gated on consentChosen (KI027) so it never stacks on the cookie banner;
          z-[60] sits above the sticky header (z-50) but below the consent banner (z-[70]);
          bottom offset includes the iOS safe-area inset. */}
      {isVisible && isMobile && consentChosen && (
        <motion.aside
          key="pc-mobile"
          aria-label="Pattern Coach App"
          className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] flex flex-row items-center gap-3 bg-white rounded-[50px] border-t-4 border-brand-accent py-[10px] px-4 min-[415px]:px-5"
          style={{
            translateX: '-50%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2), 0 4px 20px rgba(23,25,244,0.35)',
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
            <div className="motion-safe:animate-brain-pulse shrink-0">
              <BrainIcon size={36} />
            </div>
            <span className="text-[11px] font-black text-brand-primary-900 uppercase tracking-wide whitespace-nowrap">
              BRILLIANT COACH
            </span>
            {/* Hidden on the smallest phones so the pill stays well inside a 375px viewport (KI027) */}
            <span className="hidden min-[415px]:inline text-[11px] font-bold text-brand-accent uppercase tracking-wide whitespace-nowrap">
              IN YOUR POCKET
            </span>
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Pattern Coach tab"
            className="-m-2.5 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-brand-accent transition-colors duration-200 shrink-0"
          >
            <CloseXIcon size={10} />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}