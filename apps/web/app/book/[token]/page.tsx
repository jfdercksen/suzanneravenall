import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { decideGate, type GateDecision } from '@/lib/booking/limits'
import { touchBookingToken } from '@/lib/booking/tokens'
import { COMPANY_CONTACT_EMAIL } from '@/lib/email/company'
import { logError } from '@/lib/log'
import BookingNotice from './BookingNotice'

/**
 * /book/<token>: the per-order booking link from the order mail, the
 * confirmation page and the portal (J-07, DECISIONS.md D022). With a session
 * left it sends the client on to the Cal.com event; at zero it says the
 * package is fully booked. The token is the only key.
 */

export const metadata: Metadata = {
  title: 'Book a session',
  description: 'Book your private session with Dr Suzanne Ravenall.',
  robots: { index: false, follow: false },
  // The token is in the path: never send it to another site as a referrer.
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

async function decide(token: string): Promise<GateDecision | 'unavailable'> {
  try {
    return await decideGate(token)
  } catch (error) {
    logError('[book] gate check failed', error)
    return 'unavailable'
  }
}

export default async function BookPage({ params }: PageProps) {
  const { token } = await params
  const decision = await decide(token)

  if (decision !== 'unavailable' && decision.kind === 'open') {
    await touchBookingToken(decision.tokenId)
    redirect(decision.url)
  }

  if (decision === 'unavailable') {
    return (
      <BookingNotice
        title="Booking is not available right now"
        lines={['Something on our side is not answering. Please try again in a few minutes; your link stays valid.']}
        primary={{ label: 'View my appointments', href: '/portal/appointments' }}
        supportEmail={COMPANY_CONTACT_EMAIL}
      />
    )
  }

  if (decision.kind === 'full') {
    return (
      <BookingNotice
        title="All sessions in this package are booked"
        lines={[
          `Every session in this package (${decision.total} in total) already has a date. You can see, move or cancel them in your portal; a cancelled session can be booked again.`,
          'Would you like more sessions? Buy another session or package and you will receive a new booking link.',
        ]}
        primary={{ label: 'View my appointments', href: '/portal/appointments' }}
        secondary={{ label: 'Buy more sessions', href: '/services' }}
        supportEmail={COMPANY_CONTACT_EMAIL}
      />
    )
  }

  return (
    <BookingNotice
      title="This booking link is not valid"
      lines={['This link is incomplete or has been changed. Please open it again from your order confirmation email.']}
      primary={{ label: 'View my appointments', href: '/portal/appointments' }}
      supportEmail={COMPANY_CONTACT_EMAIL}
    />
  )
}
