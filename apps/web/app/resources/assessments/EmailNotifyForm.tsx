'use client'

import { useState } from 'react'

export default function EmailNotifyForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage(null)

    try {
      // TODO Phase 4: Wire to Vibe Marketing
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, source: 'assessments-notify' }),
      })

      if (!res.ok) {
        throw new Error('Something went wrong. Please try again.')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong.',
      )
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <p className="text-lg text-white font-medium">You&apos;re on the list!</p>
        <p className="text-white/60 mt-2">
          We&apos;ll let you know as soon as assessments are available.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
      noValidate
    >
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors duration-200"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors duration-200"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="shrink-0 bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-300"
      >
        {status === 'loading' ? 'Sending…' : 'Notify Me'}
      </button>
      {status === 'error' && errorMessage && (
        <p className="sm:col-span-3 text-red-400 text-sm text-center">
          {errorMessage}
        </p>
      )}
    </form>
  )
}
