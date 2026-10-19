import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const getSession = vi.fn()
const updateUser = vi.fn()

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getSession, updateUser } }),
}))

import ResetPasswordPage from './page'

describe('ResetPasswordPage (KI073)', () => {
  beforeEach(() => {
    getSession.mockReset()
    updateUser.mockReset()
  })

  it('offers a new link when there is no recovery session', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    render(<ResetPasswordPage />)

    expect(await screen.findByText('This link has expired')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request a New Link' })).toHaveAttribute('href', '/portal/forgot-password')
    expect(screen.queryByLabelText(/New password/)).not.toBeInTheDocument()
  })

  it('says the password is updated after a successful reset', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    updateUser.mockResolvedValue({ error: null })
    render(<ResetPasswordPage />)

    fireEvent.change(await screen.findByLabelText(/New password/), { target: { value: 'a-long-password' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'a-long-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    expect(await screen.findByText('Password updated')).toBeInTheDocument()
    expect(updateUser).toHaveBeenCalledWith({ password: 'a-long-password' })
    expect(screen.getByRole('link', { name: 'Go to Your Dashboard' })).toHaveAttribute('href', '/portal/dashboard')
  })

  it('keeps the form and shows the error when the update fails', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    updateUser.mockResolvedValue({ error: { message: 'Password is too weak' } })
    render(<ResetPasswordPage />)

    fireEvent.change(await screen.findByLabelText(/New password/), { target: { value: 'a-long-password' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'a-long-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    expect(await screen.findByText('Password is too weak')).toBeInTheDocument()
    expect(screen.queryByText('Password updated')).not.toBeInTheDocument()
  })
})
