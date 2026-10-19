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
