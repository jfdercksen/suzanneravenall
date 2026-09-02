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

  // min-h + py at every breakpoint (never a fixed h-screen). The fuller
  // approved copy and three CTAs exceed short viewports — on a 1280x720
  // laptop the stack needs 852px — and with a fixed height + overflow-hidden
  // the centred content is clipped top and bottom, taking the CTA row with
  // it. min-h lets the hero grow instead of swallowing the buttons.
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-[600px] sm:min-h-[700px] lg:min-h-[calc(100vh-5rem)] overflow-hidden"
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
        className="absolute inset-0 bg-gradient-to-r from-brand-primary-900/85 via-brand-primary-900/55 to-brand-primary-900/10"
      />

      {/* Layer 3 — Content */}
      <div className="relative z-10 min-h-[600px] sm:min-h-[700px] lg:min-h-[calc(100vh-5rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center min-h-[600px] sm:min-h-[700px] lg:min-h-[calc(100vh-5rem)] max-w-3xl xl:max-w-4xl py-16 lg:py-12">

          {/* Name + role — single line so the headline owns the space */}
          <motion.p
            {...fadeUp(0)}
            className="text-white/90 text-xs lg:text-sm font-medium tracking-[0.25em] uppercase mb-4 lg:mb-5"
          >
            Dr. Suzanne Ravenall · Founder of Pattern Intelligence™
          </motion.p>

          {/* Headline — the page's single loudest element. text-8xl (the
              approved impact-pass size) is kept, but gated on vertical room:
              at 96px the two lines alone run 192px, and on a 720px-tall
              laptop that pushed the CTA row clean off the bottom of the
              screen — Suzanne's 27 Aug screenshot. Above ~960px of viewport
              there is room for it, so tall displays still get the full
              statement size. */}
          <motion.h1
            id="hero-heading"
            {...fadeUp(0.15)}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl [@media(min-width:1280px)_and_(min-height:960px)]:text-8xl font-semibold tracking-tight text-white leading-[1.05] mb-4 lg:mb-6"
          >
            It&apos;s not you,
            <br />
            <span className="underline decoration-brand-accent-400 decoration-[6px] underline-offset-8">it&apos;s your pattern.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.35)}
            className="text-lg lg:text-xl text-white/90 max-w-2xl mb-5"
          >
            For years you&apos;ve tried to change the outcome. We help you discover
            and transform the invisible patterns creating it. Because when the
            pattern changes, everything changes.
          </motion.p>

          {/* Supporting line — gated on viewport HEIGHT as well as width. It is
              the longest and least essential block in the hero, so it is the
              one that yields when there is no vertical room: a 1080p laptop at
              150% scaling leaves ~625px, and without this gate the CTA row
              lands ~53px below the fold again.
              Was text-sm/white-70/font-light, which is the "small writing
              difficult to read" in Suzanne's 27 Aug screenshot: light weight at
              70% opacity over video is the least legible pairing on the page.
              Now text-base at 80% and normal weight. */}
          <motion.p
            {...fadeUp(0.55)}
            className="hidden [@media(min-width:640px)_and_(min-height:780px)]:block text-base text-white/80 max-w-2xl mb-8"
          >
            Decoding the invisible patterns that shape human potential.
            Introducing Pattern Intelligence™, a new science and way of
            understanding how unconscious patterns shape behaviour, leadership,
            resilience, health, success and abundance.
          </motion.p>

          {/* CTA row */}
          <motion.div
            {...fadeUp(0.65)}
            className="flex flex-col sm:flex-row sm:flex-wrap gap-3 lg:gap-4"
          >
            <Link
              href="/discover-your-pattern"
              aria-label="Take the free Pattern Scan"
              className="inline-flex items-center justify-center px-6 py-3.5 lg:px-7 bg-brand-accent hover:bg-brand-accent/90 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.5)]"
            >
              Take the Free Pattern Scan
            </Link>
            {/* Three CTAs (approved copy set) — compact padding so the row
                wraps cleanly inside the centered hero instead of clipping */}
            <Link
              href="/explore"
              aria-label="Explore Pattern Intelligence"
              className="inline-flex items-center justify-center px-6 py-3.5 lg:px-7 border border-white/50 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-brand-cream/10"
            >
              Explore Pattern Intelligence
            </Link>
            <Link
              href="/contact"
              aria-label="Book a free discovery call with Dr. Suzanne Ravenall"
              className="inline-flex items-center justify-center px-6 py-3.5 lg:px-7 border border-white/50 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-brand-cream/10"
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors duration-300 cursor-pointer"
      >
        <ChevronDown className="w-6 h-6 motion-safe:animate-bounce" />
      </button>
    </section>
  )
}
