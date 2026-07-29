'use client'

import { useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const ENQUIRY_OPTIONS = [
  '1-on-1 Coaching',
  'Group Program',
  'Speaking Enquiry',
  'Practitioner Program',
  'Other',
] as const

export default function ContactForm({ light = false }: { light?: boolean }) {
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('submitting')
    setErrorMessage('')

    const form = e.currentTarget
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
        <p className="text-brand-accent text-lg font-semibold mb-2">Message sent!</p>
        <p className={`text-sm ${light ? 'text-gray-500' : 'text-white/70'}`}>
          Thank you — Suzanne&rsquo;s team will be in touch within 2 business days.
        </p>
      </div>
    )
  }

  const isSubmitting = formState === 'submitting'

  const labelClass = `block text-xs mb-1 uppercase tracking-wider ${light ? 'text-gray-500' : 'text-white/60'}`
  const inputClass = `w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors disabled:opacity-50 ${
    light
      ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-accent'
      : 'bg-gray-800 border-gray-700 text-white placeholder-white/30 focus:border-brand-accent'
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
          className={inputClass}
          placeholder="Your full name"
        />
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
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className={labelClass}>
          Phone <span className={light ? 'text-gray-600' : 'text-white/40'}>(optional)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          disabled={isSubmitting}
          autoComplete="tel"
          className={inputClass}
          placeholder="+27 000 000 0000"
        />
      </div>

      <div>
        <label htmlFor="contact-enquiry" className={labelClass}>
          What are you looking for?
        </label>
        <select
          id="contact-enquiry"
          name="enquiry"
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
          disabled={isSubmitting}
          className={`${inputClass} resize-none`}
          placeholder="Tell Suzanne a little about what you're looking for..."
        />
      </div>

      {formState === 'error' && (
        <p role="alert" className="text-red-500 text-sm">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand-accent hover:bg-brand-accent-700 disabled:opacity-60 text-white font-semibold py-4 rounded-button transition-all duration-300 text-sm uppercase tracking-wider"
      >
        {isSubmitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
