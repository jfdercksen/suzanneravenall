'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function ResourcesNewsletterCTA() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO Phase 4: Wire to Vibe Marketing
    setSubmitted(true)
  }

  return (
    <section
      aria-labelledby="newsletter-cta-heading"
      className="w-full bg-brand-primary py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
          >
            Monthly Insights Newsletter
          </motion.p>

          <motion.h2
            id="newsletter-cta-heading"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-light text-white mb-6"
          >
            Stay Connected
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/70 font-light leading-relaxed mb-10"
          >
            Each month, Dr. Suzanne Ravenall shares insights on consciousness, healing, inner
            regulation and transformation — the kind of wisdom that changes how you see yourself
            and your world.
          </motion.p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white/10 rounded-2xl p-8 text-white"
            >
              <p className="text-lg font-semibold mb-2">You&apos;re on the list.</p>
              <p className="text-white/70 font-light text-sm">
                Watch your inbox for the next issue.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-white/40 text-sm focus:outline-none focus:border-brand-accent focus:bg-white/15 transition-all duration-300"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-white/40 text-sm focus:outline-none focus:border-brand-accent focus:bg-white/15 transition-all duration-300"
              />
              <button
                type="submit"
                className="whitespace-nowrap bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm px-8 py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Subscribe
              </button>
            </motion.form>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-4 text-xs text-white/40 font-light"
          >
            No spam. Unsubscribe at any time.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
