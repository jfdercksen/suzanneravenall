'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { hasAccess, tierLabel, type TierSlug, type ResourceKey } from '@/lib/access/tiers'

interface VideoItem {
  id: string
  title: string
  description: string
  duration: string
  category: string
  resource: ResourceKey
  thumbnailColor: string
}

// Placeholder video catalogue — replace with Supabase video_content query once table is populated
const VIDEOS: VideoItem[] = [
  {
    id: 'intro-hpr-overview',
    title: 'Introduction to HPR — Welcome Session',
    description: 'Dr. Suzanne Ravenall introduces the Human Performance Replicator methodology.',
    duration: '28 min',
    category: 'Getting Started',
    resource: 'resources_basic',
    thumbnailColor: 'from-blue-900 to-brand-primary',
  },
  {
    id: 'group-session-rr-1',
    title: 'Rapid Repatterning — Group Session 1',
    description: 'Introduction to the RR process with live group practice.',
    duration: '90 min',
    category: 'Group Sessions',
    resource: 'group_sessions_recorded',
    thumbnailColor: 'from-purple-900 to-brand-primary',
  },
  {
    id: 'group-session-efs-1',
    title: 'Emotional Freedom Intensive',
    description: 'Neuroscience of emotional regulation with group experiential work.',
    duration: '2 hr',
    category: 'Group Sessions',
    resource: 'group_sessions_recorded',
    thumbnailColor: 'from-indigo-900 to-brand-primary',
  },
  {
    id: 'group-session-rel-heal',
    title: 'Relationship Healing Session',
    description: 'Clearing ancestral and relational energy patterns.',
    duration: '90 min',
    category: 'Group Sessions',
    resource: 'group_sessions_recorded',
    thumbnailColor: 'from-pink-900 to-brand-primary',
  },
  {
    id: 'live-gold-may-2026',
    title: 'Gold Cohort — May 2026 Intensive',
    description: 'Full 3-hour live coaching intensive with Gold members. Advanced patterns work.',
    duration: '3 hr',
    category: 'Live Sessions',
    resource: 'live_session_recordings',
    thumbnailColor: 'from-yellow-900 to-brand-primary',
  },
  {
    id: 'live-energy-leadership',
    title: 'VIP Masterclass — Energy Leadership',
    description: 'Exclusive masterclass on energy leadership for high-performance professionals.',
    duration: '2.5 hr',
    category: 'Live Sessions',
    resource: 'live_session_recordings',
    thumbnailColor: 'from-orange-900 to-brand-primary',
  },
]

const CATEGORIES = ['All', 'Getting Started', 'Group Sessions', 'Live Sessions']

interface VideoPlayerModalProps {
  videoId: string
  title: string
  onClose: () => void
}

function VideoPlayerModal({ videoId, title, onClose }: VideoPlayerModalProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/video/${videoId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load video')
        return res.json()
      })
      .then((data: { url: string }) => {
        setEmbedUrl(data.url)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        setError('Unable to load this video. Please try again.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [videoId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <p className="text-white font-semibold text-sm">{title}</p>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Close video"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="aspect-video bg-black">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="h-full flex items-center justify-center text-white/50 text-sm">
              {error}
            </div>
          )}
          {embedUrl && (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface VideoCardProps {
  video: VideoItem
  tier: TierSlug
  onWatch: (id: string, title: string) => void
}

function VideoCard({ video, tier, onWatch }: VideoCardProps) {
  const unlocked = hasAccess(tier, video.resource)
  const minTier = (['free', 'silver', 'gold', 'practitioner'] as TierSlug[]).find(
    (t) => hasAccess(t, video.resource),
  ) ?? 'silver'

  return (
    <div className="group flex flex-col bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className={`relative aspect-video bg-gradient-to-br ${video.thumbnailColor} flex items-center justify-center`}>
        {unlocked ? (
          <button
            onClick={() => onWatch(video.id, video.title)}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm group-hover:scale-110 transition-transform duration-300"
            aria-label={`Watch ${video.title}`}
          >
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-white/40 text-xs">{tierLabel(minTier)}</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <span className="bg-black/60 text-white/80 text-xs px-2 py-0.5 rounded backdrop-blur-sm">
            {video.duration}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <p className="text-xs uppercase tracking-widest text-brand-accent font-medium mb-2">
          {video.category}
        </p>
        <p className="text-white font-semibold leading-snug mb-2 text-sm">{video.title}</p>
        <p className="text-white/40 text-xs leading-relaxed flex-1">{video.description}</p>

        <div className="mt-4">
          {unlocked ? (
            <button
              onClick={() => onWatch(video.id, video.title)}
              className="w-full py-2.5 px-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-semibold rounded-xl transition-colors duration-300"
            >
              Watch Now
            </button>
          ) : (
            <Link
              href={`/portal/upgrade?from=${encodeURIComponent('/portal/videos')}`}
              className="block w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-white/50 hover:text-white text-sm font-semibold rounded-xl transition-colors duration-300 text-center"
            >
              Unlock with {tierLabel(minTier)}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

interface VideosContentProps {
  tier: TierSlug
}

export default function VideosContent({ tier }: VideosContentProps) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [playingVideo, setPlayingVideo] = useState<{ id: string; title: string } | null>(null)

  const filtered = activeCategory === 'All'
    ? VIDEOS
    : VIDEOS.filter((v) => v.category === activeCategory)

  return (
    <main className="w-full bg-brand-primary min-h-screen py-20 lg:py-32">
      {playingVideo && (
        <VideoPlayerModal
          videoId={playingVideo.id}
          title={playingVideo.title}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Member Portal
          </p>
          <h1 className="text-4xl lg:text-6xl font-light text-white mb-4">
            Video Library
          </h1>
          <p className="text-xl text-white/60 max-w-2xl">
            Coaching sessions, group intensives, and masterclasses — watch at your own pace.
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                activeCategory === cat
                  ? 'bg-brand-accent text-white'
                  : 'bg-gray-900 text-white/60 hover:text-white hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <VideoCard
                video={video}
                tier={tier}
                onWatch={(id, title) => setPlayingVideo({ id, title })}
              />
            </motion.div>
          ))}
        </div>

        {tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="mt-16 relative overflow-hidden rounded-2xl bg-gray-900 p-8 lg:p-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                  Unlock the Library
                </p>
                <h2 className="text-2xl lg:text-3xl font-light text-white mb-3">
                  90+ hours of coaching sessions
                </h2>
                <p className="text-white/60 max-w-xl">
                  Upgrade to Silver to access recorded group sessions. Upgrade to Gold for all live session recordings.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/portal/upgrade?from=%2Fportal%2Fvideos"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-xl transition-colors duration-300"
                >
                  Upgrade Membership
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </main>
  )
}
