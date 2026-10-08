'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { emailError, hasErrors, requiredError, useFieldErrors } from '@/lib/forms/validation'
import { MASTERCLASS_WATCH_PATH } from '@/lib/masterclass'

type FormState = 'idle' | 'submitting' | 'success' | 'error'
type Field = 'firstName' | 'email' | 'watchDate' | 'watchTime'
type Schedule = 'now' | 'later'

const FIRST_NAME_REQUIRED = 'Please enter your first name.'
const DATE_REQUIRED = 'Please choose a date.'
const TIME_REQUIRED = 'Please choose a time.'

/** Today as YYYY-MM-DD in the visitor's own time zone, for the date picker's min. */
function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface EmailCaptureFormProps {
  variant?: 'dark' | 'light'
}

export default function EmailCaptureForm({ variant = 'dark' }: EmailCaptureFormProps) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  // Watch Now / Watch Later, as on the current site (Shayna, 7 Oct).
  const [schedule, setSchedule] = useState<Schedule>('now')
  const [watchDate, setWatchDate] = useState('')
  const [watchTime, setWatchTime] = useState('')
  const router = useRouter()
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const { errors, setError, setErrors } = useFieldErrors<Field>()
  // useId keeps the ids unique if the form is ever placed on a page twice.
  const id = useId()
  const firstNameId = `${id}-first-name`
  const emailId = `${id}-email`
  const dateId = `${id}-date`
  const timeId = `${id}-time`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fieldErrors = {
      firstName: requiredError(firstName, FIRST_NAME_REQUIRED),
      email: emailError(email),
      watchDate: schedule === 'later' ? requiredError(watchDate, DATE_REQUIRED) : undefined,
      watchTime: schedule === 'later' ? requiredError(watchTime, TIME_REQUIRED) : undefined,
    }
    if (hasErrors(fieldErrors)) {
      setErrors(fieldErrors)
      return
    }
    setState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          email,
          source: 'masterclass',
          ...(schedule === 'later' ? { watchDate, watchTime } : {}),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
        return
      }

      if (schedule === 'now') {
        router.push(MASTERCLASS_WATCH_PATH)
        return
      }
      setState('success')
    } catch {
      setErrorMessage('Unable to submit. Please check your connection and try again.')
      setState('error')
    }
  }

  const inputClass =
    variant === 'light'
      ? 'flex-1 rounded-xl bg-brand-sand border border-brand-border px-4 py-3 text-brand-ink placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent text-sm'
      : 'flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent text-sm'

  const errorClass = variant === 'light' ? 'text-red-600' : 'text-red-400'
  const labelColor = variant === 'light' ? 'text-brand-ink' : 'text-white/80'

  if (state === 'success') {
    return (
      <div className="rounded-card bg-brand-accent/5 border border-brand-primary-300/40 p-6 text-center">
        <p className={`font-medium text-lg ${variant === 'light' ? 'text-brand-ink' : 'text-white'}`}>
          Thank you, you&rsquo;re registered.
        </p>
        <p className={`mt-1 text-sm ${variant === 'light' ? 'text-brand-muted' : 'text-white/80'}`}>
          We have emailed you the link to watch the masterclass at the time you chose.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 flex flex-col">
          <label htmlFor={firstNameId} className="sr-only">First name</label>
          <input
            id={firstNameId}
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value)
              if (errors.firstName) setError('firstName', requiredError(e.target.value, FIRST_NAME_REQUIRED))
            }}
            onBlur={(e) => setError('firstName', requiredError(e.target.value, FIRST_NAME_REQUIRED))}
            required
            autoComplete="given-name"
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? `${firstNameId}-error` : undefined}
            className={inputClass}
          />
          {errors.firstName && (
            <p id={`${firstNameId}-error`} className={`mt-1 text-xs ${errorClass}`}>{errors.firstName}</p>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <label htmlFor={emailId} className="sr-only">Email address</label>
          <input
            id={emailId}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setError('email', emailError(e.target.value))
            }}
            onBlur={(e) => setError('email', emailError(e.target.value))}
            required
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            className={inputClass}
          />
          {errors.email && (
            <p id={`${emailId}-error`} className={`mt-1 text-xs ${errorClass}`}>{errors.email}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={state === 'submitting'}
          // White on the dark variant: the near-black accent vanishes on black.
          className={`rounded-button ${variant === 'light' ? 'bg-brand-accent-600 hover:bg-brand-accent-700 text-white' : 'bg-white hover:bg-brand-sand text-brand-primary'} disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 font-medium text-sm transition-all duration-300 whitespace-nowrap sm:w-auto w-full`}
        >
          {state === 'submitting' ? 'Sending…' : schedule === 'now' ? 'Register and Watch →' : 'Register →'}
        </button>
      </div>

      <fieldset className="mt-4">
        <legend className={`text-xs uppercase tracking-[0.2em] mb-2 ${labelColor}`}>Watch schedule</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {(['now', 'later'] as const).map((value) => (
            <label key={value} className={`inline-flex items-center gap-2 text-sm ${labelColor}`}>
              <input
                type="radio"
                name={`${id}-schedule`}
                value={value}
                checked={schedule === value}
                onChange={() => setSchedule(value)}
                className="accent-brand-accent"
              />
              {value === 'now' ? 'Watch Now' : 'Watch Later'}
            </label>
          ))}
        </div>
        {schedule === 'later' && (
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex flex-col">
              <label htmlFor={dateId} className={`text-xs mb-1 ${labelColor}`}>Date</label>
              <input
                id={dateId}
                type="date"
                min={localToday()}
                value={watchDate}
                onChange={(e) => {
                  setWatchDate(e.target.value)
                  if (errors.watchDate) setError('watchDate', requiredError(e.target.value, DATE_REQUIRED))
                }}
                aria-invalid={!!errors.watchDate}
                aria-describedby={errors.watchDate ? `${dateId}-error` : undefined}
                className={inputClass}
              />
              {errors.watchDate && (
                <p id={`${dateId}-error`} className={`mt-1 text-xs ${errorClass}`}>{errors.watchDate}</p>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <label htmlFor={timeId} className={`text-xs mb-1 ${labelColor}`}>Time</label>
              <input
                id={timeId}
                type="time"
                value={watchTime}
                onChange={(e) => {
                  setWatchTime(e.target.value)
                  if (errors.watchTime) setError('watchTime', requiredError(e.target.value, TIME_REQUIRED))
                }}
                aria-invalid={!!errors.watchTime}
                aria-describedby={errors.watchTime ? `${timeId}-error` : undefined}
                className={inputClass}
              />
              {errors.watchTime && (
                <p id={`${timeId}-error`} className={`mt-1 text-xs ${errorClass}`}>{errors.watchTime}</p>
              )}
            </div>
          </div>
        )}
      </fieldset>

      {state === 'error' && (
        <p role="alert" className={`mt-2 text-xs ${errorClass}`}>{errorMessage}</p>
      )}

      <p className={`mt-3 text-xs ${variant === 'light' ? 'text-brand-muted' : 'text-white/70'}`}>
        Free. No credit card required.
      </p>

    </form>
  )
}
