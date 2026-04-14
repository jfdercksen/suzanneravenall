import type { Metadata } from 'next'
import Hero from '../components/home/Hero'
import MediaLogos from '../components/home/MediaLogos'
import TrustBar from '../components/home/TrustBar'
import UpcomingPrograms from '../components/home/UpcomingPrograms'
import TransformationQuote from '../components/home/TransformationQuote'
import FocusAreas from '../components/home/FocusAreas'
import ServicesSection from '../components/home/ServicesSection'
import TestimonialSpotlight from '../components/home/TestimonialSpotlight'
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
      <Hero />
      <MediaLogos id="media-logos" />
      <TrustBar />
      <UpcomingPrograms />
      <TransformationQuote />
      <FocusAreas />
      <LeadMagnet />
      <ServicesSection />
      <TestimonialSpotlight />
      <FeaturedPrograms />
      <TestimonialsSection />
      <AboutTeaser />
      <FinalCTA />
    </>
  )
}
