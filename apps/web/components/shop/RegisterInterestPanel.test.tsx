import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { getProgramBySlug } from '@/data/programs'
import { RegisterInterestPanel } from './RegisterInterestPanel'

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

const NO_DATE = /\b(19|20)\d{2}\b|\bsoon\b|\bnext (week|month)\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i

describe('RegisterInterestPanel (Suzanne 12 Nov)', () => {
  it('offers register interest for one programme, with no date and nothing to buy', () => {
    render(<RegisterInterestPanel programmes={[getProgramBySlug('meditation')!]} />)
    const panel = screen.getByTestId('register-interest-panel')
    const button = within(panel).getByRole('link', { name: 'Register Your Interest' })
    const url = new URL(button.getAttribute('href')!, 'https://example.com')
    expect(url.pathname).toBe('/contact')
    expect(url.searchParams.get('topic')).toBe('The Inner Sanctuary (live via Zoom)')
    expect(within(panel).getByRole('link', { name: 'About the programme' })).toHaveAttribute('href', '/programs/meditation')
    expect(panel.textContent).toMatch(/No dates are set yet/)
    expect(panel.textContent).not.toMatch(NO_DATE)
    expect(within(panel).queryByRole('button')).toBeNull()
    expect(panel.textContent).not.toContain('\u2014')
  })

  it('gives each programme on a shared product its own button (Intuition: Personal and Business)', () => {
    render(
      <RegisterInterestPanel
        programmes={[getProgramBySlug('intuition-in-my-personal-capacity')!, getProgramBySlug('intuition-in-business')!]}
      />,
    )
    const panel = screen.getByTestId('register-interest-panel')
    const topics = within(panel)
      .getAllByRole('link', { name: /^Register Your Interest:/ })
      .map((a) => new URL(a.getAttribute('href')!, 'https://example.com').searchParams.get('topic'))
    expect(topics).toEqual(['Intuition in My Personal Capacity (live via Zoom)', 'Intuition in Business (live via Zoom)'])
    expect(panel.textContent).not.toMatch(NO_DATE)
  })
})
