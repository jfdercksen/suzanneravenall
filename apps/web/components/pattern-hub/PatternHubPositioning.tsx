'use client'

import { motion } from 'framer-motion'

const traits = ['Emotions', 'Relationships', 'Health', 'Decisions', 'Performance']

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function PatternHubPositioning() {
  return (
    <section aria-labelledby="pattern-hub-positioning-heading" className="w-full bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <motion.h2
            id="pattern-hub-positioning-heading"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-5xl font-light text-brand-primary leading-tight mb-8"
          >
            You Don&rsquo;t Have a Problem. You Have a Pattern.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5 text-base lg:text-lg text-gray-600 leading-relaxed"
          >
            <p>
              What you notice day to day — the argument that repeats, the
              exhaustion that won&rsquo;t lift, the hesitation before a big
              decision — is only the surface. Those are behaviours, and
              behaviours are what a pattern looks like from the outside.
            </p>
            <p>
              Underneath, your nervous system has encoded a response that
              runs automatically, long before conscious thought gets
              involved. It formed for a reason, once served a purpose, and
              now repeats whether or not it still serves you.
            </p>
            <p>
              Each diagnostic below is built to surface exactly that: the
              pattern quietly driving your emotions, your relationships,
              your health, your decisions and your performance — so you can
              finally see what has been running the show.
            </p>
          </motion.div>

          <motion.ul
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="flex flex-wrap gap-x-8 gap-y-3 mt-10"
          >
            {traits.map((trait) => (
              <motion.li
                key={trait}
                variants={itemVariants}
                className="flex items-center gap-2 text-brand-primary font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" aria-hidden="true" />
                {trait}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  )
}