import type { Metadata } from 'next'
import Hero from '../components/home/Hero'
import TrustBar from '../components/home/TrustBar'
import MediaLogos from '../components/home/MediaLogos'
import UpcomingPrograms from '../components/home/UpcomingPrograms'
import { MagazineCovers } from '../components/shared/MagazineCovers'
import AboutTeaser from '../components/home/AboutTeaser'
import FeaturedPrograms from '../components/home/FeaturedPrograms'
import TransformationQuote from '../components/home/TransformationQuote'
import FocusAreas from '../components/home/FocusAreas'
import TestimonialSpotlight from '../components/home/TestimonialSpotlight'
import BookPromotion from '../components/home/BookPromotion'
import StatementBand from '../components/home/StatementBand'
import UpcomingEvents from '../components/home/UpcomingEvents'
import LeadMagnet from '../components/home/LeadMagnet'
import VideoTestimonials from '../components/shared/VideoTestimonials'
import FinalCTA from '../components/home/FinalCTA'
import { getFeaturedCohort } from '../lib/inventory/group-sessions'

export const metadata: Metadata = {
  title: {
    absolute: 'Dr. Suzanne Ravenall: Transformation Coaching',
  },
  description:
    "It's not you, it's your pattern. Dr. Suzanne Ravenall, founder of Pattern Intelligence™, helps you decode the patterns running your life and change them at the level where they live.",
  openGraph: {
    title: 'Dr. Suzanne Ravenall: Transformation Coaching',
    description:
      "It's not you, it's your pattern. Pattern-level transformation with Dr. Suzanne Ravenall, founder of Pattern Intelligence™.",
    images: [{ url: '/images/hero-bg-suzanne-ravenall.jpg', width: 1200, height: 630, alt: 'Dr. Suzanne Ravenall' }],
  },
  twitter: {
    title: 'Dr. Suzanne Ravenall: Transformation Coaching',
    description:
      "It's not you, it's your pattern. Pattern-level transformation with Dr. Suzanne Ravenall, founder of Pattern Intelligence™.",
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
    'https://www.linkedin.com/in/sravenall',
    'https://www.instagram.com/suzanneravenall',
    'https://www.facebook.com/suzanneravenalltransformation',
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
  jobTitle: 'Transformation, Behaviour & Pattern Coach',
  description:
    'Founder of Pattern Intelligence™ — pattern-level transformation that helps you decode the patterns running your life and change them for good.',
  alumniOf: {
    '@type': 'Organization',
    name: 'University (credentials pending confirmation)',
  },
  sameAs: [
    'https://www.linkedin.com/in/sravenall',
    'https://www.instagram.com/suzanneravenall',
    'https://www.facebook.com/suzanneravenalltransformation',
  ],
}

export default async function HomePage() {
  const featuredCohort = await getFeaturedCohort()

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
      {/* Colour system: light is the default; dark only where full-bleed
          imagery carries it (hero, quote video, photo-backed CTAs). */}
      {/* 1 — dark (video hero) */}
      <Hero />
      {/* 2 — light (bg-white) */}
      <TrustBar />
      {/* 3 — light (bg-gray-50 press band) */}
      <MediaLogos id="media-logos" tone="light" />
      {/* 4 — light (bg-white, dark photo cards) */}
      <UpcomingPrograms cohort={featuredCohort} />
      {/* 5 — light (bg-white) */}
      <MagazineCovers />
      {/* 6 — light (bg-gray-50) */}
      <AboutTeaser />
      {/* 7 — light (bg-white) */}
      <FeaturedPrograms />
      {/* 8 — dark (full-bleed video) */}
      <TransformationQuote />
      {/* 9 — light (bg-white, photo panel) */}
      <FocusAreas />
      {/* 10 — light (bg-gray-50) */}
      <TestimonialSpotlight />
      {/* 11 — mixed dark/light (BookPromotion split layout) */}
      <BookPromotion />
      {/* 12 — light (bg-white, full-width centered statement) */}
      <StatementBand />
      {/* 13 — light (bg-gray-50) */}
      <UpcomingEvents cohort={featuredCohort} />
      {/* 14 — dark (photo + navy overlay) */}
      <LeadMagnet />
      {/* 15 — light (bg-white) */}
      <VideoTestimonials />
      {/* 16 — dark (photo + navy overlay) */}
      <FinalCTA />
    </>
  )
}
