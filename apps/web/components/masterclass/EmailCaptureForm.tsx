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
      ? 'flex-1 rounded-xl bg-brand-sand border border-brand-border px-4 py-3 text-brand-ink placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent text-sm'
      : 'flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent text-sm'

  if (state === 'success') {
    return (
      <div className="rounded-card bg-brand-accent/5 border border-brand-primary-300/40 p-6 text-center">
        <p className={`font-medium text-lg ${variant === 'light' ? 'text-brand-ink' : 'text-white'}`}>
          You&rsquo;re in!
        </p>
        <p className={`mt-1 text-sm ${variant === 'light' ? 'text-brand-muted' : 'text-white/80'}`}>
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
          // White on the dark variant: the near-black accent vanishes on black.
          className={`rounded-button ${variant === 'light' ? 'bg-brand-accent-600 hover:bg-brand-accent-700 text-white' : 'bg-white hover:bg-brand-sand text-brand-primary'} disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 font-medium text-sm transition-all duration-300 whitespace-nowrap sm:w-auto w-full`}
        >
          {state === 'submitting' ? 'Sending…' : 'Get Instant Access →'}
        </button>
      </div>

      {state === 'error' && (
        <p className={`mt-2 text-xs ${variant === 'light' ? 'text-red-600' : 'text-red-400'}`}>{errorMessage}</p>
      )}

      <p className={`mt-3 text-xs ${variant === 'light' ? 'text-brand-muted' : 'text-white/70'}`}>
        Free. No credit card required. Instant access.
      </p>

      {/* TODO Phase 4: Wire to Vibe Marketing automation */}
    </form>
  )
}
