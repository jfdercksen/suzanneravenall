'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const sessionTypes = [
  {
    name: 'Resonance Repatterning',
    description:
      'We attract people at our common level of woundedness or our common level of emotional health. The kind of energy you project has everything to do with the kind of person you attract — become the healthy self you want to meet.',
  },
  {
    name: 'Transformation, Behaviour & Executive Coaching',
    description:
      'Transformational Coaching has evolved as a more complete approach — shifting from a simple performance-focused tool to a holistic, humanistic and psychological focus. This process focuses on the whole person, not just what is noticeable on the surface.',
  },
  {
    name: 'Rapid Transformation Therapy®',
    description:
      'A hybrid therapy combining the most beneficial principles of Hypnotherapy, CBT (Cognitive Behavioral Therapy), Psychotherapy, NLP (Neuro Linguistic Programming) and Regression Therapy.',
  },
  {
    name: 'Rapid Repatterning®',
    description:
      'We think 60–70,000 thoughts a day — 90% of them the same as yesterday, driven by memorised beliefs and programmes. Those thoughts lead to the same choices, behaviours and emotions. Rapid Repatterning interrupts the loop at its root.',
  },
  {
    name: 'Akashic Intuitive Mastery',
    description:
      'Access and rewrite your life’s blueprint. Alter your relationship with success and improve your intuition to such an extent that you receive daily guidance in the direction you are moving in — it is completely possible.',
  },
  {
    name: 'Group Family Coaching',
    description:
      'Some family challenges are difficult to resolve without outside assistance. When we understand how our earliest perceptions and beliefs shape who we are, we can see how our make-up shows up in family dynamics — sometimes in helpful, sometimes in harmful ways.',
  },
  {
    name: 'Exploring the Alpha Mind',
    description:
      'A deep practice for accessing the alpha brainwave state — the gateway between conscious awareness and the unconscious programmes running your daily life.',
  },
  {
    name: 'Energetic Realignment & Optimisation',
    description:
      'Clearings for people, dwellings, businesses, animals, and properties worldwide. These clearings remove negative, imbalanced or stagnated energies. All clearings are performed remotely — a person does not need to be physically present.',
  },
]

export default function PrivateSessions() {
  return (
    <motion.section
      id="private"
      aria-labelledby="private-heading"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-gray-950 py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            1-on-1 with Suzanne
          </p>
          <h2
            id="private-heading"
            className="text-4xl md:text-6xl font-light text-white leading-tight mb-8"
          >
            Private Sessions to unlock the root cause — and go beyond it.
          </h2>
          <p className="text-lg text-white/70 font-light leading-relaxed">
            Suzanne helps you get to the root cause of the key issues disrupting your
            life, track the patterns through the impact, and break through into self
            mastery. You close the gap from where you are to where you want to be.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sessionTypes.map((session, idx) => (
            <motion.article
              key={session.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative overflow-hidden bg-gray-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-2xl"
            >
              <Image
                src="/images/hero-bg.jpg"
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent"
              />
              <div className="relative z-10 p-8">
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-brand-accent transition-colors duration-300">
                  {session.name}
                </h3>
                <p className="text-sm text-white/65 font-light leading-relaxed">
                  {session.description}
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
            Book Discovery Call
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
