'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HEADER_UNDERLINE, PageHeader } from '@/components/shared/PageHeader'
import { contactHref } from '@/app/contact/enquiry'
import { speakingTestimonials } from '@/data/testimonials'

/** "Book a Discussion": Suzanne's Acuity booking type for speaking enquiries,
 *  the same link as the "Book a discussion" buttons on the current site's
 *  speaking page (Shayna, 7 Oct: both buttons went to the contact form). */
export const SPEAKING_DISCUSSION_HREF =
  'https://app.acuityscheduling.com/schedule.php?owner=18094639&appointmentType=24190547'

// Suzanne's real, established signature keynote topics — same four talks
// used in components/services/Speaking.tsx. Taglines are drawn directly
// from the source copy, not invented. Durations are as published on the
// old site.
const talks = [
  {
    title: 'Conversations with My Brain',
    tagline: 'Living proof that you can re-train your brain',
    duration: '20, 45 or 60 minutes',
  },
  {
    title: 'Recycling My Soul',
    tagline: 'How consciousness draws our experiences to us: the science of entanglement',
    duration: '20, 45 or 60 minutes',
  },
  {
    title: 'Second Time Around',
    tagline: 'A new way of being, a second time around',
    duration: '20, 45 or 60 minutes',
  },
  {
    title: 'Trauma to Transcendence',
    tagline: 'Turning trauma into transcendence',
    duration: '45 or 60 minutes',
  },
]

// "Audiences leave changed", Suzanne's copy of 8 Nov 2026.
const outcomes = [
  {
    heading: 'The shift happens in the room',
    body: 'Suzanne doesn’t just explain patterns. She shows audiences theirs, live. People feel the shift during the talk itself, and the energy in the room changes with it.',
  },
  {
    heading: 'Tools they use the next day',
    body: 'Every talk includes practical techniques people can apply straight away: at work, under pressure and in the moments that matter.',
  },
  {
    heading: 'Insight that lasts',
    body: 'Instead of a motivational high that fades by Monday, audiences leave with a new understanding of what drives their behaviour, and a way to start changing it.',
  },
]

/**
 * Keynote footage. None exists on any of Suzanne's live sites (content
 * sourcing, 6 Oct 2026, decision 11), so the reel block and the header's
 * "Watch a Preview" link are hidden while this is null. Set it to real
 * keynote footage from Suzanne to bring both back.
 */
const KEYNOTE_REEL = null as { src: string; poster: string } | null

/**
 * Where Suzanne has spoken, in her three groups (Suzanne, 8 Nov 2026; this
 * replaces the flat list taken from the ravenallinstitute.com conference
 * posts under decision 11).
 */
export const SPEAKING_EVENT_GROUPS = [
  {
    heading: 'Global stages',
    events: [
      'Sustainability; The Prince of Wales Trust, St James’s Palace, London',
      'YPO chapter events',
      'YPO consciousness events',
      'Health events',
    ],
  },
  {
    heading: 'Leadership & business',
    events: ['Leadership Summits', 'Effective Leadership Strategies', 'HR Africa'],
  },
  {
    heading: 'Women in leadership',
    events: ['African Women in Leadership', 'Women in Leadership', 'Women in Management'],
  },
] as const

// "Why event organisers book Suzanne", Suzanne's copy of 8 Nov 2026.
export const WHY_BOOK = [
  'She practises what she speaks about. She’s an entrepreneur and CEO with more than 30 years of building award-winning businesses, so she isn’t a theorist.',
  'Her credibility comes from experience. She was named one of the Top 11 Women Entrepreneurs in the World by Leading Women of the World, has climbed one of the Seven Summits, and has turned her own trauma into transcendence.',
  'She speaks to every level. Boardrooms, leadership teams, women’s networks and personal growth audiences all relate to her, because patterns drive everyone.',
  'Her talks are interactive. Audiences take part rather than sit back, and they talk about it afterwards.',
]

/** The speaker pack does not exist yet, so the button asks for it through the
 *  contact form with the request already written in. Point it at the PDF once
 *  Suzanne sends one. */
export const SPEAKER_PACK_HREF = contactHref('speaking', 'Please send me the speaker pack')

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

const scrollFadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
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
      {/* ─── 1. Header: shared PageHeader, the header rule ──────────────── */}
      {/* Stage video. The poster has Suzanne in the centre of the frame with
          the top half clear, so the default left alignment and centre crop
          apply. The scroll indicator and accent glow are gone. */}
      <PageHeader
        id="speaking-hero-heading"
        eyebrow="Keynote Speaker"
        video={{
          src: '/videos/generated/hero-stage-video.mp4',
          poster: '/images/hero-bg-suzanne-ravenall.jpg',
        }}
        title={
          <>
            Transform Your Audience{' '}
            <span className={HEADER_UNDERLINE}>From the Inside Out</span>
          </>
        }
        description={
          <>
            Suzanne Ravenall delivers keynote experiences that don&rsquo;t just inspire.
            They create measurable, lasting change in how people think,
            lead, and perform.
          </>
        }
      >
        <Link
          href={contactHref('speaking')}
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          Book Suzanne to Speak
        </Link>
        {KEYNOTE_REEL && (
          <a
            href="#reel"
            className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
          >
            Watch a Preview &darr;
          </a>
        )}
      </PageHeader>

      {/* ─── 2. Speaking Topics: light, bg-brand-cream ──────────────────── */}
      <section
        aria-labelledby="topics-heading"
        className="w-full bg-brand-cream py-20 lg:py-32"
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
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight"
            >
              Every talk is a pattern interrupt
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {talks.map((talk, idx) => (
              <motion.article
                key={talk.title}
                {...scrollFadeUp(idx * 0.1)}
                className="group relative overflow-hidden min-h-[260px] bg-brand-primary-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-white/30 hover:shadow-2xl"
              >
                <Image
                  src="/images/hero-bg-suzanne-ravenall.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover opacity-15 group-hover:opacity-30 transition-opacity duration-500"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-black/80 to-transparent" />
                <div className="relative z-10 p-8 flex flex-col h-full">
                  <h3 className="text-xl font-medium text-white mb-2 group-hover:text-brand-accent-400 transition-colors duration-300">
                    {talk.title}
                  </h3>
                  <p className="text-base text-brand-accent-400 font-light italic mb-4 leading-snug">
                    &ldquo;{talk.tagline}&rdquo;
                  </p>
                  <div className="mt-auto">
                    <p className="text-xs text-white/50 uppercase tracking-widest">Duration</p>
                    <p className="text-sm text-white/70 mt-1">{talk.duration}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Transformation Promise: dark, bg-brand-primary-900 ──────── */}
      <section
        aria-labelledby="promise-heading"
        className="w-full bg-brand-primary-900 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-4">
              What Happens in the Room
            </p>
            <h2
              id="promise-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-tight mb-8"
            >
              Audiences leave changed
            </h2>
            <p className="text-xl text-white font-light leading-relaxed mb-6">
              Most talks inspire for an evening. Suzanne changes how people see
              themselves, and what they do next.
            </p>
            <p className="text-lg text-white/80 font-light leading-relaxed">
              She doesn&rsquo;t just talk about transformation. She takes the
              room through it. Audiences experience the shift for themselves,
              leave with tools they can use the next morning, and understand why
              they do what they do, often for the first time.
            </p>
          </motion.div>

          <ol className="grid gap-8 sm:grid-cols-3">
            {outcomes.map((item, idx) => (
              <motion.li
                key={item.heading}
                {...scrollFadeUp(idx * 0.1)}
                className="flex flex-col gap-4 p-8 bg-brand-primary-800 border border-white/5 rounded-card hover:border-white/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
              >
                <span aria-hidden="true" className="text-brand-accent-400 text-2xl font-light">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-medium text-white">{item.heading}</h3>
                <p className="text-sm text-white/70 font-light leading-relaxed">{item.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── 4. Where Suzanne has spoken: light, bg-brand-sand ──────────── */}
      {/* Decision 11 (6 Oct): the placeholder logo strip is replaced by the
          list of events she has spoken at; the keynote reel stays hidden until
          Suzanne sends real footage (see KEYNOTE_REEL). */}
      <section
        id="reel"
        aria-labelledby="reel-heading"
        className="w-full bg-brand-sand py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Suzanne in Action
            </p>
            <h2
              id="reel-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight"
            >
              Where Suzanne has spoken
            </h2>
          </motion.div>

          {KEYNOTE_REEL && (
            <div className="mb-12">
              {/* Video player */}
              <motion.div {...scrollFadeUp(0.1)} className="relative w-full rounded-card overflow-hidden bg-brand-primary-900 shadow-2xl">
                {/* 16:9 aspect */}
                <div className="relative aspect-video w-full">
                  <video
                    ref={reelRef}
                    onPlay={() => setReelPlaying(true)}
                    onPause={() => setReelPlaying(false)}
                    onEnded={() => setReelPlaying(false)}
                    playsInline
                    className="w-full h-full object-cover"
                    poster={KEYNOTE_REEL.poster}
                  >
                    <source src={KEYNOTE_REEL.src} type="video/mp4" />
                  </video>

                  {/* Play button overlay */}
                  {!reelPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <button
                        type="button"
                        onClick={handleReelPlay}
                        aria-label="Play keynote preview"
                        className="group flex items-center justify-center w-20 h-20 bg-white hover:bg-brand-sand rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
                      >
                        <svg className="w-8 h-8 text-brand-primary ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                <div className="px-6 py-4 bg-brand-primary-900">
                  <p className="text-sm text-white/50 italic">
                    Keynote preview
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {SPEAKING_EVENT_GROUPS.map((group, idx) => (
              <motion.div
                key={group.heading}
                {...scrollFadeUp(0.1 + idx * 0.1)}
                className="p-8 bg-white border border-brand-border rounded-card"
              >
                <h3 id={`spoken-group-${idx}`} className="text-xl font-medium text-brand-primary mb-5">
                  {group.heading}
                </h3>
                <ul aria-labelledby={`spoken-group-${idx}`} className="space-y-3">
                  {group.events.map((event) => (
                    <li key={event} className="flex items-start gap-3 text-brand-ink text-sm leading-relaxed">
                      <svg className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {event}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Audience Types: dark, bg-brand-primary ──────────────────── */}
      <section
        aria-labelledby="audience-heading"
        className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-4">
              Who Suzanne Speaks To
            </p>
            <h2
              id="audience-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-tight"
            >
              Built for leaders ready to go deeper
            </h2>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Corporate & Executive */}
            <motion.div {...scrollFadeUp(0.1)} className="p-8 bg-white/5 border border-white/10 rounded-card">
              <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brand-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </span>
                Corporate &amp; Executive
              </h3>
              <ul className="space-y-3">
                {corporateAudiences.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/70 text-sm font-light">
                    <svg className="w-4 h-4 text-brand-accent-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Personal Growth & Wellness */}
            <motion.div {...scrollFadeUp(0.15)} className="p-8 bg-white/5 border border-white/10 rounded-card">
              <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brand-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </span>
                Personal Growth &amp; Wellness
              </h3>
              <ul className="space-y-3">
                {personalAudiences.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/70 text-sm font-light">
                    <svg className="w-4 h-4 text-brand-accent-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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

      {/* ─── 6. Testimonials: light, bg-brand-cream ─────────────────────── */}
      {/* Hidden entirely until data/testimonials.ts holds verified,
          Suzanne-approved keynote quotes (decision 11, 6 Oct). Do not
          fabricate quotes or attributions. */}
      {speakingTestimonials.length > 0 && (
        <section
          aria-labelledby="testimonials-heading"
          className="w-full bg-brand-cream py-20 lg:py-32"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-16">
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
                From the Room
              </p>
              <h2
                id="testimonials-heading"
                className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight"
              >
                What audiences say
              </h2>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {speakingTestimonials.map((t, i) => (
                <motion.figure
                  key={`${t.name}-${i}`}
                  {...scrollFadeUp(i * 0.1)}
                  className="p-8 bg-brand-sand border border-brand-border rounded-card"
                >
                  <blockquote className="text-brand-muted leading-relaxed mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption>
                    <p className="font-medium text-brand-primary text-sm">{t.name}</p>
                    {t.title && <p className="text-brand-muted text-xs mt-0.5">{t.title}</p>}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 7. Why organisers book Suzanne: light, bg-brand-cream ──────── */}
      {/* The testimonials band above is hidden, so this cream band follows
          the dark audience band. If testimonials return (also cream), move
          one of the two to sand. */}
      <section
        aria-labelledby="why-book-heading"
        className="w-full bg-brand-cream py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollFadeUp(0)} className="max-w-3xl mb-12">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              For Event Organisers
            </p>
            <h2
              id="why-book-heading"
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-tight"
            >
              Why event organisers book Suzanne
            </h2>
          </motion.div>

          <ul className="grid gap-6 sm:grid-cols-2 mb-12">
            {WHY_BOOK.map((reason, idx) => (
              <motion.li
                key={reason}
                {...scrollFadeUp(idx * 0.1)}
                className="flex items-start gap-4 p-8 bg-brand-sand border border-brand-border rounded-card"
              >
                <svg className="w-5 h-5 text-brand-accent shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <p className="text-brand-ink text-lg font-light leading-relaxed">{reason}</p>
              </motion.li>
            ))}
          </ul>

          <motion.div {...scrollFadeUp(0.2)} className="flex flex-col sm:flex-row gap-4">
            <Link
              href={contactHref('speaking')}
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Book Suzanne to Speak
            </Link>
            <Link
              href={SPEAKER_PACK_HREF}
              className="inline-flex items-center justify-center px-8 py-4 border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Download Speaker Pack
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── 8. Booking CTA: dark, bg-brand-primary-900 ─────────────────── */}
      <section
        aria-labelledby="cta-heading"
        className="relative w-full bg-brand-primary-900 py-20 lg:py-32 overflow-hidden"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">

            {/* Left — copy */}
            <div>
              <motion.p {...scrollFadeUp(0)} className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-6">
                Book Suzanne
              </motion.p>
              <motion.h2
                id="cta-heading"
                {...scrollFadeUp(0.1)}
                className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-tight mb-6"
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
                  href={contactHref('speaking')}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-brand-sand text-brand-primary font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300 animate-[pulse-glow_3s_ease-in-out_infinite]"
                >
                  Start the Conversation
                </Link>
                <a
                  href={SPEAKING_DISCUSSION_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white hover:bg-white/10 font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300"
                >
                  Book a Discussion
                </a>
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
                  className="w-full object-cover object-left-top"
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
