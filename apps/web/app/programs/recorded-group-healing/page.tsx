import type { Metadata } from 'next'
import { getProgramsByCategory } from '@/data/programs'
import RecordedGroupHealingContent from '@/components/programs/RecordedGroupHealingContent'

export const metadata: Metadata = {
  title: 'Recorded Group Healing Sessions',
  description:
    'Group healing, in your own time: Resonance Repatterning group healing series recorded live with Dr. Suzanne Ravenall. Watch online, anytime, and return whenever you need.',
}

export default function RecordedGroupHealingPage() {
  return <RecordedGroupHealingContent series={getProgramsByCategory('group')} />
}
