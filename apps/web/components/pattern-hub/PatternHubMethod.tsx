'use client'

import { motion } from 'framer-motion'

const layers = [
  {
    number: '01',
    title: 'Nervous system',
    description: 'The automatic responses that fire before conscious thought does.',
  },
  {
    number: '02',
    title: 'Subconscious conditioning',
    description: 'The beliefs and associations laid down long before you could question them.',
  },
  {
    number: '03',
    title: 'Identity architecture',
    description: 'The internal story of who you are that quietly sets your ceiling.',
  },
]

export default function PatternHubMethod() {
  return (
    <section aria-labelledby="pattern-hub-method-heading" className="w-full bg-gray-50 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16 lg:mb-20"
        >
          <h2
            id="pattern-hub-method-heading"
            className="text-3xl lg:text-5xl font-semibold tracking-tight text-brand-primary leading-tight mb-4"
          >
            The Method Behind the Work
          </h2>
          <p className="text-base lg:text-lg text-gray-600">
            Rapid Repatterning® works at the level where patterns are formed
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8 mb-16 lg:mb-20">
          {layers.map((layer, idx) => (
            <motion.div
              key={layer.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <p className="text-brand-accent font-black text-2xl mb-3">{layer.number}</p>
              <h3 className="text-lg font-semibold text-brand-primary mb-2">{layer.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{layer.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="italic text-brand-primary text-center text-xl"
        >
          This is why change is not temporary. It&rsquo;s structural.
        </motion.p>
      </div>
    </section>
  )
}