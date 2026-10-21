"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import IntakeQuestion, { type QuestionValue } from './IntakeQuestion'
import { ACKNOWLEDGEMENT_KEY, validateSubmission } from '@/lib/intake/validate'
import type { IntakeForm } from '@/lib/intake/types'

/**
 * The open intake form: header on black, questions on white, the thank-you
 * state after a successful send. Validates in the browser with the same rules
 * the submit route uses, then lets the route have the last word.
 */

interface IntakeFormContentProps {
  token: string
  form: IntakeForm
  serviceName: string
  firstName: string | null
  introduction: string | null
  supportEmail: string
}

type Phase = 'editing' | 'sending' | 'done'

function paragraphs(text: string | null): string[] {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

const SECTION_MOTION = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
} as const

const FAILURE_MESSAGES: Record<string, string> = {
  already_completed: 'We already have your form. There is nothing more to do.',
  expired: 'This link has expired. Please write to us for a new one.',
  not_found: 'This link is not valid. Please open it again from the mail we sent you.',
}

export default function IntakeFormContent({ token, form, serviceName, firstName, introduction, supportEmail }: IntakeFormContentProps) {
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({})
  const [acknowledged, setAcknowledged] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<Phase>('editing')
  const [failure, setFailure] = useState<string | null>(null)

  const answerFor = (id: string): QuestionValue => answers[id] ?? { value: '', detail: '' }
  const errorCount = Object.keys(errors).length

  function clearError(key: string) {
    if (!errors[key]) return
    setErrors((prev) => {
      const rest = { ...prev }
      delete rest[key]
      return rest
    })
  }

  function update(id: string, next: QuestionValue) {
    setAnswers((prev) => ({ ...prev, [id]: next }))
    clearError(id)
  }

  function showErrors(found: Record<string, string>) {
    setErrors(found)
    const first = form.fields.find((f) => found[f.id])
    const target = first ? `q-${first.id}-wrap` : found[ACKNOWLEDGEMENT_KEY] ? 'intake-ack' : null
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFailure(null)
    const submission = { acknowledged, answers }
    const checked = validateSubmission(form, submission)
    if (!checked.ok) {
      showErrors(checked.errors)
      return
    }
    setPhase('sending')
    try {
      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...submission }),
      })
      const body = (await res.json().catch(() => ({}))) as { status?: string; errors?: Record<string, string> }
      if (res.ok) {
        setPhase('done')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      setPhase('editing')
      if (res.status === 422 && body.errors) {
        showErrors(body.errors)
        return
      }
      if (body.status === 'already_completed') {
        setPhase('done')
        return
      }
      setFailure(
        FAILURE_MESSAGES[body.status ?? ''] ??
          `Your form could not be sent just now. Please try again in a minute; nothing you typed is lost. If it keeps failing, write to ${supportEmail}.`,
      )
    } catch {
      setPhase('editing')
      setFailure(`Your form could not be sent. Check your connection and try again; nothing you typed is lost.`)
    }
  }

  const header = (
    <section className="w-full py-20 lg:py-32 bg-brand-primary-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...SECTION_MOTION}>
          <p className="mb-4 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400">{serviceName}</p>
          <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05] text-white">
            {phase === 'done' ? 'Thank you, your form is in' : form.title}
          </h1>
          <p className="max-w-xl text-sm sm:text-base lg:text-lg text-white/85">
            {phase === 'done'
              ? 'We have received your intake form and will read it before your session. There is nothing more to do here.'
              : `${firstName ? `${firstName}, this` : 'This'} form helps us prepare for your session. It takes about 10 to 15 minutes.`}
          </p>
        </motion.div>
      </div>
    </section>
  )

  if (phase === 'done') {
    return (
      <>
        {header}
        <section className="w-full py-20 lg:py-32 bg-brand-cream">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...SECTION_MOTION}>
              <p className="text-base lg:text-lg leading-relaxed text-brand-ink">
                If you would like to add or change something, write to us at{' '}
                <a href={`mailto:${supportEmail}`} className="underline underline-offset-4">
                  {supportEmail}
                </a>
                . If you have not booked your session time yet, use the booking link in your order confirmation mail.
              </p>
            </motion.div>
          </div>
        </section>
      </>
    )
  }

  const intro = [...paragraphs(introduction), ...paragraphs(form.intro)]

  return (
    <>
      {header}
      <section className="w-full py-20 lg:py-32 bg-brand-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.form {...SECTION_MOTION} onSubmit={handleSubmit} noValidate className="space-y-8">
            {intro.length > 0 ? (
              <div className="space-y-4 rounded-md bg-brand-sand p-6 lg:p-8">
                {intro.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-brand-ink">
                    {p}
                  </p>
                ))}
              </div>
            ) : null}

            {form.fields.map((field) =>
              field.type === 'heading' ? (
                <h2 key={field.id} className="border-t border-brand-border pt-10 text-2xl lg:text-3xl font-medium tracking-tight text-brand-ink">
                  {field.label}
                </h2>
              ) : (
                <IntakeQuestion
                  key={field.id}
                  field={field}
                  answer={answerFor(field.id)}
                  error={errors[field.id]}
                  onChange={(next) => update(field.id, next)}
                />
              ),
            )}

            {form.acknowledgement ? (
              <div id="intake-ack" className="scroll-mt-32 rounded-md bg-brand-sand p-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => {
                      setAcknowledged(e.target.checked)
                      if (e.target.checked) clearError(ACKNOWLEDGEMENT_KEY)
                    }}
                    aria-invalid={!!errors[ACKNOWLEDGEMENT_KEY]}
                    className="mt-1 h-5 w-5 shrink-0 accent-brand-primary"
                  />
                  <span className="text-base leading-relaxed text-brand-ink">{form.acknowledgement}</span>
                </label>
                {errors[ACKNOWLEDGEMENT_KEY] ? (
                  <p className="mt-2 text-sm text-red-600">{errors[ACKNOWLEDGEMENT_KEY]}</p>
                ) : null}
              </div>
            ) : null}

            <div className="border-t border-brand-border pt-8">
              {errorCount > 0 ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                  {errorCount === 1 ? 'One answer needs your attention' : `${errorCount} answers need your attention`} before
                  the form can be sent.
                </p>
              ) : null}
              {failure ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                  {failure}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={phase === 'sending'}
                className="w-full sm:w-auto rounded-md px-10 py-4 text-base font-medium text-white bg-brand-accent-600 hover:bg-brand-accent-700 transition-all duration-300 disabled:opacity-60"
              >
                {phase === 'sending' ? 'Sending...' : 'Send my intake form'}
              </button>
              <p className="mt-4 text-sm text-brand-muted">
                Your answers go only to the Ravenall Institute team. Questions? Write to{' '}
                <a href={`mailto:${supportEmail}`} className="underline underline-offset-4">
                  {supportEmail}
                </a>
                .
              </p>
            </div>
          </motion.form>
        </div>
      </section>
    </>
  )
}
