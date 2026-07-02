'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const STORAGE_KEY = 'pattern-coach-tab-dismissed'
const EXTERNAL_URL = 'https://suzanneravenallpatterncoach.com'

function BrainIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Left hemisphere outline */}
      <path d="M14 5 C9 5 4 9 4 14 C4 19 9 23 14 23" />
      {/* Right hemisphere outline */}
      <path d="M14 5 C19 5 24 9 24 14 C24 19 19 23 14 23" />
      {/* Corpus callosum divider */}
      <line x1="14" y1="5" x2="14" y2="23" />
      {/* Left neural fold */}
      <path d="M8 10 Q5 14 8 18" />
      {/* Right neural fold */}
      <path d="M20 10 Q23 14 20 18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="1" y1="1" x2="9" y2="9" />
      <line x1="9" y1="1" x2="1" y2="9" />
    </svg>
  )
}

export default function PatternCoachTab() {
  // Start dismissed=true (hidden) so SSR output matches initial client render.
  const [dismissed, setDismissed] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const wasDismissed = window.localStorage.getItem(STORAGE_KEY) === 'true'
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(motionMq.matches)
    if (!wasDismissed) setDismissed(false)
    setMounted(true)
  }, [])

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    window.localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  // Prevent SSR mismatch — render nothing until client hydration confirms state.
  if (!mounted) return null

  const transition = {
    delay: prefersReducedMotion ? 0 : 3,
    duration: prefersReducedMotion ? 0 : 0.5,
    ease: 'easeOut' as const,
  }

  return (
    // AnimatePresence requires motion elements as direct keyed children — no fragment wrapper.
    // Both asides are guarded separately so each gets its own exit animation.
    <AnimatePresence>
      {!dismissed && (
        // ── Desktop: vertical pill, flush against left edge ──────────────
        <motion.aside
          key="pc-desktop"
          aria-label="Pattern Coach App"
          className="hidden lg:flex fixed left-0 z-[60] flex-col items-center overflow-hidden w-8 h-[220px] bg-brand-primary border-l-4 border-brand-accent rounded-r-xl shadow-[4px_0_24px_theme(colors.brand.accent/30%)] hover:w-12 hover:shadow-[4px_0_32px_theme(colors.brand.accent/50%)] transition-[width,box-shadow] duration-300"
          style={{ top: '50%', translateY: '-50%' }}
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -120, opacity: 0 }}
          whileHover={{ x: 4 }}
          transition={transition}
        >
          {/* Clickable area: brain + rotated text */}
          <a
            href={EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center flex-1 min-h-0 w-full pt-4 gap-3"
            aria-label="Open Pattern Coach — Brilliant Coach in Your Pocket"
          >
            {/* Brain icon — motion-safe suppresses the CSS animation for reduced-motion users */}
            <span className="text-brand-accent motion-safe:animate-brain-glow shrink-0">
              <BrainIcon size={28} />
            </span>

            {/* Vertical text: reads bottom to top */}
            <span className="relative flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center">
              <span
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
                className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/80 whitespace-nowrap select-none"
              >
                Brilliant Coach in Your Pocket
              </span>
            </span>
          </a>

          {/* Dismiss button — sibling to <a>, never nested inside it */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Pattern Coach tab"
            className="shrink-0 mb-3 h-4 w-4 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors duration-200"
          >
            <CloseIcon />
          </button>
        </motion.aside>
      )}

      {!dismissed && (
        // ── Mobile: horizontal pill, fixed bottom centre ──────────────────
        <motion.aside
          key="pc-mobile"
          aria-label="Pattern Coach App"
          className="flex lg:hidden fixed z-[60] items-center gap-3 h-12 px-4 bg-brand-primary border-b-4 border-brand-accent rounded-t-xl shadow-[0_-4px_24px_theme(colors.brand.accent/30%)]"
          style={{ bottom: '24px', left: '50%', translateX: '-50%' }}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={transition}
        >
          <a
            href={EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
            aria-label="Open Pattern Coach — Brilliant Coach in Your Pocket"
          >
            <span className="text-brand-accent motion-safe:animate-brain-glow">
              <BrainIcon size={20} />
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-white/80 whitespace-nowrap select-none">
              Brilliant Coach in Your Pocket
            </span>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Pattern Coach tab"
            className="ml-1 h-8 w-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors duration-200"
          >
            <CloseIcon />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}