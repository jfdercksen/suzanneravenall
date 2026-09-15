'use client'

import Link from 'next/link'
import type { Topic } from '@/app/explore/topics'
import { PageHeader } from '@/components/shared/PageHeader'
import { getTopicQuiz, getTopicQuizLabel } from '@/components/explore/topicQuizMap'

export default function TopicHero({ topic }: { topic: Topic }) {
  const quiz = getTopicQuiz(topic.slug)
  const quizLabel = getTopicQuizLabel(topic.slug)

  const handleScrollToApproach = () => {
    const el = document.getElementById('approach')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* Header: shared PageHeader, the header rule. Each topic brings its own
          picture, so the default left alignment and centre crop apply. */}
      <PageHeader
        id="topic-hero-heading"
        image={topic.image}
        title={topic.heroHeadline}
        description={topic.heroSubheadline}
      >
        {/* CTAs: quiz first, discovery call second (Suzanne, 27 Jul 2026) */}
        {quiz ? (
          <Link
            href={`/explore/${topic.slug}/quiz`}
            className="inline-flex items-center justify-center text-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
          >
            {quizLabel}
          </Link>
        ) : (
          <Link
            href="/discover-your-pattern"
            className="inline-flex items-center justify-center text-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
          >
            Take the Free Pattern Scan
          </Link>
        )}
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          Book a Discovery Call
        </Link>
        <button
          type="button"
          onClick={handleScrollToApproach}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-white/80 hover:text-white text-xs sm:text-sm uppercase tracking-widest font-medium transition-colors duration-300"
        >
          Explore the Method
          <span aria-hidden="true" className="inline-block">↓</span>
        </button>
      </PageHeader>

      {/* Slim black band under the header: the breadcrumb and the opening
          question, secondary copy that the header rule moves out of the
          picture. Same content as before. */}
      <section
        aria-label="Topic introduction"
        className="w-full bg-brand-primary-900 border-t border-white/10 py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 text-xs uppercase tracking-[0.3em] font-medium text-white/80"
          >
            <Link
              href="/explore"
              className="transition-colors duration-300 hover:text-white"
            >
              Explore
            </Link>
            <span aria-hidden="true" className="mx-3">/</span>
            <span className="text-white">{topic.title}</span>
          </nav>

          {/* Opening question: the pattern interrupt */}
          <p className="max-w-3xl text-white text-lg lg:text-xl font-light italic leading-relaxed">
            {topic.openingQuestion}
          </p>
        </div>
      </section>
    </>
  )
}
