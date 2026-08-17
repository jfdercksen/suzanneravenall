'use client'

import { motion } from 'framer-motion'
import { homepageTestimonials } from '@/data/testimonials'

// Testimonial data lives in data/testimonials.ts — the single source of truth.
// Entries require Dr. Suzanne Ravenall's verified sign-off before being added.
// While the list is empty this component renders nothing.

// NOTE: Tailwind JIT requires complete class names — never interpolate these strings.
const avatarColors = ['bg-brand-primary-700', 'bg-brand-primary-600', 'bg-brand-accent']

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function TestimonialsSection() {
  if (homepageTestimonials.length === 0) return null

  return (
    <section aria-labelledby="testimonials-heading" className="py-20 lg:py-32 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4">

        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent-400 text-xs font-medium uppercase tracking-[0.3em] mb-3">
            Client Results
          </p>
          <h2 id="testimonials-heading" className="text-4xl lg:text-6xl font-light text-white">
            Real people. Real breakthroughs.
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {homepageTestimonials.map(({ quote, name, title, result }, i) => (
            <motion.figure
              key={name}
              className="relative flex flex-col bg-white/5 border border-white/10 rounded-card p-8 hover:border-brand-accent/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              <div className="text-brand-accent/30 text-8xl font-serif leading-none select-none absolute top-4 left-6">&ldquo;</div>

              <blockquote className="relative text-white/80 text-base leading-relaxed flex-1 mt-4">
                {quote}
              </blockquote>

              <figcaption className="mt-6">
                {result && (
                  <div className="inline-flex items-center gap-1.5 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-none" />
                    <span className="text-brand-accent-400 text-xs font-semibold uppercase tracking-wide">
                      {result}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center flex-none`}>
                    <span className="text-white text-sm font-semibold">{initialsFor(name)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{name}</p>
                    {title && <p className="text-white/70 text-xs">{title}</p>}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
