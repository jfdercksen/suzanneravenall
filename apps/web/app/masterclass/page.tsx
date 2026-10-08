import type { Metadata } from 'next'
import MasterclassContent from '@/components/masterclass/MasterclassContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:
      'Unlock Your Most Extraordinary Self | Free Masterclass with Dr. Suzanne Ravenall',
    description:
      'Breaking the hold of the child brain on adult adversity. A free, 17-minute, pre-recorded masterclass with Dr. Suzanne Ravenall that you watch on demand.',
  }
}

export default function MasterclassPage() {
  return <MasterclassContent />
}
