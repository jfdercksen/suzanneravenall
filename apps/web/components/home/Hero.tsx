'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

// Suzanne wants to switch between the new site video and the one from her
// current (old) site — rendered as a two-slide toggle, both kept mounted so
// switching is an instant crossfade with no reload.
const heroVideos = [
  { src: '/videos/generated/hero-stage-video.mp4', label: 'New site video' },
  { src: '/videos/hero-current-site.mp4', label: 'Current site video' },
]

export default function Hero() {
  const [activeVideo, setActiveVideo] = useState(0)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])

  // Only the visible video plays — the hidden one is paused so it doesn't
  // burn bandwidth/battery in the background (60%+ mobile audience).
  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return
      if (i === activeVideo) {
        void el.play().catch(() => {})
      } else {
        el.pause()
      }
    })
  }, [activeVideo])

  const scrollToMedia = () => {
    document.getElementById('media-logos')?.scrollIntoView({ behavior: 'smooth' })
  }

  // min-h + py on mobile (not fixed h-screen) — the fuller approved copy and
  // three CTAs can exceed short viewports, and overflow-hidden would clip
  // them silently. Fixed full-viewport height only from lg.
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-[700px] lg:h-screen overflow-hidden"
    >
      {/* Layer 1 — Background videos (crossfade on toggle) */}
      {heroVideos.map((video, i) => (
        <video
          key={video.src}
          ref={(el) => {
            videoRefs.current[i] = el
          }}
          autoPlay={i === 0}
          muted
          loop
          playsInline
          preload={i === 0 ? 'auto' : 'none'}
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            activeVideo === i ? 'opacity-100' : 'opacity-0'
          }`}
          poster="/images/hero-bg-suzanne-ravenall.jpg"
        >
          <source src={video.src} type="video/mp4" />
        </video>
      ))}

      {/* Video toggle — bottom-right, above the gradient */}
      <div
        role="group"
        aria-label="Choose hero background video"
        className="absolute bottom-8 right-4 sm:right-6 lg:right-8 z-20 flex items-center gap-2"
      >
        {heroVideos.map((video, i) => (
          <button
            key={video.src}
            type="button"
            onClick={() => setActiveVideo(i)}
            aria-label={video.label}
            aria-pressed={activeVideo === i}
            className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
              activeVideo === i
                ? 'bg-brand-accent border-brand-accent scale-110'
                : 'bg-transparent border-white/60 hover:border-white'
            }`}
          />
        ))}
      </div>

      {/* Layer 2 — Gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10"
      />

      {/* Layer 3 — Content */}
      <div className="relative z-10 min-h-[700px] lg:min-h-0 lg:h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center min-h-[700px] lg:min-h-0 lg:h-full max-w-3xl py-24 lg:py-0">

          {/* Name */}
          <motion.p
            {...fadeUp(0)}
            className="text-brand-accent text-sm lg:text-base font-medium tracking-[0.3em] uppercase mb-2"
          >
            Dr. Suzanne Ravenall
          </motion.p>

          {/* Eyebrow */}
          <motion.p
            {...fadeUp(0.1)}
            className="text-xs tracking-[0.3em] text-white/70 uppercase font-medium mb-6"
          >
            Founder of Pattern Intelligence™
          </motion.p>

          {/* Headline */}
          <motion.h1
            id="hero-heading"
            {...fadeUp(0.25)}
            className="text-5xl lg:text-6xl font-display text-white leading-[1.05] mb-6"
          >
            It&apos;s not you, <span className="text-brand-accent">it&apos;s your pattern</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.45)}
            className="text-lg lg:text-xl text-white/80 font-light max-w-xl mb-5"
          >
            For years you&apos;ve tried to change the outcome. We help you discover
            and transform the invisible patterns creating it. Because when the
            pattern changes, everything changes.
          </motion.p>

          {/* Supporting line */}
          <motion.p
            {...fadeUp(0.55)}
            className="text-sm lg:text-base text-white/60 font-light max-w-xl mb-10"
          >
            Decoding the invisible patterns that shape human potential.
            Introducing Pattern Intelligence™ — a new science and way of
            understanding how unconscious patterns shape behaviour, leadership,
            resilience, health, success and abundance.
          </motion.p>

          {/* CTA row */}
          <motion.div
            {...fadeUp(0.65)}
            className="flex flex-col sm:flex-row sm:flex-wrap gap-4"
          >
            <Link
              href="/discover-your-pattern"
              aria-label="Take the free Pattern Scan"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent/90 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.5)]"
            >
              Take the Free Pattern Scan
            </Link>
            <Link
              href="/explore"
              aria-label="Explore Pattern Intelligence"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Explore Pattern Intelligence
            </Link>
            <Link
              href="/contact"
              aria-label="Book a free discovery call with Dr. Suzanne Ravenall"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Book a Discovery Call
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Layer 4 — Scroll indicator */}
      <button
        onClick={scrollToMedia}
        aria-label="Scroll to next section"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/70 transition-colors duration-300 cursor-pointer"
      >
        <ChevronDown className="w-6 h-6 motion-safe:animate-bounce" />
      </button>
    </section>
  )
}
