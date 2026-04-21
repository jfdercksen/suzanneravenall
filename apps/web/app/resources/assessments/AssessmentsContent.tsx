'use client'

import { motion } from 'framer-motion'
import EmailNotifyForm from './EmailNotifyForm'

const assessmentTypes = [
  {
    title: 'Pattern Recognition',
    description: 'Identify the unconscious patterns shaping your relationships and results.',
  },
  {
    title: 'Emotional Mastery Profile',
    description: 'Understand your emotional response patterns and triggers.',
  },
  {
    title: 'Life Design Assessment',
    description: 'Map your current reality against your ideal future.',
  },
]

export default function AssessmentsContent() {
  return (
    <main>
      <section className="w-full bg-brand-primary min-h-[70vh] flex items-center py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              Coming Soon
            </p>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6">Assessments</h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed">
              Self-assessment tools to help you identify your patterns and chart your transformation path.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="w-full bg-gray-950 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">Be First to Know</h2>
            <p className="text-lg text-white/60">We&apos;ll notify you when assessments launch.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <EmailNotifyForm />
          </motion.div>
        </div>
      </section>

      <section className="w-full bg-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Coming Soon
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900">What to Expect</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {assessmentTypes.map(({ title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
