import type { Metadata } from 'next'
import ProgramsPageClient from './ProgramsPageClient'

export const metadata: Metadata = {
  title: 'Programmes',
  description:
    "Explore Dr. Suzanne Ravenall's transformation programmes: practitioner training, self-paced online courses, live sessions, and group workshops designed for dramatic change.",
}

export default function ProgramsPage() {
  return <ProgramsPageClient />
}
