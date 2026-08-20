'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

type FormState = 'idle' | 'loading' | 'success' | 'error'

const FEATURES = [
  {
    title: 'Member Discussions',
    description: 'Ask questions, share wins, and get support from fellow members who are on the same path.',
    icon: (
      <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.122v10a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-10c0-.994.616-1.838 1.5-2.122M12 3a3 3 0 110 6 3 3 0 010-6zm0 0v3m0 0H9m3 0h3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21v-6.75a2.25 2.25 0 012.25-2.25h4.5a2.25 2.25 0 012.25 2.25V21" />
      </svg>
    ),
  },
  {
    title: 'Breakthrough Sharing',
    description: 'Celebrate your breakthroughs in a safe, supportive environment with people who understand your journey.',
    icon: (
      <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    title: 'Tier-Based Access',
    description: 'Your membership tier determines your access: practitioners get dedicated spaces, Gold members get priority.',
    icon: (
      <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
]

const EXPLORE_LINKS = [
  {
    label: 'Programmes',
    href: '/programs',
    description: 'Discover our full range of transformation programmes.',
  },
  {
    label: 'Blog',
    href: '/blog',
    description: 'Insights on patterns, neuroscience, and lasting change.',
  },
  {
    label: 'Shop',
    href: '/shop',
    description: 'Browse individual sessions, courses, and memberships.',
  },
]

export default function CommunityContent() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok || res.status === 202) {
        setState('success')
        setEmail('')
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMessage((data as { error?: string }).error ?? 'Something went wrong. Please try again.')
        setState('error')
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
      setState('error')
    }
  }

  return (
    <main className="w-full">

      {/* ── Section 1: Hero (light) ─────────────────────────────────────── */}
      <section className="relative w-full bg-gray-50 min-h-screen flex items-center py-20 lg:py-32 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                Community
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-brand-primary mb-6 leading-[1.05]">
                Your Transformation<br />Community
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl">
                A private space for members to connect, share breakthroughs, and support
                each other&apos;s journey. Coming soon.
              </p>
            </motion.div>

            {/* Email capture */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mb-16"
            >
              <p className="text-brand-primary font-semibold mb-4">
                Be the first to know when we launch
              </p>

              {state === 'success' ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-card max-w-md">
                  <svg aria-hidden="true" className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-700 text-sm">
                    You&apos;re on the list. We&apos;ll let you know as soon as the community launches.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <label htmlFor="community-email" className="sr-only">Email address</label>
                  <input
                    id="community-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={state === 'loading'}
                    className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-accent transition-colors duration-200 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={state === 'loading'}
                    className="px-6 py-3.5 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-300 disabled:opacity-60 whitespace-nowrap"
                  >
                    {state === 'loading' ? 'Sending…' : 'Notify me'}
                  </button>
                </form>
              )}

              {state === 'error' && errorMessage && (
                <p className="mt-3 text-red-500 text-sm">{errorMessage}</p>
              )}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <Link
                href="/portal/dashboard"
                className="inline-flex items-center gap-2 text-brand-accent hover:text-brand-accent-700 font-semibold transition-colors duration-300 group"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 rotate-180 transition-transform duration-300 group-hover:-translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                Explore the Portal
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Section 2: Explore (light) ──────────────────────────────────── */}
      <section className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              While you wait
            </p>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-brand-primary">
              Explore what&apos;s available now
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {EXPLORE_LINKS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="group flex flex-col gap-3 p-6 bg-gray-50 hover:bg-gray-100 rounded-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full"
                >
                  <h3 className="text-gray-900 font-semibold">{item.label}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1">{item.description}</p>
                  <span className="inline-flex items-center gap-1 text-brand-accent text-sm font-medium group-hover:gap-2 transition-all duration-300">
                    Explore
                    <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Feature preview (light) ─────────────────────────── */}
      <section className="relative w-full bg-gray-50 py-20 lg:py-32 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              What&apos;s coming
            </p>
            <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-brand-primary">
              Built for your growth
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="p-6 bg-white border border-gray-100 rounded-card"
              >
                <div className="w-10 h-10 rounded-card bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-brand-primary font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
