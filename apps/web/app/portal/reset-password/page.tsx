'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// checking: reading the recovery session the reset link starts.
// no-link:  no session, so the link is missing, used or expired (KI073).
// ready:    the form. done: the password is changed, said on this page (KI073).
type Stage = 'checking' | 'no-link' | 'ready' | 'done'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('checking')
  // The result replaces the form, so focus moves to its heading and a screen
  // reader announces it.
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (stage === 'no-link' || stage === 'done') headingRef.current?.focus()
  }, [stage])

  // Only a member who arrived through a valid recovery link has a session
  // here. Without one the page says so and offers a new link, instead of
  // bouncing to the login page with no word of why.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStage(session ? 'ready' : 'no-link')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      setLoading(false)
      setStage('done')
    }
  }

  if (stage === 'checking') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-primary">
        <div role="status" aria-label="Checking your reset link" className="w-8 h-8 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
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
          <p className="text-white/70 text-sm mt-2">{stage === 'no-link' ? 'Reset your password' : 'Set a new password'}</p>
        </div>

        {stage === 'no-link' && (
          <div className="bg-brand-primary-800 border border-white/25 rounded-2xl p-8" role="status">
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-medium tracking-tight text-white mb-3 focus:outline-none">This link has expired</h1>
            <p className="text-white/70 text-sm mb-8">
              Password reset links work once and only for a short time. Request a new link and we
              will email it to you.
            </p>
            <Link
              href="/portal/forgot-password"
              className="block w-full text-center bg-white hover:bg-brand-sand text-brand-primary font-semibold py-4 rounded-xl transition-colors duration-300"
            >
              Request a New Link
            </Link>
            <p className="text-center text-white/60 text-sm mt-6">
              Remembered it?{' '}
              <Link href="/portal/login" className="text-white underline underline-offset-4">
                Log in
              </Link>
            </p>
          </div>
        )}

        {stage === 'done' && (
          <div className="bg-brand-primary-800 border border-white/25 rounded-2xl p-8" role="status">
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-medium tracking-tight text-white mb-3 focus:outline-none">Password updated</h1>
            <p className="text-white/70 text-sm mb-8">
              Your new password is saved. Use it the next time you log in.
            </p>
            <Link
              href="/portal/dashboard"
              className="block w-full text-center bg-white hover:bg-brand-sand text-brand-primary font-semibold py-4 rounded-xl transition-colors duration-300"
            >
              Go to Your Dashboard
            </Link>
          </div>
        )}

        {stage === 'ready' && (
        <div className="bg-brand-primary-800 border border-white/25 rounded-2xl p-8">
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1">New Password</h1>
          <p className="text-white/70 text-sm mb-8">
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                New password{' '}
                <span className="text-white/60 font-normal">(min. 8 characters)</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-primary-700 border border-white/35 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-brand-primary-700 border border-white/35 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-brand-sand disabled:opacity-50 disabled:cursor-not-allowed text-brand-primary font-semibold py-4 rounded-xl transition-colors duration-300"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
        )}
      </div>
    </main>
  )
}
