'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const sectionReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

const credentials: string[] = [
  'B.Msc.',
  'M.Msc.',
  'Msc.D.',
  'Rapid Repatterning\u00ae Practitioner',
  'Neuro-repatterning\u00ae Practitioner',
  'NLP Practitioner',
  'Energy Psychology',
  'Trauma Science',
  'Consciousness Studies',
  'Metaphysics',
  'Ancient Healing Arts',
  'Neurobiology of Performance',
]

// Full qualifications list ported from the old site's /qualifications page
// (infra/scripts/scraped-content/about.md). Wording as published there.
const academicQualifications = [
  'B.Sc. Metaphysics (American Alternative Medical Association)',
  'M.Sc. Metaphysics (American Alternative Medical Association)',
  'Doctorate of Philosophy: Metaphysics (American Alternative Medical Association)',
  'Ph.D. Integrative Medicine & Conscious Business Ethics — in progress',
]

const certifications = [
  'Certified Master Behaviour Coach (BSI – UK)',
  'Certified NLP Master',
  'Certified RTT (RTT Hypnotherapy UK)',
  'Certified Mediation Instructor (CTAA)',
  'Certified / Diploma Advanced Resonance Repatterning (RR Institute)',
  'Certified Teacher Resonance Repatterning (RR Institute)',
  'Certified Teacher Therapeutic Qigong',
  'Certified Mediator',
  'Certified Teacher Mindfulness',
  'Certified Facilitator HeartMath',
  'Certified BodyTalk (CBP BodyTalk Association)',
  'Certified Qi Gong Instructor',
  'Certified Philosophical/Metaphysical Counsellor (AMA)',
  'Certified Clinical Trauma Specialist (CCTSI)',
  'Certified Clinical Trauma & Addiction Specialist (CTAA)',
  'Certified PTSD Counselling (CTAA)',
  'Certified Family Trauma Specialist (CFTP)',
  'Sexual Trauma Specialist (CCTS)',
  'Certified Akashic Mastery (Akashic School of Knowing)',
  'Reiki Master',
]

const additionalTraining = [
  'Regression Therapy (QHHT)',
  'Energy Clearing',
  'Mindscape',
  'Bio-geometry',
  'Radionics',
  'Medical Mediumship',
  'Reconnective Healing',
  'BodyTalk Structural Integration',
  'BodyTalk Fascia Balancing',
  'Western & Eastern Astrology',
]

const memberships =
  'Suzanne is a member of the ICF (International Coaching Federation), BMA (British Medical Association), BodyTalk Association, Resonance Repatterning Association, and the AMA (American Medical Association).'

// [CONFIRM with Suzanne]: qualifications count and years-experience values were
// counter widgets that didn't hydrate during scrape. Using same values as
// homepage AnimatedStats until client confirms exact numbers.
const stats: { target: number; suffix: string; label: string }[] = [
  { target: 20, suffix: '+', label: 'Years Experience' },
  { target: 2000, suffix: '+', label: 'Clients Transformed' },
  { target: 30, suffix: '+', label: 'Awards' },
  { target: 30, suffix: '+', label: 'Countries' },
]

function AnimatedStat({ target, suffix, label, delay }: {
  target: number
  suffix: string
  label: string
  delay: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const inView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (!inView) return
    const duration = 2000
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setCount(target)
      }
    }
    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick)
    }, delay * 1000)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [inView, target, delay])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' as const }}
      className="border-t border-white/15 pt-6 min-w-[140px]"
    >
      <p className="text-5xl lg:text-6xl font-light text-brand-accent mb-2">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-white/60 text-sm tracking-widest uppercase">
        {label}
      </p>
    </motion.div>
  )
}

function QualificationGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-white/70 text-sm font-light leading-relaxed">
            <span aria-hidden="true" className="mt-2 w-3 h-px bg-brand-accent flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Credentials() {
  const [showFullList, setShowFullList] = useState(false)

  return (
    <section
      aria-labelledby="credentials-heading"
      className="bg-brand-primary py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
        >
          Credentials &amp; Expertise
        </motion.p>

        <motion.h2
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          id="credentials-heading"
          className="text-4xl lg:text-6xl font-light text-white leading-[1.08] max-w-3xl mb-16"
        >
          Two decades. Multiple disciplines. One integrated method.
        </motion.h2>

        <div className="flex flex-wrap gap-12 mb-16">
          {stats.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              target={stat.target}
              suffix={stat.suffix}
              label={stat.label}
              delay={0.2 + i * 0.1}
            />
          ))}
        </div>

        {/* Credential tags */}
        <div className="flex flex-wrap gap-3">
          {credentials.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{
                duration: 0.5,
                delay: i * 0.05,
                ease: 'easeOut' as const,
              }}
              className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5 text-white/80 text-sm font-light backdrop-blur-sm"
            >
              {tag}
            </motion.span>
          ))}
        </div>

        {/* Full qualifications & memberships — ported from the old /qualifications page */}
        <div className="mt-12">
          <button
            type="button"
            onClick={() => setShowFullList((open) => !open)}
            aria-expanded={showFullList}
            aria-controls="full-qualifications"
            className="inline-flex items-center gap-3 text-sm uppercase tracking-widest font-medium text-white/80 hover:text-white border border-white/25 hover:border-white/50 rounded-button px-6 py-3 transition-colors duration-300"
          >
            {showFullList ? 'Hide full qualifications' : 'View full qualifications & memberships'}
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${showFullList ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showFullList && (
            <div id="full-qualifications" className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <QualificationGroup title="Academic" items={academicQualifications} />
              <QualificationGroup title="Certifications" items={certifications} />
              <div className="space-y-10">
                <QualificationGroup title="Additional Training" items={additionalTraining} />
                <div>
                  <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
                    Memberships
                  </h3>
                  <p className="text-white/70 text-sm font-light leading-relaxed">{memberships}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
