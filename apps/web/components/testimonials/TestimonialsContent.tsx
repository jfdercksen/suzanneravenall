'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import VideoTestimonials from '@/components/shared/VideoTestimonials'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

// Real client testimonials harvested from the previous suzanneravenall.com site
// (infra/scripts/scraped-content/about.md + masterclass.md). Attribution as given.
const writtenTestimonials = [
  {
    quote:
      'Suzanne is highly skilled at cutting through the noise and getting to the core of an issue. Her sessions are deep and empowering and I always leave with a sense of clarity and understanding of the underlying causes of the challenges I face in my life.',
    name: 'Matheo',
    location: 'Cyprus',
  },
  {
    quote:
      'What an incredible experience it was to benefit from the extraordinary repatterning skills that Dr Suzanne Ravenall facilitated. Layers of old beliefs that I was unaware of, lifted. I definitely feel lighter and money is flowing into my life with greater ease. Highly recommended.',
    name: 'Jen',
    location: 'California',
  },
  {
    quote:
      'She has been so professional and helpful that no words can describe. Her guidance and kindness mean so much to me and I am truly grateful for everything I have learnt from her. She never hesitates sharing her knowledge and personal experiences, and they open my eyes to new stages of personal development and growth.',
    name: 'Sally',
    location: 'Hong Kong',
  },
  {
    quote:
      'With Suzanne’s compassionate guidance during the sessions the shifts within me came very quickly; there is still work to be done but within days I became a different person, more engaged with life, motivated and enthusiastic. I continue to evolve and I thank you Suzanne for the opportunity to finally find peace with several areas of past trauma. My life will only get better from hereon in.',
    name: 'Jayne',
    location: 'France',
  },
  {
    quote:
      'I loved the reading you gave me. You identified some core patterns and problems which I know are correct from the work I have already done on myself. The affirmations and new pattern ideas really helped.',
    name: 'Johanna',
    location: 'United Kingdom',
  },
  {
    quote:
      'I released a lot of negativity. It was an extremely valuable experience to me. I enjoyed it. It was relaxing and cathartic. I experienced tremendous relief and release. It helped clear up my thought processes. I definitely recommend Suzanne.',
    name: 'Seth',
    location: 'America',
  },
  {
    quote:
      'This was an awesome experience. I was able to relate to what came up. Apart from the content you have such a nice personable way of connecting, which made it very easy for me to dive into the unknown. I feel more at ease with and about myself.',
    name: 'Anke',
    location: 'USA',
  },
  {
    quote:
      'Suzanne taps into areas that need to be cleared. She is compassionate in her sessions.',
    name: 'Gloria',
    location: 'USA',
  },
  {
    quote:
      'Suzanne made me feel completely at ease and I felt I could trust her and loved her energy. She really seems to know how to access the information that’s valuable for you and has an ability to do this in such a down-to-earth manner. I would absolutely recommend working with Suzanne Ravenall. I believe she’s definitely genuine and one of a kind.',
    name: 'Ivana Vranic',
    location: 'Scotland',
  },
]

export default function TestimonialsContent() {
  return (
    <>
      {/* ── Hero — dark, short ─────────────────────────────────────────── */}
      <section
        aria-labelledby="testimonials-hero-heading"
        className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            {...fadeUp(0)}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Testimonials
          </motion.p>

          <motion.h1
            id="testimonials-hero-heading"
            {...fadeUp(0.15)}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mb-6"
          >
            Real People. Real Patterns. Real Change.
          </motion.h1>

          <motion.p
            {...fadeUp(0.3)}
            className="text-lg text-white/70 font-light max-w-xl leading-relaxed"
          >
            Clients around the world share what shifted when they found — and broke — the
            patterns that were holding them back.
          </motion.p>
        </div>
      </section>

      {/* ── Video testimonials — light (bg-white inside component) ─────── */}
      <VideoTestimonials showViewAllLink={false} />

      {/* ── Results spotlight — dark stats band ────────────────────────── */}
      <section
        aria-labelledby="testimonials-result-heading"
        className="bg-gray-950 py-20 lg:py-32 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Stat anchor */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: 'easeOut' as const }}
            >
              <p className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-3">
                The Numbers Behind the Stories
              </p>
              <h2
                id="testimonials-result-heading"
                className="text-4xl lg:text-6xl font-light text-white leading-[1.1] mb-8"
              >
                When the pattern breaks, everything moves
              </h2>
              <div className="text-7xl lg:text-9xl font-light text-white leading-none mb-2">
                2&times;
              </div>
              <p className="text-xl lg:text-2xl text-white/60 font-light uppercase tracking-wider mb-8">
                Productivity in 6 months
              </p>
              <div className="w-16 h-px bg-brand-accent mb-8" />
              <p className="text-white/60 text-sm font-light leading-relaxed max-w-sm">
                Three sessions. One 30-year pattern found and dissolved. A business — and a
                life — running at double the pace.
              </p>
            </motion.div>

            {/* Outcomes — the homepage TestimonialSpotlight already carries the
                Sarah M. quote and links here, so this band summarises what
                clients consistently report instead of repeating it. */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' as const }}
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-8">
                What Clients Report
              </p>
              <ul className="space-y-6 list-none">
                {[
                  'Patterns they had carried for decades — through therapy, books and willpower — finally naming themselves and losing their grip.',
                  'Relationships shifting as old attachment and communication loops dissolve.',
                  'Calm and clarity under pressure where there used to be anxiety and overwhelm.',
                  'Momentum in business and career once the invisible handbrake comes off.',
                ].map((outcome) => (
                  <li key={outcome} className="flex gap-4">
                    <span aria-hidden="true" className="mt-2.5 w-8 h-px bg-brand-accent flex-shrink-0" />
                    <span className="text-lg lg:text-xl font-light text-white/80 leading-relaxed">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Written testimonials grid — light ──────────────────────────── */}
      <section
        aria-labelledby="written-testimonials-heading"
        className="bg-gray-50 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 lg:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
              In Their Words
            </p>
            <h2
              id="written-testimonials-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary mb-4"
            >
              What clients say
            </h2>
            <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto">
              From private sessions to group programmes — in their own words, exactly as
              they shared them.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {writtenTestimonials.map(({ quote, name, location }, i) => (
              <motion.figure
                key={`${name}-${location}`}
                className="relative flex flex-col bg-white border border-gray-100 rounded-card p-8 shadow-sm hover:shadow-2xl hover:border-brand-accent/30 transition-all duration-500 hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: 'easeOut' }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  className="w-8 h-8 text-brand-accent/30 mb-6 flex-none"
                >
                  <path d="M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z" />
                </svg>

                <blockquote className="text-gray-600 text-base font-light leading-relaxed flex-1">
                  {quote}
                </blockquote>

                <figcaption className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-brand-primary font-medium text-sm">{name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{location}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — dark ───────────────────────────────────────────── */}
      <section
        aria-labelledby="testimonials-cta-heading"
        className="relative w-full bg-brand-primary-900 py-20 lg:py-32 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute bg-brand-accent/10 blur-[160px] rounded-full w-[32rem] h-[32rem] -bottom-40 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Your Turn
          </motion.p>

          <motion.h2
            id="testimonials-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mx-auto mb-6"
          >
            Ready to write your own story?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-lg text-white/70 font-light max-w-xl mx-auto leading-relaxed mb-10"
          >
            Start by finding the pattern that&apos;s running your life — it takes two
            minutes and it&apos;s free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/discover-your-pattern"
              className="bg-brand-accent-600 hover:bg-brand-accent-700 text-white px-8 py-4 rounded-button text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)] text-center"
            >
              Take the Free Pattern Scan &rarr;
            </Link>
            <Link
              href="/contact"
              className="border border-white/50 hover:border-white text-white/70 hover:text-white px-8 py-4 rounded-button text-sm uppercase tracking-widest font-medium transition-all duration-300 text-center"
            >
              Book a Discovery Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
