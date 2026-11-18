'use client'

import { useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'

const RELOADED_KEY = 'staff-clarity-reload'

/**
 * The one section of a /staff/submissions page: sand ground, entrance per the
 * motion rule. If Clarity is already running (a public page loaded it and the
 * browser came here without a full load, e.g. back/forward), reload once: on a
 * full load of a /staff page CookieConsent never starts it, so the answers are
 * never recorded.
 */
export function StaffSection({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!('clarity' in window)) return
    try {
      if (sessionStorage.getItem(RELOADED_KEY) === window.location.pathname) return
      sessionStorage.setItem(RELOADED_KEY, window.location.pathname)
    } catch {
      // Storage blocked: reload anyway; the next load has no Clarity.
    }
    window.location.reload()
  }, [])

  return (
    <section className="w-full min-h-[70vh] py-20 lg:py-32 bg-brand-sand">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}
