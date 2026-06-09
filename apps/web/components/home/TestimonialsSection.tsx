'use client'

import { motion } from 'framer-motion'

// TODO (pre-launch blocker): Replace ALL placeholder testimonials with real client quotes
// before DNS cutover. Required per entry: full name, role, company, city, and a headshot photo.
// Avatars must NOT be initials-only — use real photos for credibility.

// NOTE: Tailwind JIT requires complete class names — never interpolate these strings.
const testimonials = [
  {
    quote: "Dr. Suzanne's Neuro-Repatterning® method is unlike anything I've experienced. The shift was immediate and it has lasted.",
    name: 'James T.',
    title: 'Executive Director, Johannesburg',
    result: 'Leadership transformation',
    initials: 'JT',
    color: 'bg-brand-primary-700',
  },
  {
    quote: "I came in sceptical. Within weeks I had clarity I hadn't felt in years and landed a partnership I'd been chasing for two years.",
    name: 'Priya K.',
    title: 'Entrepreneur, Durban',
    result: 'Landed 7-figure partnership',
    initials: 'PK',
    color: 'bg-brand-primary-600',
  },
  {
    // TODO: Real client testimonial — replace this placeholder before launch
    quote: 'TODO: Real testimonial from Suzanne\'s client files.',
    name: 'TODO: Real client name',
    title: 'TODO: Role, Company, City',
    result: 'TODO: Specific measurable result',
    initials: 'XX',
    color: 'bg-brand-accent',
  },
]

export default function TestimonialsSection() {
  return (
    <section aria-labelledby="testimonials-heading" className="py-20 lg:py-32 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4">

        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
            Client Results
          </p>
          <h2 id="testimonials-heading" className="text-4xl lg:text-6xl font-light text-white">
            Real people. Real breakthroughs.
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(({ quote, name, title, result, initials, color }, i) => (
            <motion.figure
              key={name}
              className="relative flex flex-col bg-white/5 border border-white/10 rounded-card p-8 hover:border-brand-accent/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              <div className="text-brand-accent/30 text-8xl font-serif leading-none select-none absolute top-4 left-6">&ldquo;</div>

              <blockquote className="relative text-white/80 text-base leading-relaxed flex-1 mt-4">
                {quote}
              </blockquote>

              <figcaption className="mt-6">
                <div className="inline-flex items-center gap-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-none" />
                  <span className="text-brand-accent text-xs font-semibold uppercase tracking-wide">
                    {result}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center flex-none`}>
                    <span className="text-white text-sm font-semibold">{initials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{name}</p>
                    <p className="text-white/50 text-xs">{title}</p>
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
