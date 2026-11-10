'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/shared/PageHeader'
import { RichText } from '@/components/shared/RichText'
import { SafeguardingBlock } from '@/components/pathways/SafeguardingBlock'
import { categoryLabel, PATHWAY_BOOKING_HREF, type Pathway } from '@/data/pathways'
import { contactHref } from '@/app/contact/enquiry'

/** Register-interest enquiry naming the pathway (kept for links elsewhere). */
export const registerInterestHref = (pathway: Pathway): string =>
  contactHref('other', `Register interest: ${pathway.title}`)

const fadeUpInView = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const LABEL = 'text-xs uppercase tracking-[0.3em] font-medium text-brand-accent'
const BODY = 'text-base lg:text-lg text-brand-muted font-light leading-relaxed'
const STATEMENT = 'text-2xl lg:text-3xl font-medium tracking-tight text-brand-primary leading-snug'
const HERO_SOLID =
  'inline-flex items-center justify-center gap-3 px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300'
const HERO_OUTLINE =
  'inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300'

const SHARED_HOW =
  'Each pathway combines deep pattern recognition with practical transformation tools to help create lasting change. Depending on the pathway, this may include coaching, subconscious repatterning, emotional processing, nervous system support, practical life tools, and deep identity-level change.'
const SHARED_WHY =
  'This is not just about talking about the problem. It is about identifying the underlying pattern, shifting it at root level, and helping you build a stronger way of being moving forward.'

function BulletList({ items }: { items: string[] }) {
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

type Band = { key: string; label: string; node: ReactNode; wide?: boolean }

export default function PathwayDetail({ pathway }: { pathway: Pathway }) {
  const detail = pathway.hasDetailContent ? pathway.detail : undefined
  const rich = Boolean(detail?.workItems)
  const eyebrow =
    detail?.eyebrow ??
    (pathway.ageLabel ? `${categoryLabel(pathway.category)} · ${pathway.ageLabel}` : categoryLabel(pathway.category))

  // Hero: her primary action, then the Book button every pathway carries (item 7.1).
  const heroPrimary = detail?.heroCtaPrimaryLabel
    ? { label: detail.heroCtaPrimaryLabel, href: detail.heroCtaPrimaryHref ?? '/discover-your-pattern' }
    : detail?.ctas?.[0]

  // Light bands in page order; grounds alternate sand / cream by position, so
  // the same ground never repeats whichever bands a pathway has.
  const bands: Band[] = []
  if (detail) {
    bands.push({
      key: 'what',
      label: 'What This Pathway Is',
      node: (
        <div className="space-y-6">
          {detail.lead && <p className={STATEMENT}>{detail.lead}</p>}
          {detail.whatThisPathwayIs.map((p) => (
            <p key={p} className={BODY}>
              {p}
            </p>
          ))}
          {detail.whatThisClosing && <p className={STATEMENT}>{detail.whatThisClosing}</p>}
        </div>
      ),
    })

    if (rich) {
      bands.push({
        key: 'who',
        label: "Who It's For",
        node: (
          <div>
            {detail.whoItsForIntro && <p className={`${BODY} mb-6`}>{detail.whoItsForIntro}</p>}
            <BulletList items={detail.whoItsFor} />
            {detail.whoItsForNote && (
              <p className={`${BODY} mt-8`}>
                <RichText line={detail.whoItsForNote} />
              </p>
            )}
          </div>
        ),
      })
      bands.push({
        key: 'work',
        label: 'What We Work On',
        wide: true,
        node: (
          <div>
            {detail.workIntro && <p className={`${BODY} mb-10 max-w-3xl`}>{detail.workIntro}</p>}
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {detail.workItems?.map((item) => (
                <li key={item.title} className="rounded-card border border-brand-border bg-white p-6 lg:p-8">
                  <h3 className="text-lg lg:text-xl font-medium text-brand-ink leading-snug mb-1">{item.title}</h3>
                  {item.subtitle && <p className="text-sm font-medium text-brand-primary mb-3">{item.subtitle}</p>}
                  <p className="mt-2 text-sm lg:text-base text-brand-muted font-light leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ul>
            {detail.workNote && (
              <p className={`${BODY} mt-10 max-w-3xl`}>
                <RichText line={detail.workNote} />
              </p>
            )}
            {detail.sessionThemes && (
              <p className="mt-8 text-sm text-brand-muted">
                <span className="font-medium text-brand-ink">Session themes: </span>
                {detail.sessionThemes.join(' · ')}
              </p>
            )}
          </div>
        ),
      })
    } else if (detail.whoItsFor.length > 0 || detail.whatWeWorkOn.length > 0) {
      bands.push({
        key: 'who-work',
        label: '',
        wide: true,
        node: (
          <div className="grid gap-16 lg:grid-cols-2">
            {detail.whoItsFor.length > 0 && (
              <div>
                <p className={`${LABEL} mb-6`}>Who It&apos;s For</p>
                <BulletList items={detail.whoItsFor} />
              </div>
            )}
            {detail.whatWeWorkOn.length > 0 && (
              <div>
                <p className={`${LABEL} mb-6`}>What We Work On</p>
                <BulletList items={detail.whatWeWorkOn} />
              </div>
            )}
          </div>
        ),
      })
    }

    if (detail.outcomes.length > 0 || detail.signatureMessage || detail.outcomesClosing) {
      bands.push({
        key: 'outcomes',
        label: 'Outcomes',
        node: (
          <div>
            {detail.outcomes.length > 0 && <BulletList items={detail.outcomes} />}
            {(detail.outcomesClosing || detail.signatureMessage) && (
              <div className="mt-12 border-l-2 border-brand-accent pl-6 lg:pl-8">
                {(detail.outcomesClosing ? [detail.outcomesClosing] : detail.signatureMessage ?? []).map((line) => (
                  <p key={line} className="text-2xl lg:text-3xl font-light text-brand-primary leading-snug">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        ),
      })
    }
  }

  bands.push({
    key: 'how',
    label: 'How the Work Happens',
    node: (
      <div className="space-y-6">
        {(detail?.howItHappens ?? [SHARED_HOW]).map((p) => (
          <p key={p} className={BODY}>
            {p}
          </p>
        ))}
        {detail?.format && (
          <p className="text-sm lg:text-base text-brand-ink">
            <RichText line={detail.format} />
          </p>
        )}
      </div>
    ),
  })
  bands.push({
    key: 'why',
    label: 'Why This Work Is Different',
    node: (
      <div className="space-y-6">
        {(detail?.whyDifferent ?? [SHARED_WHY]).map((p) => (
          <p key={p} className={BODY}>
            {p}
          </p>
        ))}
      </div>
    ),
  })

  const closingHeading =
    detail?.withOthers?.heading ?? (rich ? pathway.title : detail?.ctaSectionHeadline ?? detail?.ctaSectionBody ?? pathway.title)
  const closingButtons = detail?.ctas ?? [{ label: 'Book a Discovery Session', href: '/contact#book' }]

  return (
    <div>
      <PageHeader
        id="pathway-hero-heading"
        eyebrow={eyebrow}
        image="/images/generated/explore-repatterning.webp"
        title={pathway.title}
        description={detail?.heroSubhead ?? pathway.description}
      >
        {heroPrimary && (
          <Link href={heroPrimary.href} className={HERO_SOLID}>
            {heroPrimary.label}
            <span aria-hidden="true">→</span>
          </Link>
        )}
        <Link href={PATHWAY_BOOKING_HREF} className={heroPrimary ? HERO_OUTLINE : HERO_SOLID}>
          Book a Session
        </Link>
      </PageHeader>

      {bands.map((band, i) => (
        <section
          key={band.key}
          aria-labelledby={band.label ? `pathway-band-${band.key}` : undefined}
          className={`w-full py-20 lg:py-32 ${i % 2 === 0 ? 'bg-brand-sand' : 'bg-brand-cream'}`}
        >
          <motion.div
            {...fadeUpInView(0)}
            className={`${band.wide ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 lg:px-8`}
          >
            {band.label && (
              <h2 id={`pathway-band-${band.key}`} className={`${LABEL} mb-8`}>
                {band.label}
              </h2>
            )}
            {band.node}
          </motion.div>
        </section>
      ))}

      {detail?.safeguarding && (
        <section
          aria-labelledby="safeguarding-heading"
          className={`w-full py-20 lg:py-32 ${bands.length % 2 === 0 ? 'bg-brand-sand' : 'bg-brand-cream'}`}
        >
          <motion.div {...fadeUpInView(0)}>
            <SafeguardingBlock line={detail.safeguarding} />
          </motion.div>
        </section>
      )}

      {/* Closing band (dark): her buttons, the Book button, all pathways */}
      <section aria-labelledby="pathway-cta-heading" className="relative w-full overflow-hidden bg-brand-primary">
        <Image
          src="/images/generated/session-coaching.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-primary/90 via-brand-primary/75 to-brand-primary/90"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          {rich && <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80 mb-6">Next Step</p>}
          <motion.h2
            id="pathway-cta-heading"
            {...fadeUpInView(0)}
            className="text-3xl lg:text-5xl font-medium tracking-tight text-white leading-tight mb-6"
          >
            {closingHeading}
          </motion.h2>
          {detail?.withOthers ? (
            <motion.p {...fadeUpInView(0.05)} className="text-lg text-white/80 font-light leading-relaxed mb-10">
              <RichText line={detail.withOthers.body} tone="dark" />
            </motion.p>
          ) : (
            !rich &&
            detail?.ctaSectionHeadline &&
            detail.ctaSectionBody && (
              <motion.p {...fadeUpInView(0.05)} className="text-lg text-white/80 font-light leading-relaxed mb-10">
                {detail.ctaSectionBody}
              </motion.p>
            )
          )}
          {!rich && pathway.category !== 'youth' && (
            <motion.p
              {...fadeUpInView(0.1)}
              className="text-base text-white/80 font-light leading-relaxed mb-8 max-w-xl mx-auto"
            >
              You do not have to keep living the old pattern. There is another way, and it begins with
              understanding what is really driving your experience.
            </motion.p>
          )}

          <motion.div {...fadeUpInView(0.15)} className="flex flex-col sm:flex-row sm:flex-wrap gap-4 justify-center">
            {closingButtons.map((cta, i) => (
              <Link
                key={cta.label}
                href={cta.href}
                className={
                  i === 0
                    ? 'group inline-flex items-center justify-center gap-3 rounded-button bg-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] text-brand-primary transition-all duration-300 hover:bg-brand-sand hover:shadow-2xl'
                    : 'inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10'
                }
              >
                {cta.label}
              </Link>
            ))}
            <Link
              href={PATHWAY_BOOKING_HREF}
              className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
            >
              Book a Session
            </Link>
            {closingButtons.length < 2 && (
              <Link
                href="/transformation-pathways"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
              >
                All Pathways
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
