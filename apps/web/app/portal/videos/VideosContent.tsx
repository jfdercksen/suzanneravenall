'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { hasAccess, tierLabel, minimumTierFor, type TierSlug, type ResourceKey } from '@/lib/access/tiers'

export interface VideoRow {
  id: string
  bunny_video_id: string
  title: string
  description: string | null
  duration_seconds: number | null
  category: string
  resource_key: string
  status: string
  thumbnail_url: string | null
  sort_order: number
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} hr${m > 0 ? ` ${m} min` : ''}`
  return `${m} min`
}

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-gray-900 rounded-card overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <p id="video-modal-title" className="text-white font-semibold text-sm">{title}</p>
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
              title={title}
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
  video: VideoRow
  tier: TierSlug
  onWatch: (bunnyVideoId: string, title: string) => void
}

function VideoCard({ video, tier, onWatch }: VideoCardProps) {
  const resourceKey = video.resource_key as ResourceKey
  const unlocked = hasAccess(tier, resourceKey)
  const minTier = minimumTierFor(resourceKey)
  const duration = formatDuration(video.duration_seconds)

  return (
    <div className="group flex flex-col bg-gray-900 rounded-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative aspect-video bg-brand-primary-900 flex items-center justify-center">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover group-hover:opacity-90 transition-opacity duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary-900 to-gray-800" />
        )}

        <div className="relative z-10">
          {unlocked ? (
            <button
              onClick={() => onWatch(video.bunny_video_id, video.title)}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-all duration-300"
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
        </div>

        {duration && (
          <div className="absolute bottom-2 right-2 z-10">
            <span className="bg-black/60 text-white/80 text-xs px-2 py-0.5 rounded backdrop-blur-sm">
              {duration}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <p className="text-xs uppercase tracking-widest text-brand-accent-300 font-medium mb-2">
          {video.category}
        </p>
        <p className="text-white font-semibold leading-snug mb-2 text-sm">{video.title}</p>
        <p className="text-white/40 text-xs leading-relaxed flex-1">{video.description ?? ''}</p>

        <div className="mt-4">
          {unlocked ? (
            <button
              onClick={() => onWatch(video.bunny_video_id, video.title)}
              className="w-full py-2.5 px-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-semibold rounded-button transition-colors duration-300"
            >
              Watch Now
            </button>
          ) : (
            /* TODO: Build /portal/upgrade page */
            <Link
              href="/shop?collection=membership"
              className="block w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-white/50 hover:text-white text-sm font-semibold rounded-button transition-colors duration-300 text-center"
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
  videos: VideoRow[]
}

export default function VideosContent({ tier, videos }: VideosContentProps) {
  const categories = ['All', ...Array.from(new Set(videos.map((v) => v.category)))]
  const [activeCategory, setActiveCategory] = useState('All')
  const [playingVideo, setPlayingVideo] = useState<{ id: string; title: string } | null>(null)

  const filtered =
    activeCategory === 'All' ? videos : videos.filter((v) => v.category === activeCategory)

  return (
    <main className="relative w-full bg-brand-primary min-h-screen py-20 lg:py-32 overflow-hidden">
      {playingVideo && (
        <VideoPlayerModal
          videoId={playingVideo.id}
          title={playingVideo.title}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-4">
            Member Portal
          </p>
          <h1 className="text-4xl lg:text-6xl font-light text-white mb-4">
            Video Library
          </h1>
          <p className="text-xl text-white/60 max-w-2xl">
            Coaching sessions, group intensives, and masterclasses. Watch at your own pace.
          </p>
        </motion.div>

        {videos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <svg className="w-16 h-16 text-white/10 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-white/40 text-lg font-light mb-2">Videos coming soon</p>
            <p className="text-white/25 text-sm max-w-sm">
              New sessions are uploaded after each cohort. Check back after your next live session.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-wrap gap-2 mb-10"
            >
              {categories.map((cat) => (
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
                  viewport={{ once: true, margin: '0px' }}
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
          </>
        )}

        {tier === 'free' && videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="mt-16 relative overflow-hidden rounded-card bg-gray-900 p-8 lg:p-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-3">
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
                {/* TODO: Build /portal/upgrade page */}
                <Link
                  href="/shop?collection=membership"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-300"
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
