'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Section is light (bg-white) — position 4 in dark/light alternation after GroupCorporate (dark).
const topics = [
  {
    name: 'Conversations with My Brain',
    image: '/images/hero-bg-suzanne-ravenall.jpg',
    description:
      'After suffering a traumatic brain injury, stroke and several life-or-death traumas, Suzanne is living proof that you can re-train your brain. We learn beliefs in early childhood that get buried deep in the unconscious — and wonder years later why the same patterns of failure, pain or trauma keep reoccurring.',
  },
  {
    name: 'Recycling My Soul',
    image: '/images/generated/explore-transformation.webp',
    description:
      'With all this talk of consciousness in the world — what does it mean? In the context of my life and work, how does my consciousness impact another? How does it impact me? In practical terms, how does my behaviour and my level of consciousness draw my experiences to me? The science of entanglement.',
  },
  {
    name: 'Second Time Around',
    image: '/images/generated/explore-repatterning.webp',
    description:
      'In this keynote we learn how our early lives define our choices, decisions and beliefs — why we seem unable to move forward, and critically, what it takes to have a restart. A "second time around": a new way of being where all possibilities are available — it is just learning how to navigate and tap into your innate potential.',
  },
  {
    name: 'Trauma to Transcendence',
    image: '/images/focus/business.jpg',
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
      className="relative w-full bg-white py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Speaking &amp; Keynotes
          </p>
          <h2
            id="speaking-heading"
            className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight mb-8"
          >
            Customised, real, authentic — keynotes that cut to what underlies human
            behaviour.
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed mb-6">
            As a keynote speaker, Suzanne takes audiences on a journey of inner
            transformation — changing lives from the inside out. When we turn on the
            magic on the inside and capitalise on it, we begin to transform in
            unimaginable ways, and that shows up in every-day life.
          </p>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            More resilience to navigate today&apos;s challenging world. More courage and
            confidence than you ever thought possible. The power of our own innate
            wisdom, energy and mind — to respond, not react, to life.
          </p>
        </div>

        <figure className="max-w-4xl mb-16 border-l-2 border-brand-accent pl-6">
          <blockquote className="text-2xl lg:text-3xl font-light italic text-brand-primary leading-snug">
            &ldquo;When we decode hidden patterns, we transform in unimaginable ways.
            That shift radiates outward — into how we lead, grow, relate, love, and
            show up.&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-xs uppercase tracking-[0.3em] font-medium text-gray-600">
            Dr. Suzanne Ravenall
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
              className="group relative overflow-hidden min-h-[280px] bg-gray-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-2xl"
            >
              <Image
                src={topic.image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent"
              />
              <div className="relative z-10 p-8">
                <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-brand-accent transition-colors duration-300">
                  {topic.name}
                </h3>
                <p className="text-sm text-white/65 font-light leading-relaxed">
                  {topic.description}
                </p>
              </div>
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
