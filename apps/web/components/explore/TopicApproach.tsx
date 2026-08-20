'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'

export default function TopicApproach({ topic }: { topic: Topic }) {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section
      id="approach"
      aria-labelledby="topic-approach-heading"
      className="w-full bg-gray-50 py-20 lg:py-32 border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-3xl mb-16 lg:mb-20"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Suzanne&apos;s Method
          </p>
          <h2
            id="topic-approach-heading"
            className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary leading-tight mb-6"
          >
            How Suzanne works{' '}
            <span className="text-brand-accent">through this</span>
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed max-w-2xl">
            Using Rapid Repatterning®, we work at the level where patterns are
            formed. This is not about coping. This is about changing the pattern.
          </p>
        </motion.div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block">
          {/* Step nodes + connector line */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="relative flex items-start gap-0 mb-12"
          >
            {/* Connecting line */}
            <div
              aria-hidden="true"
              className="absolute top-6 left-6 right-6 h-px bg-gray-200"
            />

            {topic.approach.map((stage, index) => (
              <button
                key={stage.step}
                type="button"
                onClick={() => setActiveStep(index)}
                className="relative flex-1 flex flex-col items-center gap-4 group focus:outline-none"
                aria-current={activeStep === index ? 'step' : undefined}
                aria-label={`Step ${stage.step}: ${stage.title}`}
              >
                {/* Node circle */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${activeStep === index
                      ? 'border-brand-accent bg-brand-accent text-white shadow-[0_0_20px_theme(colors.brand.accent/40%)]'
                      : 'border-gray-300 bg-white text-gray-400 group-hover:border-brand-accent/60 group-hover:text-gray-600'
                    }`}
                >
                  <span className="text-xs font-medium tracking-wider">{stage.step}</span>
                </div>

                {/* Step title below node */}
                <span
                  className={`text-xs uppercase tracking-[0.2em] font-medium text-center leading-tight transition-colors duration-300 px-2
                    ${activeStep === index ? 'text-brand-accent' : 'text-gray-400 group-hover:text-gray-600'}`}
                >
                  {stage.title}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Active step detail panel */}
          <div className="relative min-h-[140px]">
            <AnimatePresence mode="wait">
              {activeStep >= 0 && topic.approach[activeStep] && (
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="rounded-card border-l-2 border-brand-accent bg-white shadow-sm p-10"
                >
                  <div className="flex items-start gap-8">
                    <span
                      aria-hidden="true"
                      className="text-6xl font-light text-brand-accent/20 leading-none select-none shrink-0"
                    >
                      {topic.approach[activeStep].step}
                    </span>
                    <div>
                      <h3 className="text-2xl font-light text-brand-primary mb-3">
                        {topic.approach[activeStep].title}
                      </h3>
                      <p className="text-lg text-gray-600 font-light leading-relaxed max-w-2xl">
                        {topic.approach[activeStep].body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: vertical accordion */}
        <ol className="lg:hidden space-y-3">
          {topic.approach.map((stage, index) => {
            const isOpen = activeStep === index
            return (
              <motion.li
                key={stage.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
              >
                <button
                  type="button"
                  onClick={() => setActiveStep(isOpen ? -1 : index)}
                  className={`w-full flex items-center gap-5 p-6 rounded-card border transition-all duration-300 text-left
                    ${isOpen
                      ? 'border-brand-accent bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-medium tracking-wider transition-all duration-300
                      ${isOpen ? 'border-brand-accent bg-brand-accent text-white' : 'border-gray-300 text-gray-400'}`}
                  >
                    {stage.step}
                  </span>
                  <span
                    className={`flex-1 text-base font-light uppercase tracking-[0.15em] transition-colors duration-300
                      ${isOpen ? 'text-brand-primary' : 'text-gray-500'}`}
                  >
                    {stage.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-3 border-x border-b border-brand-accent bg-white rounded-b-card">
                        <p className="text-base text-gray-600 font-light leading-relaxed">
                          {stage.body}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
