import type { Metadata } from 'next'
import SpeakingContent from '@/components/speaking/SpeakingContent'

export const metadata: Metadata = {
  title: 'Keynote Speaker | Dr. Suzanne Ravenall',
  description:
    'Dr. Suzanne Ravenall delivers keynote experiences that create measurable, lasting change. Book Suzanne for corporate events, leadership conferences, transformation summits, and wellness events.',
}

export default function SpeakingPage() {
  return <SpeakingContent />
}
