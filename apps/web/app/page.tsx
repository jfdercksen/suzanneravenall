import type { Metadata } from 'next'
import HeroSection from '../components/home/HeroSection'
import TrustBar from '../components/home/TrustBar'
import FocusAreas from '../components/home/FocusAreas'
import ServicesSection from '../components/home/ServicesSection'
import FeaturedPrograms from '../components/home/FeaturedPrograms'
import TestimonialsSection from '../components/home/TestimonialsSection'
import AboutTeaser from '../components/home/AboutTeaser'
import LeadMagnet from '../components/home/LeadMagnet'
import FinalCTA from '../components/home/FinalCTA'

export const metadata: Metadata = {
  title: {
    absolute: 'Dr. Suzanne Ravenall — Transformation Coaching',
  },
  description:
    "Break the childhood patterns holding you back. Dr. Suzanne Ravenall's Neuro-Repatterning\u00ae methodology delivers permanent, measurable change for high-achievers ready to unlock their extraordinary life.",
  openGraph: {
    title: 'Dr. Suzanne Ravenall — Transformation Coaching',
    description:
      'Break the childhood patterns holding you back. Science-backed coaching that delivers permanent change.',
    images: [{ url: '/images/hero-bg.jpg', width: 1200, height: 630 }],
  },
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <FocusAreas />
      <ServicesSection />
      <FeaturedPrograms />
      <TestimonialsSection />
      <AboutTeaser />
      <LeadMagnet />
      <FinalCTA />
    </>
  )
}
