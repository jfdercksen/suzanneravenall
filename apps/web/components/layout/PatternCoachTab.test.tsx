import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PatternCoachTab from './PatternCoachTab'

// Mock framer-motion — replace motion.aside with a native <aside> and AnimatePresence as a fragment
vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: React.ComponentProps<'aside'>) => (
      <aside {...props}>{children}</aside>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock next/link as a passthrough <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const STORAGE_KEY = 'pattern-coach-tab-dismissed'
const PRODUCT_PAGE_PATH = '/pattern-coach'
const CONSENT_STORAGE_KEY = 'cookie_consent'
const CONSENT_CHOSEN_EVENT = 'sr:cookie-consent-chosen'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

beforeEach(() => {
  // jsdom does not implement matchMedia — provide a stub that returns matches: false
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  })

  // Reset to a desktop-width viewport (defineProperty persists across tests in this file)
  setViewportWidth(1024)

  // Start each test with a clean localStorage
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('PatternCoachTab', () => {
  it('does not render when localStorage has pattern-coach-tab-dismissed=true', async () => {
    localStorage.setItem(STORAGE_KEY, 'true')

    await act(async () => {
      render(<PatternCoachTab />)
    })

    // After mount the component should remain hidden — no complementary landmark rendered
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('renders when localStorage is empty', async () => {
    // localStorage.clear() in beforeEach ensures no value is stored

    await act(async () => {
      render(<PatternCoachTab />)
    })

    await waitFor(() => {
      const asides = screen.getAllByRole('complementary', { name: 'Pattern Coach App' })
      expect(asides.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('X button sets localStorage dismissed key and removes the tab from DOM', async () => {
    const user = userEvent.setup()

    await act(async () => {
      render(<PatternCoachTab />)
    })

    // Wait until the dismiss buttons are visible (one per layout variant)
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: 'Dismiss Pattern Coach tab' })
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })

    const buttons = screen.getAllByRole('button', { name: 'Dismiss Pattern Coach tab' })
    const firstButton = buttons[0]
    if (!firstButton) throw new Error('Expected at least one dismiss button')
    await user.click(firstButton)

    // localStorage must record the dismissal
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')

    // The tab must be removed from the DOM
    await waitFor(() => {
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })
  })

  it('main link points to the internal /pattern-coach product page in the same tab', async () => {
    await act(async () => {
      render(<PatternCoachTab />)
    })

    await waitFor(() => {
      // There are two link elements (desktop + mobile), both must point to the internal product page
      const links = screen.getAllByRole('link', { name: /Discover Pattern Coach/i })
      expect(links.length).toBeGreaterThanOrEqual(1)
      for (const link of links) {
        expect(link).toHaveAttribute('href', PRODUCT_PAGE_PATH)
        // Must open in the same tab — no external new-tab bypass of the trial flow
        expect(link).not.toHaveAttribute('target')
      }
    })
  })

  it('complementary landmark has aria-label "Pattern Coach App"', async () => {
    await act(async () => {
      render(<PatternCoachTab />)
    })

    await waitFor(() => {
      const asides = screen.getAllByRole('complementary', { name: 'Pattern Coach App' })
      expect(asides.length).toBeGreaterThanOrEqual(1)
      for (const aside of asides) {
        expect(aside).toHaveAttribute('aria-label', 'Pattern Coach App')
      }
    })
  })

  // KI027 — on mobile the pill must never stack on top of the cookie consent banner
  describe('mobile / cookie-consent coordination (KI027)', () => {
    it('does NOT render the mobile pill while cookie consent is unanswered', async () => {
      setViewportWidth(375)

      await act(async () => {
        render(<PatternCoachTab />)
      })

      // No consent stored → banner would be showing → pill must stay hidden
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })

    it('renders the mobile pill when cookie consent was already chosen on a previous visit', async () => {
      setViewportWidth(375)
      localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')

      await act(async () => {
        render(<PatternCoachTab />)
      })

      await waitFor(() => {
        expect(
          screen.getByRole('complementary', { name: 'Pattern Coach App' })
        ).toBeInTheDocument()
      })
    })

    it('shows the mobile pill after the consent-chosen event fires (accept OR reject)', async () => {
      setViewportWidth(375)

      await act(async () => {
        render(<PatternCoachTab />)
      })

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()

      // Simulate the user answering the banner (CookieConsent stores the choice then fires the event)
      await act(async () => {
        localStorage.setItem(CONSENT_STORAGE_KEY, 'rejected')
        window.dispatchEvent(new Event(CONSENT_CHOSEN_EVENT))
      })

      await waitFor(() => {
        expect(
          screen.getByRole('complementary', { name: 'Pattern Coach App' })
        ).toBeInTheDocument()
      })
    })
  })
})