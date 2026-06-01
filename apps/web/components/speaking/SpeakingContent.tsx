'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

// TODO: Suzanne to confirm/update talk details
const talks = [
  {
    title: 'The Performance Revolution',
    tagline: 'Why your ceiling is not your skill — it’s your pattern',
    audience: 'Corporate, executive teams, leadership conferences',
    duration: '45–90 minutes',
  },
  {
    title: 'The Unstoppable Force',
    tagline: 'How to rebound with more courage than you thought possible',
    audience: 'Women in leadership, transformation conferences',
    duration: '45–90 minutes',
  },
  {
    title: 'Decode the Pattern',
    tagline: 'The hidden programs running your life — and how to rewrite them',
    audience: 'Personal development conferences, wellness events',
    duration: '60–120 minutes',
  },
  {
    title: 'Conscious Engineering',
    tagline: 'Using energy psychology to drive peak performance',
    audience: 'Corporate wellness, executive coaching summits',
    duration: '30–90 minutes',
  },
]

const outcomes = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    heading: 'Immediate Shifts',
    body: 'Participants experience measurable energetic and mindset shifts during the talk itself.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    heading: 'Practical Tools',
    body: 'Concrete repatterning techniques participants can apply immediately after leaving the room.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.702-1.316 2.391l-1.558-.39c-.893-.223-1.843-.067-2.614.49l-.16.12a2.96 2.96 0 01-3.507 0l-.16-.12c-.771-.557-1.72-.713-2.614-.49l-1.558.39c-1.344.311-2.316-1.392-1.316-2.391L5 14.5" />
      </svg>
    ),
    heading: 'Lasting Change',
    body: 'Not just inspiration — actual neural pathway restructuring that sticks long after the event.',
  },
]

const corporateAudiences = [
  'Leadership teams and C-suite',
  'Corporate wellness programmes',
  'Executive retreats',
  'Professional conferences',
]

const personalAudiences = [
  'Transformation conferences',
  'Women in leadership summits',
  'Wellness and health events',
  'Coaching and therapy conferences',
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const scrollFadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function SpeakingContent() {
  const reelRef = useRef<HTMLVideoElement>(null)
  const [reelPlaying, setReelPlaying] = useState(false)

  function handleReelPlay() {
    if (!reelRef.current) return
    if (reelPlaying) {
      reelRef.current.pause()
    } else {
      reelRef.current.play().catch(() => {})
    }
  }

  return (
    <>
      {/* ─── 1. Hero — dark, min-h-screen ───────────────────────────────── */}
      <section
        aria-labelledby="speaking-hero-heading"
        className="relative w-full overflow-hidden min-h-screen flex items-center"
      >
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="absolute inset-0 z-0 w-full h-full object-cover"
          poster="/images/hero-bg-suzanne-ravenall.jpg"
        >
          <source src="/videos/generated/hero-stage-video.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-brand-primary/50 to-brand-primary"
        />

        {/* Ambient glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute bg-brand-accent/10 blur-[160px] rounded-full w-[500px] h-[500px] top-1/3 left-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48">
          <div className="max-w-3xl">
            <motion.p
              {...fadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              Keynote Speaker
            </motion.p>

            <motion.h1
              id="speaking-hero-heading"
              {...fadeUp(0.1)}
              className="text-4xl lg:text-7xl font-light text-white leading-[1.05] mb-8"
            >
              Transform Your Audience{' '}
              <span className="text-brand-accent">From the Inside Out</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="text-lg lg:text-xl text-white/75 font-light leading-relaxed mb-10 max-w-2xl"
            >
              Suzanne Ravenall delivers keynote experiences that don&rsquo;t just inspire
              &mdash; they create measurable, lasting change in how people think,
              lead, and perform.
            </motion.p>

            <motion.div
              {...fadeUp(0.3)}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
              >
                Book Suzanne to Speak
              </Link>
              <a
                href="#reel"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-colors duration-300"
              >
                Watch a Preview &darr;
              </a>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── 2. Speaking Topics — light, bg-white ───────────────────────── */}
      <section
        aria-labelledby="topics-heading"
        className="w-full bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...scrollFadeUp(0)}
            className="max-w-3xl mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Signature Talks
            </p>
            <h2
              id="topics-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight"
            >
              Every talk is a pattern interrupt
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {talks.map((talk, idx) => (
              <motion.article
                key={talk.title}
                {...scrollFadeUp(idx * 0.1)}
                className="group relative overflow-hidden min-h-[260px] bg-gray-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-2xl"
              >
                <Image
                  src="/images/hero-bg-suzanne-ravenall.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover opacity-15 group-hover:opacity-30 transition-opacity duration-500"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent" />
                <div className="relative z-10 p-8 flex flex-col h-full">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-brand-accent transition-colors duration-300">
                    {talk.title}
                  </h3>
                  <p className="text-base text-brand-accent/80 font-light italic mb-4 leading-snug">
                    &ldquo;{talk.tagline}&rdquo;
                  </p>
                  <div className="mt-auto space-y-1">
                    <p className="text-xs text-white/50 uppercase tracking-widest">Audience</p>
                    <p className="text-sm text-white/70">{talk.audience}</p>
                    <p className="text-xs text-white/40 mt-2">{talk.duration}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Transformation Promise — dark, bg-gray-950 ──────────────── */}
      <section
        aria-labelledby="promise-heading"
        className="w-full bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              What Happens in the Room
            </p>
            <h2
              id="promise-heading"
              className="text-4xl lg:text-6xl font-light text-white leading-tight"
            >
              Audiences leave different
            </h2>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-3">
            {outcomes.map((item, idx) => (
              <motion.div
                key={item.heading}
                {...scrollFadeUp(idx * 0.1)}
                className="group flex flex-col gap-5 p-8 bg-gray-900 border border-white/5 rounded-card hover:border-brand-accent/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-accent/5"
              >
                <div className="text-brand-accent group-hover:scale-110 transition-transform duration-300 w-fit">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{item.heading}</h3>
                <p className="text-sm text-white/60 font-light leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Reel / Evidence — light, bg-gray-50 ─────────────────────── */}
      <section
        id="reel"
        aria-labelledby="reel-heading"
        className="w-full bg-gray-50 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Suzanne in Action
            </p>
            <h2
              id="reel-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight"
            >
              See the transformation in real time
            </h2>
          </motion.div>

          {/* Video player */}
          <motion.div {...scrollFadeUp(0.1)} className="relative w-full rounded-card overflow-hidden bg-gray-900 shadow-2xl">
            {/* 16:9 aspect */}
            <div className="relative aspect-video w-full">
              <video
                ref={reelRef}
                onPlay={() => setReelPlaying(true)}
                onPause={() => setReelPlaying(false)}
                onEnded={() => setReelPlaying(false)}
                playsInline
                className="w-full h-full object-cover"
                poster="/images/hero-bg-suzanne-ravenall.jpg"
              >
                {/* TODO: Add real conference video reel — hero-stage-video.mp4 is a placeholder preview */}
                <source src="/videos/generated/hero-stage-video.mp4" type="video/mp4" />
              </video>

              {/* Play button overlay */}
              {!reelPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    type="button"
                    onClick={handleReelPlay}
                    aria-label="Play keynote preview"
                    className="group flex items-center justify-center w-20 h-20 bg-brand-accent hover:bg-brand-accent-700 rounded-full shadow-[0_0_40px_theme(colors.brand.accent/60%)] transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Pause button when playing */}
              {reelPlaying && (
                <button
                  type="button"
                  onClick={handleReelPlay}
                  aria-label="Pause keynote preview"
                  className="absolute bottom-4 right-4 flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full transition-colors duration-200"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Caption */}
            <div className="px-6 py-4 bg-gray-900">
              <p className="text-sm text-white/50 italic">
                Keynote excerpt &mdash; Empower. Inspire. Change. Conference
              </p>
            </div>
          </motion.div>

          {/* TODO: Add real conference logos below the video */}
          <motion.div {...scrollFadeUp(0.2)} className="mt-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-gray-400 mb-8 text-center">
              Trusted by
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-32 h-12 bg-gray-200 rounded-card animate-pulse"
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6 italic">
              {/* TODO: Replace placeholder logo tiles with real conference/corporate logos */}
              Conference and corporate client logos — to be provided by Suzanne
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── 5. Audience Types — dark, bg-brand-primary ─────────────────── */}
      <section
        aria-labelledby="audience-heading"
        className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        {/* Glow blob */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute bg-brand-accent/10 blur-[160px] rounded-full w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Who Suzanne Speaks To
            </p>
            <h2
              id="audience-heading"
              className="text-4xl lg:text-6xl font-light text-white leading-tight"
            >
              Built for leaders ready to go deeper
            </h2>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Corporate & Executive */}
            <motion.div {...scrollFadeUp(0.1)} className="p-8 bg-white/5 border border-white/10 rounded-card">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </span>
                Corporate &amp; Executive
              </h3>
              <ul className="space-y-3">
                {corporateAudiences.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/70 text-sm font-light">
                    <svg className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Personal Growth & Wellness */}
            <motion.div {...scrollFadeUp(0.15)} className="p-8 bg-white/5 border border-white/10 rounded-card">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </span>
                Personal Growth &amp; Wellness
              </h3>
              <ul className="space-y-3">
                {personalAudiences.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/70 text-sm font-light">
                    <svg className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 6. Testimonials — light, bg-white ──────────────────────────── */}
      <section
        aria-labelledby="testimonials-heading"
        className="w-full bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              From the Room
            </p>
            <h2
              id="testimonials-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight"
            >
              What audiences say
            </h2>
          </motion.div>

          {/* TODO: Replace with real speaking-specific testimonials — Suzanne to provide quotes from event organisers or attendees */}
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.figure
              {...scrollFadeUp(0.1)}
              className="flex flex-col gap-6 p-8 bg-gray-50 border border-gray-100 rounded-card"
            >
              <div className="flex gap-1" role="img">
                <span className="sr-only">5 out of 5 stars</span>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-brand-accent" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-xl lg:text-2xl font-light text-brand-primary leading-relaxed italic">
                &ldquo;Suzanne didn&rsquo;t just deliver a talk &mdash; she shifted something in the room. Our team left with tools they actually use.&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-semibold text-sm" aria-hidden="true">
                  EC
                </div>
                <div>
                  {/* TODO: Replace with real name and title */}
                  <p className="text-sm font-semibold text-brand-primary">Event Co-ordinator</p>
                  <p className="text-xs text-gray-500">Corporate Leadership Summit</p>
                </div>
              </figcaption>
            </motion.figure>

            <motion.figure
              {...scrollFadeUp(0.15)}
              className="flex flex-col gap-6 p-8 bg-gray-50 border border-gray-100 rounded-card"
            >
              <div className="flex gap-1" role="img">
                <span className="sr-only">5 out of 5 stars</span>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-brand-accent" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-xl lg:text-2xl font-light text-brand-primary leading-relaxed italic">
                &ldquo;I&rsquo;ve attended hundreds of conferences. Suzanne&rsquo;s keynote was the one session everyone kept talking about six months later.&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-semibold text-sm" aria-hidden="true">
                  CD
                </div>
                <div>
                  {/* TODO: Replace with real name and title */}
                  <p className="text-sm font-semibold text-brand-primary">Conference Director</p>
                  <p className="text-xs text-gray-500">Transformation Summit</p>
                </div>
              </figcaption>
            </motion.figure>
          </div>
        </div>
      </section>

      {/* ─── 7. Booking CTA — dark, bg-brand-primary-900 ────────────────── */}
      <section
        aria-labelledby="cta-heading"
        className="relative w-full bg-brand-primary-900 py-20 lg:py-32 overflow-hidden"
      >
        {/* Ambient glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute bg-brand-accent/10 blur-[180px] rounded-full w-[700px] h-[500px] bottom-0 left-1/4 -translate-x-1/4" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">

            {/* Left — copy */}
            <div>
              <motion.p {...scrollFadeUp(0)} className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                Book Suzanne
              </motion.p>
              <motion.h2
                id="cta-heading"
                {...scrollFadeUp(0.1)}
                className="text-4xl lg:text-6xl font-light text-white leading-tight mb-6"
              >
                Ready to transform your next event?
              </motion.h2>
              <motion.p
                {...scrollFadeUp(0.2)}
                className="text-lg text-white/60 font-light leading-relaxed mb-10"
              >
                Suzanne speaks globally and adapts every keynote to your audience,
                industry, and transformation goals. Enquiries welcome for events of
                all sizes.
              </motion.p>
              <motion.div
                {...scrollFadeUp(0.3)}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_40px_theme(colors.brand.accent/60%)] animate-[pulse-glow_3s_ease-in-out_infinite]"
                >
                  Start the Conversation
                </Link>
                {/* TODO: Create speaking kit PDF and replace this button with: <a href="/speaking-kit.pdf" download> */}
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center px-8 py-4 border border-white/10 text-white/30 font-semibold text-sm uppercase tracking-widest rounded-button cursor-not-allowed"
                  title="Speaking kit coming soon"
                >
                  Download Speaking Kit
                </button>
              </motion.div>
            </div>

            {/* Right — portrait */}
            <motion.div
              {...scrollFadeUp(0.15)}
              className="relative lg:flex lg:justify-end"
            >
              <div className="relative w-full max-w-sm mx-auto lg:mx-0 rounded-card overflow-hidden shadow-2xl">
                <Image
                  src="/images/suzanne-portrait.jpg"
                  alt="Dr. Suzanne Ravenall"
                  width={480}
                  height={600}
                  className="w-full object-cover object-top"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 480px"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-primary-900/60 via-transparent to-transparent" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </>
  )
}
