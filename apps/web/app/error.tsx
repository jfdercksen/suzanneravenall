'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 py-24">
      <h1 className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary text-center">Something went wrong</h1>
      <p className="mt-4 text-lg text-brand-muted text-center">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center justify-center rounded-button bg-brand-accent-600 hover:bg-brand-accent-700 px-6 py-3 text-xs sm:text-sm uppercase tracking-widest font-medium text-white transition-all duration-300"
      >
        Try again
      </button>
    </main>
  )
}
