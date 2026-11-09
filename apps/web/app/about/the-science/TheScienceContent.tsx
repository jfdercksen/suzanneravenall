'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageHeader, HEADER_UNDERLINE } from '@/components/shared/PageHeader'

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
  {
    title: 'Fawn',
    description:
      'Appease, please, over-accommodate. The system protects itself by keeping others happy, at the cost of its own needs.',
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

// Suzanne's list of 8 Nov 2026. regulatedOutcomes and REGULATED_CLOSING are
// the one source for this list on the site.
const regulatedOutcomes = [
  'You feel calm without forcing it',
  'You respond instead of react',
  'You think clearly under pressure',
  'You stop feeling on edge',
  'Your energy stabilises',
  'You navigate life differently',
  'You access your full potential',
]

const REGULATED_CLOSING =
  'You don’t become a different person. You become yourself, you know yourself at a deeper level without the pattern running you.'

// The real science, Suzanne's attachment of 8 Nov 2026 (Document2).
const foundations = [
  {
    number: '01',
    title: 'The brain is a prediction machine',
    body: 'Modern neuroscience shows that the brain doesn’t just react to the world. It predicts it. From past experience it builds models of what will happen next and gets the body ready before conscious thought catches up. When a prediction formed under pressure years ago is still running, it fires faster than reason. That’s why insight alone rarely changes behaviour.',
  },
  {
    number: '02',
    title: 'The nervous system decides before you do',
    body: 'Your nervous system constantly scans for safety and threat below awareness, a process neuroscientists call neuroception. When it detects a threat, including a social one like criticism, exclusion or a high-stakes meeting, it triggers fight, flight, freeze or fawn. Performance becomes inconsistent because it depends on the state of the nervous system, not on capability.',
  },
  {
    number: '03',
    title: 'Patterns are learned, so they can be relearned',
    body: 'Every pattern was once a smart adaptation: the best strategy available when it formed. The issue is less the pattern than the meaning attached to the experience that created it. Most of us carry a small number of core patterns, and each one produces many surface behaviours.',
  },
  {
    number: '04',
    title: 'Early experience leaves a measurable mark',
    body: 'The landmark Adverse Childhood Experiences (ACE) study, run by Kaiser Permanente and the US Centers for Disease Control with about 17,000 mostly middle-class, employed adults, found that difficult early experiences are common and strongly linked to later health, behaviour and life outcomes. This isn’t about a damaged few. It describes how human systems adapt, and it applies to all of us.',
  },
  {
    number: '05',
    title: 'The brain can change: neuroplasticity',
    body: 'The brain keeps rewiring itself throughout life. Research on memory reconsolidation shows that when an old emotional learning is reactivated and met with a new, contradicting experience, it can be updated at the root rather than just managed. Rapid Repatterning® & Pattern Intelligence™ is built on this mechanism.',
  },
]

const changeHoldsSteps = [
  { title: 'See the pattern', body: 'make the unconscious prediction visible.' },
  { title: 'Decode the meaning', body: 'find the belief and need it was formed to protect.' },
  { title: 'Regulate the system', body: 'build the nervous-system safety that lets change happen.' },
  { title: 'Repattern', body: 'update the prediction itself through Rapid Repatterning® & Pattern Intelligence™.' },
  { title: 'Embody', body: 'practise the new response until the body trusts it as real.' },
]

export default function TheScienceContent() {
  return (
    <>
      {/* Header: shared PageHeader, the header rule */}
      <PageHeader
        id="science-hero-heading"
        eyebrow="About: The Science"
        image="/images/hero-bg-suzanne-ravenall.jpg"
        title={
          <>
            It&rsquo;s not you,{' '}
            <span className={HEADER_UNDERLINE}>it&rsquo;s your pattern</span>.
          </>
        }
        description={
          <>
            The science behind Pattern Intelligence&trade;: how the brain and
            nervous system learn patterns, why they persist below conscious
            thought, and what actually changes them.
          </>
        }
      />

      {/* The Real Science: light. Suzanne's attachment of 8 Nov 2026 */}
      <section aria-labelledby="real-science-heading" className="bg-brand-cream py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <motion.p
                {...sectionReveal}
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
              >
                The Science
              </motion.p>
              <motion.h2
                {...reveal(0.1)}
                id="real-science-heading"
                className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
              >
                Behaviour is never the problem. It&rsquo;s the evidence.
              </motion.h2>
              <motion.p
                {...reveal(0.2)}
                className="text-brand-ink text-lg font-light leading-relaxed mb-6"
              >
                Beneath every behaviour sits a prediction: a fast, unconscious
                forecast your nervous system makes about what will keep you safe.
                Pattern Intelligence&trade; draws on neuroscience, somatic
                psychology and behavioural science to find those predictions,
                measure them and change them.
              </motion.p>
              <motion.p
                {...reveal(0.3)}
                className="text-brand-primary text-xl font-light leading-relaxed"
              >
                People don&rsquo;t repeat behaviours. They repeat predictions.
                Change the prediction, and the behaviour changes naturally.
              </motion.p>
            </div>
            <motion.div
              {...reveal(0.3)}
              className="rounded-card bg-brand-sand p-8 lg:p-10"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                The question behind the work
              </p>
              <p className="text-2xl lg:text-3xl font-light text-brand-primary leading-snug mb-6">
                Why do intelligent, capable people keep producing outcomes they
                consciously don&rsquo;t want?
              </p>
              <p className="text-brand-muted text-lg font-light leading-relaxed">
                The usual answers are willpower, mindset or skill. None of them
                explain why a gifted leader freezes in the room that matters, or
                why a high-performing team falls back into the same conflict
                every quarter. The real answer is in how the brain is built, and
                it&rsquo;s both more hopeful and more practical than those
                explanations.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Five Foundations: dark */}
      <section
        aria-labelledby="foundations-heading"
        className="bg-brand-primary-900 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            {...sectionReveal}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-6"
          >
            Five Foundations
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="foundations-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08] max-w-3xl mb-16"
          >
            What the science shows.
          </motion.h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {foundations.map((foundation, i) => (
              <motion.li
                key={foundation.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: 'easeOut' as const }}
                className="rounded-card bg-brand-primary-700 p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
              >
                <span className="block text-brand-accent-400 text-2xl font-light mb-4">
                  {foundation.number}
                </span>
                <h3 className="text-xl lg:text-2xl font-medium text-white mb-4">
                  {foundation.title}
                </h3>
                <p className="text-white/80 font-light leading-relaxed">{foundation.body}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* The Premise: light */}
      <section aria-labelledby="premise-heading" className="bg-brand-cream py-20 lg:py-32">
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
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              Emotions are not the cause. They are the output.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-brand-ink text-lg font-light leading-relaxed mb-6"
            >
              Most people believe their emotions are the problem.
              &ldquo;I&rsquo;m anxious.&rdquo; &ldquo;I overreact.&rdquo;
              &ldquo;I shut down.&rdquo; So they try to control them. But
              emotions and behaviours are the result of how your nervous system
              is interpreting the world.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-brand-ink text-lg font-light leading-relaxed mb-6"
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

      {/* The Nervous System: light */}
      <section
        aria-labelledby="nervous-system-heading"
        className="bg-brand-sand py-20 lg:py-32"
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
            className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] max-w-3xl mb-8"
          >
            How your system learned the pattern.
          </motion.h2>
          <motion.p
            {...reveal(0.2)}
            className="text-brand-muted text-lg font-light leading-relaxed max-w-3xl mb-16"
          >
            Your nervous system is designed for survival. When it senses threat,
            it activates one of four responses, and when repeated over time,
            these become default patterns.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
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
                className="rounded-card border border-brand-border bg-white p-8 transition-all duration-500 hover:border-brand-primary-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <h3 className="text-2xl font-light text-brand-primary mb-4">
                  {response.title}
                </h3>
                <p className="text-brand-muted font-light leading-relaxed">
                  {response.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.blockquote
            {...reveal(0.3)}
            className="border-l-2 border-brand-accent pl-6 italic text-brand-primary text-xl lg:text-2xl font-light leading-snug max-w-3xl"
          >
            You are not reacting to what&rsquo;s happening now. You are reacting
            to what your system expects, based on the past.
          </motion.blockquote>
        </div>
      </section>

      {/* The Childhood Brain: light */}
      <section
        aria-labelledby="childhood-brain-heading"
        className="bg-brand-cream py-20 lg:py-32"
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
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              Where the pattern was written.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-brand-ink text-lg font-light leading-relaxed mb-6"
            >
              Brain development is much more than a story about biology. From our
              earliest years, relationships with others play a key role in
              shaping how the brain grows. From early experiences of neglect,
              lack of love, or simply not having our needs met, we generate
              beliefs, some helpful, some harmful.
            </motion.p>
            <motion.p
              {...reveal(0.3)}
              className="text-brand-ink text-lg font-light leading-relaxed mb-6"
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

      {/* Why Insight Isn't Enough: light */}
      <section
        aria-labelledby="insight-heading"
        className="bg-brand-sand py-20 lg:py-32"
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
                className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
              >
                You can&rsquo;t think your way out of a pattern.
              </motion.h2>
              <motion.p
                {...reveal(0.2)}
                className="text-brand-muted text-lg font-light leading-relaxed mb-6"
              >
                You can understand your behaviour. You can be aware of it. And
                still repeat it. Why? Because the pattern doesn&rsquo;t live in
                your thinking. It lives in your nervous system, in your body,
                below conscious thought. The system keeps returning to what it
                resonates with: the familiar.
              </motion.p>
              <motion.p
                {...reveal(0.3)}
                className="text-brand-muted text-lg font-light leading-relaxed"
              >
                That is why Rapid Repatterning&reg; &amp; Pattern
                Intelligence&trade; works at the level where patterns are formed,
                not coping strategies layered on top, but a change to the pattern
                itself.
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
                  className="flex gap-6 rounded-card border border-brand-border bg-white p-6 transition-all duration-500 hover:border-brand-primary-300"
                >
                  <span className="text-brand-accent text-2xl font-light shrink-0">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-brand-primary text-lg font-medium mb-2">
                      {step.title}
                    </h3>
                    <p className="text-brand-muted font-light leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why the Change Holds: dark */}
      <section
        aria-labelledby="change-holds-heading"
        className="bg-brand-primary-900 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <motion.p
                {...sectionReveal}
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-6"
              >
                Why the Change Holds
              </motion.p>
              <motion.h2
                {...reveal(0.1)}
                id="change-holds-heading"
                className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08] mb-8"
              >
                Pattern Intelligence&trade; works one layer deeper.
              </motion.h2>
              <motion.p
                {...reveal(0.2)}
                className="text-white/80 text-lg font-light leading-relaxed mb-6"
              >
                Most development approaches add coping strategies on top of the
                old pattern. Under pressure the pattern wins, and the old
                behaviour comes back.
              </motion.p>
              <motion.p
                {...reveal(0.3)}
                className="text-white text-xl font-light leading-relaxed"
              >
                The new prediction becomes the default, so there&rsquo;s nothing
                left to fight against.
              </motion.p>
            </div>
            <ol className="flex flex-col gap-4">
              {changeHoldsSteps.map((step, i) => (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' as const }}
                  className="flex gap-6 rounded-card bg-brand-primary-700 p-6"
                >
                  <span aria-hidden="true" className="text-brand-accent-400 text-2xl font-light shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-white/80 font-light leading-relaxed">
                    <span className="text-white font-medium">{step.title}:</span>{' '}
                    {step.body}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Measured, Not Assumed + Where the Science Comes Together: light */}
      <section
        aria-labelledby="measured-heading"
        className="bg-brand-cream py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <motion.p
                {...sectionReveal}
                className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
              >
                Measured, Not Assumed
              </motion.p>
              <motion.h2
                {...reveal(0.1)}
                id="measured-heading"
                className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
              >
                Most human-development work can&rsquo;t show what it changed.
              </motion.h2>
              <motion.p
                {...reveal(0.2)}
                className="text-brand-ink text-lg font-light leading-relaxed"
              >
                Pattern Intelligence&trade; starts with the Pattern Score&trade;,
                a scored diagnostic baseline that maps the patterns shaping
                performance and tracks how they shift over time. It applies to
                individuals, teams, departments and whole organisations.
              </motion.p>
            </div>
            <motion.div
              {...reveal(0.3)}
              className="rounded-card bg-brand-sand p-8 lg:p-10"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                Where the science comes together
              </p>
              <p className="text-brand-ink text-lg font-light leading-relaxed mb-6">
                Leadership development changes the behaviour. Therapy explains
                it. Coaching motivates it.
              </p>
              <p className="text-2xl lg:text-3xl font-medium text-brand-primary leading-snug mb-6">
                Pattern Intelligence&trade; changes the prediction that creates
                it.
              </p>
              <p className="text-brand-muted text-lg font-light leading-relaxed">
                No single field has the full picture. Pattern Intelligence&trade;
                brings neuroscience, somatic psychology, trauma research and
                behavioural science into one discipline built for real-world
                performance.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* When the Pattern Changes: light */}
      <section
        aria-labelledby="change-heading"
        className="bg-brand-sand py-20 lg:py-32"
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
              className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary leading-[1.08] mb-8"
            >
              What happens when the pattern changes.
            </motion.h2>
            <motion.p
              {...reveal(0.2)}
              className="text-brand-ink text-lg font-light leading-relaxed mb-10"
            >
              When your nervous system becomes regulated, the change starts to
              show up everywhere at once, because one pattern was driving
              multiple areas of your life. Coherence starts to return to the
              whole system:
            </motion.p>
            <ul className="mb-12">
              {regulatedOutcomes.map((outcome, i) => (
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
                  className="flex items-baseline gap-4 border-b border-brand-border py-4 text-brand-primary text-lg font-light"
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
              {REGULATED_CLOSING}
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* Final CTA: photo-backed, black overlay */}
      <section
        aria-labelledby="science-cta-heading"
        className="relative bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
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
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            {...sectionReveal}
            className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6"
          >
            Find Your Pattern
          </motion.p>
          <motion.h2
            {...reveal(0.1)}
            id="science-cta-heading"
            className="text-4xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08] mb-8"
          >
            Decode the pattern. Unlock the potential.
          </motion.h2>
          <motion.p
            {...reveal(0.2)}
            className="text-white/80 text-lg font-light leading-relaxed max-w-xl mx-auto mb-12"
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
              className="inline-flex items-center justify-center px-10 py-4 bg-white hover:bg-brand-sand text-brand-primary font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300"
            >
              Discover your Pattern Score&trade;
            </Link>
            <Link
              href="/contact#book"
              className="inline-flex items-center justify-center px-10 py-4 border border-white/50 hover:border-white text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Speak to The Ravenall Institute
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
