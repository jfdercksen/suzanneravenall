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
    images: [{ url: '/images/hero-bg-suzanne-ravenall.jpg', width: 1200, height: 630, alt: 'Dr. Suzanne Ravenall' }],
  },
  twitter: {
    title: 'Dr. Suzanne Ravenall — Transformation Coaching',
    description:
      'Break the childhood patterns holding you back. Science-backed coaching that delivers permanent change.',
    images: ['/images/hero-bg-suzanne-ravenall.jpg'],
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Dr. Suzanne Ravenall',
  url: 'https://suzanneravenall.com',
  logo: 'https://suzanneravenall.com/logos/suzanne-ravenall-logo.svg',
  sameAs: [
    'https://www.linkedin.com/in/suzanneravenall',
    'https://www.instagram.com/suzanneravenall',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: 'https://suzanneravenall.com/contact',
  },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Dr. Suzanne Ravenall',
  url: 'https://suzanneravenall.com',
  image: 'https://suzanneravenall.com/images/suzanne-portrait.jpg',
  jobTitle: 'Transformation Coach',
  description:
    "Neuro-Repatterning\u00ae pioneer helping high-achievers break childhood patterns for permanent, measurable change.",
  alumniOf: {
    '@type': 'Organization',
    name: 'University (credentials pending confirmation)',
  },
  sameAs: [
    'https://www.linkedin.com/in/suzanneravenall',
    'https://www.instagram.com/suzanneravenall',
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
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
