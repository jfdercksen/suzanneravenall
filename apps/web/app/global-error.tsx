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
      <body className="flex min-h-screen flex-col items-center justify-center p-24 font-sans antialiased">
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="mt-4 text-lg text-gray-600">
          A critical error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-8 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
