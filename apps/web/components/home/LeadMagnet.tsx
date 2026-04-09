'use client'

import { useState } from 'react'

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
    <section id="lead-magnet" aria-labelledby="leadmagnet-heading" className="py-20 lg:py-28 bg-brand-primary-900">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="text-brand-accent text-xs font-semibold uppercase tracking-widest mb-4">
          Free Resource
        </p>
        <h2 id="leadmagnet-heading" className="text-3xl lg:text-4xl font-semibold text-white">
          The Breakthrough Masterclass
        </h2>
        <p className="mt-4 text-white/70 text-lg leading-relaxed">
          Discover the three core patterns keeping you stuck — and the exact method to dissolve them permanently. Free. No catch.
        </p>

        {status === 'success' ? (
          <div className="mt-8 rounded-card bg-brand-accent/20 border border-brand-accent/40 px-8 py-6">
            <p className="text-white font-semibold text-lg">You&apos;re on the list!</p>
            <p className="mt-2 text-white/70">We&apos;ll send your masterclass access as soon as it&apos;s ready.</p>
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
              className="flex-1 px-5 py-3.5 rounded-button bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent disabled:opacity-50 text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-7 py-3.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap text-sm"
            >
              {status === 'loading' ? 'Sending…' : 'Get Free Access'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p id="lead-magnet-error" role="alert" className="mt-3 text-red-400 text-sm">
            {error}
          </p>
        )}

        <p className="mt-4 text-white/40 text-xs">
          No spam. Unsubscribe at any time.
        </p>
      </div>
    </section>
  )
}
