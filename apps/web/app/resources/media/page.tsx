import type { Metadata } from 'next'
import MediaContent from '@/components/resources/MediaContent'

export function generateMetadata(): Metadata {
  return {
    title: 'Media & Press',
    description:
      'Dr. Suzanne Ravenall featured in Leadership Magazine, CEO Magazine and Business Excellence Award press. Read the coverage.',
  }
}

// Public since 10 Nov 2026 (Johan: "Move to Public"): press, articles and awards
// are marketing content. The portal pages keep their access check.
export default function MediaPage() {
  return <MediaContent />
}
