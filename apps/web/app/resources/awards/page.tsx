import type { Metadata } from 'next'
import AwardsContent from '@/components/resources/AwardsContent'

export function generateMetadata(): Metadata {
  return {
    title: 'Awards & Honours',
    description:
      'Dr. Suzanne Ravenall and the Ravenall Institute, recognised with Global 100, CRF and Healthcare & Pharmaceutical Excellence Awards.',
  }
}

// Public since 10 Nov 2026 (Johan: "Move to Public"): press, articles and awards
// are marketing content. The portal pages keep their access check.
export default function AwardsPage() {
  return <AwardsContent />
}
