'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { patternQuizzes, categoryLabel } from '@/data/patternQuizzes'

export default function PatternHubQuizGrid() {
  return (
    <section
      id="assessments"
      aria-labelledby="pattern-hub-quiz-grid-heading"
      className="w-full bg-gray-50 py-20 lg:py-32 scroll-mt-48"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-12 lg:mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            The Assessments
          </p>
          <h2
            id="pattern-hub-quiz-grid-heading"
            className="text-3xl lg:text-5xl font-semibold tracking-tight text-brand-primary leading-tight mb-4"
          >
            Choose the Diagnostic That Speaks to You
          </h2>
          <p className="text-base lg:text-lg text-gray-600">
            You don&rsquo;t need to do all of them. Start with the one that
            feels most relevant right now.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {patternQuizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.slug}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              className="flex flex-col h-full rounded-card bg-white shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-lg hover:border-brand-accent/30 hover:-translate-y-1"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-brand-accent font-medium mb-3">
                {categoryLabel(quiz.category)}
              </p>
              <h3 className="text-lg font-semibold text-brand-primary leading-snug">
                {quiz.question}
              </h3>
              <p className="text-sm text-gray-500 mt-2 flex-1">{quiz.description}</p>
              <Link
                href={`/explore/${quiz.topicSlug}/quiz`}
                className="mt-auto rounded-button bg-brand-primary text-white text-sm px-4 py-2 hover:bg-brand-accent transition-colors duration-200 text-center w-full"
              >
                Take Quiz →
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}