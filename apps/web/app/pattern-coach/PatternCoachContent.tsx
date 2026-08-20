'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Compass, Sparkles } from 'lucide-react'

const APP_URL = 'https://suzanneravenallpatterncoach.com'

const steps = [
  {
    number: '01',
    title: 'Sign Up',
    description:
      'Create your account in minutes. No long forms, no gatekeeping: just you and your coach, ready when you are.',
  },
  {
    number: '02',
    title: '30 Days Free Access',
    description:
      'Explore everything the Pattern Intelligence Coach™ offers for a full 30 days, completely free. Ask anything, any time of day.',
  },
  {
    number: '03',
    title: 'Continue Monthly',
    description:
      'Loved your first month? Keep going, then a simple monthly subscription, cancel anytime.',
  },
]

const capabilities = [
  {
    icon: Clock,
    title: 'Available 24 Hours a Day',
    description:
      'Insight rarely keeps office hours. Whether it is a 6am boardroom nerve or a 2am spiral, your coach is there the moment you need to think something through.',
  },
  {
    icon: Compass,
    title: 'Pattern-Aware Guidance',
    description:
      'Grounded in Pattern Intelligence™, it helps you notice the unconscious patterns driving your decisions and behaviour, and supports the work between sessions.',
  },
  {
    icon: Sparkles,
    title: "Built on Suzanne's Method",
    description:
      'Shaped by Dr. Suzanne Ravenall’s behavioural performance methodology, so the guidance you receive reflects the same approach she uses with leaders worldwide.',
  },
]

const reassurances = [
  {
    question: 'How long is the free trial?',
    answer:
      'A full 30 days. You get complete access from day one, so you can experience what a coach in your pocket really feels like before deciding.',
  },
  {
    question: 'What happens after the trial?',
    answer:
      'You continue on a simple monthly subscription, cancel anytime. Full subscription details are confirmed when you sign up.',
  },
  {
    question: 'What devices does it work on?',
    answer:
      'Any device with a browser: phone, tablet, or desktop. Your coach travels with you wherever you go.',
  },
  {
    question: 'Does it replace working with Suzanne?',
    answer:
      'No, it complements it. The Pattern Intelligence Coach™ supports you between sessions and in everyday moments; deep transformation work still happens with Suzanne and her programmes.',
  },
]

const sectionFadeUp = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
} as const

export default function PatternCoachContent() {
  return (
    <>
      {/* ── Section 1: Hero (light) ──────────────────────────────────────── */}
      <section className="relative w-full bg-white min-h-[70vh] flex items-center py-24 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              Pattern Intelligence Coach&trade;
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-brand-primary leading-tight mb-6"
            >
              A Brilliant Coach in Your Pocket:{' '}
              <span className="text-brand-accent">24 Hours a Day</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-gray-600 mt-4 max-w-2xl mb-10"
            >
              The moments that shape you rarely happen in a coaching session. The
              Pattern Intelligence Coach&trade; is your always-on AI coach, built on
              Dr. Suzanne Ravenall&rsquo;s method, ready whenever a pattern shows up.
              Try it free for 30 days, then continue on a simple monthly subscription.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-semibold rounded-button transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.5)]"
              >
                Start Your 30-Day Free Trial
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 hover:border-brand-primary text-gray-600 hover:text-brand-primary text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
              >
                Book a Discovery Call
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 2: How It Works (light) ─────────────────────────────── */}
      <section className="w-full bg-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              How It Works
            </p>
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary">
              Three Simple Steps
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative p-8 rounded-card bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-500"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-6 right-6 text-6xl font-bold text-brand-accent opacity-20 leading-none select-none"
                >
                  {step.number}
                </span>
                <h3 className="text-gray-900 text-xl font-semibold mb-3 pr-16">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: What It Does (light) ─────────────────────────────── */}
      <section className="relative w-full bg-white py-20 lg:py-32 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              What It Does
            </p>
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary">
              Coaching That Never Sleeps
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {capabilities.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-gray-50 rounded-card p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-card bg-brand-accent/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-brand-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-brand-primary text-xl font-semibold mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Reassurance / FAQ (light) ────────────────────────── */}
      <section className="w-full bg-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Good to Know
            </p>
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-brand-primary">
              Before You Start
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {reassurances.map((item, i) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white rounded-card p-8 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-brand-primary text-lg font-semibold mb-3">
                  {item.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Final CTA (dark, photo-backed) ───────────────────── */}
      <section className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden">
        {/* Background photo + navy overlay — dark sections carry imagery, never flat colour */}
        <Image
          src="/images/generated/session-coaching.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFadeUp} className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-4">
              Ready When You Are
            </p>
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
              Your Coach Is Waiting
            </h2>
            <p className="text-white/80 text-lg mb-10">
              Start today and have a brilliant coach in your pocket within minutes:
              free for 30 days, then a simple monthly subscription. Cancel anytime.
            </p>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-semibold rounded-button transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.5)]"
            >
              Start Your 30-Day Free Trial
            </a>
          </motion.div>
        </div>
      </section>
    </>
  )
}
