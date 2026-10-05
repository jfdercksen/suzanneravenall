'use client'

import { useState } from 'react'
import {
  PHONE_PATTERN,
  emailError,
  hasErrors,
  phoneError,
  requiredError,
  sanitisePhone,
  useFieldErrors,
} from '@/lib/forms/validation'
import { ENQUIRY_OPTIONS, type EnquiryOption } from './enquiry'

type FormState = 'idle' | 'submitting' | 'success' | 'error'
type Field = 'name' | 'email' | 'phone' | 'message'

// Site check M5: checked on blur and on submit, not only by the API.
const VALIDATORS: Record<Field, (value: string) => string | undefined> = {
  name: (v) => requiredError(v, 'Please enter your name.'),
  email: emailError,
  phone: phoneError,
  message: (v) => requiredError(v, 'Please enter a message.'),
}

interface ContactFormProps {
  light?: boolean
  /** Preselected enquiry type, from /contact?enquiry= */
  enquiry?: EnquiryOption
  /** What the visitor clicked on (an event, an immersion), from /contact?topic= */
  topic?: string
}

export default function ContactForm({ light = false, enquiry, topic }: ContactFormProps) {
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const { errors, setError, setErrors } = useFieldErrors<Field>()

  const fieldProps = (field: Field) => ({
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setError(field, VALIDATORS[field](e.target.value)),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Phone: letters are stripped as typed.
      if (field === 'phone') e.target.value = sanitisePhone(e.target.value)
      if (errors[field]) setError(field, VALIDATORS[field](e.target.value))
    },
    'aria-invalid': !!errors[field],
    'aria-describedby': errors[field] ? `contact-${field}-error` : undefined,
  })

  const fieldMessage = (field: Field) =>
    errors[field] ? (
      <p id={`contact-${field}-error`} className={`mt-1 text-xs ${light ? 'text-red-600' : 'text-red-400'}`}>
        {errors[field]}
      </p>
    ) : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fieldErrors = Object.fromEntries(
      (Object.keys(VALIDATORS) as Field[]).map((field) => [
        field,
        VALIDATORS[field]((form.elements.namedItem(field) as HTMLInputElement).value),
      ]),
    ) as Record<Field, string | undefined>
    if (hasErrors(fieldErrors)) {
      setErrors(fieldErrors)
      return
    }

    setFormState('submitting')
    setErrorMessage('')

    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value.trim(),
      enquiry: (form.elements.namedItem('enquiry') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim(),
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setFormState('success')
      } else {
        const json = (await res.json()) as { error?: string }
        setErrorMessage(json.error ?? 'Something went wrong. Please try again.')
        setFormState('error')
      }
    } catch {
      setErrorMessage('Unable to send message. Please check your connection and try again.')
      setFormState('error')
    }
  }

  if (formState === 'success') {
    return (
      <div className="py-8 text-center">
        <p className="text-brand-accent text-lg font-medium mb-2">Message sent!</p>
        <p className={`text-sm ${light ? 'text-brand-muted' : 'text-white/70'}`}>
          Thank you. Suzanne&rsquo;s team will be in touch within 2 business days.
        </p>
      </div>
    )
  }

  const isSubmitting = formState === 'submitting'

  const labelClass = `block text-xs mb-1 uppercase tracking-wider ${light ? 'text-brand-muted' : 'text-white/60'}`
  const inputClass = `w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors disabled:opacity-50 ${
    light
      ? 'bg-white border-brand-primary-300 text-brand-ink placeholder-brand-primary-400 focus:border-brand-accent'
      : 'bg-brand-primary-800 border-brand-primary-600 text-white placeholder-white/30 focus:border-white'
  }`

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          disabled={isSubmitting}
          autoComplete="name"
          {...fieldProps('name')}
          className={inputClass}
          placeholder="Your full name"
        />
        {fieldMessage('name')}
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          disabled={isSubmitting}
          autoComplete="email"
          {...fieldProps('email')}
          className={inputClass}
          placeholder="you@example.com"
        />
        {fieldMessage('email')}
      </div>

      <div>
        <label htmlFor="contact-phone" className={labelClass}>
          Phone <span className={light ? 'text-brand-muted' : 'text-white/40'}>(optional)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          disabled={isSubmitting}
          autoComplete="tel"
          inputMode="tel"
          pattern={PHONE_PATTERN}
          {...fieldProps('phone')}
          className={inputClass}
          placeholder="+27 000 000 0000"
        />
        {fieldMessage('phone')}
      </div>

      <div>
        <label htmlFor="contact-enquiry" className={labelClass}>
          What are you looking for?
        </label>
        <select
          id="contact-enquiry"
          name="enquiry"
          defaultValue={enquiry ?? ''}
          disabled={isSubmitting}
          className={`${inputClass} appearance-none`}
        >
          <option value="">Select an option</option>
          {ENQUIRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          defaultValue={topic ? `Regarding: ${topic}\n\n` : undefined}
          disabled={isSubmitting}
          {...fieldProps('message')}
          className={`${inputClass} resize-none`}
          placeholder="Tell Suzanne a little about what you're looking for..."
        />
        {fieldMessage('message')}
      </div>

      {formState === 'error' && (
        <p role="alert" className={`text-sm ${light ? 'text-red-600' : 'text-red-400'}`}>
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand-accent hover:bg-brand-accent-700 disabled:opacity-60 text-white font-medium py-4 rounded-button transition-all duration-300 text-sm uppercase tracking-wider"
      >
        {isSubmitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
