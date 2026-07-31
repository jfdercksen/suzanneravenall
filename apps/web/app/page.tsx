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
import UpcomingEvents from '../components/home/UpcomingEvents'
import LeadMagnet from '../components/home/LeadMagnet'
import VideoTestimonials from '../components/shared/VideoTestimonials'
import FinalCTA from '../components/home/FinalCTA'

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
      {/* 1 — dark */}
      <Hero />
      {/* 2 — light */}
      <TrustBar />
      {/* 3 — dark (bg-gray-950) */}
      <MediaLogos id="media-logos" />
      {/* 4 — dark (bg-brand-primary) */}
      <UpcomingPrograms />
      {/* 5 — light (bg-white) */}
      <MagazineCovers />
      {/* 5 — light (bg-gray-50) */}
      <AboutTeaser />
      {/* 6 — light (bg-white) */}
      <FeaturedPrograms />
      {/* 7 — dark (full-bleed video) */}
      <TransformationQuote />
      {/* 8 — dark (bg-gray-950) */}
      <FocusAreas />
      {/* 9 — dark */}
      <TestimonialSpotlight />
      {/* 10 — mixed dark/light (BookPromotion split layout) */}
      <BookPromotion />
      {/* 11 — light (bg-gray-50) */}
      <UpcomingEvents />
      {/* 12 — dark (bg-brand-primary) */}
      <LeadMagnet />
      {/* 13 — light (bg-white) */}
      <VideoTestimonials />
      {/* 14 — dark (bg-brand-primary) */}
      <FinalCTA />
    </>
  )
}
