'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

// TODO: Replace placeholder images with real focus area photos from Suzanne
const areas = [
  {
    title: 'Mindset & Beliefs',
    description: 'Rewire the patterns holding you back',
    image: '/images/focus/mindset.webp',
    href: '/services#mindset',
  },
  {
    title: 'Neuro-Repatterning™',
    description: "Suzanne's proprietary methodology",
    image: '/images/focus/neuro.jpg',
    href: '/services#neuro',
  },
  {
    title: 'Relationships',
    description: 'Build connections that elevate you',
    image: '/images/focus/relationships.webp',
    href: '/services#relationships',
  },
  {
    title: 'Business & Leadership',
    description: 'Lead with clarity and conviction',
    image: '/images/focus/business.jpg',
    href: '/services#business',
  },
  {
    title: 'Health & Wellbeing',
    description: 'Energy, vitality and lasting resilience',
    image: '/images/focus/health.webp',
    href: '/services#health',
  },
  {
    title: 'Life Purpose',
    description: 'Align every decision with your why',
    image: '/images/focus/purpose.webp',
    href: '/services#purpose',
  },
]

export default function FocusAreas() {
  const [activeArea, setActiveArea] = useState(0)
  const activeItem = areas[activeArea] ?? areas[0]!

  return (
    <section aria-label="Areas of Focus" className="bg-white py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <h2 className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-16">
          Areas of Focus
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Mobile-only: active image above list — AnimatePresence key-swap (one image in DOM) */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-sm lg:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeArea}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' as const }}
              >
                <Image
                  src={activeItem.image}
                  alt={activeItem.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* LEFT — stacked pillar list
              Row is split into a <button> (select) + <Link> (navigate) so that
              tapping on mobile sets the active state without immediately navigating. */}
          <ul className="space-y-0 divide-y divide-gray-200">
            {areas.map((area, i) => {
              const isActive = activeArea === i
              return (
                <li key={area.title}>
                  <div
                    className={`flex items-center justify-between py-6 transition-all duration-300 ${isActive ? 'text-brand-primary' : 'text-gray-300'
                      }`}
                  >
                    {/* Button: selects the area (no navigation) */}
                    <button
                      type="button"
                      onMouseEnter={() => setActiveArea(i)}
                      onClick={() => setActiveArea(i)}
                      aria-current={isActive ? 'true' : undefined}
                      className="text-left flex-1 group hover:text-gray-500 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <span className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tight block">
                        {area.title}
                      </span>
                      <span
                        aria-hidden={!isActive}
                        className={`text-sm text-gray-500 mt-1 block transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                      >
                        {area.description}
                      </span>
                    </button>

                    {/* Link: explicit navigate affordance */}
                    <Link
                      href={area.href}
                      aria-label={`Explore ${area.title}`}
                      className="ml-4 flex-shrink-0"
                    >
                      <ChevronRight
                        className={`w-5 h-5 transition-all duration-300 ${isActive
                          ? 'text-brand-accent translate-x-1'
                          : 'text-gray-300 hover:text-gray-400'
                          }`}
                      />
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* RIGHT — image panel, desktop only — AnimatePresence key-swap (one image in DOM) */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm hidden lg:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeArea}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' as const }}
              >
                <Image
                  src={activeItem.image}
                  alt={activeItem.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
}
