'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ensureMembership } from '@/lib/access/ensure-membership'
import { emailError, hasErrors, requiredError, useFieldErrors } from '@/lib/forms/validation'

type Field = 'name' | 'email' | 'password' | 'confirmPassword'

const MIN_PASSWORD = 8

export default function SignupPage() {
  const router = useRouter()
  // Site check M6: keep the login page's ?redirect= so a new member still
  // lands where they were heading. Same relative-only rule as the login page.
  const rawRedirect = useSearchParams().get('redirect') ?? ''
  const redirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/portal/dashboard'
  const redirectQuery =
    redirect !== '/portal/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  // Site check M5: field messages on blur, before anything is sent.
  const { errors, setError: setFieldError, setErrors: setFieldErrors } = useFieldErrors<Field>()

  const validate = (field: Field, value: string): string | undefined => {
    switch (field) {
      case 'name':
        return requiredError(value, 'Please enter your full name.')
      case 'email':
        return emailError(value)
      case 'password':
        if (!value) return 'Please choose a password.'
        return value.length < MIN_PASSWORD ? `Your password needs at least ${MIN_PASSWORD} characters.` : undefined
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.'
        return value === password ? undefined : 'Passwords do not match.'
    }
  }

  const fieldProps = (field: Field, setValue: (v: string) => void) => ({
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      if (errors[field]) setFieldError(field, validate(field, e.target.value))
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => setFieldError(field, validate(field, e.target.value)),
    'aria-invalid': !!errors[field],
    'aria-describedby': errors[field] ? `signup-${field}-error` : undefined,
  })

  const fieldMessage = (field: Field) =>
    errors[field] ? (
      <p id={`signup-${field}-error`} className="mt-1.5 text-xs text-red-400">
        {errors[field]}
      </p>
    ) : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fieldErrors = {
      name: validate('name', name),
      email: validate('email', email),
      password: validate('password', password),
      confirmPassword: validate('confirmPassword', confirmPassword),
    }
    if (hasErrors(fieldErrors)) {
      setFieldErrors(fieldErrors)
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/portal/callback${
          redirectQuery ? `?next=${encodeURIComponent(redirect)}` : ''
        }`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Two legitimate outcomes, and the flow has to handle BOTH (KI038).
    //
    // 1. No session: GoTrue has email confirmation on, so it has sent a
    //    confirmation mail. The free-tier membership record is created later,
    //    server-side in /portal/callback, once the link is clicked. Show the
    //    "check your email" screen.
    // 2. A session: GOTRUE_MAILER_AUTOCONFIRM is on, so NO mail was sent and
    //    the account is already confirmed and signed in. /portal/callback will
    //    never run, so the membership record has to be created here instead,
    //    and telling the member to check their email would strand them waiting
    //    for a mail that is never coming.
    //
    // Branching on the session rather than on a build-time flag means this
    // keeps working whichever way autoconfirm is set, so turning it off later
    // needs no code change.
    if (!data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    // Best-effort: a failure here degrades display-only (the portal layout
    // falls back to the free tier), so it must not strand a member who has a
    // perfectly good account. The login path calls this too, so a miss here is
    // picked up on their next sign-in rather than being permanent.
    if (data.user) {
      await ensureMembership(data.user.id)
    } else {
      // Supabase's types make session-without-user impossible, so this should
      // never fire; log it rather than skipping in silence if it ever does.
      console.error('[signup] session returned with no user; membership not created')
    }

    router.push(redirect)
    router.refresh()
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-primary px-4">
        <div className="w-full max-w-md bg-brand-primary-800 border border-white/25 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-white mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-3">Check your email</h1>
          <p className="text-white/60 mb-2">
            We&apos;ve sent a confirmation link to
          </p>
          <p className="text-brand-accent-400 font-medium mb-8">{email}</p>
          <p className="text-white/70 text-sm mb-8">
            Click the link in the email to confirm your account, then you can
            log in.
          </p>
          <Link
            href={`/portal/login${redirectQuery}`}
            className="inline-flex items-center justify-center w-full px-8 py-4 bg-white hover:bg-brand-sand text-brand-primary font-semibold rounded-xl transition-colors duration-300"
          >
            Return to Login
          </Link>
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
          <p className="text-white/50 text-sm mt-2">Create your account</p>
        </div>

        <div className="bg-brand-primary-800 border border-white/25 rounded-2xl p-8">
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1">Sign Up</h1>
          <p className="text-white/50 text-sm mb-8">
            Join the community and access member resources
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                {...fieldProps('name', setName)}
                className="w-full bg-brand-primary-700 border border-white/35 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-colors duration-200"
                placeholder="Jane Smith"
              />
              {fieldMessage('name')}
            </div>

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
                {...fieldProps('email', setEmail)}
                className="w-full bg-brand-primary-700 border border-white/35 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-colors duration-200"
                placeholder="you@example.com"
              />
              {fieldMessage('email')}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                Password{' '}
                <span className="text-white/60 font-normal">(min. 8 characters)</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                {...fieldProps('password', setPassword)}
                className="w-full bg-brand-primary-700 border border-white/35 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-colors duration-200"
                placeholder="••••••••"
              />
              {fieldMessage('password')}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                {...fieldProps('confirmPassword', setConfirmPassword)}
                className="w-full bg-brand-primary-700 border border-white/35 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-colors duration-200"
                placeholder="••••••••"
              />
              {fieldMessage('confirmPassword')}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-brand-sand disabled:opacity-50 disabled:cursor-not-allowed text-brand-primary font-semibold py-4 rounded-xl transition-colors duration-300"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-white/70 text-sm">
            Already have an account?{' '}
            <Link href={`/portal/login${redirectQuery}`} className="text-brand-accent-400 hover:underline">
              Log in →
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}
