import type { Metadata } from 'next'
import EventsContent from './EventsContent'

export const metadata: Metadata = {
  title: 'Events | Dr. Suzanne Ravenall',
  description:
    'Live events, group sessions and training dates with Dr. Suzanne Ravenall — live-via-Zoom programmes, group repatterning sessions, and upcoming opportunities to work together.',
}

export default function EventsPage() {
  return <EventsContent />
}
