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

  // HEADER RULE (design standard 2026-09-15, .claude/rules/design-rules.md):
  // the picture is the hero, the text sits on top of it. Suzanne's 14 Sep note
  // was that the old 96px semibold headline and three blocks of copy blocked
  // out the photograph. So: content anchored to the bottom-left the way
  // tonyrobbins.com does it, headline capped at 60px and regular weight, one
  // description paragraph, and a black scrim that exists only behind the text
  // band. The top of the frame, where Suzanne's face is, stays clear.
  // Below sm the video is a tight close-up, so no overlay can avoid her face:
  // the picture takes the top 320px and the text sits on black beneath it,
  // joined by a fade. From sm up the text overlays the picture.
  // min-h (never a fixed height) so the stack can grow on short viewports.
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex flex-col justify-end bg-brand-primary-900 sm:min-h-[700px] lg:min-h-[calc(100vh-5rem)] overflow-hidden"
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
          className={`absolute inset-x-0 top-0 w-full h-80 sm:h-full object-cover transition-opacity duration-700 ${
            activeVideo === i ? 'opacity-100' : 'opacity-0'
          }`}
          poster="/images/hero-bg-suzanne-ravenall.jpg"
        >
          <source src={video.src} type="video/mp4" />
        </video>
      ))}

      {/* Video toggle — on the picture: its bottom edge below sm, the
          section's bottom-right from sm */}
      <div
        role="group"
        aria-label="Choose hero background video"
        className="absolute top-72 sm:top-auto sm:bottom-8 right-4 sm:right-6 lg:right-8 z-20 flex items-center gap-2"
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
                ? 'bg-white border-white scale-110'
                : 'bg-transparent border-white/60 hover:border-white'
            }`}
          />
        ))}
      </div>

      {/* Layer 2 — Content band. The scrim is attached to the text rather
          than painted over the whole frame: a fade from clear to black/65,
          then black/65 to black/85 behind the text itself. At black/65 even a
          pure-white patch of photo sits at #595959, so white text is 7:1 and
          white/80 is 5:1 whatever the frame shows. */}
      <div className="relative z-10 pt-56 sm:pt-0">
        {/* Below sm the fade runs to the section ground exactly where the
            320px picture ends (224 + 96), so there is no seam. */}
        <div aria-hidden="true" className="h-24 lg:h-32 bg-gradient-to-t from-brand-primary-900 sm:from-black/65 to-transparent" />
        <div className="bg-gradient-to-t from-black/85 to-black/65">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-20 lg:pb-24">
            {/* No width cap on the wrapper: the description carries its own
                max-w-xl, and the three CTAs need ~900px to sit on one row. */}
            <div>

              {/* No eyebrow: Johan picked option B on the 15 Sep design
                  canvas. The "Dr. Suzanne Ravenall · Founder of Pattern
                  Intelligence" line repeated the logo directly above it. */}

              {/* Headline — regular weight, 36 / 48 / 60px. The measured
                  reference is 70px at weight 500 in Suisse Intl; Poppins has
                  wider, heavier strokes at the same weight, so 400 in Poppins
                  reads like 500 in Suisse. */}
              <motion.h1
                id="hero-heading"
                {...fadeUp(0.15)}
                className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.05] mb-4 lg:mb-5"
              >
                It&apos;s not you,
                <br />
                <span className="underline decoration-white/60 decoration-2 underline-offset-[10px]">it&apos;s your pattern.</span>
              </motion.h1>

              {/* One description paragraph, one size down. The second
                  supporting paragraph was dropped from the hero on Johan's
                  15 Sep direction ("smaller or less info"). */}
              <motion.p
                {...fadeUp(0.35)}
                className="text-sm sm:text-base lg:text-lg text-white/85 max-w-xl mb-6 lg:mb-8"
              >
                For years you&apos;ve tried to change the outcome. We help you discover
                and transform the invisible patterns creating it. Because when the
                pattern changes, everything changes.
              </motion.p>

              {/* CTA row — on imagery the primary CTA is a white button with
                  black text (reference: "Get Tickets Now"), never the
                  near-black accent, which would vanish into the scrim. */}
              <motion.div
                {...fadeUp(0.5)}
                className="flex flex-col sm:flex-row sm:flex-wrap gap-3"
              >
                <Link
                  href="/discover-your-pattern"
                  aria-label="Take the free Pattern Scan"
                  className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
                >
                  Take the Free Pattern Scan
                </Link>
                <Link
                  href="/explore"
                  aria-label="Explore Pattern Intelligence"
                  className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
                >
                  Explore Pattern Intelligence
                </Link>
                <Link
                  href="/contact"
                  aria-label="Book a free discovery call with Dr. Suzanne Ravenall"
                  className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
                >
                  Book a Discovery Call
                </Link>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* Layer 3 — Scroll indicator */}
      <button
        onClick={scrollToMedia}
        aria-label="Scroll to next section"
        className="absolute z-20 bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors duration-300 cursor-pointer"
      >
        <ChevronDown className="w-6 h-6 motion-safe:animate-bounce" />
      </button>
    </section>
  )
}
