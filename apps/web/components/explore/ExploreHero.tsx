'use client'

import { PageHeader, HEADER_UNDERLINE } from '@/components/shared/PageHeader'

// Header: shared PageHeader, the header rule. Kept a client component because
// HEADER_UNDERLINE is exported from a client module. Suzanne stands on the
// left of the frame, so the text takes the right-hand column from sm.
export default function ExploreHero() {
  return (
    <PageHeader
      id="explore-hero-heading"
      eyebrow="Areas of Focus"
      align="right"
      video={{
        src: '/videos/generated/hero-brain-video.mp4',
        poster: '/images/hero-bg-suzanne-ravenall.jpg',
      }}
      title={
        <>
          Every area of your life,{' '}
          <span className={HEADER_UNDERLINE}>transformed</span>
        </>
      }
      description={
        <>
          Transformation isn&apos;t about working harder on the surface. It&apos;s about
          changing the pattern underneath, the one your nervous system has
          been running for years. When the pattern shifts, every area of your
          life follows.
        </>
      }
    />
  )
}
