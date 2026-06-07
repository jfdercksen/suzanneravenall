'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const covers = [
  {
    src: '/images/media/magazine-ceo-cover3.jpg',
    alt: 'Dr. Suzanne Ravenall on the cover of CEO Magazine — third feature edition',
    publication: 'CEO Magazine',
    rotate: -2,
  },
  {
    src: '/images/media/magazine-ceo-global.jpg',
    alt: 'Dr. Suzanne Ravenall featured on the cover of CEO Global Magazine',
    publication: 'CEO Global',
    rotate: 1,
  },
  {
    src: '/images/media/magazine-ceo.jpg',
    alt: 'Dr. Suzanne Ravenall on the front cover of CEO Magazine',
    publication: 'CEO Magazine',
    rotate: -1,
  },
  {
    src: '/images/media/magazine-feature.jpg',
    alt: 'Dr. Suzanne Ravenall magazine cover feature',
    publication: 'Cover Feature',
    rotate: 2,
  },
]

export function MagazineCovers() {
  return (
    <section aria-labelledby="magazine-covers-heading" className="bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-16 lg:mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
            Cover Features
          </p>
          <h2 id="magazine-covers-heading" className="text-4xl lg:text-6xl font-light text-brand-primary">
            Recognised as a leading voice in transformation
          </h2>
        </motion.div>

        {/* Cover grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {covers.map((cover, i) => (
            <motion.div
              key={cover.src}
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              <motion.div
                className="relative w-full aspect-[3/4] rounded-card overflow-hidden"
                animate={{ rotate: cover.rotate, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                whileHover={{ rotate: 0, scale: 1.03, y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Image
                  src={cover.src}
                  alt={cover.alt}
                  fill
                  sizes="(max-width: 1024px) 45vw, 22vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </motion.div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-[0.2em]">
                {cover.publication}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
