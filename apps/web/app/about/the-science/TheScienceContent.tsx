'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const survivalResponses = [
  {
    title: 'Fight',
    description:
      'React, control, push back. The system protects itself by dominating the environment.',
  },
  {
    title: 'Flight',
    description:
      'Anxiety, overthinking, urgency. The system tries to escape the perceived threat.',
  },
  {
    title: 'Freeze',
    description:
      'Shutdown, withdrawal, numbness. The system collapses when threat feels inescapable.',
  },
]

const repatterningSteps = [
  {
    number: '01',
    title: 'Nervous system regulation',
    description:
      'Bringing the system out of survival mode, so change becomes physiologically possible.',
  },
  {
    number: '02',
    title: 'Subconscious pattern decoding',
    description:
      'Identifying the specific pattern, and the early experience it was built to survive.',
  },
  {
    number: '03',
    title: 'Emotional reset',
    description:
      'Releasing the stored emotional charge that keeps the old response firing.',
  },
  {
    number: '04',
    title: 'Identity recalibration',
    description:
      'Aligning who you are today with a system no longer organised around the past.',
  },
]

const outcomes = [
  'You feel calm without forcing it',
  'You respond instead of react',
  'You think clearly under pressure',
  'You stop feeling on edge',
  'Your energy stabilises',
]

export default function TheScienceContent() {
  return (
    <>
      {/* Hero — dark navy */}
      <section
        aria-labelledby="science-hero-heading"
        className="relative bg-brand-primary pt-40 pb-24 lg:pt-52 lg:pb-32 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand-accent/15 blur-[120px]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...fadeUp(0)}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              About: The Science
            </motion.p>
            <motion.h1
              id="science-hero-heading"
              {...fadeUp(0.2)}
              className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-8"
            >
              It&rsquo;s not you,{' '}
              <span className="text-brand-accent">it&rsquo;s your pattern</span>.
            </motion.h1>
            <motion.p
              {...fadeUp(0.4)}
              className="text-lg lg:text-xl text-white/75 font-light max-w-xl"
            >
              The science behind Pattern Intelligence&trade;: how the brain and
              nervous system learn patterns, why they persist below conscious
              thought, and what actually changes them.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Premise — light */}
      <section aria-labelledby="premise-heading" className="bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Premise
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="premise-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-[1.08] mb-8"
            >
              Emotions are not the cause. They are the output.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              Most people believe their emotions are the problem.
              &ldquo;I&rsquo;m anxious.&rdquo; &ldquo;I overreact.&rdquo;
              &ldquo;I shut down.&rdquo; So they try to control them. But
              emotions and behaviours are the result of how your nervous system
              is interpreting the world.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              If your nervous system feels unsafe, you will experience anxiety,
              even in safe environments. If your system expects pressure, you
              will feel stress, even when nothing is wrong. If your system
              learned to shut down, you will disconnect, even when you want to
              engage.
            </motion.p>
            <motion.p
              {...reveal(0.4)}
              className="text-brand-primary text-xl font-light leading-relaxed"
            >
              This is not personality. This is patterning.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Nervous System — dark */}
      <section
        aria-labelledby="nervous-system-heading"
        className="bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            {...sectionReveal}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            The Nervous System
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="nervous-system-heading"
            className="text-4xl lg:text-6xl font-light text-white leading-[1.08] max-w-3xl mb-8"
          >
            How your system learned the pattern.
          </motion.h2>
          <motion.p
            {...reveal(0.2)}
            className="text-white/70 text-lg font-light leading-relaxed max-w-3xl mb-16"
          >
            Your nervous system is designed for survival. When it senses threat,
            it activates one of three responses, and when repeated over time,
            these become default patterns.
          </motion.p>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8 mb-16">
            {survivalResponses.map((response, i) => (
              <motion.div
                key={response.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: 'easeOut' as const,
                }}
                className="rounded-card border border-white/5 bg-gray-900 p-8 transition-all duration-500 hover:border-brand-accent/40 hover:shadow-2xl hover:-translate-y-1"
              >
                <h3 className="text-2xl font-light text-white mb-4">
                  {response.title}
                </h3>
                <p className="text-white/65 font-light leading-relaxed">
                  {response.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.blockquote
            {...reveal(0.3)}
            className="border-l-2 border-brand-accent pl-6 italic text-white text-xl lg:text-2xl font-light leading-snug max-w-3xl"
          >
            You are not reacting to what&rsquo;s happening now. You are reacting
            to what your system expects, based on the past.
          </motion.blockquote>
        </div>
      </section>

      {/* The Childhood Brain — light */}
      <section
        aria-labelledby="childhood-brain-heading"
        className="bg-gray-50 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Childhood Brain
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="childhood-brain-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-[1.08] mb-8"
            >
              Where the pattern was written.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              Brain development is much more than a story about biology. From our
              earliest years, relationships with others play a key role in
              shaping how the brain grows. From early experiences of neglect,
              lack of love, or simply not having our needs met, we generate
              beliefs, some helpful, some harmful.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-gray-700 text-lg font-light leading-relaxed mb-6"
            >
              The child adapts, learns a new way of being, and makes it the new
              familiar. Fast-forward to adulthood: the decisions are long
              forgotten, but the adult finds their potential reduced by rules
              that are limiting and self-defeating: an operating system that was
              installed early and has never been interrogated, reviewed or
              updated.
            </motion.p>
            <motion.p
              {...reveal(0.4)}
              className="text-brand-primary text-xl font-light leading-relaxed"
            >
              Until that operating system is raised to awareness, the same
              patterns repeat themselves: in relationships, health, work and
              life.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Why Insight Isn't Enough — dark */}
      <section
        aria-labelledby="insight-heading"
        className="bg-gray-950 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <motion.p
                {...sectionReveal}
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
              >
                Why Insight Isn&rsquo;t Enough
              </motion.p>
              <motion.h2
                {...reveal(0.1)}
                id="insight-heading"
                className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-8"
              >
                You can&rsquo;t think your way out of a pattern.
              </motion.h2>
              <motion.p
                {...reveal(0.2)}
                className="text-white/70 text-lg font-light leading-relaxed mb-6"
              >
                You can understand your behaviour. You can be aware of it. And
                still repeat it. Why? Because the pattern doesn&rsquo;t live in
                your thinking. It lives in your nervous system, in your body,
                below conscious thought. The system keeps returning to what it
                resonates with: the familiar.
              </motion.p>
              <motion.p
                {...reveal(0.3)}
                className="text-white/70 text-lg font-light leading-relaxed"
              >
                That is why Rapid Repatterning&reg; works at the level where
                patterns are formed, not coping strategies layered on top, but a
                change to the pattern itself.
              </motion.p>
            </div>

            <div className="flex flex-col gap-6">
              {repatterningSteps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: 'easeOut' as const,
                  }}
                  className="flex gap-6 rounded-card border border-white/5 bg-gray-900 p-6 transition-all duration-500 hover:border-brand-accent/40"
                >
                  <span className="text-brand-accent text-2xl font-light shrink-0">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-white text-lg font-medium mb-2">
                      {step.title}
                    </h3>
                    <p className="text-white/65 font-light leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* When the Pattern Changes — light */}
      <section
        aria-labelledby="change-heading"
        className="bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.p
              {...sectionReveal}
              className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
            >
              The Result
            </motion.p>
            <motion.h2
              {...reveal(0.1)}
              id="change-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary leading-[1.08] mb-8"
            >
              What happens when the pattern changes.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-gray-700 text-lg font-light leading-relaxed mb-10"
            >
              When your nervous system becomes regulated, the change shows up
              everywhere at once, because one pattern was driving multiple areas
              of your life. Coherence returns to the whole system:
            </motion.p>
            <ul className="mb-12">
              {outcomes.map((outcome, i) => (
                <motion.li
                  key={outcome}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: 'easeOut' as const,
                  }}
                  className="flex items-baseline gap-4 border-b border-gray-200 py-4 text-brand-primary text-lg font-light"
                >
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full bg-brand-accent shrink-0 translate-y-[-2px]"
                  />
                  {outcome}
                </motion.li>
              ))}
            </ul>
            <motion.blockquote
              {...reveal(0.3)}
              className="border-l-2 border-brand-accent pl-6 italic text-brand-primary text-xl lg:text-2xl font-light leading-snug"
            >
              You don&rsquo;t become a different person. You become yourself,
              without the pattern running you.
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* Final CTA — dark navy */}
      <section
        aria-labelledby="science-cta-heading"
        className="relative bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand-accent/15 blur-[120px]"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            {...sectionReveal}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Find Your Pattern
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="science-cta-heading"
            className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-8"
          >
            The science only matters once you know your pattern.
          </motion.h2>
          <motion.p
            {...reveal(0.2)}
            className="text-white/70 text-lg font-light leading-relaxed max-w-xl mx-auto mb-12"
          >
            Take the free Pattern Scan to identify the pattern your nervous
            system is running, or book a discovery call to talk it through with
            Suzanne.
          </motion.p>
          <motion.div
            {...reveal(0.3)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/discover-your-pattern"
              className="inline-flex items-center justify-center px-10 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:shadow-[0_0_30px_theme(colors.brand.accent/50%)]"
            >
              Take the Free Pattern Scan
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-10 py-4 border border-white/40 hover:border-white text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/5"
            >
              Book a Discovery Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
