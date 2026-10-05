import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import CalInlineBooking, {
  CAL_BOOKING_PAGE_URL,
  CAL_INLINE_NAMESPACE,
  CAL_INLINE_TIMEOUT_MS,
  CAL_INLINE_MIN_HEIGHT,
} from './CalInlineBooking'

type Handler = () => void
const handlers: Record<string, Handler[]> = {}
const calFn = vi.fn((method: string, arg: { action: string; callback: Handler }) => {
  if (method === 'on') (handlers[arg.action] ??= []).push(arg.callback)
})
const inlineProps = vi.fn()

vi.mock('@calcom/embed-react', () => ({
  default: (props: Record<string, unknown>) => {
    inlineProps(props)
    return <div data-testid="cal-inline" />
  },
  getCalApi: vi.fn(() => Promise.resolve(calFn)),
}))

function fire(action: string) {
  act(() => {
    handlers[action]?.forEach((cb) => cb())
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  for (const key of Object.keys(handlers)) delete handlers[key]
})

async function renderBooking() {
  await act(async () => {
    render(<CalInlineBooking />)
  })
}

describe('CalInlineBooking', () => {
  it('renders the inline embed in its own namespace', async () => {
    await renderBooking()
    expect(screen.getByTestId('cal-inline')).toBeInTheDocument()
    expect(inlineProps).toHaveBeenCalledWith(expect.objectContaining({ namespace: CAL_INLINE_NAMESPACE }))
    expect(CAL_INLINE_NAMESPACE).not.toBe('')
    expect(screen.queryByRole('link', { name: 'Open the booking page' })).not.toBeInTheDocument()
  })

  // Site check V10: a fixed-height box around the auto-sized iframe made a scroll inside a scroll
  it('lets the calendar grow to its own height instead of scrolling inside a fixed box', async () => {
    await renderBooking()
    const style = inlineProps.mock.calls[0]?.[0].style as Record<string, string>
    expect(style.height).toBeUndefined()
    expect(style.overflow).toBeUndefined()
    expect(style.minHeight).toBe(CAL_INLINE_MIN_HEIGHT)
  })

  it('shows a fallback with a direct booking link when the embed never loads', async () => {
    await renderBooking()
    await act(async () => {
      vi.advanceTimersByTime(CAL_INLINE_TIMEOUT_MS + 100)
    })
    expect(screen.getByRole('link', { name: 'Open the booking page' })).toHaveAttribute('href', CAL_BOOKING_PAGE_URL)
    expect(CAL_BOOKING_PAGE_URL).toMatch(/\/suzanneravenall\/discovery-call$/)
    expect(screen.getByRole('link', { name: 'send us a message' })).toHaveAttribute('href', '#message')
    expect(screen.getByTestId('cal-inline-container')).toHaveStyle({ height: '0px' })
  })

  it('shows the fallback straight away when Cal reports the link failed', async () => {
    await renderBooking()
    fire('linkFailed')
    expect(screen.getByRole('link', { name: 'Open the booking page' })).toBeInTheDocument()
  })

  it('keeps the embed and no fallback once Cal reports the calendar is ready', async () => {
    await renderBooking()
    fire('linkReady')
    await act(async () => {
      vi.advanceTimersByTime(CAL_INLINE_TIMEOUT_MS + 100)
    })
    expect(screen.queryByRole('link', { name: 'Open the booking page' })).not.toBeInTheDocument()
    expect(screen.getByTestId('cal-inline-container')).not.toHaveStyle({ height: '0px' })
  })

  it('hides the fallback again if a slow embed finishes loading after the timeout', async () => {
    await renderBooking()
    await act(async () => {
      vi.advanceTimersByTime(CAL_INLINE_TIMEOUT_MS + 100)
    })
    expect(screen.getByRole('link', { name: 'Open the booking page' })).toBeInTheDocument()
    fire('linkReady')
    expect(screen.queryByRole('link', { name: 'Open the booking page' })).not.toBeInTheDocument()
  })
})
