import type { Metadata } from 'next'
import ServicesHero from '@/components/services/ServicesHero'
import PrivateSessions from '@/components/services/PrivateSessions'
import GroupCorporate from '@/components/services/GroupCorporate'
import Speaking from '@/components/services/Speaking'
import Programs from '@/components/services/Programs'
import ServicesFinalCTA from '@/components/services/ServicesFinalCTA'

export function generateMetadata(): Metadata {
  return {
    title: 'Services | Private Sessions, Group Programmes & Keynotes — Dr. Suzanne Ravenall',
    description:
      'Unlock your life and potential with Dr. Suzanne Ravenall — Private Sessions, Group & Corporate Wellness Retreats, Keynote Speaking, and Guided Programmes rooted in Resonance Repatterning, RTT® and transformational coaching.',
  }
}

export default function ServicesPage() {
  return (
    <main>
      <ServicesHero />
      <PrivateSessions />
      <GroupCorporate />
      <Speaking />
      <Programs />
      <ServicesFinalCTA />
    </main>
  )
}
