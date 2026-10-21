import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const setCurrency = vi.fn(async (_c: string) => {})
let state: { currency: 'zar' | 'usd' | null; usdEnabled: boolean } = { currency: 'usd', usdEnabled: true }

vi.mock('@/lib/cart', () => ({
  useCart: () => ({ ...state, setCurrency }),
}))

import { CurrencySwitcher } from './CurrencySwitcher'

describe('CurrencySwitcher (D021)', () => {
  beforeEach(() => {
    setCurrency.mockReset()
    setCurrency.mockResolvedValue(undefined)
    state = { currency: 'usd', usdEnabled: true }
  })

  it('shows ZAR and USD with the current one pressed', () => {
    render(<CurrencySwitcher />)
    expect(screen.getByRole('group', { name: 'Currency' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /US dollar/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /rand/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches to ZAR on click', async () => {
    render(<CurrencySwitcher />)
    await userEvent.click(screen.getByRole('button', { name: /rand/ }))
    expect(setCurrency).toHaveBeenCalledWith('zar')
  })

  it('does nothing when the current currency is clicked', async () => {
    render(<CurrencySwitcher />)
    await userEvent.click(screen.getByRole('button', { name: /US dollar/ }))
    expect(setCurrency).not.toHaveBeenCalled()
  })

  it('shows the error when the switch fails', async () => {
    setCurrency.mockRejectedValue(new Error('Could not change the currency right now. Please try again.'))
    render(<CurrencySwitcher />)
    await userEvent.click(screen.getByRole('button', { name: /rand/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not change the currency')
  })

  it('is hidden while USD is switched off', () => {
    state = { currency: 'zar', usdEnabled: false }
    const { container } = render(<CurrencySwitcher />)
    expect(container).toBeEmptyDOMElement()
  })

  it('is hidden until the currency is known', () => {
    state = { currency: null, usdEnabled: true }
    const { container } = render(<CurrencySwitcher />)
    expect(container).toBeEmptyDOMElement()
  })
})
