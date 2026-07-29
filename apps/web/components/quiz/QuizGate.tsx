'use client'

import { useRef, useState } from 'react'
import type { Quiz } from '@/app/explore/quizzes/types'
import QuizFlow from './QuizFlow'

type GateMode = 'gate' | 'checkEmail' | 'invalid' | 'quiz'

interface QuizSubscriberSeed {
  id: string
  accessToken: string
  email: string
  initialAnswers?: Record<number, number>
  initialStep?: number
}

interface QuizGateProps {
  quiz: Quiz
  initialMode: 'gate' | 'invalid' | 'quiz'
  subscriber?: QuizSubscriberSeed
}

type SubmitStatus = 'idle' | 'submitting' | 'error'

export default function QuizGate({ quiz, initialMode, subscriber }: QuizGateProps) {
  const [mode, setMode] = useState<GateMode>(initialMode)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [sentTo, setSentTo] = useState('')

  // Guards against a double-submit firing two upserts before React re-renders
  // the disabled submit button — a second upsert rotates the access token,
  // which would invalidate the link from the first (already-sent) email.
  const isSubmitting = useRef(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting.current) return
    isSubmitting.current = true
    setStatus('submitting')
    setErrorMessage('')
    try {
      const res = await fetch('/api/quiz/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizSlug: quiz.slug, firstName, lastName, email }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')

      setSentTo(email)
      setStatus('idle')
      setMode('checkEmail')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      isSubmitting.current = false
    }
  }

  if (mode === 'quiz' && subscriber) {
    return (
      <QuizFlow
        quiz={quiz}
        subscriberId={subscriber.id}
        accessToken={subscriber.accessToken}
        subscriberEmail={subscriber.email}
        initialAnswers={subscriber.initialAnswers}
        initialStep={subscriber.initialStep}
      />
    )
  }

  return (
    <section className="relative min-h-screen w-full bg-brand-primary text-white overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
      />

      {/* Top-aligned, deliberately tight padding (not flex-centered) —
          centering this short content in a min-h-screen section risks
          landing the submit button behind the fixed cookie-consent banner /
          Pattern Coach pill, which both live in the last ~80-150px of the
          viewport. Kept short enough that the button clears that zone even
          on a compact 800px-tall desktop viewport. */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-16 sm:pb-24">
        {mode === 'gate' && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-3">
              Before You Begin
            </p>
            <h1 className="text-3xl lg:text-4xl font-light leading-tight mb-3">{quiz.title}</h1>
            <p className="text-base text-white/70 font-light leading-relaxed mb-6">
              Tell us where to send your diagnostic link — you&apos;ll get your result the
              moment you finish.
            </p>

            <form onSubmit={submit} className="text-left space-y-3">
              <div>
                <label htmlFor="quiz-gate-first-name" className="block text-sm text-white/70 mb-2">
                  First name
                </label>
                <input
                  id="quiz-gate-first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full min-h-[52px] rounded-button bg-white/5 border border-white/15 px-5 text-white placeholder-white/30 focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="quiz-gate-last-name" className="block text-sm text-white/70 mb-2">
                  Last name
                </label>
                <input
                  id="quiz-gate-last-name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full min-h-[52px] rounded-button bg-white/5 border border-white/15 px-5 text-white placeholder-white/30 focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="quiz-gate-email" className="block text-sm text-white/70 mb-2">
                  Email
                </label>
                <input
                  id="quiz-gate-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full min-h-[52px] rounded-button bg-white/5 border border-white/15 px-5 text-white placeholder-white/30 focus:border-brand-accent focus:outline-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-300" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30 disabled:opacity-60"
              >
                {status === 'submitting' ? 'Sending…' : 'Send Me the Diagnostic'}
              </button>
            </form>
          </div>
        )}

        {mode === 'checkEmail' && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-3">
              Check Your Inbox
            </p>
            <h1 className="text-3xl lg:text-4xl font-light leading-tight mb-3">
              Your {quiz.title} link is on its way
            </h1>
            <p className="text-base text-white/70 font-light leading-relaxed mb-6">
              We&apos;ve sent it to <span className="text-white">{sentTo}</span>. Check your
              inbox (and spam folder) to begin.
            </p>
            <button
              type="button"
              onClick={() => setMode('gate')}
              className="text-sm text-white/60 hover:text-white underline underline-offset-4 transition-colors duration-200"
            >
              Didn&apos;t get it? Resend
            </button>
          </div>
        )}

        {mode === 'invalid' && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-3">
              Link Expired
            </p>
            <h1 className="text-3xl lg:text-4xl font-light leading-tight mb-3">
              This link isn&apos;t valid
            </h1>
            <p className="text-base text-white/70 font-light leading-relaxed mb-6">
              It may have expired or already been used. Request a new one below.
            </p>
            <button
              type="button"
              onClick={() => setMode('gate')}
              className="inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700"
            >
              Get a New Link
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
