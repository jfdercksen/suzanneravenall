import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AppointmentView } from '@/lib/portal/appointments'
import { AppointmentCard } from './AppointmentCard'

const BASE: AppointmentView = {
  uid: 'bk_1',
  service: 'Resonance Repatterning / Coaching Session',
  dateLabel: 'Tue, 20 October 2026',
  timeLabel: '10:00 - 11:00 SAST',
  durationLabel: '60 min',
  status: 'booked',
  rescheduleUrl: null,
  cancelUrl: null,
  joinUrl: null,
  outcome: null,
  creditRestored: false,
}

describe('AppointmentCard: session rules (D024)', () => {
  it('shows a no-show and that the session counts as used', () => {
    render(<AppointmentCard appointment={{ ...BASE, outcome: 'no_show' }} past />)
    expect(screen.getByText('No-show')).toBeInTheDocument()
    expect(screen.getByTestId('appointment-outcome')).toHaveTextContent('missed, so it counts as used')
  })

  it('shows a late cancellation and a late move', () => {
    const { unmount } = render(<AppointmentCard appointment={{ ...BASE, status: 'cancelled', outcome: 'late_cancel' }} past />)
    expect(screen.getByText('Late cancellation')).toBeInTheDocument()
    expect(screen.getByTestId('appointment-outcome')).toHaveTextContent('less than 48 working hours notice')
    unmount()
    render(<AppointmentCard appointment={{ ...BASE, outcome: 'late_move' }} past />)
    expect(screen.getByText('Moved at short notice')).toBeInTheDocument()
  })

  it('says when staff gave the session back', () => {
    render(<AppointmentCard appointment={{ ...BASE, status: 'cancelled', outcome: 'late_cancel', creditRestored: true }} past />)
    expect(screen.getByTestId('appointment-outcome')).toHaveTextContent('given back to your package')
  })

  it('an ordinary past booking still reads Completed, with no note', () => {
    render(<AppointmentCard appointment={BASE} past />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByTestId('appointment-outcome')).not.toBeInTheDocument()
  })
})
