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

const STORAGE_KEY = 'pattern-coach-tab-dismissed'
const EXTERNAL_URL = 'https://suzanneravenallpatterncoach.com'

beforeEach(() => {
  // jsdom does not implement matchMedia — provide a stub that returns matches: false
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  })

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
    await user.click(buttons[0])

    // localStorage must record the dismissal
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')

    // The tab must be removed from the DOM
    await waitFor(() => {
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })
  })

  it('main anchor has correct href to suzanneravenallpatterncoach.com', async () => {
    await act(async () => {
      render(<PatternCoachTab />)
    })

    await waitFor(() => {
      // There are two anchor elements (desktop + mobile), both must point to the external URL
      const links = screen.getAllByRole('link', { name: /Open Pattern Coach/i })
      expect(links.length).toBeGreaterThanOrEqual(1)
      for (const link of links) {
        expect(link).toHaveAttribute('href', EXTERNAL_URL)
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
})