import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PatternHubStickyBar, { DISMISS_STORAGE_KEY } from './PatternHubStickyBar'

const QUIZ_URL = '/explore/emotional-nervous-system-mastery/quiz'
const BAR_OFFSET = '2.5rem'

afterEach(() => {
  cleanup()
  // Reset any DOM mutations the component made so tests stay isolated
  document.documentElement.style.removeProperty('--pattern-bar-offset')
  document.body.style.paddingTop = ''
  window.localStorage.clear()
})

describe('PatternHubStickyBar', () => {
  it('renders the announcement text on mount', () => {
    render(<PatternHubStickyBar />)
    expect(screen.getByText('Not sure where to start?')).toBeInTheDocument()
  })

  it('renders a link to the master diagnostic quiz on mount', () => {
    render(<PatternHubStickyBar />)
    const link = screen.getByRole('link', { name: /Take the 60-second Master Pattern Quiz/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', QUIZ_URL)
  })

  it('renders a dismiss button with aria-label "Dismiss announcement bar"', () => {
    render(<PatternHubStickyBar />)
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss announcement bar' })
    expect(dismissBtn).toBeInTheDocument()
  })

  it('sets the --pattern-bar-offset CSS custom property and body padding-top on mount', () => {
    render(<PatternHubStickyBar />)
    expect(document.documentElement.style.getPropertyValue('--pattern-bar-offset')).toBe(BAR_OFFSET)
    expect(document.body.style.paddingTop).toBe(BAR_OFFSET)
  })

  it('removes the bar from the DOM when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    render(<PatternHubStickyBar />)

    expect(screen.getByText('Not sure where to start?')).toBeInTheDocument()

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss announcement bar' })
    await user.click(dismissBtn)

    expect(screen.queryByText('Not sure where to start?')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dismiss announcement bar' })).not.toBeInTheDocument()
  })

  it('removes the CSS custom property and resets body padding-top after dismissal', async () => {
    const user = userEvent.setup()
    render(<PatternHubStickyBar />)

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss announcement bar' })
    await user.click(dismissBtn)

    expect(document.documentElement.style.getPropertyValue('--pattern-bar-offset')).toBe('')
    expect(document.body.style.paddingTop).toBe('')
  })

  it('cleans up the CSS custom property and body padding-top on unmount', () => {
    const { unmount } = render(<PatternHubStickyBar />)

    expect(document.documentElement.style.getPropertyValue('--pattern-bar-offset')).toBe(BAR_OFFSET)
    expect(document.body.style.paddingTop).toBe(BAR_OFFSET)

    unmount()

    expect(document.documentElement.style.getPropertyValue('--pattern-bar-offset')).toBe('')
    expect(document.body.style.paddingTop).toBe('')
  })

  // Site check M9: dismissing is remembered on reload.
  it('remembers a dismissal so the bar stays hidden on the next visit', async () => {
    const user = userEvent.setup()
    const first = render(<PatternHubStickyBar />)
    await user.click(screen.getByRole('button', { name: 'Dismiss announcement bar' }))
    expect(window.localStorage.getItem(DISMISS_STORAGE_KEY)).toBe('1')
    first.unmount()

    render(<PatternHubStickyBar />)
    expect(screen.queryByText('Not sure where to start?')).not.toBeInTheDocument()
    expect(document.documentElement.style.getPropertyValue('--pattern-bar-offset')).toBe('')
    expect(document.body.style.paddingTop).toBe('')
  })

  it('still shows and dismisses the bar when storage is blocked', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const user = userEvent.setup()
    render(<PatternHubStickyBar />)
    expect(screen.getByText('Not sure where to start?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dismiss announcement bar' }))
    expect(screen.queryByText('Not sure where to start?')).not.toBeInTheDocument()
    getItem.mockRestore()
    setItem.mockRestore()
  })
})