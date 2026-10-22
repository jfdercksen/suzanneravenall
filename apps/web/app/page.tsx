import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
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
import { getProductPrices } from '../lib/shop/product-prices'
import { getProgramPriceTexts } from '../lib/programs/fetch-program-prices'
import { lowestProgramPrice } from '../lib/programs/program-prices'
import { getProgramBySlug, getProgramsByCategory } from '../data/programs'
import { ipCountry } from '../lib/geoip'
import { CURRENCY_COOKIE, visitorCurrency } from '../lib/visitor-region'

const BOOK_HANDLE = 'the-latest-book-by-suzanne'
const BASIC_FIVE_SLUG = 'resonance-repatterning-basic-5-series'

// Prices follow the visitor's currency (D021), so the page is rendered per
// request, like /shop. The two Medusa reads stay cached for 5 minutes.
export const dynamic = 'force-dynamic'

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
  const groupPrograms = getProgramsByCategory('group')
  const basicFive = getProgramBySlug(BASIC_FIVE_SLUG)
  const [featuredCohort, bookPrices, programPrices, reqHeaders, reqCookies] = await Promise.all([
    getFeaturedCohort(),
    getProductPrices(BOOK_HANDLE),
    getProgramPriceTexts(basicFive ? [...groupPrograms, basicFive] : groupPrograms),
    headers(),
    cookies(),
  ])
  // Same rule as the shop and the cart (D021): the cards show the visitor's currency.
  const currency = visitorCurrency(reqHeaders, reqCookies.get(CURRENCY_COOKIE)?.value, process.env, ipCountry(reqHeaders))

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
      {/* Grounds (design standard 2026-09-15): white = brand-cream,
          light grey = brand-sand, black = brand-primary-900. Never the same
          ground twice in a row. */}
      {/* 1 — dark (video hero) */}
      <Hero />
      {/* 2 — white */}
      <TrustBar />
      {/* 3 — light grey (press band) */}
      <MediaLogos id="media-logos" tone="light" />
      {/* 4 — white (dark photo cards) */}
      <UpcomingPrograms cohort={featuredCohort} defaultCurrency={currency} />
      {/* 5 — black: white above, light grey below, so dark is the only
          ground that does not repeat a neighbour */}
      <MagazineCovers tone="dark" />
      {/* 6 — light grey */}
      <AboutTeaser />
      {/* 7 — white */}
      <FeaturedPrograms
        groupPrice={lowestProgramPrice(groupPrograms.map((p) => programPrices[p.slug]).filter((t) => t !== undefined))}
        basicFivePrice={programPrices[BASIC_FIVE_SLUG]}
        defaultCurrency={currency}
      />
      {/* 8 — dark (full-bleed video) */}
      <TransformationQuote />
      {/* 9 — white (photo panel) */}
      <FocusAreas />
      {/* 10 — light grey (renders nothing until a verified story exists) */}
      <TestimonialSpotlight />
      {/* 11 — split: black book panel | light grey copy panel */}
      <BookPromotion prices={bookPrices} defaultCurrency={currency} />
      {/* 12 — white (full-width centered statement) */}
      <StatementBand />
      {/* 13 — light grey */}
      <UpcomingEvents cohort={featuredCohort} bookPrices={bookPrices} defaultCurrency={currency} />
      {/* 14 — dark (photo + black overlay) */}
      <LeadMagnet />
      {/* 15 — white */}
      <VideoTestimonials />
      {/* 16 — dark (photo + black overlay) */}
      <FinalCTA />
    </>
  )
}
