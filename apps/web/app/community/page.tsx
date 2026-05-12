import type { Metadata } from 'next'
import CommunityContent from './CommunityContent'

export const metadata: Metadata = {
  title: 'Community | Suzanne Ravenall',
  description:
    "A private space for members to connect, share breakthroughs, and support each other's journey. Coming soon.",
}

export default function CommunityPage() {
  return <CommunityContent />
}
