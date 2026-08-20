'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Take the Diagnostic',
    description: 'Answer targeted questions',
  },
  {
    number: '02',
    title: 'Discover Your Pattern',
    description: 'Get a personalised result',
  },
  {
    number: '03',
    title: 'Understand the Root Cause',
    description: 'Learn why it formed',
  },
  {
    number: '04',
    title: 'Repattern',
    description: 'Shift at the level where change happens',
  },
]

export default function PatternHubHowItWorks() {
  return (
    <section aria-labelledby="pattern-hub-how-heading" className="w-full bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          id="pattern-hub-how-heading"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary mb-16 lg:mb-20"
        >
          How This Works
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <p className="text-6xl font-black text-brand-accent/20 mb-4" aria-hidden="true">
                {step.number}
              </p>
              <h3 className="text-lg font-semibold text-brand-primary mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}