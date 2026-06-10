'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Program } from '@/data/programs'

type Props = {
  program: Program
  relatedPrograms: Program[]
}

// -- helpers --

const CATEGORY_LABELS: Record<Program['category'], string> = {
  practitioner: 'Practitioner Training',
  'self-paced': 'Self-Paced Online',
  live: 'Live Programme',
  group: 'Group Programme',
}

const DELIVERY_METHODS: Record<Program['category'], string> = {
  practitioner: 'Live Training via Zoom',
  'self-paced': 'Self-Paced Online — Access Anytime',
  live: 'Live via Zoom with Suzanne',
  group: 'Group Sessions via Zoom',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ZAR: 'R',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
}

function getCurrencySymbol(currency: string | undefined): string {
  if (!currency) return 'R'
  return CURRENCY_SYMBOLS[currency] ?? currency
}

function getCtaProps(program: Program): { label: string; href: string } {
  // TODO: When a medusaHandle field is added to Program type, use /shop/{handle} for priced programmes
  if (program.price) return { label: 'Add to Cart', href: `/shop/${program.slug}` }
  if (program.category === 'live' || program.category === 'group') {
    return { label: 'Book Now', href: '/contact' }
  }
  return { label: 'Enquire', href: '/contact' }
}

// -- motion variants --

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const childVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const viewport = { once: true, margin: '-100px' } as const

// -- icons (inline SVG — no external icon dependency) --

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

// -- outcome cards (placeholder — TODO: Suzanne to provide programme-specific outcomes) --

const OUTCOMES = [
  {
    Icon: SparklesIcon,
    title: 'Shift Your Perspective',
    body: 'Gain a completely new understanding of the patterns and beliefs shaping your life — and discover that lasting change is not only possible, it is inevitable.',
  },
  {
    Icon: BoltIcon,
    title: 'Rewire Deep Patterns',
    body: 'Move beyond surface-level change to reprogramme the subconscious beliefs at the root of your challenges — creating embodied, lasting transformation.',
  },
  {
    Icon: ArrowUpIcon,
    title: 'Step Into Your Power',
    body: 'Leave with practical tools, renewed energy, and the clarity and confidence to navigate your life in a fundamentally new way.',
  },
]

// -- credential items --

const CREDENTIALS = [
  { stat: '20+', label: 'Years of Practice' },
  { stat: '1000s', label: 'Lives Transformed' },
  { stat: 'Certified', label: 'RR Practitioner' },
  { stat: 'International', label: 'Keynote Speaker' },
]

// -- related programme card --

function RelatedProgramCard({ program }: { program: Program }) {
  return (
    <motion.div
      variants={childVariants}
      className="group relative overflow-hidden min-h-[280px] bg-gray-900 border border-white/5 rounded-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-2xl flex flex-col"
    >
      <Image
        src={program.image ?? '/images/hero-bg-suzanne-ravenall.jpg'}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-transparent" />
      <div className="relative z-10 flex flex-col h-full p-8">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
            {CATEGORY_LABELS[program.category]}
          </p>
          <h3 className="text-xl font-semibold text-white mb-3 leading-snug group-hover:text-brand-accent transition-colors duration-300">
            {program.name}
          </h3>
          <p className="text-white/65 text-sm font-light leading-relaxed">{program.shortDescription}</p>
        </div>
        <Link
          href={`/programs/${program.slug}`}
          aria-label={`Learn more about ${program.name}`}
          className="mt-6 inline-flex items-center justify-center w-full py-3 px-6 border border-white/30 hover:border-brand-accent hover:bg-brand-accent text-white text-sm font-medium rounded-button transition-all duration-300"
        >
          Learn More
        </Link>
      </div>
    </motion.div>
  )
}

// -- main component --

export default function ProgramDetailClient({ program, relatedPrograms }: Props) {
  const cta = getCtaProps(program)
  const deliveryMethod = DELIVERY_METHODS[program.category]
  const categoryLabel = CATEGORY_LABELS[program.category]

  return (
    <>
      {/* ── 1. HERO — dark ──────────────────────────────────────────── */}
      <section
        aria-labelledby="program-hero-heading"
        className="relative h-screen min-h-[640px] flex items-center overflow-hidden"
      >
        <Image
          src={program.image ?? '/images/hero-bg-suzanne-ravenall.jpg'}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-50"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_theme(colors.brand.accent/15%),_transparent_50%)]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            {/* Back link */}
            <motion.div {...fadeUp(0)}>
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50 hover:text-white transition-colors duration-200 mb-8"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                All Programmes
              </Link>
            </motion.div>

            {/* Category + delivery badges */}
            <motion.div {...fadeUp(0.05)} className="flex flex-wrap gap-3 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
                {categoryLabel}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest bg-white/10 text-white/70 border border-white/20">
                {deliveryMethod}
              </span>
            </motion.div>

            <motion.h1
              id="program-hero-heading"
              {...fadeUp(0.15)}
              className="text-4xl lg:text-6xl font-light text-white leading-[1.05] mb-6"
            >
              {program.name}
            </motion.h1>

            <motion.p {...fadeUp(0.25)} className="text-lg lg:text-xl text-white/75 font-light max-w-2xl mb-8 leading-relaxed">
              {program.shortDescription}
            </motion.p>

            {/* Duration + price row */}
            <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-6 mb-10">
              {program.duration && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">Duration</p>
                  <p className="text-sm text-white/80 font-light">{program.duration}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">Investment</p>
                {program.price ? (
                  <p className="text-sm font-semibold text-brand-accent">
                    {getCurrencySymbol(program.currency)}{program.price}
                    {program.currency && (
                      <span className="text-white/50 font-normal ml-1">{program.currency}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-white/80 font-light">Contact for pricing</p>
                )}
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-4">
              <Link
                href={cta.href}
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
              >
                {cta.label}
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/40 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/5"
              >
                View All Programmes
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. WHAT YOU'LL EXPERIENCE — light ──────────────────────── */}
      {/* TODO: Suzanne to provide programme-specific outcome statements for each programme */}
      <motion.section
        aria-labelledby="outcomes-heading"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="relative w-full bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              What You&apos;ll Experience
            </p>
            <h2
              id="outcomes-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight mb-6"
            >
              After this programme, you will&hellip;
            </h2>
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              Every programme is designed to produce real, measurable shifts — not just insight,
              but transformation you can feel in your daily life.
            </p>
          </div>

          <motion.div
            variants={staggerVariants}
            className="grid gap-8 sm:grid-cols-3"
          >
            {OUTCOMES.map(({ Icon, title, body }) => (
              <motion.div
                key={title}
                variants={childVariants}
                className="flex flex-col p-8 bg-gray-50 border border-gray-100 rounded-card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-brand-accent mb-6">
                  <Icon />
                </div>
                <h3 className="text-xl font-semibold text-brand-primary mb-4">{title}</h3>
                <p className="text-gray-600 font-light leading-relaxed text-sm flex-1">{body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── 3. PROGRAMME DETAILS — dark ─────────────────────────────── */}
      <motion.section
        aria-labelledby="details-heading"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="relative w-full bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Left — description + who this is for */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                Programme Details
              </p>
              <h2
                id="details-heading"
                className="text-4xl lg:text-5xl font-light text-white leading-tight mb-8"
              >
                Everything you need to know.
              </h2>

              <p className="text-white/75 font-light leading-relaxed mb-10 text-base lg:text-lg">
                {program.description}
              </p>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-accent mb-2">Format</p>
                  <p className="text-white/80 text-sm font-light">{categoryLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-accent mb-2">Delivery</p>
                  <p className="text-white/80 text-sm font-light">{deliveryMethod}</p>
                </div>
                {program.duration && (
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-accent mb-2">Duration</p>
                    <p className="text-white/80 text-sm font-light">{program.duration}</p>
                  </div>
                )}
              </div>

              {/* TODO: Suzanne to provide — "Who this is for" paragraph for each programme */}
              <div className="border-l-2 border-brand-accent/40 pl-6">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-accent mb-3">Who This Is For</p>
                <p className="text-white/65 font-light leading-relaxed text-sm">
                  This programme is for you if you are ready to move beyond surface-level change and
                  commit to a deeper journey of inner transformation. Whether you are facing a specific
                  challenge or simply know that there is more available to you — this is your next step.
                </p>
              </div>
            </div>

            {/* Right — what's included */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                What&apos;s Included
              </p>
              <motion.ul
                variants={staggerVariants}
                className="space-y-5"
              >
                {program.features.map((feature) => (
                  <motion.li
                    key={feature}
                    variants={childVariants}
                    className="flex items-start gap-4 text-white/75 font-light leading-relaxed"
                  >
                    <span className="text-brand-accent mt-0.5">
                      <CheckIcon />
                    </span>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </motion.ul>

              {/* Investment callout */}
              <div className="mt-12 p-6 bg-gray-900 border border-white/10 rounded-card">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-accent mb-3">Investment</p>
                {program.price ? (
                  <p className="text-3xl font-light text-white mb-4">
                    {getCurrencySymbol(program.currency)}{program.price}
                    {program.currency && (
                      <span className="text-white/40 text-base font-normal ml-2">{program.currency}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-xl font-light text-white/80 mb-4">Contact for pricing</p>
                )}
                <Link
                  href={cta.href}
                  className="inline-flex items-center justify-center w-full py-4 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
                >
                  {cta.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 4. ABOUT THE FACILITATOR — light ────────────────────────── */}
      <motion.section
        aria-labelledby="facilitator-heading"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="relative w-full bg-gray-50 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            {/* Left — portrait */}
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative w-full max-w-sm lg:max-w-none lg:w-[400px] h-[500px] rounded-card overflow-hidden shadow-2xl">
                <Image
                  src="/images/suzanne-portrait.jpg"
                  alt="Dr. Suzanne Ravenall"
                  fill
                  sizes="(max-width: 1024px) 384px, 400px"
                  className="object-cover object-top"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>

            {/* Right — bio */}
            <div className="order-1 lg:order-2">
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                Your Facilitator
              </p>
              <h2
                id="facilitator-heading"
                className="text-4xl lg:text-5xl font-light text-brand-primary leading-tight mb-6"
              >
                Dr. Suzanne Ravenall
              </h2>
              {/* TODO: Suzanne to review and approve facilitator bio copy */}
              <p className="text-lg text-gray-600 font-light leading-relaxed mb-6">
                Dr. Suzanne Ravenall has spent over two decades guiding individuals and organisations
                through profound inner transformation. A trauma survivor herself — having navigated
                a traumatic brain injury, stroke, and multiple life-altering experiences — Suzanne
                has turned her lived wisdom into a rigorous methodology for conscious healing.
              </p>
              <p className="text-base text-gray-500 font-light leading-relaxed mb-10">
                She is a certified Resonance Repatterning practitioner, Akashic Navigator, and Energy
                Clearing facilitator, as well as an internationally recognised keynote speaker. Her
                work weaves neuroscience, energy psychology, and ancient healing traditions into a
                practical, transformative framework accessible to anyone ready to change.
              </p>

              {/* Credentials strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {CREDENTIALS.map(({ stat, label }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-semibold text-brand-primary mb-1">{stat}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-[0.15em]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 5. RELATED PROGRAMMES — dark ───────────────────────────── */}
      {relatedPrograms.length > 0 && (
        <motion.section
          aria-labelledby="related-heading"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="relative w-full bg-gray-950 py-20 lg:py-32"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                  Related Programmes
                </p>
                <h2
                  id="related-heading"
                  className="text-4xl lg:text-5xl font-light text-white leading-tight"
                >
                  You might also like.
                </h2>
              </div>
              <Link
                href="/programs"
                className="shrink-0 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors duration-200 uppercase tracking-widest"
              >
                View All
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <motion.div
              variants={staggerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {relatedPrograms.map((p) => (
                <RelatedProgramCard key={p.slug} program={p} />
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── 6. FINAL CTA — light ────────────────────────────────────── */}
      <motion.section
        aria-labelledby="program-cta-heading"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="relative w-full bg-white py-20 lg:py-32 overflow-hidden"
      >
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_theme(colors.brand.accent/5%),_transparent_65%)]" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Your Next Step
          </motion.p>

          <motion.h2
            id="program-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl lg:text-6xl font-light text-brand-primary leading-tight mb-6"
          >
            Ready to begin your transformation?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-gray-600 font-light max-w-xl mx-auto mb-12 leading-relaxed"
          >
            Take the first step. Secure your place in {program.name} and begin the work
            that changes everything.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href={cta.href}
              className="inline-flex items-center justify-center px-10 py-5 bg-brand-accent hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:shadow-[0_0_40px_theme(colors.brand.accent/40%)]"
            >
              {cta.label}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-10 py-5 border border-gray-300 hover:border-brand-primary text-brand-primary text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-gray-50"
            >
              Have Questions? Book a Discovery Call
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </>
  )
}
