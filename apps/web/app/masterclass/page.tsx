import type { Metadata } from 'next'
import MasterclassContent from '@/components/masterclass/MasterclassContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:
      'Unlock Your Most Extraordinary Self | Free Masterclass with Dr. Suzanne Ravenall',
    description:
      'Discover the pattern, decode and disrupt it, then rewire your mind and nervous system for radical inner and outer transformation. Free masterclass with Dr. Suzanne Ravenall.',
  }
}

export default function MasterclassPage() {
  return <MasterclassContent />
}
