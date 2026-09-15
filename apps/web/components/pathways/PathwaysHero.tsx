'use client'

import { PageHeader, HEADER_UNDERLINE } from '@/components/shared/PageHeader'

// Header: shared PageHeader, the header rule. The photo now shows at full
// strength instead of at 50% under a full-frame wash.
export default function PathwaysHero() {
  return (
    <PageHeader
      id="pathways-hero-heading"
      eyebrow="Transformation Pathways"
      image="/images/generated/explore-transformation.webp"
      title={
        <>
          Individual &amp; group pathways for deep, lasting{' '}
          <span className={HEADER_UNDERLINE}>transformation</span>
        </>
      }
      description={
        <>
          Each pathway is a focused transformation journey, a guided way to
          uncover the hidden patterns running underneath, interrupt the loops
          that keep you stuck, and support real, lasting personal change.
          Begin an Individual Transformation Pathway today, or register your
          interest in the upcoming group immersions.
        </>
      }
    />
  )
}
