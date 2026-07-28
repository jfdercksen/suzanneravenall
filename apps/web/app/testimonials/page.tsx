import type { Metadata } from 'next'
import TestimonialsContent from '@/components/testimonials/TestimonialsContent'

export const metadata: Metadata = {
  title: 'Testimonials | Dr. Suzanne Ravenall',
  description:
    'Real transformations from real people. Watch and read what clients around the world say about working with Dr. Suzanne Ravenall — private sessions, group programmes and Rapid Repatterning®.',
}

export default function TestimonialsPage() {
  return <TestimonialsContent />
}
