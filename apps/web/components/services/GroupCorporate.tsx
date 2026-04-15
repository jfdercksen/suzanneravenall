'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const groupOfferings = [
  {
    name: 'Money Mastery',
    description:
      'Given the opportunity, everyone would love to accumulate more wealth and live a more abundant life. Many people have a poor relationship with money and as a result struggle to manifest the financial success they desire. Change that — at the root.',
  },
  {
    name: 'Love & Relationships',
    description:
      'We attract people at our common level of woundedness or emotional health. To attract a healthy, loving partner you need to become that healthy person first. The energy you project has everything to do with the person you attract.',
  },
  {
    name: 'Career Progression',
    description:
      'To activate the Law of Attraction in your career, you must identify and change the limiting beliefs that have been internalised since childhood — and accepted as true even when they are not.',
  },
  {
    name: 'Shedding Excess Weight',
    description:
      'We hold onto excess weight because our earlier childhood needs were not met. We build survival strategies, bury them, and carry them quietly into adulthood. This series brings them into the light so the body can let go.',
  },
  {
    name: 'Overcoming the Need to Fix Others',
    description:
      'We respond to a lack of unconditional love by wanting to make everything okay — learning as small children it is safe to fix others’ problems. A 4-week repatterning series: part coaching, part class, full release.',
  },
  {
    name: 'Being a Great Boundary Setter',
    description:
      'Setting boundaries is one of the most challenging aspects of being human — and something 99% of us were never taught. A 4-week series to understand what a boundary is, when it has been transgressed, and how to hold one in place.',
  },
  {
    name: 'Nice or Not Nice Communication',
    description:
      'We learn in early childhood to receive love and acceptance only by being nice or agreeable — a pattern with a flipside of cutting anger when it becomes too much. A 4-week series to move into a new way of being.',
  },
  {
    name: 'Attraction Frequency',
    description:
      'A vibration is a state of being — the energetic quality of a person, place, thought, or thing. In this Group Repatterning class, resonate with the attraction frequency and manifest your own positivity, light, and love.',
  },
  {
    name: 'Develop Super Confidence',
    description:
      'Confidence within oneself is a complete game changer. As Henry Ford said: “Whether you think you can, or you think you can’t — you’re right.” This series builds the belief that underwrites every game-changing choice.',
  },
]

export default function GroupCorporate() {
  return (
    <motion.section
      id="group"
      aria-labelledby="group-heading"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-white py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Group &amp; Corporate
          </p>
          <h2
            id="group-heading"
            className="text-4xl md:text-6xl font-light text-brand-primary-900 leading-tight mb-8"
          >
            Group Sessions &amp; Corporate Wellness Retreats.
          </h2>
          <p className="text-lg text-gray-700 font-light leading-relaxed">
            Through a comfortable, authentic and safe environment, Suzanne runs short
            group series that tackle the key issues affecting most people — getting
            into the unconscious beliefs that disrupt lives and helping participants
            move beyond these challenges and into their power to inner self mastery.
            It simply creates a better life for those courageous enough to try.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groupOfferings.map((offering, idx) => (
            <motion.article
              key={offering.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative bg-gray-50 border border-gray-200 rounded-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/60 hover:shadow-card-hover"
            >
              <h3 className="text-xl font-semibold text-brand-primary-900 mb-4 group-hover:text-brand-accent transition-colors duration-300">
                {offering.name}
              </h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                {offering.description}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 rounded-card bg-brand-primary-900 p-10 md:p-14 text-white">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            For Teams &amp; Organisations
          </p>
          <h3 className="text-2xl md:text-4xl font-light mb-6 leading-tight">
            Corporate Wellness Retreats — bespoke programmes for your team.
          </h3>
          <p className="text-white/70 font-light leading-relaxed mb-8 max-w-3xl">
            Retreats and in-house series designed around the issues your people carry
            into work every day. {/* [CONFIRM: exact corporate retreat formats, duration, and pricing — scraped page lists offering but no package detail] */}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
          >
            Enquire
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
