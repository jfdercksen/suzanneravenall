import type { Metadata } from 'next'
import { getLiveCalendar } from '@/lib/events/liveCalendar'
import EventsContent from './EventsContent'

export const metadata: Metadata = {
  title: 'Events: Live Programmes Calendar',
  description:
    'Live programmes with Dr. Suzanne Ravenall via Zoom: dates, formats and booking, or register your interest for the next run.',
}

// Past dates drop off by themselves, so the page is rebuilt hourly.
export const revalidate = 3600

export default function EventsPage() {
  return <EventsContent calendar={getLiveCalendar()} />
}
