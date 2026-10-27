import type { AppointmentView } from '@/lib/portal/appointments'

const STATUS_BADGE: Record<AppointmentView['status'], { label: string; className: string }> = {
  booked: { label: 'Booked', className: 'bg-white text-brand-primary' },
  rescheduled: { label: 'Rescheduled', className: 'bg-white/20 text-white border border-white/30' },
  cancelled: { label: 'Cancelled', className: 'text-white/85 border border-white/40' },
  over_limit: { label: 'Not in your package', className: 'text-white/85 border border-white/40' },
}

// Session rules (D024): what happened to a session the client lost or missed.
const OUTCOME_BADGE: Record<NonNullable<AppointmentView['outcome']>, string> = {
  no_show: 'No-show',
  late_cancel: 'Late cancellation',
  late_move: 'Moved at short notice',
}

function outcomeNote({ outcome, creditRestored }: AppointmentView): string | null {
  if (!outcome) return null
  if (creditRestored) return 'This session was given back to your package.'
  return outcome === 'no_show'
    ? 'This session was missed, so it counts as used.'
    : 'Changed with less than 48 working hours notice, so this session counts as used.'
}

interface AppointmentCardProps {
  appointment: AppointmentView
  /** Past list: no actions, finished bookings read "Completed" */
  past?: boolean
}

export function AppointmentCard({ appointment, past = false }: AppointmentCardProps) {
  const badge = appointment.outcome
    ? { label: OUTCOME_BADGE[appointment.outcome], className: 'text-white/85 border border-white/40' }
    : past && appointment.status !== 'cancelled' && appointment.status !== 'over_limit'
      ? { label: 'Completed', className: 'bg-white/20 text-white border border-white/30' }
      : STATUS_BADGE[appointment.status]
  const note = outcomeNote(appointment)
  const hasActions = Boolean(appointment.rescheduleUrl || appointment.cancelUrl || appointment.joinUrl)

  return (
    <li
      className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-brand-primary-800 border border-white/25 rounded-card"
      data-testid={past ? 'past-appointment' : 'upcoming-appointment'}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-white font-semibold">{appointment.dateLabel}</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-white/85 text-sm">
          {appointment.timeLabel} <span className="text-white/60">({appointment.durationLabel})</span>
        </p>
        <p className="text-white/70 text-sm truncate">{appointment.service}</p>
        {note && (
          <p className="mt-1 text-white/85 text-sm" data-testid="appointment-outcome">
            {note}
          </p>
        )}
      </div>

      {!past && hasActions && (
        <div className="flex flex-wrap gap-2">
          {appointment.joinUrl && (
            <a
              href={appointment.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-white hover:bg-brand-sand text-brand-primary text-sm font-semibold rounded-button transition-colors duration-300"
            >
              Join
            </a>
          )}
          {appointment.rescheduleUrl && (
            <a
              href={appointment.rescheduleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-white/50 hover:bg-white/10 text-white text-sm font-semibold rounded-button transition-colors duration-300"
            >
              Reschedule
            </a>
          )}
          {appointment.cancelUrl && (
            <a
              href={appointment.cancelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-white/85 hover:text-white text-sm font-medium underline-offset-4 hover:underline transition-colors duration-300"
            >
              Cancel
            </a>
          )}
        </div>
      )}
    </li>
  )
}
