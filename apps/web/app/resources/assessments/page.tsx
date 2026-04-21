import type { Metadata } from 'next'
import AssessmentsContent from './AssessmentsContent'

export const metadata: Metadata = {
  title: 'Assessments | Dr. Suzanne Ravenall',
  description: 'Self-assessment tools for transformation. Coming soon.',
}

export default function AssessmentsPage() {
  return <AssessmentsContent />
}
