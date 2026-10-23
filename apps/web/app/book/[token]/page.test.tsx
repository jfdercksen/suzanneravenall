import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const h = vi.hoisted(() => ({
  decideGate: vi.fn(),
  touch: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  }),
}))
vi.mock('@/lib/booking/limits', () => ({ decideGate: h.decideGate }))
vi.mock('@/lib/booking/tokens', () => ({ touchBookingToken: h.touch }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: h.redirect }))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div> },
}))

import BookPage from './page'

const TOKEN = 'a'.repeat(43)
const params = Promise.resolve({ token: TOKEN })

beforeEach(() => vi.clearAllMocks())

describe('/book/<token>', () => {
  it('sends the client on to Cal.com while sessions are left', async () => {
    h.decideGate.mockResolvedValue({ kind: 'open', url: 'http://cal/x/session-60?metadata%5Bbt%5D=t', remaining: 2, total: 4, tokenId: 'tok_1' })
    await expect(BookPage({ params })).rejects.toThrow('NEXT_REDIRECT http://cal/x/session-60')
    expect(h.touch).toHaveBeenCalledWith('tok_1')
  })

  it('refuses at zero and links to the appointments page', async () => {
    h.decideGate.mockResolvedValue({ kind: 'full', total: 4 })
    render(await BookPage({ params }))
    expect(screen.getByRole('heading', { name: 'All sessions in this package are booked' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'View my appointments' }).getAttribute('href')).toBe('/portal/appointments')
    expect(screen.getByRole('link', { name: 'Buy more sessions' }).getAttribute('href')).toBe('/services')
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('says an unknown link is not valid', async () => {
    h.decideGate.mockResolvedValue({ kind: 'invalid' })
    render(await BookPage({ params }))
    expect(screen.getByRole('heading', { name: 'This booking link is not valid' })).toBeTruthy()
  })

  it('says booking is unavailable when the check fails, without redirecting', async () => {
    h.decideGate.mockRejectedValue(new Error('db down'))
    render(await BookPage({ params }))
    expect(screen.getByRole('heading', { name: 'Booking is not available right now' })).toBeTruthy()
    expect(h.redirect).not.toHaveBeenCalled()
  })
})
