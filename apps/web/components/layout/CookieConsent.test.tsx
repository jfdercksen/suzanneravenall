import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CookieConsent, {
  CONSENT_STORAGE_KEY,
  CONSENT_CHOSEN_EVENT,
  CONSENT_OPEN_EVENT,
  CONSENT_BANNER_HEIGHT_VAR,
  openCookieSettings,
} from './CookieConsent'
import CookieSettingsButton from './CookieSettingsButton'

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

  // Site check B8: the banner must not cover the "Book a Discovery Call" button in the mobile menu
  it('steps aside while the mobile menu is open and returns when it closes', async () => {
    await act(async () => {
      render(<CookieConsent />)
    })
    await screen.findByRole('dialog', { name: 'Cookie consent' })

    await act(async () => {
      window.dispatchEvent(new CustomEvent('pattern-hub:mobile-nav-toggle', { detail: { open: true } }))
    })
    expect(screen.queryByRole('dialog', { name: 'Cookie consent' })).not.toBeInTheDocument()

    await act(async () => {
      window.dispatchEvent(new CustomEvent('pattern-hub:mobile-nav-toggle', { detail: { open: false } }))
    })
    expect(screen.getByRole('dialog', { name: 'Cookie consent' })).toBeInTheDocument()
  })

  // Site check V6: the banner must not hide the end of the page before a choice is made
  it('reserves its height at the bottom of the page while it shows and releases it after a choice', async () => {
    const user = userEvent.setup()
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ height: 64 } as DOMRect)

    try {
      await act(async () => {
        render(<CookieConsent />)
      })
      await screen.findByRole('dialog', { name: 'Cookie consent' })

      expect(document.body.style.paddingBottom).toBe('64px')
      expect(document.documentElement.style.getPropertyValue(CONSENT_BANNER_HEIGHT_VAR)).toBe('64px')

      await user.click(screen.getByRole('button', { name: 'Accept' }))

      expect(document.body.style.paddingBottom).toBe('')
      expect(document.documentElement.style.getPropertyValue(CONSENT_BANNER_HEIGHT_VAR)).toBe('')
    } finally {
      rectSpy.mockRestore()
    }
  })

  // Site check M10: consent can be changed after it was given
  it('reopens after a stored choice when Cookie settings is used', async () => {
    const user = userEvent.setup()
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')

    await act(async () => {
      render(
        <>
          <CookieConsent />
          <CookieSettingsButton />
        </>
      )
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cookie settings' }))
    expect(screen.getByRole('dialog', { name: 'Cookie consent' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reject' }))
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('rejected')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('openCookieSettings fires the open event other code can listen for', () => {
    const onOpen = vi.fn()
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    openCookieSettings()
    expect(onOpen).toHaveBeenCalledTimes(1)
    window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
  })
})
