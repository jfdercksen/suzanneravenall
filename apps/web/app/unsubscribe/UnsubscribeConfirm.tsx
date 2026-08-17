'use client'

import { useState } from 'react'

interface Props {
  token: string
  email: string
}

type Status = 'idle' | 'submitting' | 'done' | 'error'

export default function UnsubscribeConfirm({ token, email }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleUnsubscribe() {
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setErrorMessage(data?.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div>
        <h1 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
          You have been unsubscribed
        </h1>
        <p className="text-gray-600 leading-relaxed mb-3">
          <strong>{email}</strong> will no longer receive marketing emails from the
          Ravenall Institute (cart reminders and membership offers).
        </p>
        <p className="text-gray-600 leading-relaxed">
          You will still receive essential service emails, such as order confirmations
          and receipts for purchases you make.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
        Unsubscribe from marketing emails
      </h1>
      <p className="text-gray-600 leading-relaxed mb-8">
        Stop sending marketing emails (cart reminders and membership offers) to{' '}
        <strong>{email}</strong>? You will still receive essential service emails such
        as order confirmations.
      </p>
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={status === 'submitting'}
        className="inline-block px-8 py-4 bg-brand-accent text-white font-semibold rounded disabled:opacity-60"
      >
        {status === 'submitting' ? 'Unsubscribing…' : 'Unsubscribe'}
      </button>
      {errorMessage ? (
        <p className="text-red-600 text-sm mt-4" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
