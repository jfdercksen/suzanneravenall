'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { categoryLabel, type Pathway, type PathwayCategory } from '@/data/pathways'

const fadeUpAnimate = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const fadeUpInView = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const heroBadgeClasses = (category: PathwayCategory): string =>
  category === 'youth'
    ? 'bg-white/10 text-white/70 border border-white/20'
    : 'bg-brand-accent/15 text-brand-accent-300 border border-brand-accent/30'

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
          />
          <span className="text-base text-gray-600 font-light leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PathwayDetail({ pathway }: { pathway: Pathway }) {
  const detail = pathway.hasDetailContent ? pathway.detail : undefined

  return (
    <main>
      {/* ── Hero (dark) ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="pathway-hero-heading"
        className="relative w-full overflow-hidden bg-brand-primary"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-800 to-brand-primary-900"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <motion.span
            {...fadeUpAnimate(0)}
            className={`inline-flex items-center rounded-button px-4 py-1.5 text-xs uppercase tracking-[0.2em] font-semibold mb-6 ${heroBadgeClasses(
              pathway.category,
            )}`}
          >
            {categoryLabel(pathway.category)}
          </motion.span>

          <motion.h1
            id="pathway-hero-heading"
            {...fadeUpAnimate(0.1)}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.08] mb-6"
          >
            {pathway.title}
          </motion.h1>

          <motion.p
            {...fadeUpAnimate(0.2)}
            className="text-lg lg:text-xl text-white/75 font-light max-w-2xl leading-relaxed mb-10"
          >
            {detail?.heroSubhead ?? pathway.description}
          </motion.p>

          <motion.div {...fadeUpAnimate(0.3)} className="flex flex-wrap items-center gap-4">
            {detail?.heroCtaPrimaryLabel && (
              <Link
                href={detail.heroCtaPrimaryHref ?? '/contact'}
                className="inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
              >
                {detail.heroCtaPrimaryLabel}
                <span aria-hidden="true">→</span>
              </Link>
            )}
            <Link
              href="/contact"
              className={
                detail?.heroCtaPrimaryLabel
                  ? 'inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10'
                  : 'inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30'
              }
            >
              Book a Discovery Session
              {!detail?.heroCtaPrimaryLabel && <span aria-hidden="true">→</span>}
            </Link>
          </motion.div>
        </div>
      </section>

      {detail ? (
        <>
          {/* ── What This Pathway Is (light) ─────────────────────────────── */}
          <section className="w-full bg-gray-50 py-20 lg:py-32">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeUpInView(0)}>
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-8">
                  What This Pathway Is
                </p>
                <div className="space-y-6">
                  {detail.whatThisPathwayIs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base lg:text-lg text-gray-600 font-light leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* ── Who It's For / What We Work On (dark) ─────────────────────── */}
          {(detail.whoItsFor.length > 0 || detail.whatWeWorkOn.length > 0) && (
            <section className="w-full bg-brand-primary-900 py-20 lg:py-32">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-16 lg:grid-cols-2">
                {detail.whoItsFor.length > 0 && (
                  <motion.div {...fadeUpInView(0)}>
                    <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6">
                      Who It&apos;s For
                    </p>
                    <ul className="space-y-3">
                      {detail.whoItsFor.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent-400"
                          />
                          <span className="text-base text-white/70 font-light leading-relaxed">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
                {detail.whatWeWorkOn.length > 0 && (
                  <motion.div {...fadeUpInView(0.1)}>
                    <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6">
                      What We Work On
                    </p>
                    <ul className="space-y-3">
                      {detail.whatWeWorkOn.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent-400"
                          />
                          <span className="text-base text-white/70 font-light leading-relaxed">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            </section>
          )}

          {/* ── Outcomes / Signature Message (light) ──────────────────────── */}
          {(detail.outcomes.length > 0 || detail.signatureMessage) && (
            <section className="w-full bg-white py-20 lg:py-32">
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
        /* "Coming soon" placeholder — only for pathways without supplied content */
        <section className="w-full bg-gray-50 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              {...fadeUpInView(0)}
              className="rounded-card border border-dashed border-gray-300 bg-white p-8 lg:p-10 text-center"
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                Coming Soon
              </p>
              <p className="text-lg lg:text-xl font-light text-brand-primary leading-relaxed">
                Full programme details for this pathway are coming soon.
              </p>
              <p className="mt-3 text-sm text-gray-500 font-light">
                Session structure, format and who it is best suited for will be
                added here shortly.
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── How the Work Happens (dark) — shared across every pathway ────── */}
      <section className="w-full bg-brand-primary py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUpInView(0)}>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6">
              How the Work Happens
            </p>
            <p className="text-lg lg:text-xl text-white/75 font-light leading-relaxed">
              Each pathway combines deep pattern recognition with practical
              transformation tools to help create lasting change. Depending on
              the pathway, this may include coaching, subconscious
              repatterning, emotional processing, nervous system support,
              practical life tools, and deep identity-level change.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Why This Work Is Different (light) — shared ───────────────────── */}
      <section className="w-full bg-white py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUpInView(0)}>
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
              Why This Work Is Different
            </p>
            <p className="text-lg lg:text-xl text-gray-600 font-light leading-relaxed">
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          {detail?.ctaSectionHeadline && (
            <motion.h2
              id="pathway-cta-heading"
              {...fadeUpInView(0)}
              className="text-3xl lg:text-5xl font-light text-white leading-tight mb-6"
            >
              {detail.ctaSectionHeadline}
            </motion.h2>
          )}
          {detail?.ctaSectionBody && (
            <motion.p
              {...fadeUpInView(0.05)}
              className="text-lg text-white/70 font-light leading-relaxed mb-10"
            >
              {detail.ctaSectionBody}
            </motion.p>
          )}

          <motion.p
            {...fadeUpInView(0.1)}
            className="text-base text-white/60 font-light leading-relaxed mb-8 max-w-xl mx-auto"
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
              className="group inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700 hover:shadow-2xl hover:shadow-brand-accent/30"
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
              className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
            >
              All Pathways
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
