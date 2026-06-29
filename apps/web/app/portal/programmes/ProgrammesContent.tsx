'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { ProgrammeItem } from './page'

interface ProgrammesContentProps {
  programmes: ProgrammeItem[]
}

type FilterKey = 'All' | 'Live' | 'Self Study' | 'In-Person'

const FILTERS: FilterKey[] = ['All', 'Live', 'Self Study', 'In-Person']

const DELIVERY_BADGE: Record<string, string> = {
  Live: 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30',
  'Self Study': 'bg-green-500/20 text-green-300 border border-green-500/30',
  'In-Person': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function normaliseDelivery(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('live') || lower.includes('zoom') || lower.includes('group')) return 'Live'
  if (lower.includes('in-person') || lower.includes('in person')) return 'In-Person'
  return 'Self Study'
}

function ProgrammeCard({ programme }: { programme: ProgrammeItem }) {
  const delivery = normaliseDelivery(programme.deliveryMethod)
  const badgeClass = DELIVERY_BADGE[delivery] ?? DELIVERY_BADGE['Self Study']

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
      }}
      className="group flex flex-col bg-gray-900 rounded-card overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-brand-primary to-gray-900 overflow-hidden">
        {programme.thumbnailUrl ? (
          <Image
            src={programme.thumbnailUrl}
            alt={programme.title}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/10">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
            {delivery}
          </span>
          <span className="text-white/30 text-xs">Purchased {formatDate(programme.purchasedAt)}</span>
        </div>

        <h3 className="text-white font-semibold leading-snug mb-4 flex-1">
          {programme.title}
        </h3>

        {/* TODO: Link to dedicated programme portal page once LMS is built (Phase 4).
            Currently links to portal resources as a placeholder. */}
        <Link
          href="/portal/resources"
          className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-semibold rounded-button transition-colors duration-300"
        >
          Access Programme
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </motion.article>
  )
}

export default function ProgrammesContent({ programmes }: ProgrammesContentProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All')

  const filtered = programmes.filter((p) => {
    if (activeFilter === 'All') return true
    return normaliseDelivery(p.deliveryMethod) === activeFilter
  })

  return (
    <main className="relative w-full bg-brand-primary min-h-screen py-16 lg:py-24 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Member Portal
          </p>
          <h1 className="text-3xl lg:text-5xl font-light text-white mb-3">My Programmes</h1>
          <p className="text-lg text-white/60">
            Every programme you&apos;ve purchased — your personal transformation library.
          </p>
        </motion.div>

        {programmes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-brand-accent text-white'
                    : 'bg-gray-900 text-white/50 hover:text-white hover:bg-gray-800'
                }`}
              >
                {filter}
                {filter !== 'All' && (
                  <span className="ml-1.5 text-xs opacity-60">
                    ({programmes.filter((p) => normaliseDelivery(p.deliveryMethod) === filter).length})
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {programmes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="py-20 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-900 flex items-center justify-center text-white/20">
              <svg aria-hidden="true" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-white mb-3">No programmes yet</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Start your transformation journey by enrolling in one of Suzanne&apos;s coaching programmes.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-300"
            >
              Browse Programmes
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-white/50">No programmes match the &quot;{activeFilter}&quot; filter.</p>
            <button onClick={() => setActiveFilter('All')} className="mt-3 text-brand-accent text-sm hover:underline">
              Show all
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={{
              show: { transition: { staggerChildren: 0.08 } },
            }}
            initial="hidden"
            animate="show"
          >
            {filtered.map((programme) => (
              <ProgrammeCard key={programme.id} programme={programme} />
            ))}
          </motion.div>
        )}

        {/* Shop CTA at bottom when there are programmes */}
        {programmes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 flex flex-col sm:flex-row items-center gap-4 p-6 bg-gray-900 rounded-card"
          >
            <div className="flex-1 text-center sm:text-left">
              <p className="text-white font-semibold mb-1">Explore more programmes</p>
              <p className="text-white/50 text-sm">Deepen your practice with additional coaching programmes from Suzanne.</p>
            </div>
            <Link
              href="/shop"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 border border-white/20 hover:border-white/40 text-white text-sm font-semibold rounded-button transition-colors duration-300"
            >
              Browse Shop
            </Link>
          </motion.div>
        )}

      </div>
    </main>
  )
}

