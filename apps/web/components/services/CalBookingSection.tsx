'use client'

import { useEffect, useRef } from 'react'
import { getCalApi } from '@calcom/embed-react'
import { motion } from 'framer-motion'

const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL ?? 'https://cal.suzanneravenall.com'

export default function CalBookingSection() {
  const initialised = useRef(false)

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true
    getCalApi({ embedJsUrl: `${CAL_URL}/embed/embed.js` }).then((cal) => {
      cal('ui', {
        theme: 'dark',
        styles: { branding: { brandColor: '#1719F4' } },
        hideEventTypeDetails: false,
      })
    })
  }, [])

  function openModal() {
    getCalApi({ embedJsUrl: `${CAL_URL}/embed/embed.js` }).then((cal) => {
      cal('modal', { calLink: 'suzanneravenall', config: { theme: 'dark' } })
    })
  }

  return (
    <motion.section
      aria-labelledby="booking-heading"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-gray-950 py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          Book a Session
        </motion.p>

        <motion.h2
          id="booking-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl md:text-6xl font-light text-white leading-tight mb-6"
        >
          Ready to begin?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg text-white/60 font-light max-w-xl mx-auto mb-12"
        >
          A 30-minute discovery call — no obligation. Find out which path is right for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center px-10 py-5 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_40px_theme(colors.brand.accent/60%)]"
          >
            Book a Discovery Call
          </button>
        </motion.div>
      </div>
    </motion.section>
  )
}
