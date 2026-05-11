'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/callback?type=recovery`,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-primary px-4">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-accent/10 text-brand-accent mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-white mb-3">Check your email</h1>
          <p className="text-white/60 mb-2">We sent a password reset link to</p>
          <p className="text-brand-accent font-medium mb-8">{email}</p>
          <p className="text-white/40 text-sm mb-8">
            The link expires in 60 minutes. If you don&apos;t see the email,
            check your spam folder.
          </p>
          <Link
            href="/portal/login"
            className="inline-flex items-center justify-center w-full px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-xl transition-colors duration-300"
          >
            Back to Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-primary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-white font-semibold text-xl tracking-tight">
              Dr. Suzanne Ravenall
            </span>
          </Link>
          <p className="text-white/50 text-sm mt-2">Reset your password</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8">
          <h1 className="text-2xl font-light text-white mb-1">Forgot Password</h1>
          <p className="text-white/50 text-sm mb-8">
            Enter your email address and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors duration-200"
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors duration-300"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link href="/portal/login" className="text-white/40 hover:text-white/70 text-sm transition-colors duration-200">
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
