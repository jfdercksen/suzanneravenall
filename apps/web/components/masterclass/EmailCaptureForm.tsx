'use client'

import { useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface EmailCaptureFormProps {
  variant?: 'dark' | 'light'
}

export default function EmailCaptureForm({ variant = 'dark' }: EmailCaptureFormProps) {
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
        body: JSON.stringify({ firstName, email }),
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

  const inputClass =
    variant === 'light'
      ? 'flex-1 rounded-xl bg-gray-100 border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent text-sm'
      : 'flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent text-sm'

  if (state === 'success') {
    return (
      <div className="rounded-card bg-brand-accent/10 border border-brand-accent/30 p-6 text-center">
        <p className={`font-semibold text-lg ${variant === 'light' ? 'text-gray-900' : 'text-white'}`}>
          You&rsquo;re in!
        </p>
        <p className={`mt-1 text-sm ${variant === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
          Check your inbox: your access link is on its way.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="masterclass-first-name" className="sr-only">First name</label>
        <input
          id="masterclass-first-name"
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className={inputClass}
        />
        <label htmlFor="masterclass-email" className="sr-only">Email address</label>
        <input
          id="masterclass-email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="rounded-button bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 text-white font-semibold text-sm transition-all duration-300 whitespace-nowrap sm:w-auto w-full"
        >
          {state === 'submitting' ? 'Sending…' : 'Get Instant Access →'}
        </button>
      </div>

      {state === 'error' && (
        <p className="mt-2 text-red-400 text-xs">{errorMessage}</p>
      )}

      <p className={`mt-3 text-xs ${variant === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
        Free. No credit card required. Instant access.
      </p>

      {/* TODO Phase 4: Wire to Vibe Marketing automation */}
    </form>
  )
}
