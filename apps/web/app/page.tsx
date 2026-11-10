import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Hero from '../components/home/Hero'
import WorkWithSuzanne from '../components/home/WorkWithSuzanne'
import PatternIntelligenceBand from '../components/home/PatternIntelligenceBand'
import DiscoveryHubBand from '../components/home/DiscoveryHubBand'
import PathwaysBand from '../components/home/PathwaysBand'
import LiveProgrammesBand from '../components/home/LiveProgrammesBand'
import SelfStudyBand from '../components/home/SelfStudyBand'
import BookPromotion from '../components/home/BookPromotion'
import VideoTestimonials from '../components/shared/VideoTestimonials'
import LeadMagnet from '../components/home/LeadMagnet'
import MediaLogos from '../components/home/MediaLogos'
import ThreeWaysToBegin from '../components/home/ThreeWaysToBegin'
import FinalCTA from '../components/home/FinalCTA'
import { getProductPrices } from '../lib/shop/product-prices'
import { getProgramsByCategory, HOME_SELF_STUDY } from '../data/programs'
import { getLiveCalendar } from '../lib/events/liveCalendar'
import { ipCountry } from '../lib/geoip'
import { CURRENCY_COOKIE, visitorCurrency } from '../lib/visitor-region'

const BOOK_HANDLE = 'the-latest-book-by-suzanne'

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
    'Founder of Pattern Intelligence™: pattern-level transformation that helps you decode the patterns running your life and change them for good.',
  sameAs: [
    'https://www.linkedin.com/in/sravenall',
    'https://www.instagram.com/suzanneravenall',
    'https://www.facebook.com/suzanneravenalltransformation',
  ],
}

export default async function HomePage() {
  const [bookPrices, reqHeaders, reqCookies] = await Promise.all([
    getProductPrices(BOOK_HANDLE),
    headers(),
    cookies(),
  ])
  // Same rule as the shop and the cart (D021): the book card shows the visitor's currency.
  const currency = visitorCurrency(reqHeaders, reqCookies.get(CURRENCY_COOKIE)?.value, process.env, ipCountry(reqHeaders))
  const selfStudy = getProgramsByCategory('self-paced')
    .filter((p) => p.isPublished && HOME_SELF_STUDY.includes(p.slug))
    .sort((a, b) => HOME_SELF_STUDY.indexOf(a.slug) - HOME_SELF_STUDY.indexOf(b.slug))

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
      {/* Section order (Suzanne's 8 Nov list, item 9; proposed to Johan 10 Nov):
          work with me near the top, then in the order of her mail: Pattern
          Intelligence, the Pattern Discovery Hub as the entry (with the Pattern
          Coach tile), Transformation Pathways, live programmes, self-study, the
          book. Grounds: white = brand-cream, light grey = brand-sand, black =
          brand-primary-900. Never the same ground twice in a row. */}
      {/* 1 dark: hero, the microphone picture she likes */}
      <Hero />
      {/* 2 white: work with me / book Suzanne to speak */}
      <WorkWithSuzanne />
      {/* 3 black: Pattern Intelligence, the method */}
      <PatternIntelligenceBand />
      {/* 4 light grey: Pattern Discovery Hub + Pattern Coach tile */}
      <DiscoveryHubBand />
      {/* 5 white: Transformation Pathways */}
      <PathwaysBand />
      {/* 6 black: live programmes from data/live-calendar.json */}
      <LiveProgrammesBand calendar={getLiveCalendar()} />
      {/* 7 white: self-study programmes + recorded group healing */}
      <SelfStudyBand programs={selfStudy} />
      {/* 8 split: black book panel | light grey copy panel */}
      <BookPromotion prices={bookPrices} defaultCurrency={currency} />
      {/* 9 white: video testimonials */}
      <VideoTestimonials />
      {/* 10 dark: book release updates (BookPromotion links here) */}
      <LeadMagnet />
      {/* 11 light grey: press band */}
      <MediaLogos id="media-logos" tone="light" />
      {/* 12 white: three ways to begin (now three) */}
      <ThreeWaysToBegin />
      {/* 13 dark: final CTA */}
      <FinalCTA />
    </>
  )
}
