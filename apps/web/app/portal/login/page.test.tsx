import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { signInWithOtp, signInWithPassword } = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
}))
let search = ''

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
}))
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOtp, signInWithPassword } }),
}))
vi.mock('@/lib/access/ensure-membership', () => ({ ensureMembership: vi.fn() }))

import LoginPage from './page'

beforeEach(() => {
  search = ''
  signInWithOtp.mockReset().mockResolvedValue({ error: null })
  signInWithPassword.mockReset()
})

describe('LoginPage (site check M5 / M6)', () => {
  it('carries ?redirect= on to the Sign up and Forgot password links', () => {
    search = `redirect=${encodeURIComponent('/portal/programmes?tab=a&b=1')}`
    render(<LoginPage />)
    const expected = `?redirect=${encodeURIComponent('/portal/programmes?tab=a&b=1')}`
    expect(screen.getByRole('link', { name: /Sign up/ })).toHaveAttribute('href', `/portal/signup${expected}`)
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
      'href',
      `/portal/forgot-password${expected}`,
    )
  })

  it('does not pass on an unsafe redirect', () => {
    search = 'redirect=//evil.example'
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /Sign up/ })).toHaveAttribute('href', '/portal/signup')
  })

  it('URL-encodes the magic-link next value', async () => {
    search = `redirect=${encodeURIComponent('/portal/programmes?tab=a&b=1')}`
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: 'Magic Link' }))
    expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email address'), 'ann@example.com')
    await user.click(screen.getByRole('button', { name: 'Send Sign-In Link' }))
    const call = signInWithOtp.mock.calls[0]?.[0] as { options: { emailRedirectTo: string } }
    const redirectTo = call.options.emailRedirectTo
    expect(new URL(redirectTo).searchParams.get('next')).toBe('/portal/programmes?tab=a&b=1')
  })

  it('shows field messages on blur and sends nothing while invalid', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('Email address'), 'ann@')
    await user.tab()
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Log In' }))
    expect(screen.getByText('Please enter your password.')).toBeInTheDocument()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })
})
