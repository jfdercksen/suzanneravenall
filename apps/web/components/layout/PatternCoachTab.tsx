'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const STORAGE_KEY = 'pattern-coach-tab-dismissed'
const EXTERNAL_URL = 'https://suzanneravenallpatterncoach.com'

function BrainIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 8C24 8 14 8 11 14C8 20 8 28 11 34C14 40 20 42 24 42"
        stroke="#1719F4" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 8C24 8 34 8 37 14C40 20 40 28 37 34C34 40 28 42 24 42"
        stroke="#1719F4" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 8V42" stroke="#1719F4" strokeWidth="1.5"
        strokeLinecap="round" strokeDasharray="3 3" />
      <path d="M11 16C14 15 17 18 15 21"
        stroke="#1719F4" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 26C13 25 16 28 14 31"
        stroke="#1719F4" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 20C15 22 14 25 12 26"
        stroke="#1719F4" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M37 16C34 15 31 18 33 21"
        stroke="#1719F4" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 26C35 25 32 28 34 31"
        stroke="#1719F4" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 20C33 22 34 25 36 26"
        stroke="#1719F4" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="14" r="2.5" fill="#1719F4" />
      <circle cx="24" cy="24" r="2.5" fill="#1719F4" />
      <circle cx="24" cy="34" r="2.5" fill="#1719F4" />
      <path d="M15 21L24 24" stroke="#1719F4" strokeWidth="1.2"
        strokeLinecap="round" opacity="0.6" />
      <path d="M33 21L24 24" stroke="#1719F4" strokeWidth="1.2"
        strokeLinecap="round" opacity="0.6" />
      <path d="M14 31L24 34" stroke="#1719F4" strokeWidth="1.2"
        strokeLinecap="round" opacity="0.6" />
      <path d="M34 31L24 34" stroke="#1719F4" strokeWidth="1.2"
        strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 1L11 11M11 1L1 11" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function PatternCoachTab() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === 'true'
    if (dismissed) return

    const updateMobile = () => setIsMobile(window.innerWidth < 1024)
    updateMobile()
    setIsVisible(true)

    window.addEventListener('resize', updateMobile)
    return () => window.removeEventListener('resize', updateMobile)
  }, [])

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    window.localStorage.setItem(STORAGE_KEY, 'true')
    setIsVisible(false)
  }

  const springEase = [0.22, 1, 0.36, 1] as const

  return (
    <AnimatePresence>
      {isVisible && !isMobile && (
        <motion.aside
          key="pc-desktop"
          aria-label="Pattern Coach App"
          className="fixed right-0 z-[60] flex flex-col items-center justify-between py-6 w-20 h-[280px] bg-white border-l-4 border-brand-accent rounded-l-3xl"
          style={{
            top: '50%',
            translateY: '-50%',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.25), -4px 0 20px rgba(23,25,244,0.3)',
          }}
          initial={{ x: 140, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 140, opacity: 0, transition: { duration: 0.4 } }}
          whileHover={{ x: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
          transition={{ delay: 2, duration: 0.7, ease: springEase }}
        >
          <a
            href={EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-4 flex-1 cursor-pointer"
            aria-label="Open Pattern Coach — Brilliant Coach in Your Pocket"
          >
            <div
              className="motion-safe:animate-brain-pulse shrink-0"
              style={{ filter: 'drop-shadow(0 0 8px #1719F4) drop-shadow(0 0 16px rgba(23,25,244,0.5))' }}
            >
              <BrainIcon size={48} />
            </div>

            <div
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[11px] font-black tracking-[0.2em] text-brand-primary-900 uppercase leading-none">
                BRILLIANT
              </span>
              <span className="text-[11px] font-black tracking-[0.2em] text-brand-primary-900 uppercase leading-none">
                COACH
              </span>
              <span className="text-[10px] font-semibold tracking-[0.15em] text-brand-accent uppercase leading-none">
                IN YOUR
              </span>
              <span className="text-[10px] font-semibold tracking-[0.15em] text-brand-accent uppercase leading-none">
                POCKET
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close Pattern Coach"
            className="-m-2.5 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-brand-accent transition-colors duration-200"
          >
            <CloseIcon />
          </button>
        </motion.aside>
      )}

      {isVisible && isMobile && (
        <motion.aside
          key="pc-mobile"
          aria-label="Pattern Coach App"
          className="fixed z-[60] flex flex-row items-center gap-3 h-14 px-6 bg-white border-t-4 border-brand-accent rounded-2xl"
          style={{
            bottom: '24px',
            left: '50%',
            translateX: '-50%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2), 0 4px 16px rgba(23,25,244,0.3)',
          }}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0, transition: { duration: 0.4 } }}
          transition={{ delay: 2, duration: 0.6, ease: springEase }}
        >
          <a
            href={EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
            aria-label="Open Pattern Coach — Brilliant Coach in Your Pocket"
          >
            <div
              className="motion-safe:animate-brain-pulse shrink-0"
              style={{ filter: 'drop-shadow(0 0 6px #1719F4) drop-shadow(0 0 12px rgba(23,25,244,0.4))' }}
            >
              <BrainIcon size={32} />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-brand-primary-900 uppercase whitespace-nowrap">
              BRILLIANT COACH
            </span>
            <span className="text-[10px] font-semibold tracking-[0.15em] text-brand-accent uppercase whitespace-nowrap">
              IN YOUR POCKET
            </span>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close Pattern Coach"
            className="-m-2.5 ml-1 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-brand-accent transition-colors duration-200 shrink-0"
          >
            <CloseIcon />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}