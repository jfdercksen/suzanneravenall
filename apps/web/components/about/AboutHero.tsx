'use client'

import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

// HEADER RULE (.claude/rules/design-rules.md), the inner-page template Johan
// approved on the 15 Sep design canvas: the picture is the header and the
// text sits on a black band at its bottom edge. Headline 60px regular, one
// line of description, no eyebrow (the old "Meet Dr. Suzanne Ravenall"
// repeated the logo directly above it). The quote that used to sit here moved
// out: MediaLogos carries the same quote further down this page.
// Below sm the picture takes the top 320px and the text sits on black beneath
// it, so nothing covers Suzanne's face. components/home/Hero.tsx is the
// reference implementation.
export default function AboutHero() {
  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative flex flex-col justify-end bg-brand-primary-900 sm:min-h-[560px] lg:min-h-[calc(100vh-5rem)] overflow-hidden"
    >
      {/* Suzanne stands left of centre in this footage: below sm the 320px
          crop shifts left so her face stays in frame. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute inset-x-0 top-0 w-full h-80 sm:h-full object-cover object-[30%_50%] sm:object-center"
        poster="/images/hero-bg-suzanne-ravenall.jpg"
      >
        <source src="/videos/generated/hero-brain-video.mp4" type="video/mp4" />
      </video>

      {/* Scrim attached to the text band only: a fade from clear to black/65,
          then black/65 to black/85 behind the text. Below sm the fade runs to
          the section ground exactly where the 320px picture ends (224 + 96). */}
      <div className="relative z-10 pt-56 sm:pt-0">
        <div aria-hidden="true" className="h-24 lg:h-32 bg-gradient-to-t from-brand-primary-900 sm:from-black/65 to-transparent" />
        <div className="bg-gradient-to-t from-black/85 to-black/65">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-20 lg:pb-24">
            {/* From sm the text sits in a right-hand column (Johan, 15 Sep):
                Suzanne stands on the left of this footage and the brain fills
                the right, so bottom-left text covered her. Left-aligned inside
                the column, because ragged-left lines are harder to read. The
                column is narrower on tablets so its left edge clears her face.
                lg:pr-24 keeps long lines clear of the Brilliant Coach tab. */}
            <div className="sm:ml-auto sm:max-w-md lg:max-w-2xl lg:pr-24">
              <motion.h1
                id="about-hero-heading"
                {...fadeUp(0)}
                className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.05] [text-wrap:balance] mb-4 lg:mb-5"
              >
                Championing the change in the human condition{' '}
                <span className="underline decoration-white/60 decoration-2 underline-offset-8 sm:underline-offset-[10px]">one person at a time</span>
              </motion.h1>

              <motion.p
                {...fadeUp(0.2)}
                className="text-sm sm:text-base lg:text-lg text-white/85 max-w-xl"
              >
                B.Msc. M.Msc. Msc.D.: Transformation &amp; Performance Coach, Speaker,
                and multiple award-winning entrepreneur.
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
