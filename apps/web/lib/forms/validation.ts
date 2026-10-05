import { useCallback, useState } from 'react'

/**
 * Shared client-side field validation for the site's forms (site check M5).
 *
 * The forms used to show messages only after submit. Each form now runs these
 * checks when a field loses focus, re-checks a field that is already showing an
 * error as the visitor types, and runs them all on submit. The API routes keep
 * their own server-side validation; this is only for the visitor.
 */

// Same shape the contact API and checkout already accept.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Characters a phone number may contain: digits, spaces, + ( ) and -. */
const PHONE_DISALLOWED = /[^\d\s+()-]/

/**
 * `pattern` for phone inputs, so the browser and assistive tech agree on what
 * is allowed. Every syntax character is escaped, because browsers compile
 * `pattern` with the `v` flag, which rejects an unescaped ( ) or - in a class.
 */
export const PHONE_PATTERN = '[\\d\\s+\\(\\)\\-]*'

export function requiredError(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message
}

export function emailError(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return 'Please enter your email address.'
  if (!EMAIL_RE.test(trimmed)) return 'Please enter a valid email address.'
  return undefined
}

/** Strips letters and other characters a phone number cannot contain. */
export function sanitisePhone(value: string): string {
  return value.replace(new RegExp(PHONE_DISALLOWED, 'g'), '')
}

/** Phone fields are optional everywhere; an entered number needs 7+ digits. */
export function phoneError(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (PHONE_DISALLOWED.test(trimmed)) {
    return 'Please use digits only, with + ( ) or - if needed.'
  }
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 7 ? undefined : 'Please enter a valid phone number.'
}

/** True when an error map holds at least one message. */
export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean)
}

/**
 * Per-field error state. `setError` only re-renders when the message changes,
 * so it is cheap to call on every blur and keystroke.
 */
export function useFieldErrors<K extends string>() {
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({})
  const setError = useCallback((field: K, message: string | undefined) => {
    setErrors((prev) => (prev[field] === message ? prev : { ...prev, [field]: message }))
  }, [])
  return { errors, setError, setErrors }
}
