import type { Metadata } from 'next'
import TheStoryContent from './TheStoryContent'

export const metadata: Metadata = {
  title: 'The Story | Dr. Suzanne Ravenall',
  description:
    'From building one of South Africa’s respected corporate transformation companies to a stroke and multiple sclerosis diagnosis: the personal journey that led Dr. Suzanne Ravenall to Rapid Repatterning®, Neuro-repatterning® and Pattern Intelligence™.',
}

export default function TheStoryPage() {
  return <TheStoryContent />
}
