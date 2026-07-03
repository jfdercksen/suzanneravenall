'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Quiz, QuizCategory } from '@/app/explore/quizzes/types'

// Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4
const SCALE: { label: string; value: number }[] = [
  { label: 'Never', value: 0 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Almost Always', value: 4 },
]

type Scores = Record<QuizCategory, number>

/**
 * Dominant pattern:
 * - Highest category sum wins (across all four categories, mixed included).
 * - If fight/flight/freeze are all within 2 points of each other AND the mixed
 *   score is (tied for) the overall highest, the result is "mixed"
 *   (Regulated Responder) — this also covers the all-zero case, where someone
 *   reports no patterns and is correctly read as regulated.
 * Tie-break order favours fight > flight > freeze > mixed.
 */
function computeResult(scores: Scores): QuizCategory {
  const trio = [scores.fight, scores.flight, scores.freeze]
  const allWithin2 = Math.max(...trio) - Math.min(...trio) <= 2
  const overallMax = Math.max(scores.fight, scores.flight, scores.freeze, scores.mixed)

  if (allWithin2 && scores.mixed === overallMax) return 'mixed'

  const order: QuizCategory[] = ['fight', 'flight', 'freeze', 'mixed']
  return order.reduce<QuizCategory>((best, c) => (scores[c] > scores[best] ? c : best), 'fight')
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function QuizFlow({ quiz }: { quiz: Quiz }) {
  const total = quiz.questions.length

  // step 0 = intro, 1..total = questions, total + 1 = results
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const [showCapture, setShowCapture] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [message, setMessage] = useState('')

  // Holds the pending auto-advance timer so it can be cancelled on unmount or
  // when the user goes back before it fires.
  const advanceTimer = useRef<number | null>(null)
  useEffect(() => () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
  }, [])

  const scores = useMemo<Scores>(() => {
    const s: Scores = { fight: 0, flight: 0, freeze: 0, mixed: 0 }
    for (const q of quiz.questions) {
      s[q.category] += answers[q.id] ?? 0
    }
    return s
  }, [answers, quiz.questions])

  const resultKey = useMemo(() => computeResult(scores), [scores])
  const result = quiz.results[resultKey]

  const start = () => {
    setDirection(1)
    setStep(1)
  }

  const handleSelect = (value: number) => {
    const question = quiz.questions[step - 1]
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
    setDirection(1)
    // Brief highlight before sliding to the next screen.
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => setStep((s) => s + 1), 280)
  }

  const goBack = () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'nervous-system-quiz',
          quizResult: resultKey,
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('success')
      setMessage('Your full Nervous System Pattern Report is on its way!')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  const isQuestion = step >= 1 && step <= total

  return (
    <section className="relative min-h-screen w-full bg-brand-primary text-white overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
      />

      {/* Progress bar — questions only */}
      {isQuestion && (
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goBack}
              className="text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors duration-150"
            >
              ← Back
            </button>
            <span className="text-xs uppercase tracking-[0.2em] text-white/70">
              {step} of {total}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuenow={step}
            aria-valuemin={0}
            aria-valuemax={total}
            className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden"
          >
            <motion.div
              className="h-full rounded-full bg-brand-accent"
              initial={false}
              animate={{ width: `${(step / total) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 0 — Intro */}
          {step === 0 && (
            <motion.div
              key="intro"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-center"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                2-Minute Diagnostic
              </p>
              <h1 className="text-4xl lg:text-6xl font-light leading-tight mb-5">{quiz.title}</h1>
              <p className="text-lg lg:text-xl text-brand-accent-200 font-light mb-8">
                {quiz.subtitle}
              </p>
              <div className="text-left text-base text-white/70 font-light leading-relaxed whitespace-pre-line mb-10">
                {quiz.intro}
              </div>
              <button
                type="button"
                onClick={start}
                className="inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
              >
                Start the Diagnostic
                <span aria-hidden="true">→</span>
              </button>
              <p className="mt-4 text-xs text-white/40 tracking-wide">2 minutes · {total} questions</p>
            </motion.div>
          )}

          {/* STEPS 1..total — Questions */}
          {isQuestion && (
            <motion.div
              key={`q-${step}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <h2
                id="quiz-current-question"
                className="text-2xl lg:text-4xl font-light leading-snug text-center min-h-[3.5em] flex items-center justify-center mb-10"
              >
                {quiz.questions[step - 1].text}
              </h2>

              <div className="flex flex-col gap-3">
                {SCALE.map((option) => {
                  const selected = answers[quiz.questions[step - 1].id] === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      aria-pressed={selected}
                      aria-describedby="quiz-current-question"
                      className={[
                        'w-full min-h-[52px] rounded-button px-6 py-3.5 text-base font-medium',
                        'border transition-all duration-200',
                        selected
                          ? 'bg-brand-accent border-brand-accent text-white scale-[1.02]'
                          : 'bg-white/5 border-white/15 text-white/85 hover:border-brand-accent/60 hover:bg-white/10',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* STEP total + 1 — Results */}
          {step > total && (
            <motion.div
              key="results"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4 text-center">
                Your Result
              </p>
              <h1 className="text-4xl lg:text-6xl font-light leading-tight mb-3 text-center">
                {result.title}
              </h1>
              <p className="text-base text-brand-accent-200 font-light mb-12 text-center">
                {result.subtitle}
              </p>

              {[
                { label: 'Mirror', body: result.mirror },
                { label: "What's Really Happening", body: result.mechanism },
              ].map((block) => (
                <div key={block.label} className="mb-8">
                  <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                    {block.label}
                  </p>
                  <p className="text-base lg:text-lg text-white/80 font-light leading-relaxed">
                    {block.body}
                  </p>
                </div>
              ))}

              {[
                { label: 'If This Continues', items: result.impact, accent: false },
                { label: 'The Shift', items: result.shift, accent: true },
              ].map((list) => (
                <div key={list.label} className="mb-8">
                  <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
                    {list.label}
                  </p>
                  <ul className="space-y-2.5">
                    {list.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-base text-white/80 font-light">
                        <span
                          aria-hidden="true"
                          className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                            list.accent ? 'bg-brand-accent' : 'bg-white/40'
                          }`}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* CTAs */}
              <div className="mt-12 flex flex-col gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
                >
                  {result.cta}
                  <span aria-hidden="true">→</span>
                </Link>

                {!showCapture && status !== 'success' && (
                  <button
                    type="button"
                    onClick={() => setShowCapture(true)}
                    className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
                  >
                    Get Your Full Pattern Report (PDF)
                  </button>
                )}
              </div>

              {/* Email capture for the PDF report.
                  TODO: PDF report generation pending — currently captures email +
                  result only. Build PDF per results structure in email when
                  content is finalised. */}
              {showCapture && status !== 'success' && (
                <form onSubmit={submitEmail} className="mt-6 rounded-card bg-white/5 border border-white/10 p-6">
                  <label htmlFor="quiz-email" className="block text-sm text-white/70 mb-3">
                    Where should we send your full Nervous System Pattern Report?
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      id="quiz-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 min-h-[52px] rounded-button bg-brand-primary-900/60 border border-white/15 px-5 text-white placeholder-white/30 focus:border-brand-accent focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="min-h-[52px] rounded-button bg-brand-accent px-8 text-sm font-semibold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-brand-accent-700 disabled:opacity-60"
                    >
                      {status === 'submitting' ? 'Sending…' : 'Send It'}
                    </button>
                  </div>
                  {status === 'error' && (
                    <p className="mt-3 text-sm text-red-300" role="alert">
                      {message}
                    </p>
                  )}
                </form>
              )}

              {status === 'success' && (
                <p
                  className="mt-6 rounded-card bg-brand-accent/15 border border-brand-accent/30 p-5 text-center text-base text-white"
                  role="status"
                >
                  {message}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
