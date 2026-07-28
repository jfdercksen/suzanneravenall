import type { Metadata } from 'next'
import TheScienceContent from './TheScienceContent'

export const metadata: Metadata = {
  title: 'The Science | Pattern-Level Transformation | Dr. Suzanne Ravenall',
  description:
    'Why insight alone doesn’t change behaviour. The science behind Pattern Intelligence™ — how the nervous system learns patterns, why they live below conscious thought, and what happens when they change.',
}

export default function TheSciencePage() {
  return <TheScienceContent />
}
