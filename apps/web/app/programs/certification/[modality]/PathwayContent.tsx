'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmailText } from '@/components/pathways/EmailText'
import { PathwayLevelDetails } from '@/components/pathways/PathwayLevelDetails'
import { MEMBER_SUPPORT_EMAIL, pathwayPlainName } from '@/data/certificationPathways'
import type { CertificationPathway } from '@/data/certificationPathways/types'

// Suzanne's Career & Certification Pathway documents of 12 Nov 2026, used as
// sent (Johan, 16 Nov). Every part of the document is here except Appendix B.

const sectionMotion = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
}

const label = 'text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4'
const sectionHeading = 'text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary mb-6'

/** Opens the level a #level-N link points at: a closed details does not open by itself. */
function openLevelFromHash() {
  const id = window.location.hash.slice(1)
  if (!/^level-\d+$/.test(id)) return
  const target = document.getElementById(id)
  if (target instanceof HTMLDetailsElement) {
    target.open = true
    target.scrollIntoView?.()
  }
}

export default function PathwayContent({ pathway, image }: { pathway: CertificationPathway; image: string }) {
  useEffect(() => {
    openLevelFromHash()
    window.addEventListener('hashchange', openLevelFromHash)
    return () => window.removeEventListener('hashchange', openLevelFromHash)
  }, [])

  return (
    <>
      <PageHeader
        id="pathway-hero-heading"
        eyebrow="Career & Certification Pathway"
        image={image}
        title={pathway.name}
        description={pathway.tagline}
      >
        <a
          href="#levels"
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
        >
          The Levels at a Glance
        </a>
        <a
          href={`mailto:${MEMBER_SUPPORT_EMAIL}`}
          className="inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300 hover:bg-white/10"
        >
          Contact Member Support
        </a>
      </PageHeader>

      {/* About this pathway + Safe practice: cream */}
      <section aria-labelledby="about-heading" className="w-full bg-brand-cream py-20 lg:py-32">
        <motion.div {...sectionMotion} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
          <div className="lg:col-span-2">
            <p className={label}>{pathwayPlainName(pathway)}</p>
            <h2 id="about-heading" className={sectionHeading}>
              About this pathway
            </h2>
            <p className="text-lg text-brand-ink font-medium leading-relaxed mb-5">{pathway.subtitle}</p>
            <div className="space-y-5 text-lg text-brand-muted font-light leading-relaxed">
              {pathway.about.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <p className="mt-8 text-sm text-brand-ink font-medium leading-relaxed border-l-2 border-brand-ink pl-4">{pathway.nb}</p>
          </div>
          <div className="bg-brand-sand rounded-card p-8 self-start">
            <h3 className="text-xl font-medium text-brand-ink mb-3">Safe practice</h3>
            {pathway.safePractice.map((p) => (
              <p key={p} className="text-sm text-brand-muted leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How certification works: sand */}
      <section aria-labelledby="how-heading" className="w-full bg-brand-sand py-20 lg:py-32">
        <motion.div {...sectionMotion} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={label}>Certification</p>
          <h2 id="how-heading" className={sectionHeading}>
            How certification works
          </h2>
          <ul className="max-w-3xl space-y-4 text-base text-brand-ink leading-relaxed list-disc pl-5">
            {pathway.howItWorks.map((p) => (
              <li key={p}>
                <EmailText text={p} />
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* The programmes: cream */}
      <section aria-labelledby="programmes-heading" className="w-full bg-brand-cream py-20 lg:py-32">
        <motion.div {...sectionMotion} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={label}>{pathwayPlainName(pathway)}</p>
          <h2 id="programmes-heading" className={sectionHeading}>
            The programmes
          </h2>
          {pathway.programmesIntro.map((p) => (
            <p key={p} className="text-lg text-brand-muted font-light leading-relaxed max-w-3xl mb-10">
              {p}
            </p>
          ))}
          <div className="space-y-12">
            {pathway.programmeTables.map((table) => (
              <div key={table.title}>
                <h3 className="text-2xl font-medium tracking-tight text-brand-ink mb-6">{table.title}</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {table.rows.map((row) => (
                    <li key={row.code} className="bg-brand-sand rounded-card p-6">
                      <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-2">{row.code}</p>
                      <p className="text-lg font-medium text-brand-ink mb-2 leading-snug">{row.name}</p>
                      <p className="text-sm text-brand-muted leading-relaxed">{row.covers}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* The levels at a glance: sand */}
      <section id="levels" aria-labelledby="glance-heading" className="w-full bg-brand-sand py-20 lg:py-32 scroll-mt-16 lg:scroll-mt-20">
        <motion.div {...sectionMotion} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={label}>{pathway.levelsSubtitle}</p>
          <h2 id="glance-heading" className={sectionHeading}>
            The levels at a glance
          </h2>
          <div role="region" aria-labelledby="glance-heading" tabIndex={0} className="overflow-x-auto bg-white border border-brand-border rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-ink">
            <table aria-labelledby="glance-heading" className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-brand-muted border-b border-brand-border">
                <tr>
                  {['Level', 'Status', 'Prerequisite', 'Sessions to log', 'Observation fee'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pathway.levelsAtAGlance.map((row) => (
                  <tr key={row.level} className="border-b border-brand-border last:border-0 align-top">
                    <td className="px-4 py-3 text-brand-muted">{row.level}</td>
                    <th scope="row" className="px-4 py-3 font-medium text-brand-ink">
                      <a
                        href={`#level-${row.level}`}
                        onClick={() => {
                          const target = document.getElementById(`level-${row.level}`)
                          if (target instanceof HTMLDetailsElement) target.open = true
                        }}
                        className="underline underline-offset-4 decoration-brand-border hover:decoration-brand-ink">
                        {row.status}
                      </a>
                    </th>
                    <td className="px-4 py-3 text-brand-ink">{row.prerequisite}</td>
                    <td className="px-4 py-3 text-brand-ink">{row.sessions}</td>
                    <td className="px-4 py-3 text-brand-ink">{row.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* Each level, A to D: cream */}
      <section aria-labelledby="each-level-heading" className="w-full bg-brand-cream py-20 lg:py-32">
        <motion.div {...sectionMotion} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={label}>Step by Step</p>
          <h2 id="each-level-heading" className={sectionHeading}>
            Each level follows the same four parts
          </h2>
          <ul className="text-base text-brand-muted leading-relaxed space-y-1 mb-12">
            {pathway.fourParts.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="space-y-4">
            {pathway.levels.map((level) => (
              <PathwayLevelDetails key={level.level} level={level} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Appendix A, the Session Log template: sand */}
      <section aria-labelledby="session-log-heading" className="w-full bg-brand-sand py-20 lg:py-32">
        <motion.div {...sectionMotion} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={label}>Appendix A</p>
          <h2 id="session-log-heading" className={sectionHeading}>
            Session Log template
          </h2>
          <p className="text-lg text-brand-ink font-medium mb-3">{pathway.sessionLog.subtitle}</p>
          <p className="text-base text-brand-muted leading-relaxed mb-8 max-w-3xl">{pathway.sessionLog.intro}</p>
          <div role="region" aria-labelledby="session-log-heading" tabIndex={0} className="overflow-x-auto bg-white border border-brand-border rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-ink">
            <table aria-labelledby="session-log-heading" className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-brand-muted border-b border-brand-border">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Column</th>
                  <th scope="col" className="px-4 py-3 font-medium">What to record</th>
                </tr>
              </thead>
              <tbody>
                {pathway.sessionLog.columns.map((c) => (
                  <tr key={c.column} className="border-b border-brand-border last:border-0 align-top">
                    <th scope="row" className="px-4 py-3 font-medium text-brand-ink whitespace-nowrap">{c.column}</th>
                    <td className="px-4 py-3 text-brand-ink">{c.record}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* Contact: dark, photo-backed */}
      <section aria-labelledby="pathway-cta-heading" className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden">
        <Image src={image} alt="" aria-hidden="true" fill sizes="100vw" className="object-cover opacity-40" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90" />
        <motion.div {...sectionMotion} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6">Member Support</p>
          <h2 id="pathway-cta-heading" className="text-4xl lg:text-6xl font-medium tracking-tight text-white mb-10">
            Questions about certification?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`mailto:${MEMBER_SUPPORT_EMAIL}`}
              className="inline-flex items-center justify-center py-4 px-8 bg-white hover:bg-brand-sand text-brand-primary text-sm font-medium rounded-button transition-all duration-300 break-all"
            >
              {MEMBER_SUPPORT_EMAIL}
            </a>
          </div>
          <Link
            href="/programs#practitioner"
            className="inline-block mt-10 text-sm text-white/80 hover:text-white underline underline-offset-4 transition-colors duration-300"
          >
            See the practitioner training
          </Link>
        </motion.div>
      </section>
    </>
  )
}
