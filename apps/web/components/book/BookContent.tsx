'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

// TODO: Suzanne to confirm book titles, descriptions, and release dates for all 3 books in the trilogy
const books = [
  {
    number: '01',
    title: 'Breakthrough',
    subtitle: 'Decoding the Pattern',
    description:
      'Identify and decode the hidden patterns that have been running your life beneath conscious awareness — the programs installed early in life that shape every decision, relationship, and result you experience today.',
    tag: 'Pre-Order',
    // TODO: Confirm with Suzanne — "Available Now" or "Pre-Order"?
    tagAccent: true,
  },
  {
    number: '02',
    title: 'Beyond the Pattern',
    subtitle: 'Upgrading Your Response',
    description:
      'Once you can see the pattern, you can change it. Book two guides you through the process of upgrading how you respond to every situation — replacing automatic reactions with conscious, empowered choices.',
    tag: 'Coming Soon',
    tagAccent: false,
  },
  {
    number: '03',
    title: 'Becoming Unstoppable',
    subtitle: 'Living at Full Potential',
    description:
      'The final book in the trilogy brings it all together — a complete operating system for living at your highest potential, navigating life with mastery and creating results that once felt impossible.',
    tag: 'Coming Soon',
    tagAccent: false,
  },
]

const themes = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.702-1.316 2.391l-1.558-.39c-.893-.223-1.843-.067-2.614.49l-.16.12a2.96 2.96 0 01-3.507 0l-.16-.12c-.771-.557-1.72-.713-2.614-.49l-1.558.39c-1.344.311-2.316-1.392-1.316-2.391L5 14.5"
        />
      </svg>
    ),
    heading: 'Decode the Pattern',
    body: 'Understanding the hidden programs running your life — installed before age seven and operating below conscious awareness.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
    heading: 'Upgrade Your Response',
    body: 'Changing how you relate to every situation — replacing automatic reactions with conscious, empowered choices that align with who you want to be.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
        />
      </svg>
    ),
    heading: 'Navigate with Mastery',
    body: 'Using your innate wisdom to move through life with clarity, confidence and purpose — not reacting, but responding with full command.',
  },
]

// TODO: Replace with book-specific testimonials when available
const testimonials = [
  {
    quote:
      "Suzanne's work fundamentally changed how I see myself and what I believe is possible. Within weeks of applying her methodology, I had breakthrough results in my business and my relationships. This is not theory — it works.",
    name: 'Michelle K.',
    title: 'Executive, Johannesburg',
  },
  {
    quote:
      "I've read dozens of personal development books. What makes Suzanne's approach different is that it goes to the root cause. She doesn't teach you to manage your patterns — she helps you dissolve them entirely.",
    name: 'David T.',
    title: 'Entrepreneur, Cape Town',
  },
  {
    quote:
      'The Rapid Repatterning® process described in this work is the single most powerful tool I have ever encountered for lasting change. I recommend it to every client I work with.',
    name: 'Dr. Karen M.',
    title: 'Clinical Psychologist',
  },
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

export default function BookContent() {
  return (
    <>
      {/* ─── 1. Hero — dark, min-h-screen ─────────────────────────────── */}
      <section
        aria-labelledby="book-hero-heading"
        className="relative w-full overflow-hidden min-h-screen flex items-center"
      >
        {/* Hero background — Suzanne holding the book */}
        <Image
          src="/images/suzanne-holding-book.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          aria-hidden="true"
        />

        {/* Gradient overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-brand-primary/50 to-brand-primary"
        />

        {/* Ambient glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute bg-brand-accent/10 blur-[160px] rounded-full w-[600px] h-[600px] top-1/3 left-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48">
          <div className="max-w-3xl">
            <motion.p
              {...fadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Breakthrough Trilogy
            </motion.p>

            <motion.h1
              id="book-hero-heading"
              {...fadeUp(0.1)}
              className="text-4xl lg:text-7xl font-light text-white leading-[1.05] mb-8"
            >
              A Quest to Find an Upgraded Version of You
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="text-lg lg:text-xl text-white/75 leading-relaxed mb-10 max-w-2xl"
            >
              Three books. One journey. The complete roadmap to decoding the patterns that keep you
              stuck — and upgrading every area of your life.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop/the-latest-book-by-suzanne"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 animate-pulse-glow"
              >
                Pre-Order Now
              </Link>
              <a
                href="#excerpt"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white hover:bg-white/10 font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300"
              >
                Read an Excerpt ↓
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 2. The Book — light, bg-white ────────────────────────────── */}
      <section aria-labelledby="book-detail-heading" className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 items-center">

            {/* Book cover — left */}
            <motion.div {...scrollFadeUp(0)} className="flex justify-center">
              <Image
                src="/images/book-cover.png"
                alt="Breakthrough Trilogy by Dr. Suzanne Ravenall"
                width={400}
                height={600}
                className="rounded-card shadow-2xl"
              />
            </motion.div>

            {/* Description — right */}
            <div>
              <motion.p
                {...scrollFadeUp(0)}
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
              >
                The Book
              </motion.p>

              <motion.h2
                id="book-detail-heading"
                {...scrollFadeUp(0.1)}
                className="text-4xl lg:text-5xl font-light text-brand-primary leading-tight mb-2"
              >
                Breakthrough Trilogy
              </motion.h2>
              <motion.p
                {...scrollFadeUp(0.15)}
                className="text-xl text-gray-400 font-light mb-8"
              >
                Overcoming the Impossible &amp; Living Life Beyond Limitation
              </motion.p>

              <motion.p {...scrollFadeUp(0.2)} className="text-gray-600 leading-relaxed mb-10">
                For a moment, just one moment, imagine you had the ability to alter your relationship
                with everything happening in your life. Imagine having the ability to deeply understand
                it, improve how you respond to it and how to navigate it successfully.
              </motion.p>

              {/* 3 key themes */}
              <div className="space-y-6 mb-10">
                {themes.map((theme, i) => (
                  <motion.div
                    key={theme.heading}
                    {...scrollFadeUp(0.3 + i * 0.1)}
                    className="flex gap-4 items-start"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-card bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                      {theme.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-primary text-sm mb-1">{theme.heading}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{theme.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                {...scrollFadeUp(0.65)}
                className="flex flex-col sm:flex-row sm:items-center gap-6"
              >
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                    Pre-order price
                  </p>
                  <p className="text-3xl font-semibold text-brand-primary">R165</p>
                </div>
                <Link
                  href="/shop/the-latest-book-by-suzanne"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300"
                >
                  Pre-Order Your Copy
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. What You'll Discover — dark, bg-gray-950 ──────────────── */}
      <section aria-labelledby="trilogy-heading" className="w-full bg-gray-950 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.p
              {...scrollFadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
            >
              Inside the Trilogy
            </motion.p>
            <motion.h2
              id="trilogy-heading"
              {...scrollFadeUp(0.1)}
              className="text-4xl lg:text-6xl font-light text-white"
            >
              Three books that work as one system
            </motion.h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book, i) => (
              <motion.div
                key={book.title}
                {...scrollFadeUp(i * 0.1)}
                className="group relative bg-gray-900 rounded-card overflow-hidden p-8 hover:shadow-[0_8px_32px_rgba(23,25,244,0.15)] transition-all duration-500 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <p className="text-7xl font-light text-brand-accent/15 mb-4 leading-none select-none">
                    {book.number}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-4 ${
                      book.tagAccent
                        ? 'bg-brand-accent/20 text-brand-accent'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {book.tag}
                  </span>
                  <h3 className="text-xl font-semibold text-white mb-1">{book.title}</h3>
                  <p className="text-sm text-brand-accent mb-4">{book.subtitle}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{book.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Excerpt — light, bg-gray-50 ───────────────────────────── */}
      {/* TODO: Replace pull quote and paragraph below with real book excerpt when available */}
      <section
        id="excerpt"
        aria-labelledby="excerpt-heading"
        className="w-full bg-gray-50 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.p
              {...scrollFadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
            >
              From the Pages
            </motion.p>
            <motion.h2
              id="excerpt-heading"
              {...scrollFadeUp(0.1)}
              className="text-3xl lg:text-5xl font-light text-brand-primary mb-16"
            >
              A taste of the journey
            </motion.h2>

            {/* Pull quote */}
            <motion.blockquote
              {...scrollFadeUp(0.2)}
              className="mb-12"
              aria-label="Book excerpt from Breakthrough Trilogy"
            >
              <div
                className="text-brand-accent/40 text-8xl font-serif leading-none mb-2 select-none"
                aria-hidden="true"
              >
                &ldquo;
              </div>
              <p className="text-2xl lg:text-3xl font-light text-gray-700 leading-relaxed italic mb-8">
                For a moment, just one moment, imagine you had the ability to alter your relationship
                with everything happening in your life.
              </p>
              <footer className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                — Dr. Suzanne Ravenall, Breakthrough Trilogy
              </footer>
            </motion.blockquote>

            <motion.p
              {...scrollFadeUp(0.3)}
              className="text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              The Breakthrough Trilogy is not a self-help book. It is a practical operating manual
              for the human mind — drawing on neuroscience, energy psychology, and over two decades
              of hands-on client transformation to give you a complete system for lasting change.
            </motion.p>

            <motion.div {...scrollFadeUp(0.4)}>
              <Link
                href="/shop/the-latest-book-by-suzanne"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300"
              >
                Get the Full Book
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 5. About the Author — dark, bg-brand-primary ─────────────── */}
      <section
        aria-labelledby="author-heading"
        className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        {/* Glow blob */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-0 w-[600px] h-[600px] bg-brand-accent/10 blur-[140px] rounded-full"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">

            {/* Text — left */}
            <div>
              <motion.p
                {...scrollFadeUp(0)}
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
              >
                About the Author
              </motion.p>
              <motion.h2
                id="author-heading"
                {...scrollFadeUp(0.1)}
                className="text-4xl lg:text-5xl font-light text-white leading-tight mb-6"
              >
                Written from lived experience
              </motion.h2>
              <motion.p {...scrollFadeUp(0.2)} className="text-white/75 leading-relaxed mb-5">
                This trilogy is not written from theory. It is written from the trenches of real
                transformation — both Suzanne&apos;s own journey and thousands of client breakthroughs
                over 20+ years.
              </motion.p>
              <motion.p {...scrollFadeUp(0.3)} className="text-white/75 leading-relaxed mb-5">
                Dr. Suzanne Ravenall climbed Mount Elbrus, founded a successful international
                coaching institution, and overcame experiences that would have stopped most people
                in their tracks. Every insight in this trilogy was hard-won and battle-tested before
                it ever reached the page.
              </motion.p>
              <motion.p {...scrollFadeUp(0.4)} className="text-white/75 leading-relaxed mb-10">
                As the founder of Rapid Repatterning® and Neuro-repatterning® methodology, Suzanne
                brings a unique fusion of neuroscience, quantum physics, and energetic psychology
                to every page — giving you tools that work at the deepest level of your being.
              </motion.p>
              <motion.div {...scrollFadeUp(0.5)}>
                <Link
                  href="/about"
                  className="inline-flex items-center text-brand-accent font-semibold text-sm uppercase tracking-widest hover:text-brand-accent-400 transition-colors duration-300 group"
                >
                  Meet Dr. Ravenall
                  <svg
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </motion.div>
            </div>

            {/* Portrait — right */}
            <motion.div
              {...scrollFadeUp(0.15)}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative w-72 lg:w-96 aspect-[3/4] rounded-card overflow-hidden shadow-2xl">
                <Image
                  src="/images/suzanne-portrait.jpg"
                  alt="Dr. Suzanne Ravenall, author of the Breakthrough Trilogy"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 288px, 384px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/50 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 6. Reader Responses — light, bg-white ──────────────────── */}
      {/* TODO: Replace with book-specific testimonials when available */}
      <section
        aria-labelledby="responses-heading"
        className="w-full bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.p
              {...scrollFadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
            >
              Early Readers Say
            </motion.p>
            <motion.h2
              id="responses-heading"
              {...scrollFadeUp(0.1)}
              className="text-4xl lg:text-6xl font-light text-brand-primary"
            >
              Transformation that speaks for itself
            </motion.h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={`${t.name}-${i}`}
                {...scrollFadeUp(i * 0.1)}
                className="group bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-card p-8 hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6" role="img" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg
                      key={j}
                      className="w-4 h-4 text-brand-amber fill-current"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-brand-primary text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. Pre-Order CTA — dark, bg-brand-primary-900 ────────────── */}
      <section
        aria-labelledby="preorder-heading"
        className="relative w-full bg-brand-primary-900 py-20 lg:py-32 overflow-hidden"
      >
        {/* Vignette overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-brand-primary-900/50"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">

            {/* CTA content — left */}
            <div>
              <motion.p
                {...scrollFadeUp(0)}
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4"
              >
                Get Your Copy
              </motion.p>
              <motion.h2
                id="preorder-heading"
                {...scrollFadeUp(0.1)}
                className="text-4xl lg:text-6xl font-light text-white leading-tight mb-6"
              >
                Your transformation starts on page one
              </motion.h2>
              <motion.p {...scrollFadeUp(0.2)} className="text-white/70 text-lg leading-relaxed mb-8">
                Pre-order the Breakthrough Trilogy and be among the first to receive your copy
                when it launches.
              </motion.p>

              <motion.div {...scrollFadeUp(0.3)} className="mb-10">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                  Pre-order price
                </p>
                <p className="text-5xl font-semibold text-white">R165</p>
              </motion.div>

              <motion.div
                {...scrollFadeUp(0.4)}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/shop/the-latest-book-by-suzanne"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 animate-pulse-glow"
                >
                  Pre-Order Now — R165
                </Link>
                <Link
                  href="/shop/the-latest-book-by-suzanne"
                  className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white hover:bg-white/10 font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300"
                >
                  Gift This Book
                </Link>
              </motion.div>
            </div>

            {/* Suzanne casual photo — right, hidden on mobile */}
            <motion.div
              {...scrollFadeUp(0.15)}
              className="hidden lg:flex justify-end"
            >
              <div className="relative w-80 aspect-[3/4] rounded-card overflow-hidden shadow-2xl">
                <Image
                  src="/images/suzanne-casual.jpg"
                  alt="Dr. Suzanne Ravenall"
                  fill
                  className="object-cover"
                  sizes="320px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary-900/70 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
