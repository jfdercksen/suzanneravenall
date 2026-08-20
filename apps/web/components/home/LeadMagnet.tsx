'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

// TODO: Wire to real PDF delivery once Suzanne provides the chapter PDF.
// Currently captures email only — no asset is sent on submit.

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function LeadMagnet() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok && res.status !== 202) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
      setEmail('')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section id="lead-magnet" aria-labelledby="leadmagnet-heading" className="relative py-14 lg:py-24 bg-brand-primary overflow-hidden">
      {/* Background photo + navy overlay — dark sections carry imagery, never flat colour */}
      <Image
        src="/images/generated/group-coaching-real.webp"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-white/80 text-xs font-medium uppercase tracking-[0.3em] mb-4">
            Free Chapter
          </p>
          <h2 id="leadmagnet-heading" className="text-4xl lg:text-6xl font-light text-white">
            Get the first chapter free
          </h2>
          <p className="mt-4 text-white/70 text-lg leading-relaxed">
            Download Chapter 1 of The Breakthrough Trilogy and discover the hidden patterns holding you back.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          {status === 'success' ? (
            <div className="mt-8 rounded-card bg-brand-accent/20 border border-brand-accent/40 px-8 py-6">
              <p className="text-white font-semibold text-lg">Chapter 1 is on its way!</p>
              <p className="mt-2 text-white/70">We&apos;ll send your chapter download link to your inbox shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <label htmlFor="lead-magnet-email" className="sr-only">
                Email address
              </label>
              <input
                id="lead-magnet-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                disabled={status === 'loading'}
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? 'lead-magnet-error' : undefined}
                className="flex-1 px-5 py-3.5 rounded-button bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent disabled:opacity-50 text-sm"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-7 py-3.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap text-sm"
              >
                {status === 'loading' ? 'Sending…' : 'Download Chapter 1'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p id="lead-magnet-error" role="alert" className="mt-3 text-red-400 text-sm">
              {error}
            </p>
          )}

          <p className="mt-4 text-white/70 text-xs">
            No spam. Unsubscribe at any time.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
