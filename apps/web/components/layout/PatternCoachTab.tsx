'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const STORAGE_KEY = 'pattern-coach-tab-dismissed'
const EXTERNAL_URL = 'https://suzanneravenallpatterncoach.com'

function BrainIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6C16 6 10 6 8 10C6 14 6 18 8 22C10 26 14 27 16 27"
        stroke="#1719F4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 6C16 6 22 6 24 10C26 14 26 18 24 22C22 26 18 27 16 27"
        stroke="#1719F4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 6V27"
        stroke="#1719F4" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M8 12C10 11 12 13 11 15"
        stroke="#1719F4" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 18C9 17 11 19 10 21"
        stroke="#1719F4" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M24 12C22 11 20 13 21 15"
        stroke="#1719F4" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M25 18C23 17 21 19 22 21"
        stroke="#1719F4" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="12" r="1.5" fill="#1719F4" />
      <circle cx="16" cy="20" r="1.5" fill="#1719F4" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </svg>
  )
}

export default function PatternCoachTab() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === 'true'
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMobile = () => setIsMobile(window.innerWidth < 1024)

    setPrefersReducedMotion(motionMq.matches)
    updateMobile()
    if (!dismissed) setIsVisible(true)

    window.addEventListener('resize', updateMobile)
    return () => window.removeEventListener('resize', updateMobile)
  }, [])

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    window.localStorage.setItem(STORAGE_KEY, 'true')
    setIsVisible(false)
  }

  const delay = prefersReducedMotion ? 0 : 2.5
  const duration = prefersReducedMotion ? 0 : 0.6

  return (
    <AnimatePresence>
      {isVisible && !isMobile && (
        <motion.aside
          key="pc-desktop"
          aria-label="Pattern Coach App"
          className="fixed right-0 z-[60] flex flex-col items-center py-5 w-16 h-[260px] border-r-4 border-[#1719F4] rounded-l-2xl overflow-hidden shadow-[-4px_0_32px_rgba(23,25,244,0.4)] hover:shadow-[-4px_0_48px_rgba(23,25,244,0.65)] transition-shadow duration-300"
          style={{
            top: '50%',
            translateY: '-50%',
            background: 'linear-gradient(180deg, #012B43 0%, #011829 100%)',
          }}
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 120, opacity: 0, transition: { duration: 0.3 } }}
          whileHover={{ x: -4, scale: 1.05 }}
          transition={{ delay, duration, ease: 'easeOut' }}
        >
          <a
            href={EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-4 flex-1 w-full min-h-0"
            aria-label="Open Pattern Coach — Brilliant Coach in Your Pocket"
          >
            <div
              style={{ filter: 'drop-shadow(0 0 6px #1719F4)' }}
              className="motion-safe:animate-brain-pulse shrink-0"
            >
              <BrainIcon size={32} />
            </div>

            <div
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              className="flex flex-col items-center gap-1 text-center flex-1"
            >
              <span className="text-[9px] font-bold tracking-[0.25em] text-white uppercase">
                BRILLIANT COACH
              </span>
              <span className="text-[9px] font-medium tracking-[0.2em] text-[#1719F4] uppercase">
                IN YOUR POCKET
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close Pattern Coach"
            className="shrink-0 h-8 w-8 flex items-center justify-center text-white/50 hover:text-white transition-colors duration-200"
          >
            <CloseIcon />
          </button>
        </motion.aside>
      )}

      {isVisible && isMobile && (
        <motion.aside
          key="pc-mobile"
          aria-label="Pattern Coach App"
          className="fixed z-[60] flex flex-row items-center gap-3 h-[52px] px-5 border-b-4 border-[#1719F4] rounded-2xl shadow-[0_-4px_32px_rgba(23,25,244,0.4)]"
          style={{
            bottom: '24px',
            left: '50%',
            translateX: '-50%',
            background: 'linear-gradient(180deg, #012B43 0%, #011829 100%)',
          }}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0, transition: { duration: 0.3 } }}
          transition={{ delay, duration, ease: 'easeOut' }}
        >
          <a
            href={EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
            aria-label="Open Pattern Coach — Brilliant Coach in Your Pocket"
          >
            <div
              style={{ filter: 'drop-shadow(0 0 6px #1719F4)' }}
              className="motion-safe:animate-brain-pulse shrink-0"
            >
              <BrainIcon size={24} />
            </div>
            <span className="text-[9px] tracking-[0.2em] text-white uppercase whitespace-nowrap select-none">
              BRILLIANT COACH IN YOUR POCKET
            </span>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close Pattern Coach"
            className="ml-1 h-8 w-8 flex items-center justify-center text-white/50 hover:text-white transition-colors duration-200 shrink-0"
          >
            <CloseIcon />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}