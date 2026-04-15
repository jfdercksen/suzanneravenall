'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

type Programme = {
  name: string
  description: string
}

type Column = {
  eyebrow: string
  title: string
  intro: string
  programmes: Programme[]
  ctaLabel: string
  ctaHref: string
}

const columns: Column[] = [
  {
    eyebrow: 'Practitioner',
    title: 'Become a practitioner in the healing arts.',
    intro:
      'Considering changing your life and becoming a practitioner in the healing arts or energy psychology? Join these expansive practitioner programmes — not only will your own life be transformed, you will help others transform theirs.',
    programmes: [
      {
        name: 'Resonance Repatterning Basic 5 Series',
        description:
          'Ever wondered why you work so hard at something and it simply doesn’t materialise? A major cause is subconscious beliefs — mostly unknown to the conscious mind — that are active every day, interfering with the life you want and deserve.',
      },
      {
        name: 'Akashic Navigator (Basic & Advanced)',
        description:
          'Access and rewrite your life’s blueprint through the Akashic Records. Create the past, present and future that you desire — and improve your intuition to receive daily guidance.',
      },
      {
        name: 'Energy Clearing (Basic & Advanced)',
        description:
          'We are physical and energetic beings, with many channels that carry information and energy. This practitioner pathway teaches you to see, clear and realign the energy field — for yourself and for others.',
      },
    ],
    ctaLabel: 'Explore Practitioner Paths',
    ctaHref: '/contact',
  },
  {
    eyebrow: 'Self-Paced',
    title: 'Learn and grow at your own pace.',
    intro:
      'All programmes are recorded and you have access to them for as long as you need and want them. Let your journey unfold in a time that is right for you.',
    programmes: [
      {
        name: 'Trauma to Transcendence',
        description:
          'Breaking the hold of the childhood brain on your adult self. From early experiences of neglect or unmet needs we form beliefs — helpful and harmful — that limit our potential. This programme rewrites the adaptations we forgot we made.',
      },
      {
        name: 'Love & Relationships',
        description:
          'We attract people at our common level of woundedness. To attract a healthy, loving partner you need to become that healthy person first. This programme shows how to raise the energetic baseline.',
      },
      {
        name: 'Intuition in My Personal Capacity',
        description:
          'Identify and change the limiting beliefs we have internalised since childhood — even the ones we have accepted as true though they are not — and reconnect to the intuition that was always there.',
      },
      {
        name: 'Become an Energy Ninja',
        description:
          'Mastering energy for an abundant life, Level 1. Everything starts as, and is, energy. Learn how to change your world by using an unseen force — and bring it into every area of your life.',
      },
      {
        name: 'Getting Unstuck',
        description:
          'Have you ever wanted to change — different career, better health, improved body, better relationship — but it escapes you? If you have tried numerous approaches and keep waking up in the same cycle, this is for you.',
      },
    ],
    ctaLabel: 'Browse Self-Paced',
    ctaHref: '/shop',
  },
  {
    eyebrow: 'Live',
    title: 'Live programmes, run by Suzanne via Zoom.',
    intro:
      'Programmes run live on a range of topics — designed to help you shift gear in life to a new way of being: more of who you are, and who you want to be. Connect from wherever you are in the world.',
    programmes: [
      {
        name: 'Mindfulness',
        description:
          'Mindfulness — the ability to be fully present in the moment — is linked to decreased stress and sadness and increased focus and happiness. This programme teaches you to recognise it, practise it, and integrate it into everyday life.',
      },
      {
        name: 'Meditation',
        description:
          'Meditation isn’t about becoming a different person. It’s training in awareness — a healthy sense of perspective. You’re not trying to turn off your thoughts, you’re learning to observe them without judgment.',
      },
      {
        name: 'Inner Cultivation (RR 06)',
        description:
          'Drawing from the inner tradition of Chinese Acupuncture, the healing process centres on restoring harmony between the heavenly yang and the earthly yin energies within ourselves and our lives.',
      },
      {
        name: 'Principles of Relationship (RR 08)',
        description:
          'Shift your resonance and embrace loving connections. Through the repatternings in this programme, resonate with new neural connections and memory imprints — and let fresh, transformative ways of relating take root.',
      },
    ],
    ctaLabel: 'See Live Schedule',
    ctaHref: '/contact',
  },
]

export default function Programs() {
  return (
    <motion.section
      id="programs"
      aria-labelledby="programs-heading"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-gray-50 py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-20">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Guided Programmes
          </p>
          <h2
            id="programs-heading"
            className="text-4xl md:text-6xl font-light text-brand-primary leading-tight mb-8"
          >
            Programmes for dramatic change — unlock your super powers now.
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Programmes to transform yourself and others, utilising conscious
            engineering and natural healing practices. Dive deep into the unconscious
            and flip open your — and others’ — self mastery.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {columns.map((col, colIdx) => (
            <motion.div
              key={col.eyebrow}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: colIdx * 0.1 }}
              className="flex flex-col bg-white border border-gray-200 rounded-card p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
                {col.eyebrow}
              </p>
              <h3 className="text-2xl md:text-3xl font-light text-brand-primary leading-tight mb-6">
                {col.title}
              </h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed mb-8">
                {col.intro}
              </p>

              <ul className="space-y-6 mb-10 flex-1">
                {col.programmes.map((p) => (
                  <li key={p.name}>
                    <h4 className="text-base font-semibold text-brand-primary mb-2">
                      {p.name}
                    </h4>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      {p.description}
                    </p>
                  </li>
                ))}
              </ul>

              <Link
                href={col.ctaHref}
                className="inline-flex items-center justify-center px-6 py-3 border border-brand-primary/30 hover:border-brand-accent hover:bg-brand-accent text-brand-primary hover:text-white text-xs uppercase tracking-widest font-medium rounded-button transition-all duration-300"
              >
                {col.ctaLabel}
              </Link>
            </motion.div>
          ))}
        </div>
        {/* [CONFIRM: exact programme start dates, durations, and pricing — scraped page lists programmes without schedule or pricing detail] */}
      </div>
    </motion.section>
  )
}
