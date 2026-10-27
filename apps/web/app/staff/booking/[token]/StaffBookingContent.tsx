"use client"

import { motion } from 'framer-motion'

/** The staff page for a session lost to a late cancel or move (D024). */

export interface StaffBookingView {
  clientName: string | null
  clientEmail: string
  dateLabel: string
  timeLabel: string
  kind: 'cancelled' | 'rescheduled'
  /** When the client made the change, SAST */
  changedLabel: string | null
  restored: boolean
  /** Cal.com named a staff address as the one who made the change */
  byStaff: boolean
}

interface StaffBookingContentProps {
  state: 'found' | 'invalid' | 'unavailable'
  token: string
  booking?: StaffBookingView
  done?: 'restored' | 'used' | 'unchanged'
}

const DONE_TEXT: Record<NonNullable<StaffBookingContentProps['done']>, string> = {
  restored: 'Done: the session is back in the client’s package.',
  used: 'Done: the session counts as used again.',
  unchanged: 'Nothing changed: the session was already in that state.',
}

export default function StaffBookingContent({ state, token, booking, done }: StaffBookingContentProps) {
  return (
    <section className="w-full min-h-[70vh] py-20 lg:py-32 bg-brand-sand">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">Staff</p>
          <h1 className="mb-8 text-4xl lg:text-6xl font-medium tracking-tight text-brand-ink">Session credit</h1>

          {state !== 'found' || !booking ? (
            <p className="max-w-xl text-base leading-relaxed text-brand-ink">
              {state === 'unavailable'
                ? 'The booking could not be loaded just now. Please try again in a minute.'
                : 'This link is not valid or has expired (links work for 60 days). Use the link in the most recent alert mail for the booking.'}
            </p>
          ) : (
            <div className="p-6 lg:p-8 bg-white border border-brand-border rounded-card">
              {done && (
                <p role="status" className="mb-6 p-4 bg-brand-sand border border-brand-border rounded-card text-sm text-brand-ink">
                  {DONE_TEXT[done]}
                </p>
              )}
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 mb-6 text-sm">
                <dt className="text-brand-muted">Client</dt>
                <dd className="sm:col-span-2 text-brand-ink">
                  {booking.clientName ? `${booking.clientName}, ` : ''}
                  {booking.clientEmail}
                </dd>
                <dt className="text-brand-muted">Session</dt>
                <dd className="sm:col-span-2 text-brand-ink">
                  {booking.dateLabel}, {booking.timeLabel}
                </dd>
                <dt className="text-brand-muted">What happened</dt>
                <dd className="sm:col-span-2 text-brand-ink">
                  {booking.kind === 'rescheduled' ? 'Moved' : 'Cancelled'}{' '}
                  {booking.byStaff ? 'under a staff address' : 'by the client'} with less than 48 working hours
                  notice{booking.changedLabel ? ` (on ${booking.changedLabel})` : ''}.
                  {booking.byStaff && ' If neither you nor Suzanne made this change, count the session as used.'}
                </dd>
                <dt className="text-brand-muted">Now</dt>
                <dd className="sm:col-span-2 font-medium text-brand-ink" data-testid="credit-state">
                  {booking.restored ? 'Given back: the session is in the client’s package again.' : 'Counts as used.'}
                </dd>
              </dl>
              <form method="post" action="/api/staff/booking-credit">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="action" value={booking.restored ? 'use' : 'restore'} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center py-4 px-8 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300"
                >
                  {booking.restored ? 'Count it as used again' : 'Give this session back'}
                </button>
              </form>
              <p className="mt-4 text-sm text-brand-muted">
                The client is not mailed about this. Their portal shows the change straight away.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
