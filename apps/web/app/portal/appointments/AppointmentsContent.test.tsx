import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('framer-motion', () => {
  const strip = (tag: string) =>
    function MotionStub({
      children,
      initial,
      animate,
      transition,
      whileInView,
      viewport,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      return React.createElement(tag, props, children)
    }
  return { motion: { div: strip('div'), section: strip('section') } }
})
import AppointmentsContent from './AppointmentsContent'
import type { MemberAppointments } from '@/lib/portal/load-appointments'

const EMPTY: MemberAppointments = {
  upcoming: [],
  past: [],
  toBook: [],
  ordersUnavailable: false,
  bookingsUnavailable: false,
}

const FULL: MemberAppointments = {
  ...EMPTY,
  upcoming: [
    {
      uid: 'bk_next',
      service: 'Resonance Repatterning / Coaching Session',
      dateLabel: 'Tue, 3 November 2026',
      timeLabel: '10:00 - 11:00 SAST',
      durationLabel: '60 min',
      status: 'booked',
      rescheduleUrl: 'http://cal.test/reschedule/bk_next',
      cancelUrl: 'http://cal.test/booking/bk_next?cancel=true',
      joinUrl: null,
      outcome: null,
      creditRestored: false,
    },
  ],
  past: [
    {
      uid: 'bk_old',
      service: 'Resonance Repatterning / Coaching Session',
      dateLabel: 'Thu, 1 October 2026',
      timeLabel: '10:00 - 11:00 SAST',
      durationLabel: '60 min',
      status: 'cancelled',
      rescheduleUrl: null,
      cancelUrl: null,
      joinUrl: null,
      outcome: null,
      creditRestored: false,
    },
  ],
  toBook: [
    {
      key: 'rr-60',
      service: 'Resonance Repatterning / Coaching Session',
      durationLabel: '60 min',
      remaining: 3,
      total: 4,
      bookUrl: 'http://cal.test/suzanneravenall/session-60?name=Johan+QA+Test',
    },
  ],
}

function section(name: RegExp) {
  return screen.getByRole('region', { name })
}

describe('AppointmentsContent', () => {
  it('renders the three sections with the booking, the remaining sessions and the past list', () => {
    render(<AppointmentsContent {...FULL} />)
    expect(screen.getByRole('heading', { level: 1, name: 'My Appointments' })).toBeInTheDocument()

    const upcoming = section(/Upcoming/)
    expect(within(upcoming).getByText('Tue, 3 November 2026')).toBeInTheDocument()
    expect(within(upcoming).getByText(/10:00 - 11:00 SAST/)).toBeInTheDocument()
    expect(within(upcoming).getByRole('link', { name: 'Reschedule' })).toHaveAttribute('href', 'http://cal.test/reschedule/bk_next')
    expect(within(upcoming).getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', 'http://cal.test/booking/bk_next?cancel=true')

    const toBook = section(/Sessions still to book/)
    expect(within(toBook).getByText(/of 4 left to book/)).toBeInTheDocument()
    expect(within(toBook).getByText('3')).toBeInTheDocument()
    expect(within(toBook).getByRole('link', { name: 'Book Now' })).toHaveAttribute(
      'href',
      'http://cal.test/suzanneravenall/session-60?name=Johan+QA+Test',
    )

    const past = section(/Past/)
    expect(within(past).getByText('Cancelled')).toBeInTheDocument()
    expect(within(past).queryByRole('link')).toBeNull()
  })

  it('shows empty states for a member with nothing', () => {
    render(<AppointmentsContent {...EMPTY} />)
    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument()
    expect(screen.getByText('No sessions to book')).toBeInTheDocument()
    expect(screen.getByText('No past appointments yet.')).toBeInTheDocument()
  })

  it('says so when the purchases could not be loaded, rather than showing nothing to book', () => {
    render(<AppointmentsContent {...EMPTY} ordersUnavailable />)
    expect(screen.getByText(/could not be loaded just now/)).toBeInTheDocument()
    expect(screen.queryByText('No sessions to book')).toBeNull()
  })
})
