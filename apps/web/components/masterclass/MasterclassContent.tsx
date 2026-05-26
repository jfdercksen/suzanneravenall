'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Target, Users, Zap } from 'lucide-react'
import EmailCaptureForm from './EmailCaptureForm'

const outcomes = [
  {
    number: '01',
    headline: 'Identify What Is Holding You Back',
    description:
      'Review your life from a different perspective, pinpoint the patterns that are tripping you up, and learn exactly how to fix them.',
  },
  {
    number: '02',
    headline: 'Release the Past and Rewrite Your Story',
    description:
      'Let go of what no longer serves you and gain an abundance of tools to navigate your life with clarity and intention.',
  },
  {
    number: '03',
    headline: 'Understand How Your Experiences Shape You',
    description:
      'Develop a deep understanding of how early experiences have shaped your current actions — and how to consciously change them.',
  },
  {
    number: '04',
    headline: 'Reprogramme Your Mind and Nervous System',
    description:
      'Learn how your thoughts create your reality and acquire proven methods to rewire your mind for lasting transformation.',
  },
]

const audience = [
  {
    icon: Target,
    title: 'You Feel Stuck or Unfulfilled',
    description:
      'You sense there is more available to you but cannot seem to break through the invisible ceiling that keeps you repeating the same patterns.',
  },
  {
    icon: Users,
    title: 'You Are Ready for Real Change',
    description:
      'You have tried motivation and willpower. Now you want to understand the root cause — and do the deeper work that creates lasting results.',
  },
  {
    icon: Zap,
    title: 'You Want to Lead with Purpose',
    description:
      'Whether in business, relationships, or personal health, you are ready to show up as the most extraordinary version of yourself.',
  },
]

const testimonials = [
  {
    quote:
      'What an incredible experience. Layers of old beliefs I was unaware of simply lifted. I definitely feel lighter and money is flowing into my life with greater ease. Highly recommended.',
    name: 'Jen',
    location: 'California',
  },
  {
    quote:
      "I have achieved so much. It is a learning experience to heal yourself and touch other people's lives in a spectacular way. Suzanne has amazing knowledge and wisdom — it has been a wonderful journey.",
    name: 'Adriana',
    location: 'Venezuela',
  },
  {
    quote:
      'The tools provided in this course are working very well for me. The alpha state meditations and daily work have been fundamental. A huge big thank you!',
    name: 'Jean',
    location: 'South Africa',
  },
]

const sectionFadeUp = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
} as const

export default function MasterclassContent() {
  return (
    <>
      {/* ── Section 1: Hero (dark) ───────────────────────────────────────── */}
      <section className="relative w-full bg-brand-primary min-h-screen flex items-center py-24 lg:py-40 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="absolute inset-0 z-0 w-full h-full object-cover opacity-30"
          poster="/images/generated/hero-masterclass.webp"
        >
          <source src="/videos/generated/hero-brain-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              Free Masterclass
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl lg:text-6xl font-light text-white leading-tight mb-6"
            >
              Unlock Your Most Extraordinary Self and Become an{' '}
              <span className="text-brand-accent">Unstoppable Force</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-gray-300 mt-4 max-w-2xl mb-10"
            >
              Discover the pattern, decode and disrupt it, then rewire your mind and
              nervous system to create radical inner and outer transformation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <EmailCaptureForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 2: What You'll Discover (light) ─────────────────────── */}
      <section className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              What You&rsquo;ll Learn
            </p>
            <h2 className="text-3xl lg:text-5xl font-light text-gray-900">
              Inside This Free Masterclass
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {outcomes.map((item, i) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative p-8 rounded-card bg-gray-50 group hover:shadow-lg hover:-translate-y-1 transition-all duration-500"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-6 right-6 text-6xl font-bold text-brand-accent opacity-20 leading-none select-none"
                >
                  {item.number}
                </span>
                <h3 className="text-gray-900 text-xl font-semibold mb-3 pr-16">
                  {item.headline}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Who This Is For (dark) ───────────────────────────── */}
      <section className="relative w-full bg-gray-950 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Is This for You?
            </p>
            <h2 className="text-3xl lg:text-5xl font-light text-white">
              This Masterclass Is Perfect If&hellip;
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {audience.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-gray-900 rounded-card p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-card bg-brand-accent/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-brand-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-white text-xl font-semibold mb-3">{title}</h3>
                <p className="text-white/60 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: About Suzanne (light) ────────────────────────────── */}
      <section className="w-full bg-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Your Host
            </p>
            <h2 className="text-3xl lg:text-5xl font-light text-gray-900 mb-8">
              Dr. Suzanne Ravenall
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Dr. Suzanne Ravenall (B.Msc. M.Msc. Msc.D.) is a multiple award-winning
              transformation and performance coach, speaker, and entrepreneur with decades
              of experience working with individuals, executives, and corporations across
              four continents.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Her expertise spans neuroscience-informed coaching, Resonance Repatterning,
              and conscious engineering — a unique approach that addresses the root causes
              of limitation rather than just the symptoms.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              Suzanne has been featured in leading publications and recognised with
              multiple business excellence awards for her profound impact on the people
              she works with around the world.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center text-brand-accent font-semibold hover:underline transition-all duration-300"
            >
              Learn more about Suzanne &rarr;
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Section 5: Social Proof (dark) ──────────────────────────────── */}
      <section className="relative w-full bg-gray-950 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              What People Say
            </p>
            <h2 className="text-3xl lg:text-5xl font-light text-white">
              Real Results, Real People
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {testimonials.map(({ quote, name, location }, i) => (
              <motion.figure
                key={name + location}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-gray-900 rounded-card p-8"
              >
                <blockquote className="italic text-gray-300 leading-relaxed mb-6">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <figcaption className="text-white font-semibold text-sm">
                  {name}{' '}
                  <span className="text-gray-500 font-normal">— {location}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Second CTA (light) ───────────────────────────────── */}
      <section className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Ready to Begin?
            </p>
            <h2 className="text-3xl lg:text-5xl font-light text-gray-900 mb-4">
              Your Transformation Starts Here
            </h2>
            <p className="text-gray-600 text-lg mb-10">
              Join thousands of people who have already taken the first step.
            </p>
            <EmailCaptureForm variant="light" />
            <p className="mt-4 text-gray-400 text-xs">
              Free. Takes 2 minutes. You can unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  )
}
