'use client'

import { useState } from 'react'

export default function EmailNotifyForm() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage(null)

    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, source: 'assessments-notify' }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
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
        <p className="text-lg text-brand-primary font-medium">You&apos;re on the list!</p>
        <p className="text-brand-muted mt-2">
          We&apos;ll let you know as soon as assessments are available.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4"
        noValidate
      >
        <label htmlFor="assessments-notify-first-name" className="sr-only">First name</label>
        <input
          id="assessments-notify-first-name"
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="flex-1 bg-brand-sand border border-brand-border rounded-xl px-5 py-4 text-brand-ink placeholder-brand-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors duration-200"
        />
        <label htmlFor="assessments-notify-email" className="sr-only">Email address</label>
        <input
          id="assessments-notify-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="flex-1 bg-brand-sand border border-brand-border rounded-xl px-5 py-4 text-brand-ink placeholder-brand-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors duration-200"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-8 py-4 rounded-xl transition-colors duration-300"
        >
          {status === 'loading' ? 'Sending…' : 'Notify Me'}
        </button>
      </form>
      {status === 'error' && errorMessage && (
        <p role="alert" className="mt-3 text-red-600 text-sm text-center">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
