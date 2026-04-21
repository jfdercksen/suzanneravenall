'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Tv,
  FileText,
  Trophy,
  Mail,
  Brain,
  ArrowRight,
} from 'lucide-react'

const categories = [
  {
    href: '/blog',
    icon: BookOpen,
    label: 'Blog',
    title: 'Insights & Articles',
    description:
      'Deep dives into transformation, neuroscience, patterns and human potential — written by Dr. Suzanne Ravenall.',
    badge: null,
  },
  {
    href: '/resources/media',
    icon: Tv,
    label: 'Media',
    title: 'TV, Podcast & Press',
    description:
      'Dr. Ravenall featured in Leadership Magazine, CEO Magazine and Business Excellence Award press. Read the coverage.',
    badge: null,
  },
  {
    href: '/resources/articles',
    icon: FileText,
    label: 'Articles',
    title: 'Published Articles',
    description:
      'Thought leadership published in major business and leadership publications including CEO Magazine and Leadership Magazine.',
    badge: null,
  },
  {
    href: '/resources/awards',
    icon: Trophy,
    label: 'Awards',
    title: 'Recognition & Honours',
    description:
      'Recognised across healthcare, business and leadership excellence — Global 100, CRF Best Employers, Healthcare & Pharmaceutical Awards and more.',
    badge: null,
  },
  {
    href: '/resources/newsletter',
    icon: Mail,
    label: 'Newsletter',
    title: 'Monthly Insights Newsletter',
    description:
      'Monthly wisdom on consciousness, healing, inner regulation and transformation delivered directly to your inbox.',
    badge: null,
  },
  {
    href: '/resources/assessments',
    icon: Brain,
    label: 'Assessments',
    title: 'Tools for Self-Discovery',
    description:
      'Interactive assessments to identify your patterns, blind spots and transformation potential.',
    badge: 'Coming Soon',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function ResourcesCategories() {
  return (
    <section aria-labelledby="categories-heading" className="w-full bg-gray-950 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
        >
          Explore
        </motion.p>

        <motion.h2
          id="categories-heading"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl lg:text-5xl font-light text-white mb-12"
        >
          Everything in one place
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map(({ href, icon: Icon, label, title, description, badge }) => (
            <motion.div key={label} variants={cardVariants}>
              <Link
                href={href}
                className="group relative flex flex-col bg-gray-900 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 h-full"
                aria-label={`${title} — ${label}`}
              >
                {badge && (
                  <span className="absolute top-6 right-6 text-xs font-medium uppercase tracking-wider bg-brand-accent/20 text-brand-accent rounded-full px-3 py-1">
                    {badge}
                  </span>
                )}

                <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent/20 transition-colors duration-300">
                  <Icon size={22} />
                </div>

                <p className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent mb-2">
                  {label}
                </p>

                <h3 className="text-xl font-semibold text-white mb-3 leading-snug">{title}</h3>

                <p className="text-sm text-gray-400 font-light leading-relaxed flex-1">
                  {description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-brand-accent group-hover:gap-3 transition-all duration-300">
                  <span>Explore</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
