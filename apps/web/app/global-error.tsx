'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import './globals.css'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-brand-cream text-brand-ink px-4 py-24 font-sans antialiased">
        <h1 className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary text-center">Something went wrong</h1>
        <p className="mt-4 text-lg text-brand-muted text-center">
          A critical error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-button bg-brand-accent-600 hover:bg-brand-accent-700 px-6 py-3 text-xs sm:text-sm uppercase tracking-widest font-medium text-white transition-all duration-300"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
