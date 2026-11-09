'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import type { Topic } from '@/app/explore/topics'
import { topicCopy, type PatternBlock } from '@/app/explore/topicCopy'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

const blockHeading = 'text-2xl lg:text-3xl font-medium tracking-tight text-brand-primary mb-6'
const bodyText = 'text-lg text-brand-ink font-light leading-relaxed'

// One block of Suzanne's "The Pattern Underneath" copy. A plain function, not
// a component: it returns the block's JSX for the section below to place.
function renderBlock(block: PatternBlock): React.ReactElement {
  switch (block.kind) {
    case 'text':
      return (
        <div className="max-w-3xl">
          {block.heading && <h3 className={blockHeading}>{block.heading}</h3>}
          <div className="space-y-6">
            {block.paragraphs.map((paragraph, i) => (
              <p key={`${i}-${paragraph}`} className={bodyText}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )
    case 'list':
      return (
        <div className="max-w-3xl">
          {block.heading && <h3 className={blockHeading}>{block.heading}</h3>}
          {block.intro && <p className={`${bodyText} mb-4`}>{block.intro}</p>}
          <ul className="space-y-3">
            {block.items.map((item, i) => (
              <li key={`${i}-${item}`} className="flex items-start gap-4">
                <span aria-hidden="true" className="flex h-[1.625em] shrink-0 items-center text-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                </span>
                <span className={bodyText}>{item}</span>
              </li>
            ))}
          </ul>
          {block.outro && <p className={`${bodyText} mt-8`}>{block.outro}</p>}
        </div>
      )
    case 'cards': {
      const CardTitle = block.heading ? 'h4' : 'h3'
      return (
        <div>
          <div className="max-w-3xl">
            {block.heading && <h3 className={blockHeading}>{block.heading}</h3>}
            <div className="space-y-4 mb-10">
              {block.intro.map((paragraph, i) => (
                <p key={`${i}-${paragraph}`} className={bodyText}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
          {/* Four cards stay two by two: at four columns the bodies run seven
              lines deep at 1024px. */}
          <ul
            className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${
              block.cards.length === 3 ? 'lg:grid-cols-3' : ''
            }`}
          >
            {block.cards.map((card, i) => (
              <li
                key={`${i}-${card.title}`}
                className="rounded-card bg-white border border-brand-border p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
              >
                <CardTitle className="text-2xl font-medium text-brand-primary mb-2">{card.title}</CardTitle>
                <p className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent mb-4">
                  {card.subtitle}
                </p>
                <p className="text-brand-muted font-light leading-relaxed">{card.body}</p>
              </li>
            ))}
          </ul>
          {block.outro && <p className={`${bodyText} max-w-3xl mt-10`}>{block.outro}</p>}
        </div>
      )
    }
    case 'compare':
      return (
        <div className="max-w-3xl">
          {block.heading && <h3 className={blockHeading}>{block.heading}</h3>}
          <div className="rounded-card overflow-hidden border border-brand-border bg-white">
          <table className="w-full table-fixed text-left">
            <caption className="sr-only">
              {block.heading ?? `${block.columns[0]} compared with ${block.columns[1]}`}
            </caption>
            <thead>
              <tr className="border-b border-brand-border">
                {block.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-3 sm:px-6 py-4 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map(([left, right], i) => (
                <tr key={`${i}-${left}`} className="border-b border-brand-border last:border-b-0 align-top">
                  <td className="px-3 sm:px-6 py-4 text-brand-muted font-light leading-relaxed">{left}</td>
                  <td className="px-3 sm:px-6 py-4 text-brand-primary font-light leading-relaxed">{right}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )
    case 'statement':
      return (
        <div className="max-w-3xl border-l-2 border-brand-accent pl-6">
          <p className="text-2xl lg:text-3xl font-light text-brand-primary leading-snug">{block.text}</p>
          {block.body && <p className={`${bodyText} mt-4`}>{block.body}</p>}
        </div>
      )
    default: {
      const unreachable: never = block
      return unreachable
    }
  }
}

export default function TopicOverview({ topic }: { topic: Topic }) {
  // Suzanne's copy (8 Nov 2026) where she has written it; the older
  // headline-and-paragraphs layout otherwise.
  const copy = topicCopy[topic.slug]?.pattern

  // Pull the first sentence of overview[0] as the pull quote:
  // it is always the most emotionally direct line.
  const pullQuote = topic.overview[0]

  return (
    <section
      aria-labelledby="topic-overview-heading"
      className="relative w-full bg-brand-sand overflow-hidden pt-20 pb-12 lg:pt-32 lg:pb-16"
    >
      {/* Dot-grid background pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[length:32px_32px]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {copy ? (
          <>
            <motion.div {...fadeUp(0)} className="max-w-3xl mb-14 lg:mb-16">
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                The Pattern Underneath
              </p>
              <h2
                id="topic-overview-heading"
                className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary leading-tight"
              >
                {copy.headline}
              </h2>
            </motion.div>

            <div className="space-y-14 lg:space-y-16">
              {copy.blocks.map((block, index) => (
                <motion.div key={`${topic.slug}-pattern-${index}`} {...fadeUp(0.1)}>
                  {renderBlock(block)}
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left: label + corePrinciple headline */}
            <motion.div {...fadeUp(0)} className="lg:col-span-5">
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
                The Pattern Underneath
              </p>
              <h2
                id="topic-overview-heading"
                className="text-4xl lg:text-5xl font-medium tracking-tight text-brand-primary leading-tight"
              >
                {topic.corePrinciple}
              </h2>
            </motion.div>

            {/* Right: pull quote + body paragraphs */}
            <div className="lg:col-span-7 space-y-8">
              {/* Pull quote treatment: first overview paragraph elevated visually */}
              <motion.div {...fadeUp(0.1)} className="relative pl-6">
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-px bg-brand-accent/60"
                />
                <p className="text-xl lg:text-2xl text-brand-accent/90 font-light italic leading-relaxed">
                  {pullQuote}
                </p>
              </motion.div>

              {/* Remaining overview paragraphs */}
              {topic.overview.slice(1).map((paragraph, index) => (
                <motion.p
                  key={index}
                  {...fadeUp(0.2 + index * 0.1)}
                  className="text-lg text-brand-muted font-light leading-relaxed"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
