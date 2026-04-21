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

export default function ContactForm() {
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
        <p className="text-white/70 text-sm">
          Thank you — Suzanne&rsquo;s team will be in touch within 2 business days.
        </p>
      </div>
    )
  }

  const isSubmitting = formState === 'submitting'

  return (
    // TODO: Wire to Resend in email setup task
    <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
      <div>
        <label htmlFor="contact-name" className="block text-xs text-white/60 mb-1 uppercase tracking-wider">
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          disabled={isSubmitting}
          autoComplete="name"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-xs text-white/60 mb-1 uppercase tracking-wider">
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          disabled={isSubmitting}
          autoComplete="email"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className="block text-xs text-white/60 mb-1 uppercase tracking-wider">
          Phone <span className="text-white/40">(optional)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          disabled={isSubmitting}
          autoComplete="tel"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50"
          placeholder="+27 000 000 0000"
        />
      </div>

      <div>
        <label htmlFor="contact-enquiry" className="block text-xs text-white/60 mb-1 uppercase tracking-wider">
          What are you looking for?
        </label>
        <select
          id="contact-enquiry"
          name="enquiry"
          disabled={isSubmitting}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50 appearance-none"
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
        <label htmlFor="contact-message" className="block text-xs text-white/60 mb-1 uppercase tracking-wider">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          disabled={isSubmitting}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50 resize-none"
          placeholder="Tell Suzanne a little about what you're looking for..."
        />
      </div>

      {formState === 'error' && (
        <p role="alert" className="text-red-400 text-sm">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all duration-300 text-sm uppercase tracking-wider"
      >
        {isSubmitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
