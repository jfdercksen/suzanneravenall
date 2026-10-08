import type { Metadata } from 'next'
import MasterclassWatch from '@/components/masterclass/MasterclassWatch'

export const metadata: Metadata = {
  title: 'Watch the Free Masterclass | Dr. Suzanne Ravenall',
  description:
    'Breaking the hold of the child brain on adult adversity. Watch the free masterclass with Dr. Suzanne Ravenall.',
  // A step after registering, as on the current site; not a search landing page.
  robots: { index: false, follow: true },
}

export default function MasterclassWatchPage() {
  return <MasterclassWatch />
}
