import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  PHONE_PATTERN,
  emailError,
  hasErrors,
  phoneError,
  requiredError,
  sanitisePhone,
  useFieldErrors,
} from './validation'

describe('form validation helpers (site check M5)', () => {
  it('requires a value', () => {
    expect(requiredError('  ', 'Please enter your first name.')).toBe('Please enter your first name.')
    expect(requiredError('Ann', 'Please enter your first name.')).toBeUndefined()
  })

  it('distinguishes a missing email from a malformed one', () => {
    expect(emailError('')).toBe('Please enter your email address.')
    expect(emailError('ann@')).toBe('Please enter a valid email address.')
    expect(emailError(' ann@example.com ')).toBeUndefined()
  })

  it('strips letters from a phone number but keeps + ( ) - and spaces', () => {
    expect(sanitisePhone('+27 (82) abc 555-1234x')).toBe('+27 (82)  555-1234')
  })

  it('treats phone as optional and needs at least 7 digits when entered', () => {
    expect(phoneError('')).toBeUndefined()
    expect(phoneError('123')).toBe('Please enter a valid phone number.')
    expect(phoneError('082 555 1234')).toBeUndefined()
    expect(phoneError('082 555 abcd')).toMatch(/digits only/)
  })

  it('has a phone pattern that compiles under the v flag browsers use', () => {
    const re = new RegExp(`^(?:${PHONE_PATTERN})$`, 'v')
    expect(re.test('+27 (82) 555-1234')).toBe(true)
    expect(re.test('082abc')).toBe(false)
  })

  it('reports whether an error map holds any message', () => {
    expect(hasErrors({ email: undefined })).toBe(false)
    expect(hasErrors({ email: 'x' })).toBe(true)
  })

  it('keeps per-field errors and skips no-op updates', () => {
    const { result } = renderHook(() => useFieldErrors<'email' | 'name'>())
    act(() => result.current.setError('email', 'bad'))
    expect(result.current.errors).toEqual({ email: 'bad' })
    const before = result.current.errors
    act(() => result.current.setError('email', 'bad'))
    expect(result.current.errors).toBe(before)
    act(() => result.current.setError('email', undefined))
    expect(result.current.errors.email).toBeUndefined()
  })
})
