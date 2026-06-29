'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function ResourcesNewsletterCTA() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, source: 'newsletter' }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
        return
      }

      setState('success')
    } catch {
      setErrorMessage('Unable to submit. Please check your connection and try again.')
      setState('error')
    }
  }

  return (
    <section
      aria-labelledby="newsletter-cta-heading"
      className="w-full bg-white py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
          >
            Monthly Insights Newsletter
          </motion.p>

          <motion.h2
            id="newsletter-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-light text-gray-900 mb-6"
          >
            Stay Connected
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 font-light leading-relaxed mb-10"
          >
            Each month, Dr. Suzanne Ravenall shares insights on consciousness, healing, inner
            regulation and transformation — the kind of wisdom that changes how you see yourself
            and your world.
          </motion.p>

          {state === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-brand-accent/10 border border-brand-accent/30 rounded-card p-8"
            >
              <p className="text-lg font-semibold text-gray-900 mb-2">You&apos;re on the list.</p>
              <p className="text-gray-600 font-light text-sm">
                Watch your inbox for the next issue.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3"
            >
              <label htmlFor="newsletter-first-name" className="sr-only">First name</label>
              <input
                id="newsletter-first-name"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={state === 'submitting'}
                className="flex-1 min-w-0 bg-gray-100 border border-gray-200 rounded-xl px-5 py-4 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-brand-accent transition-all duration-300 disabled:opacity-60"
              />
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={state === 'submitting'}
                className="flex-1 min-w-0 bg-gray-100 border border-gray-200 rounded-xl px-5 py-4 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-brand-accent transition-all duration-300 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={state === 'submitting'}
                className="whitespace-nowrap bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-60 text-white font-semibold text-sm px-8 py-4 rounded-button transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                {state === 'submitting' ? 'Subscribing…' : 'Subscribe'}
              </button>
            </motion.form>
          )}

          {state === 'error' && errorMessage && (
            <p className="mt-3 text-red-500 text-sm">{errorMessage}</p>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-4 text-xs text-gray-400 font-light"
          >
            No spam. Unsubscribe at any time.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
