import type { Metadata } from 'next'
import MediaContent from '@/components/resources/MediaContent'

export function generateMetadata(): Metadata {
  return {
    title: 'Media & Press | Dr. Suzanne Ravenall',
    description:
      'Dr. Suzanne Ravenall featured in Leadership Magazine, CEO Magazine and Business Excellence Award press — read the coverage.',
  }
}

export default function MediaPage() {
  return <MediaContent />
}
