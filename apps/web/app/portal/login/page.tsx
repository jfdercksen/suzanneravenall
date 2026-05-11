'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type LoginMode = 'password' | 'magic-link'

const ERROR_MESSAGES: Record<string, string> = {
  'auth-callback-failed': 'The sign-in link has expired or is invalid. Please request a new one.',
  'missing-code': 'Something went wrong with the sign-in link. Please try again.',
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') ?? ''
  // Only allow relative redirects — prevents open redirect attacks
  const redirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/portal/dashboard'
  const callbackError = searchParams.get('error')

  const [mode, setMode] = useState<LoginMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    callbackError ? (ERROR_MESSAGES[callbackError] ?? 'Something went wrong. Please try again.') : null
  )
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push(redirect)
    }
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/portal/callback?next=${redirect}`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setMagicLinkSent(true)
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-primary px-4">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-accent/10 text-brand-accent mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-white mb-3">Check your email</h1>
          <p className="text-white/60 mb-2">We sent a sign-in link to</p>
          <p className="text-brand-accent font-medium mb-8">{email}</p>
          <p className="text-white/40 text-sm mb-8">
            Click the link in the email to sign in. It expires in 60 minutes.
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setEmail('') }}
            className="text-brand-accent hover:underline text-sm"
          >
            Use a different email
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-primary px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-white font-semibold text-xl tracking-tight">
              Dr. Suzanne Ravenall
            </span>
          </Link>
          <p className="text-white/50 text-sm mt-2">Member Portal</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8">

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-gray-800 p-1 mb-8">
            <button
              type="button"
              onClick={() => { setMode('password'); setError(null) }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === 'password'
                  ? 'bg-brand-primary text-white shadow'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setMode('magic-link'); setError(null) }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === 'magic-link'
                  ? 'bg-brand-primary text-white shadow'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Magic Link
            </button>
          </div>

          {mode === 'password' ? (
            <>
              <h1 className="text-2xl font-light text-white mb-1">Log In</h1>
              <p className="text-white/50 text-sm mb-8">Access your member account</p>

              <form onSubmit={handlePasswordLogin} className="space-y-5" noValidate>
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-white/70">
                      Password
                    </label>
                    <Link
                      href="/portal/forgot-password"
                      className="text-xs text-brand-accent hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors duration-200"
                    placeholder="••••••••"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors duration-300"
                >
                  {loading ? 'Logging in…' : 'Log In'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-light text-white mb-1">Sign In</h1>
              <p className="text-white/50 text-sm mb-8">
                We&apos;ll email you a one-click sign-in link. No password needed.
              </p>

              <form onSubmit={handleMagicLink} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="magic-email" className="block text-sm font-medium text-white/70 mb-2">
                    Email address
                  </label>
                  <input
                    id="magic-email"
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
                  {loading ? 'Sending link…' : 'Send Sign-In Link'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-white/40 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/portal/signup" className="text-brand-accent hover:underline">
              Sign up →
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors duration-200">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}
