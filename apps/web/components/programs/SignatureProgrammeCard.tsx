'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import type { SignatureProgramme } from '@/data/practitionerTracks'

interface SignatureProgrammeCardProps {
  programme: SignatureProgramme
  variants?: Variants
}

/**
 * One of Suzanne's three programmes on /programs (copy of 18 Nov): her
 * headline and description on the left, the format facts, her next step and
 * the programme's own website on the right. A sand card on the cream section.
 */
export function SignatureProgrammeCard({ programme, variants }: SignatureProgrammeCardProps) {
  const headingId = `programme-${programme.id}`
  return (
    <motion.article
      variants={variants}
      aria-labelledby={headingId}
      className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 p-8 lg:p-12 bg-brand-sand rounded-card"
    >
      <div className="lg:col-span-3">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">{programme.label}</p>
        <h3 id={headingId} className="mb-4 text-2xl lg:text-4xl font-medium tracking-tight leading-snug text-brand-ink">
          {programme.name}
        </h3>
        <p className="mb-4 text-lg font-medium leading-relaxed text-brand-ink">{programme.headline}</p>
        {programme.description.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="mb-4 font-light leading-relaxed text-brand-muted">
            {paragraph}
          </p>
        ))}
        {programme.tagline && <p className="font-medium leading-relaxed text-brand-ink">{programme.tagline}</p>}
      </div>

      <div className="lg:col-span-2 flex flex-col">
        <dl className="flex-1 space-y-4 mb-8 text-sm">
          {programme.facts.map((fact) => (
            <div key={fact.label}>
              <dt className="mb-1 text-xs uppercase tracking-[0.2em] font-medium text-brand-muted">{fact.label}</dt>
              <dd className="leading-relaxed text-brand-ink">
                {fact.steps ? (
                  <ol className="list-decimal pl-5 space-y-1">
                    {fact.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
        <Link
          href={programme.nextStep.href}
          className="inline-flex items-center justify-center w-full py-3 px-6 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm font-medium rounded-button transition-colors duration-300"
        >
          {programme.nextStep.label}
        </Link>
        {programme.site && (
          <a
            href={programme.site.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-center text-sm underline underline-offset-2 text-brand-ink hover:text-brand-primary transition-colors duration-300"
          >
            {programme.site.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </motion.article>
  )
}
