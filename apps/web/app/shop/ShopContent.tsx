'use client'

import Link from 'next/link'
import { BookOpen, Phone, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import FeaturedPrograms from '@/components/home/FeaturedPrograms'

export default function ShopContent() {
  return (
    <main>
      <section className="w-full bg-brand-primary min-h-[60vh] flex items-center py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              Coming Soon
            </p>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6">The Shop is Coming</h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed">
              Programs and digital resources will be available to purchase here. In the meantime,
              explore our coaching programmes.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="w-full bg-gray-950 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Link
              href="/programs"
              className="group relative bg-gray-900 rounded-2xl p-10 flex flex-col gap-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-light text-white mb-3">Explore Programmes</h2>
                <p className="text-white/60 leading-relaxed">
                  Discover 1:1 intensives, group transformation programmes, and practitioner
                  certification — built to create lasting change.
                </p>
              </div>
              <div className="flex items-center gap-2 text-brand-accent font-medium">
                View programmes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </Link>

            <Link
              href="/contact"
              className="group relative bg-brand-accent/10 border border-brand-accent rounded-2xl p-10 flex flex-col gap-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-accent/20 text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                <Phone className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-light text-white mb-3">Book a Discovery Call</h2>
                <p className="text-white/60 leading-relaxed">
                  Not sure which programme is right for you? A 30-minute discovery call with
                  Dr. Ravenall will give you clarity.
                </p>
              </div>
              <div className="flex items-center gap-2 text-brand-accent font-medium">
                Book your call
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      <FeaturedPrograms />
    </main>
  )
}
