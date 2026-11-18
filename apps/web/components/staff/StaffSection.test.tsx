import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaffSection } from './StaffSection'

describe('StaffSection', () => {
  const reload = vi.fn()
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, reload, pathname: '/staff/submissions/quiz' } })
    sessionStorage.clear()
    reload.mockClear()
  })
  afterEach(() => {
    delete (window as unknown as { clarity?: unknown }).clarity
  })

  it('renders its children and leaves the page alone without Clarity', () => {
    render(<StaffSection><p>Answers</p></StaffSection>)
    expect(screen.getByText('Answers')).toBeInTheDocument()
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads once when Clarity is already running, so it never records the answers', () => {
    ;(window as unknown as { clarity: () => void }).clarity = () => {}
    const first = render(<StaffSection><p>Answers</p></StaffSection>)
    expect(reload).toHaveBeenCalledTimes(1)
    first.unmount()
    render(<StaffSection><p>Answers</p></StaffSection>)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
