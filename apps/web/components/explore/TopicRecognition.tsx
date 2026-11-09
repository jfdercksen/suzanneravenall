'use client'

import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'
import { topicCopy } from '@/app/explore/topicCopy'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

// Holder is one text line tall (text-lg x leading-relaxed), so the dot
// centres on the first line instead of sitting above it.
const dot = (
  <span aria-hidden="true" className="flex h-[1.625em] shrink-0 items-center text-lg">
    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
  </span>
)

export default function TopicRecognition({ topic }: { topic: Topic }) {
  // Suzanne's grouped copy (8 Nov 2026) where she has written it; the older
  // flat list otherwise.
  const copy = topicCopy[topic.slug]?.recognition

  return (
    <section
      aria-labelledby="topic-recognition-heading"
      className="relative w-full bg-brand-cream overflow-hidden py-20 lg:py-32"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...fadeUp(0)}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6 text-center"
        >
          Sound Familiar?
        </motion.p>
        <motion.h2
          id="topic-recognition-heading"
          {...fadeUp(0.1)}
          className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          {copy ? copy.intro : <>You Might Recognise This&hellip;</>}
        </motion.h2>

        {copy ? (
          <>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-12 mx-auto ${
                copy.groups.length === 3 ? 'lg:grid-cols-3 max-w-6xl' : 'max-w-5xl'
              }`}
            >
              {copy.groups.map((group, groupIndex) => (
                <motion.div key={group.heading} {...fadeUp(0.15 + groupIndex * 0.1)}>
                  <h3 className="text-xl lg:text-2xl font-medium text-brand-primary border-b border-brand-border pb-3 mb-5">
                    {group.heading}
                  </h3>
                  <ul className="space-y-3">
                    {group.items.map((item, i) => (
                      <li key={`${i}-${item}`} className="flex items-start gap-4">
                        {dot}
                        <span className="text-lg text-brand-muted font-light leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {copy.note && (
              <motion.p
                {...fadeUp(0.2)}
                className="mt-14 text-lg text-brand-ink font-light leading-relaxed text-center max-w-2xl mx-auto"
              >
                {copy.note}
              </motion.p>
            )}

            <motion.p
              {...fadeUp(0.25)}
              className="mt-14 lg:mt-16 text-2xl lg:text-3xl font-medium tracking-tight text-brand-primary text-center max-w-3xl mx-auto"
            >
              {copy.closing}
            </motion.p>
          </>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl mx-auto">
            {topic.recognitionItems.map((item, index) => (
              <motion.li
                key={`${topic.slug}-recognition-${index}`}
                {...fadeUp(0.15 + index * 0.05)}
                className="flex items-start gap-4"
              >
                {dot}
                <span className="text-lg text-brand-muted font-light leading-relaxed">
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
