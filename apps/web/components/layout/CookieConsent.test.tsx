import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CookieConsent, { CONSENT_STORAGE_KEY, CONSENT_CHOSEN_EVENT } from './CookieConsent'

// Mock next/link as a passthrough <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('CookieConsent', () => {
  it('renders the consent dialog on first visit (no stored choice)', async () => {
    await act(async () => {
      render(<CookieConsent />)
    })

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Cookie consent' })).toBeInTheDocument()
    })
  })

  it('does not render when a choice is already stored', async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')

    await act(async () => {
      render(<CookieConsent />)
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Accept stores the choice, hides the banner and fires the consent-chosen event (KI027)', async () => {
    const user = userEvent.setup()
    const onChosen = vi.fn()
    window.addEventListener(CONSENT_CHOSEN_EVENT, onChosen)

    await act(async () => {
      render(<CookieConsent />)
    })

    await user.click(await screen.findByRole('button', { name: 'Accept' }))

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('accepted')
    expect(onChosen).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    window.removeEventListener(CONSENT_CHOSEN_EVENT, onChosen)
  })

  it('Reject stores the choice, hides the banner and fires the consent-chosen event (KI027)', async () => {
    const user = userEvent.setup()
    const onChosen = vi.fn()
    window.addEventListener(CONSENT_CHOSEN_EVENT, onChosen)

    await act(async () => {
      render(<CookieConsent />)
    })

    await user.click(await screen.findByRole('button', { name: 'Reject' }))

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('rejected')
    expect(onChosen).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    window.removeEventListener(CONSENT_CHOSEN_EVENT, onChosen)
  })

  it('sits above the Pattern Coach pill in the stacking order (z-[70] > z-[60]) and reserves iOS safe-area space', async () => {
    await act(async () => {
      render(<CookieConsent />)
    })

    const dialog = await screen.findByRole('dialog', { name: 'Cookie consent' })
    expect(dialog.className).toContain('z-[70]')
    expect(dialog.className).toContain('env(safe-area-inset-bottom)')
  })
})
