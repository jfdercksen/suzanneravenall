'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { MemberAppointments } from '@/lib/portal/load-appointments'
import { AppointmentCard } from './AppointmentCard'

const SECTION_MOTION = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
} as const

export default function AppointmentsContent({
  upcoming,
  past,
  toBook,
  ordersUnavailable,
  bookingsUnavailable,
}: MemberAppointments) {
  const remaining = toBook.reduce((sum, item) => sum + item.remaining, 0)

  return (
    <div className="relative w-full bg-brand-primary min-h-screen py-16 lg:py-24 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute bg-white/[0.06] blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-4">
            Member Portal
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.05] mb-3">
            My Appointments
          </h1>
          <p className="text-lg text-white/60">
            Your booked sessions with Dr. Suzanne Ravenall and the sessions you still have to book. Times are South African time (SAST).
          </p>
        </motion.div>

        {bookingsUnavailable && (
          <p role="status" className="mb-8 p-4 bg-brand-primary-800 border border-white/25 rounded-card text-white/85 text-sm">
            Your bookings could not be loaded just now. Please refresh the page in a minute.
          </p>
        )}

        {/* Upcoming */}
        <motion.section {...SECTION_MOTION} className="mb-12" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="text-xl font-semibold text-white mb-4">
            Upcoming
          </h2>
          {upcoming.length > 0 ? (
            <ul className="space-y-3">
              {upcoming.map((appointment) => (
                <AppointmentCard key={appointment.uid} appointment={appointment} />
              ))}
            </ul>
          ) : (
            <div className="p-6 bg-brand-primary-800 border border-white/25 rounded-card">
              <p className="text-white font-semibold mb-1">No upcoming appointments</p>
              <p className="text-white/70 text-sm">
                {remaining > 0
                  ? 'You have sessions ready to book below.'
                  : 'When you book a session it will appear here with its date and time.'}
              </p>
            </div>
          )}
        </motion.section>

        {/* Sessions still to book */}
        <motion.section {...SECTION_MOTION} className="mb-12" aria-labelledby="to-book-heading">
          <h2 id="to-book-heading" className="text-xl font-semibold text-white mb-4">
            Sessions still to book
          </h2>
          {ordersUnavailable ? (
            <p role="status" className="p-6 bg-brand-primary-800 border border-white/25 rounded-card text-white/85 text-sm">
              Your session purchases could not be loaded just now. Please refresh the page in a minute.
            </p>
          ) : toBook.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {toBook.map((item) => (
                <li
                  key={item.key}
                  data-testid="sessions-to-book"
                  className="flex flex-col p-5 bg-brand-primary-800 border border-white/25 rounded-card"
                >
                  <p className="text-white font-semibold mb-1">{item.service}</p>
                  <p className="text-white/70 text-sm mb-4">{item.durationLabel} sessions</p>
                  <p className="text-white text-2xl font-semibold tracking-tight mb-4">
                    {item.remaining} <span className="text-white/70 text-base font-normal">of {item.total} left to book</span>
                  </p>
                  {item.bookUrl ? (
                    <a
                      href={item.bookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center justify-center w-full py-3 bg-white hover:bg-brand-sand text-brand-primary text-sm font-semibold rounded-button transition-colors duration-300"
                    >
                      Book Now
                    </a>
                  ) : (
                    <p className="mt-auto text-white/70 text-sm">All sessions booked.</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 bg-brand-primary-800 border border-white/25 rounded-card">
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">No sessions to book</p>
                <p className="text-white/70 text-sm">
                  Private sessions and session packages you buy are listed here, ready to book.
                </p>
              </div>
              <Link
                href="/services"
                className="flex-shrink-0 inline-flex items-center px-5 py-2.5 bg-white hover:bg-brand-sand text-brand-primary text-sm font-semibold rounded-button transition-colors duration-300"
              >
                View Sessions
              </Link>
            </div>
          )}
        </motion.section>

        {/* Past */}
        <motion.section {...SECTION_MOTION} aria-labelledby="past-heading">
          <h2 id="past-heading" className="text-xl font-semibold text-white mb-1">
            Past
          </h2>
          <p className="text-white/60 text-sm mb-4">The last 12 months, cancelled bookings included.</p>
          {past.length > 0 ? (
            <ul className="space-y-3">
              {past.map((appointment) => (
                <AppointmentCard key={appointment.uid} appointment={appointment} past />
              ))}
            </ul>
          ) : (
            <p className="p-6 bg-brand-primary-800 border border-white/25 rounded-card text-white/70 text-sm">
              No past appointments yet.
            </p>
          )}
        </motion.section>
      </div>
    </div>
  )
}
