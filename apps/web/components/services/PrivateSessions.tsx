'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { allPrivateSessions } from '@/data/privateSessions'

// Card background image per session, keyed by slug. Kept here (not in the data
// file) because images are a presentation concern of this section.
const sessionImages: Record<string, string> = {
  'resonance-repatterning': '/images/generated/explore-repatterning.webp',
  'transformational-coaching': '/images/generated/explore-transformation.webp',
  'executive-coaching': '/images/generated/explore-transformation.webp',
  'rapid-transformational-therapy': '/images/generated/explore-resonance.webp',
  'rapid-repatterning': '/images/generated/explore-repatterning.webp',
  'akashic-intuitive-mastery': '/images/generated/explore-akashic.webp',
  'group-family-coaching': '/images/generated/group-coaching-real.webp',
  'exploring-the-alpha-mind': '/images/generated/explore-mindfulness.webp',
  'energetic-realignment-optimisation': '/images/generated/explore-energy.webp',
}

const fallbackImage = '/images/generated/explore-repatterning.webp'

export default function PrivateSessions() {
  return (
    <motion.section
      id="private"
      aria-labelledby="private-heading"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-white py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            1-on-1 with Suzanne
          </p>
          <h2
            id="private-heading"
            className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight mb-8"
          >
            Private Sessions to unlock the root cause — and go beyond it.
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Suzanne helps you get to the root cause of the key issues disrupting your
            life, track the patterns through the impact, and break through into self
            mastery. You close the gap from where you are to where you want to be.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allPrivateSessions.map((session, idx) => (
            <motion.article
              key={session.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative overflow-hidden min-h-[220px] bg-gray-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-2xl"
            >
              <Image
                src={sessionImages[session.slug] ?? fallbackImage}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent"
              />
              <div className="relative z-10 flex h-full flex-col p-8">
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-brand-accent transition-colors duration-300">
                  {session.title}
                </h3>
                <p className="text-sm text-white/65 font-light leading-relaxed">
                  {session.shortDescription}
                </p>
                <Link
                  href={`/services/private-sessions/${session.slug}`}
                  className="mt-auto pt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent transition-colors duration-300 hover:text-white"
                >
                  More Information
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
          >
            Book Discovery Call
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
