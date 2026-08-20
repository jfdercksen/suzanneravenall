'use client'

import { motion } from 'framer-motion'

const labeledAs = ['Anxiety', 'Burnout', 'Relationship struggles', 'Lack of clarity']

export default function PatternHubDeeperPositioning() {
  return (
    <section aria-labelledby="pattern-hub-deeper-heading" className="w-full bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          id="pattern-hub-deeper-heading"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary mb-16 lg:mb-20 max-w-3xl"
        >
          This Isn&rsquo;t Personality. It&rsquo;s Patterning.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.ul
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              What People Call It
            </p>
            {labeledAs.map((label) => (
              <li key={label} className="flex items-center gap-3 text-gray-700 text-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0" aria-hidden="true" />
                {label}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-5 text-base lg:text-lg text-gray-600 leading-relaxed"
          >
            <p>
              These aren&rsquo;t fixed traits or flaws in your character.
              They&rsquo;re patterned responses your system learned, ways of
              coping, protecting and adapting that made sense once and now
              run on autopilot.
            </p>
            <p>
              And anything that was learned can be relearned. That&rsquo;s
              not a motivational idea. It&rsquo;s how the nervous system
              actually works.
            </p>
            <p>
              This is the work of{' '}
              <span className="text-brand-accent font-medium">Rapid Repatterning®</span>
              : going beneath the behaviour to the pattern that produces it,
              and changing it at that level.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}