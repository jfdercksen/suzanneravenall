'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' } as const,
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'How long is a discovery call?',
    answer: '30 minutes, completely free, no obligation.',
  },
  {
    id: 'faq-2',
    question: 'Where are sessions held?',
    answer:
      'All sessions are online via Zoom. In-person sessions in Cape Town are available for local clients.', // [CONFIRM]
  },
  {
    id: 'faq-3',
    question: 'Do you work with international clients?',
    answer: 'Yes. Clients come from over 30 countries across 6 continents.',
  },
] as const

function FAQItem({
  id,
  question,
  answer,
  delay,
}: {
  id: string
  question: string
  answer: string
  delay: number
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="border-b border-gray-200 last:border-b-0"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`${id}-answer`}
        id={`${id}-button`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-gray-900 font-semibold text-base md:text-lg pr-4 group-hover:text-brand-accent transition-colors duration-200">
          {question}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-5 h-5 shrink-0 text-brand-accent transition-transform duration-300 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`${id}-answer`}
            role="region"
            aria-labelledby={`${id}-button`}
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-600 text-sm md:text-base leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ContactFAQ() {
  return (
    <section
      aria-labelledby="contact-faq-heading"
      className="w-full bg-white py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4 text-center"
        >
          COMMON QUESTIONS
        </motion.p>

        <motion.h2
          id="contact-faq-heading"
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          className="text-4xl md:text-6xl font-light text-gray-900 text-center mb-14"
        >
          Quick Answers
        </motion.h2>

        <div className="max-w-3xl mx-auto">
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={item.id}
              id={item.id}
              question={item.question}
              answer={item.answer}
              delay={0.15 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
