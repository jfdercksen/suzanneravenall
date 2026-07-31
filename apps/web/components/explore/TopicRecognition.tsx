'use client'

import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function TopicRecognition({ topic }: { topic: Topic }) {
  const isOddCount = topic.recognitionItems.length % 2 !== 0

  return (
    <section
      aria-labelledby="topic-recognition-heading"
      className="relative w-full bg-brand-primary overflow-hidden py-20 lg:py-32"
    >
      {/* Subtle accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-brand-accent/8 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...fadeUp(0)}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-6 text-center"
        >
          Sound Familiar?
        </motion.p>
        <motion.h2
          id="topic-recognition-heading"
          {...fadeUp(0.1)}
          className="text-4xl lg:text-6xl font-light text-white leading-tight text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          You Might Recognise This&hellip;
        </motion.h2>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl mx-auto">
          {topic.recognitionItems.map((item, index) => {
            const isTrailingOdd = isOddCount && index === topic.recognitionItems.length - 1
            return (
              <motion.li
                key={`${topic.slug}-recognition-${index}`}
                {...fadeUp(0.15 + index * 0.05)}
                className={`flex items-start gap-4 ${isTrailingOdd ? 'sm:col-span-2 sm:justify-center' : ''}`}
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent-400"
                />
                <span className="text-lg text-white/80 font-light leading-relaxed">
                  {item}
                </span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
