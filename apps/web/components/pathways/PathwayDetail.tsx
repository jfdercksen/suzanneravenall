'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/shared/PageHeader'
import { categoryLabel, type Pathway } from '@/data/pathways'

const fadeUpInView = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
          />
          <span className="text-base text-brand-muted font-light leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PathwayDetail({ pathway }: { pathway: Pathway }) {
  const detail = pathway.hasDetailContent ? pathway.detail : undefined

  return (
    <main>
      {/* ── Header: shared PageHeader, the header rule ──────────────────── */}
      {/* The category badge is now the eyebrow. One picture serves every
          pathway, so the default left alignment and centre crop apply. */}
      <PageHeader
        id="pathway-hero-heading"
        eyebrow={categoryLabel(pathway.category)}
        image="/images/generated/explore-repatterning.webp"
        title={pathway.title}
        description={detail?.heroSubhead ?? pathway.description}
      >
        {detail?.heroCtaPrimaryLabel && (
          <Link
            href={detail.heroCtaPrimaryHref ?? '/contact'}
            className="inline-flex items-center justify-center gap-3 px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300"
          >
            {detail.heroCtaPrimaryLabel}
            <span aria-hidden="true">→</span>
          </Link>
        )}
        <Link
          href="/contact"
          className={
            detail?.heroCtaPrimaryLabel
              ? 'inline-flex items-center justify-center px-6 py-3 lg:px-7 lg:py-3.5 border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300'
              : 'inline-flex items-center justify-center gap-3 px-6 py-3 lg:px-7 lg:py-3.5 bg-white hover:bg-brand-sand text-brand-primary text-xs sm:text-sm uppercase tracking-widest font-medium rounded-button transition-all duration-300'
          }
        >
          Book a Discovery Session
          {!detail?.heroCtaPrimaryLabel && <span aria-hidden="true">→</span>}
        </Link>
      </PageHeader>

      {detail ? (
        <>
          {/* ── What This Pathway Is (light) ─────────────────────────────── */}
          <section className="w-full bg-brand-sand py-20 lg:py-32">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeUpInView(0)}>
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-8">
                  What This Pathway Is
                </p>
                <div className="space-y-6">
                  {detail.whatThisPathwayIs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base lg:text-lg text-brand-muted font-light leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* ── Who It's For / What We Work On (light) ─────────────────────── */}
          {(detail.whoItsFor.length > 0 || detail.whatWeWorkOn.length > 0) && (
            <section className="w-full bg-brand-cream py-20 lg:py-32">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-16 lg:grid-cols-2">
                {detail.whoItsFor.length > 0 && (
                  <motion.div {...fadeUpInView(0)}>
                    <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                      Who It&apos;s For
                    </p>
                    <BulletList items={detail.whoItsFor} />
                  </motion.div>
                )}
                {detail.whatWeWorkOn.length > 0 && (
                  <motion.div {...fadeUpInView(0.1)}>
                    <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                      What We Work On
                    </p>
                    <BulletList items={detail.whatWeWorkOn} />
                  </motion.div>
                )}
              </div>
            </section>
          )}

          {/* ── Outcomes / Signature Message (light) ──────────────────────── */}
          {(detail.outcomes.length > 0 || detail.signatureMessage) && (
            <section className="w-full bg-brand-sand py-20 lg:py-32">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {detail.outcomes.length > 0 && (
                  <motion.div {...fadeUpInView(0)} className="mb-16">
                    <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                      Outcomes
                    </p>
                    <BulletList items={detail.outcomes} />
                  </motion.div>
                )}
                {detail.signatureMessage && (
                  <motion.div
                    {...fadeUpInView(0.1)}
                    className="border-l-2 border-brand-accent pl-6 lg:pl-8"
                  >
                    {detail.signatureMessage.map((line) => (
                      <p
                        key={line}
                        className="text-2xl lg:text-3xl font-light text-brand-primary leading-snug"
                      >
                        {line}
                      </p>
                    ))}
                  </motion.div>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        /* "Coming soon" placeholder: only for pathways without supplied content */
        <section className="w-full bg-brand-sand py-20 lg:py-32">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              {...fadeUpInView(0)}
              className="rounded-card border border-dashed border-brand-primary-300 bg-white p-8 lg:p-10 text-center"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                Coming Soon
              </p>
              <p className="text-lg lg:text-xl font-light text-brand-primary leading-relaxed">
                Full programme details for this pathway are coming soon.
              </p>
              <p className="mt-3 text-sm text-brand-muted font-light">
                Session structure, format and who it is best suited for will be
                added here shortly.
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── How the Work Happens (light): shared across every pathway ────── */}
      <section className="w-full bg-brand-cream py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUpInView(0)}>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              How the Work Happens
            </p>
            <p className="text-lg lg:text-xl text-brand-muted font-light leading-relaxed">
              Each pathway combines deep pattern recognition with practical
              transformation tools to help create lasting change. Depending on
              the pathway, this may include coaching, subconscious
              repatterning, emotional processing, nervous system support,
              practical life tools, and deep identity-level change.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Why This Work Is Different (light): shared ───────────────────── */}
      <section className="w-full bg-brand-sand py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUpInView(0)}>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              Why This Work Is Different
            </p>
            <p className="text-lg lg:text-xl text-brand-muted font-light leading-relaxed">
              This is not just about talking about the problem. It is about
              identifying the underlying pattern, shifting it at root level,
              and helping you build a stronger way of being moving forward.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Pathway CTA + Final CTA (dark) ────────────────────────────────── */}
      <section
        aria-labelledby="pathway-cta-heading"
        className="relative w-full overflow-hidden bg-brand-primary"
      >
        {/* Background photo + black overlay: dark CTA bands carry imagery, never flat colour */}
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
          {detail?.ctaSectionHeadline && (
            <motion.h2
              id="pathway-cta-heading"
              {...fadeUpInView(0)}
              className="text-3xl lg:text-5xl font-medium tracking-tight text-white leading-tight mb-6"
            >
              {detail.ctaSectionHeadline}
            </motion.h2>
          )}
          {detail?.ctaSectionBody && (
            <motion.p
              {...fadeUpInView(0.05)}
              className="text-lg text-white/80 font-light leading-relaxed mb-10"
            >
              {detail.ctaSectionBody}
            </motion.p>
          )}

          <motion.p
            {...fadeUpInView(0.1)}
            className="text-base text-white/80 font-light leading-relaxed mb-8 max-w-xl mx-auto"
          >
            You do not have to keep living the old pattern. There is another
            way, and it begins with understanding what is really driving your
            experience.
          </motion.p>

          <motion.div
            {...fadeUpInView(0.15)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-3 rounded-button bg-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] text-brand-primary transition-all duration-300 hover:bg-brand-sand hover:shadow-2xl"
            >
              Book a Discovery Session
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
            <Link
              href="/transformation-pathways"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/50 hover:border-white text-white font-medium text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
            >
              All Pathways
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
