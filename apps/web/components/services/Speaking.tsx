'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

// Section is dark (bg-gray-950) to maintain dark/light alternation after
// GroupCorporate (bg-white). Text colours updated accordingly.
const topics = [
  {
    name: 'Conversations with My Brain',
    description:
      'After suffering a traumatic brain injury, stroke and several life-or-death traumas, Suzanne is living proof that you can re-train your brain. We learn beliefs in early childhood that get buried deep in the unconscious — and wonder years later why the same patterns of failure, pain or trauma keep reoccurring.',
  },
  {
    name: 'Recycling My Soul',
    description:
      'With all this talk of consciousness in the world — what does it mean? In the context of my life and work, how does my consciousness impact another? How does it impact me? In practical terms, how does my behaviour and my level of consciousness draw my experiences to me? The science of entanglement.',
  },
  {
    name: 'Second Time Around',
    description:
      'In this keynote we learn how our early lives define our choices, decisions and beliefs — why we seem unable to move forward, and critically, what it takes to have a restart. A "second time around": a new way of being where all possibilities are available — it is just learning how to navigate and tap into your innate potential.',
  },
  {
    name: 'Trauma to Transcendence',
    description:
      'Suzanne weaves her way through this challenging topic — helping us understand where buried trauma comes from, how it shows up, how your nervous system responds or breaks down, and how to turn trauma into transcendence: changing your body/mind and bringing homeostasis back to your system.',
  },
]

export default function Speaking() {
  return (
    <motion.section
      id="speaking"
      aria-labelledby="speaking-heading"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-gray-950 py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Speaking &amp; Keynotes
          </p>
          <h2
            id="speaking-heading"
            className="text-4xl md:text-6xl font-light text-white leading-tight mb-8"
          >
            Customised, real, authentic — keynotes that cut to what underlies human
            behaviour.
          </h2>
          <p className="text-lg text-white/70 font-light leading-relaxed mb-6">
            As a keynote speaker, Suzanne takes audiences on a journey of inner
            transformation — changing lives from the inside out. When we turn on the
            magic on the inside and capitalise on it, we begin to transform in
            unimaginable ways, and that shows up in every-day life.
          </p>
          <p className="text-lg text-white/70 font-light leading-relaxed">
            More resilience to navigate today&apos;s challenging world. More courage and
            confidence than you ever thought possible. The power of our own innate
            wisdom, energy and mind — to respond, not react, to life.
          </p>
        </div>

        <figure className="max-w-4xl mb-16 border-l-2 border-brand-accent pl-6">
          <blockquote className="text-2xl md:text-3xl font-light italic text-white leading-snug">
            &ldquo;Life is an adventure or nothing at all.&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-xs uppercase tracking-[0.3em] font-medium text-white/50">
            Helen Keller
          </figcaption>
        </figure>

        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Signature Keynote Topics
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {topics.map((topic, idx) => (
            <motion.article
              key={topic.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative bg-gray-900 border border-white/5 rounded-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-2xl"
            >
              <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-brand-accent transition-colors duration-300">
                {topic.name}
              </h3>
              <p className="text-sm text-white/65 font-light leading-relaxed">
                {topic.description}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
          >
            Book Suzanne to Speak
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
