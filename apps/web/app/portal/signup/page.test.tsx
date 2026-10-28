import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signUp = vi.fn()
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { signUp } }) }))
vi.mock('@/lib/access/ensure-membership', () => ({ ensureMembership: vi.fn(async () => true) }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

import SignupPage from './page'

async function fillAndSubmit(phone: string) {
  const user = userEvent.setup()
  render(<SignupPage />)
  await user.type(screen.getByLabelText('Full name'), 'Ann van Wyk')
  await user.type(screen.getByLabelText('Email address'), 'ann@example.com')
  if (phone) await user.type(screen.getByLabelText(/Phone number/), phone)
  await user.type(screen.getByLabelText(/^Password/), 'longenough1')
  await user.type(screen.getByLabelText('Confirm password'), 'longenough1')
  await user.click(screen.getByRole('button', { name: 'Create Account' }))
}

describe('SignupPage phone number (KI077)', () => {
  beforeEach(() => {
    signUp.mockReset()
    signUp.mockResolvedValue({ data: { session: null, user: null }, error: null })
  })

  it('saves the phone number on the new account', async () => {
    await fillAndSubmit('+27 82 555 1234')
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ data: { full_name: 'Ann van Wyk', phone: '+27 82 555 1234' } }) })
    )
  })

  it('treats the phone number as optional', async () => {
    await fillAndSubmit('')
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ data: { full_name: 'Ann van Wyk', phone: null } }) })
    )
  })

  it('stops on a phone number that is too short', async () => {
    await fillAndSubmit('123')
    expect(signUp).not.toHaveBeenCalled()
    expect(screen.getByText('Please enter a valid phone number.')).toBeInTheDocument()
  })
})

describe('SignupPage when the address already has an account', () => {
  beforeEach(() => signUp.mockReset())

  it('says the account exists and links to log in and reset, instead of "check your email"', async () => {
    // GoTrue's answer for an existing address: a user with no identities, no session, no mail.
    signUp.mockResolvedValue({ data: { session: null, user: { id: 'u1', identities: [] } }, error: null })
    await fillAndSubmit('')
    expect(await screen.findByRole('heading', { name: 'You already have an account' })).toBeInTheDocument()
    expect(screen.getByText(/Your password has not changed/)).toBeInTheDocument()
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/portal/login?email=ann%40example.com')
    expect(screen.getByRole('link', { name: 'Reset my password' })).toHaveAttribute('href', '/portal/forgot-password')
  })

  it('a new address still gets "check your email"', async () => {
    signUp.mockResolvedValue({ data: { session: null, user: { id: 'u2', identities: [{ id: 'i1' }] } }, error: null })
    await fillAndSubmit('')
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
  })
})
