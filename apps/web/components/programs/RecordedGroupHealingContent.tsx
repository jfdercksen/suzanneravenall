'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/shared/PageHeader'
import { RichText } from '@/components/shared/RichText'
import { type RichLine } from '@/lib/content/richLine'
import type { Program } from '@/data/programs'

// Suzanne's 8 Nov copy, verbatim (item 8.3). Access length from her current
// site's Guided Programmes page: "you have access to them for as long as you
// need and want them" (read 11 Nov 2026).
export const ACCESS_LINE: RichLine = ['Access: yours for as long as you need it.']

const reveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
}

const LABEL = 'text-xs uppercase tracking-[0.3em] font-medium text-brand-accent'
const H2 = 'text-3xl lg:text-5xl font-medium tracking-tight text-brand-primary leading-tight mb-8'
const BODY = 'text-base lg:text-lg text-brand-muted font-light leading-relaxed'

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />
          <span className="text-base text-brand-muted font-light leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Band({
  id,
  sectionId,
  ground,
  wide,
  children,
}: {
  id: string
  /** In-page anchor on the section, clear of the fixed header. */
  sectionId?: string
  ground: 'cream' | 'sand'
  wide?: boolean
  children: ReactNode
}) {
  return (
    <section
      id={sectionId}
      aria-labelledby={id}
      className={`w-full py-20 lg:py-32 scroll-mt-16 lg:scroll-mt-20 ${ground === 'cream' ? 'bg-brand-cream' : 'bg-brand-sand'}`}
    >
      <motion.div {...reveal} className={`${wide ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 lg:px-8`}>
        {children}
      </motion.div>
    </section>
  )
}

const HOW_IT_WORKS = [
  { title: 'Choose your series', body: "each series focuses on a theme that affects most people's lives." },
  { title: 'Watch online, anytime', body: 'stream the sessions at your own pace, from anywhere.' },
  { title: 'Join the group energy', body: 'take part in each session as if you were there live.' },
  { title: 'Return whenever you need', body: 'repeat sessions as often as you like. Each time can bring a new layer of shift.' },
]

export default function RecordedGroupHealingContent({ series }: { series: Program[] }) {
  return (
    <>
      <PageHeader
        id="recorded-healing-heading"
        eyebrow="Recorded Group Healing Sessions"
        image="/images/generated/group-coaching-real.webp"
        title="Group healing, in your own time"
        description="These Resonance Repatterning group healing series were recorded live with Suzanne. Now you can do the same, wherever you are and whenever you're ready."
      >
        <a
          href="#series"
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          Choose Your Series
        </a>
      </PageHeader>

      <Band id="rgh-moment" ground="cream">
        <p className={`${LABEL} mb-6`}>Recorded Group Healing Sessions</p>
        <h2 id="rgh-moment" className={H2}>
          Healing doesn&apos;t have to wait for the right moment
        </h2>
        <div className="space-y-6">
          <p className={BODY}>
            Some of the deepest shifts happen in a group. When people come together with the same intention,
            something builds in the room that&apos;s hard to describe and easy to feel. There&apos;s a shared field,
            and it carries everyone further than they could go alone.
          </p>
          <p className={BODY}>
            These Resonance Repatterning group healing series were recorded live with Suzanne. Each one takes on a
            theme that affects most of us: the unconscious beliefs, old patterns and stuck energy that hold us back
            from the lives we want. Session by session, participants move beyond them and into their own power.
          </p>
          <p className={BODY}>Now you can do the same, wherever you are and whenever you&apos;re ready.</p>
        </div>
      </Band>

      <Band id="rgh-taking-part" ground="sand">
        <h2 id="rgh-taking-part" className={H2}>
          You&apos;re not watching. You&apos;re taking part.
        </h2>
        <div className="space-y-6">
          <p className={BODY}>
            These aren&apos;t lectures, and you&apos;re not just an observer. When you watch a recorded session, you
            step into the group&apos;s energy. Suzanne holds the session with the intention that it continues to work
            for everyone who joins it, whether they were in the room on the day or press play months later.
          </p>
          <p className={BODY}>
            Many people who watch the recordings tell us they feel the shifts just as strongly as those who attended
            live. You simply join the healing at a time that&apos;s right for you.
          </p>
          <p className="text-2xl lg:text-3xl font-medium tracking-tight text-brand-primary leading-snug">
            Same session. Same group energy. Your timing.
          </p>
        </div>
      </Band>

      <Band id="rgh-who" ground="cream">
        <h2 id="rgh-who" className={H2}>
          Who These Sessions Are For
        </h2>
        <Bullets
          items={[
            "You feel stuck in a pattern, belief or situation you can't seem to move past",
            'You want to heal at a deeper level than talking about it allows',
            "You love the power of group work but can't always make live sessions",
            "You want to experience Suzanne's work before committing to one-to-one sessions or a pathway",
            'You prefer to go at your own pace, pausing, repeating and returning whenever you need',
          ]}
        />
      </Band>

      <Band id="rgh-session" ground="sand">
        <h2 id="rgh-session" className={H2}>
          What Happens in a Session
        </h2>
        <p className={`${BODY} mb-6`}>
          Each session takes you through a live healing process with Suzanne and the group. You&apos;ll:
        </p>
        <Bullets
          items={[
            'Identify the unconscious beliefs and patterns behind a common life challenge',
            "Clear what's been holding you back, at the level of your energy and nervous system as well as your mind",
            'Shift into a new, more empowered way of being, often with a noticeable sense of lightness, clarity or release',
            'Integrate the change with simple practices to carry the shift into everyday life',
          ]}
        />
        <p className={`${BODY} mt-8`}>
          Every series is held in a safe, warm and respectful space. You don&apos;t need to share anything or do
          anything except show up, listen and allow.
        </p>
      </Band>

      <Band id="rgh-how" ground="cream" wide>
        <h2 id="rgh-how" className={H2}>
          How It Works
        </h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="rounded-card bg-brand-sand p-6 lg:p-8">
              <p className="text-3xl font-semibold tracking-tight text-brand-primary mb-4">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="text-lg font-medium text-brand-ink mb-2">{step.title}</h3>
              <p className="text-sm text-brand-muted font-light leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-base text-brand-ink">
          <RichText line={ACCESS_LINE} />
        </p>
      </Band>

      <Band id="series-heading" sectionId="series" ground="sand" wide>
        <p className={`${LABEL} mb-6`}>The Series</p>
        <h2 id="series-heading" className={H2}>
          Choose your series
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {series.map((program) => (
            <li
              key={program.slug}
              className="group relative overflow-hidden min-h-[300px] bg-brand-primary-900 rounded-card transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              <Image
                src={program.image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/40 to-transparent" />
              <div className="relative z-10 flex h-full flex-col p-6">
                <h3 className="text-lg font-medium text-white mb-3 leading-snug">{program.name}</h3>
                <p className="text-sm text-white/70 font-light leading-relaxed mb-4 flex-1">{program.shortDescription}</p>
                {program.duration && <p className="text-xs text-white/70 mb-4">{program.duration}</p>}
                <Link
                  href={`/programs/${program.slug}`}
                  aria-label={`View ${program.name}`}
                  className="inline-flex items-center justify-center w-full py-3 px-4 border border-white/50 hover:border-white hover:bg-white/10 text-white text-sm font-medium rounded-button transition-all duration-300"
                >
                  View series
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Band>

      <Band id="rgh-most" ground="cream">
        <h2 id="rgh-most" className={H2}>
          Get the Most From Your Sessions
        </h2>
        <Bullets
          items={[
            "Find a quiet, private space where you won't be interrupted",
            'Use headphones if you can',
            'Have water and a journal nearby',
            'Give yourself a little time afterwards to rest and integrate',
          ]}
        />
        <p className="mt-10 text-sm text-brand-muted font-light leading-relaxed">
          These sessions are a complementary healing practice. They aren&apos;t a substitute for medical or
          psychological care.
        </p>
      </Band>

      <section aria-labelledby="rgh-cta" className="relative w-full overflow-hidden bg-brand-primary-900 py-20 lg:py-28">
        <Image src="/images/generated/session-coaching.webp" alt="" aria-hidden="true" fill sizes="100vw" className="object-cover opacity-40" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/75 to-black/90" />
        <motion.div {...reveal} className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="rgh-cta" className="text-3xl lg:text-5xl font-medium tracking-tight text-white mb-8">
            Same session. Same group energy. Your timing.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#series"
              className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-brand-sand text-brand-primary text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              Choose Your Series
            </a>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Visit the Shop
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  )
}
