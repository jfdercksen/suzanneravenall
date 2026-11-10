'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { RichText } from '@/components/shared/RichText'
import { getProgramBySlug, type Program } from '@/data/programs'
import { SERIES_PATHS, type ProgrammeCopy } from '@/data/programmeCopy'

const reveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 },
}

const LABEL = 'text-xs uppercase tracking-[0.3em] font-medium text-brand-accent'
const BODY = 'text-base lg:text-lg text-brand-muted font-light leading-relaxed'
const STATEMENT = 'text-2xl lg:text-3xl font-medium tracking-tight text-brand-primary leading-snug'
const CTA =
  'inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300'

type Props = {
  program: Program
  copy: ProgrammeCopy
  /** Visitor-currency price text and suffix from ProgramPrices. */
  price: string
  priceSuffix?: string
  cta: { label: string; href: string }
}

type Band = { key: string; label: string; wide?: boolean; node: ReactNode }

/**
 * Section keys in page order, so the caller can continue the ground alternation.
 * Keep in step with the bands built below (a test renders every copy entry and
 * compares the section count).
 */
export function longFormBandCount(program: Program, copy: ProgrammeCopy): number {
  return buildKeys(program, copy).length
}

function buildKeys(program: Program, copy: ProgrammeCopy): string[] {
  const keys = ['what']
  if (copy.different) keys.push('different')
  keys.push('who', 'learn', 'after', 'details')
  if (copy.certification) keys.push('certification')
  if (program.series && SERIES_PATHS[program.series]) keys.push('path')
  keys.push('close')
  return keys
}

/**
 * The long-form programme page from Suzanne's 8 Nov copy documents
 * (data/programmeCopy.ts). Light grounds alternate cream / sand by position,
 * starting cream under the dark facts band.
 */
export function ProgrammeLongForm({ program, copy, price, priceSuffix, cta }: Props) {
  const path = program.series ? SERIES_PATHS[program.series] : undefined
  // One label per page: register-interest programmes use the same words as the header button.
  const ctaLabel = program.registerInterest ? 'Register Interest' : copy.ctaLabel

  const bands: Band[] = [
    {
      key: 'what',
      label: 'What This Programme Is',
      node: (
        <div className="space-y-6">
          {copy.level && <p className="text-sm uppercase tracking-[0.2em] font-medium text-brand-ink">{copy.level}</p>}
          <p className={STATEMENT}>{copy.lead}</p>
          {copy.whatItIs.map((p) => (
            <p key={p} className={BODY}>
              {p}
            </p>
          ))}
          {copy.whatItIsClosing && <p className={STATEMENT}>{copy.whatItIsClosing}</p>}
        </div>
      ),
    },
  ]
  if (copy.different) {
    bands.push({
      key: 'different',
      label: copy.different.heading,
      node: (
        <div className="space-y-6">
          {copy.different.paragraphs.map((p) => (
            <p key={p} className={BODY}>
              {p}
            </p>
          ))}
        </div>
      ),
    })
  }
  bands.push(
    {
      key: 'who',
      label: copy.whoHeading,
      node: (
        <div>
          <p className={`${BODY} mb-6`}>{copy.whoIntro}</p>
          <ul className="space-y-3">
            {copy.who.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />
                <span className="text-base text-brand-muted font-light leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          {copy.whoNote && <p className="mt-8 text-base font-medium text-brand-ink">{copy.whoNote}</p>}
        </div>
      ),
    },
    {
      key: 'learn',
      label: "What You'll Learn",
      wide: true,
      node: (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {copy.learn.map((item) => (
            <li key={item.title} className="rounded-card border border-brand-border bg-white p-6 lg:p-8">
              <h3 className="text-lg lg:text-xl font-medium text-brand-ink leading-snug mb-3">{item.title}</h3>
              <p className="text-sm lg:text-base text-brand-muted font-light leading-relaxed">
                <RichText line={item.body} />
              </p>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'after',
      label: 'After This Programme, You Will…',
      wide: true,
      node: (
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {copy.after.map((item, i) => (
            <li key={item.title} className="rounded-card border border-brand-border bg-white p-6 lg:p-8">
              <p className="text-3xl font-semibold tracking-tight text-brand-primary mb-4" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="text-lg lg:text-xl font-medium text-brand-ink leading-snug mb-3">{item.title}</h3>
              <p className="text-sm lg:text-base text-brand-muted font-light leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: 'details',
      label: 'Programme Details',
      wide: true,
      node: (
        <div className="grid gap-12 lg:grid-cols-2">
          <dl className="space-y-5">
            {copy.details.map((row) => (
              <div key={row.label} className="grid grid-cols-[8.5rem_1fr] gap-4 border-b border-brand-border pb-4">
                <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent pt-1">{row.label}</dt>
                <dd className="text-base text-brand-ink font-light leading-relaxed">
                  {row.value === 'price' ? (
                    <span className="font-semibold">
                      {price}
                      {priceSuffix && <span className="text-brand-muted font-normal ml-1">{priceSuffix}</span>}
                    </span>
                  ) : (
                    <RichText line={row.value} />
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div>
            {copy.whatsIncluded && (
              <>
                <h3 className={`${LABEL} mb-6`}>What&apos;s Included</h3>
                <ul className="space-y-4 mb-10">
                  {copy.whatsIncluded.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-brand-muted font-light leading-relaxed">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />
                      <span>
                        <RichText line={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link href={cta.href} className={CTA}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      ),
    },
  )
  if (copy.certification) {
    const cert = copy.certification
    bands.push({
      key: 'certification',
      label: cert.heading,
      node: (
        <div className="space-y-6">
          {cert.lead && <p className={STATEMENT}>{cert.lead}</p>}
          {cert.paragraphs.map((p, i) => (
            <p key={i} className={BODY}>
              <RichText line={p} />
            </p>
          ))}
        </div>
      ),
    })
  }
  if (path) {
    bands.push({
      key: 'path',
      label: path.heading,
      wide: true,
      node: (
        <div>
          <ol className="grid gap-6 sm:grid-cols-2">
            {path.steps.map((step) => {
              const stepProgram = getProgramBySlug(step.slug)
              const current = step.slug === program.slug
              return (
                <li
                  key={step.slug}
                  className={`rounded-card border p-6 lg:p-8 ${current ? 'border-brand-primary bg-white' : 'border-brand-border bg-white'}`}
                >
                  <p className="text-sm uppercase tracking-[0.2em] font-medium text-brand-ink mb-3">
                    {step.label}
                    {current && <span className="ml-2 text-brand-muted normal-case tracking-normal">(this page)</span>}
                  </p>
                  <p className="text-base text-brand-muted font-light leading-relaxed mb-4">{step.text}</p>
                  {!current && stepProgram && (
                    <Link
                      href={`/programs/${step.slug}`}
                      className="text-sm font-medium text-brand-primary underline underline-offset-4 decoration-brand-primary-300 hover:decoration-brand-primary"
                    >
                      View {stepProgram.name}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
          <p className="mt-8 text-base text-brand-ink">{path.note}</p>
          <p className="mt-3 text-base text-brand-ink">
            <RichText line={path.bundle} />
          </p>
        </div>
      ),
    })
  }
  bands.push({
    key: 'close',
    label: '',
    node: (
      <div className="text-center">
        {copy.closingNote && (
          <p className={`${BODY} mb-8`}>
            <RichText line={copy.closingNote} />
          </p>
        )}
        <Link href={cta.href} className={CTA}>
          {ctaLabel}
        </Link>
        {copy.scope && (
          <p className="mt-10 text-sm text-brand-muted font-light leading-relaxed">
            {copy.scope.label && <strong className="font-medium text-brand-ink">{copy.scope.label} </strong>}
            {copy.scope.text}
          </p>
        )}
      </div>
    ),
  })

  return (
    <>
      {bands.map((band, i) => (
        <section
          key={band.key}
          aria-labelledby={band.label ? `programme-band-${band.key}` : undefined}
          aria-label={band.label ? undefined : ctaLabel}
          className={`w-full py-20 lg:py-32 ${i % 2 === 0 ? 'bg-brand-cream' : 'bg-brand-sand'}`}
        >
          <motion.div {...reveal} className={`${band.wide ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 lg:px-8`}>
            {band.label && (
              <h2 id={`programme-band-${band.key}`} className={`${LABEL} mb-8`}>
                {band.label}
              </h2>
            )}
            {band.node}
          </motion.div>
        </section>
      ))}
    </>
  )
}
