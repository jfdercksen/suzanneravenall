import Link from 'next/link'
import { HEADER_UNDERLINE, PageHeader } from '@/components/shared/PageHeader'

// Header: shared PageHeader, the header rule. The video is the client
// transformation montage; the poster is the stage photo with Suzanne in the
// centre of the frame, so the default left alignment and centre crop apply.
// The desktop-only portrait card that sat beside the copy is gone: the
// picture is the header.
export default function ServicesHero() {
  return (
    <PageHeader
      id="services-hero-heading"
      eyebrow="Services with Dr. Suzanne Ravenall"
      video={{
        src: '/videos/generated/hero-services-testimonials.mp4',
        poster: '/images/hero-bg-suzanne-ravenall.jpg',
      }}
      title={
        <>
          Unlock your life{' '}
          <span className={HEADER_UNDERLINE}>and potential.</span>
        </>
      }
      description={
        <>
          Through a comfortable, authentic and safe environment, Suzanne helps you
          get to the root cause of key issues that disrupt life, track the patterns
          through the impact and then helps you break through and go beyond these
          challenges and into self mastery.
        </>
      }
    >
      <Link
        href="#private"
        className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
      >
        Find Your Path
      </Link>
      <Link
        href="/explore"
        className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
      >
        Explore the Method
      </Link>
    </PageHeader>
  )
}
