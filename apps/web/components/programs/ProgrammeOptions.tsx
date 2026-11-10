'use client'

import Link from 'next/link'
import { useProgramPrices } from '@/components/programs/ProgramPrices'
import { getProgramCta, selfStudyEditionOf, type Program } from '@/data/programs'
import { PRICE_ON_REQUEST, programPriceSuffix } from '@/lib/programs/program-prices'

/** Shop link for the recorded self-study, with its variant preselected when known. */
export function recordedSelfStudyHref(program: Program, variantId: string | undefined): string {
  const base = `/shop/${program.shopHandle}`
  return variantId ? `${base}?variant=${encodeURIComponent(variantId)}` : base
}

/**
 * The two ways to take a live programme whose product also sells Self Study
 * (Johan 10 Nov, KI106): the recorded self-study to buy now, and the live Zoom
 * series with Suzanne on register interest. Only short labels are ours; the
 * programme copy around it is Suzanne's, unchanged.
 */
export function ProgrammeOptions({ program }: { program: Program }) {
  const { priceOf, currency, variantOf } = useProgramPrices()
  const edition = selfStudyEditionOf(program)
  if (!edition) return null

  const live = getProgramCta(program)
  const options = [
    {
      key: 'self-study',
      label: 'Self-Study',
      title: 'The recorded programme',
      note: 'Start now, at your own pace.',
      price: priceOf(edition.slug),
      cta: {
        // Without a price to show, the shop page is where the price is: say so.
        label: priceOf(edition.slug) === PRICE_ON_REQUEST ? 'View in Shop' : 'Buy the Recorded Programme',
        href: recordedSelfStudyHref(program, variantOf(edition.slug)),
      },
    },
    {
      key: 'live',
      label: 'Live via Zoom',
      title: 'The live series with Suzanne',
      note: 'No dates yet: register your interest.',
      price: priceOf(program.slug),
      cta: live,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {options.map((option) => {
        const suffix = option.price === PRICE_ON_REQUEST ? null : programPriceSuffix(option.price, currency)
        return (
          <div key={option.key} className="flex flex-col rounded-card border border-brand-border bg-white p-6">
            <p className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent mb-2">{option.label}</p>
            <p className="text-lg font-medium text-brand-ink leading-snug mb-1">{option.title}</p>
            <p className="text-sm text-brand-muted font-light mb-4">{option.note}</p>
            <p className="text-2xl font-semibold tracking-tight text-brand-primary mb-6 flex-1">
              {option.price}
              {suffix && <span className="text-sm text-brand-muted font-normal ml-1">{suffix}</span>}
            </p>
            {/* Same weight for both: the visitor chooses, neither option is the default. */}
            <Link
              href={option.cta.href}
              className="inline-flex items-center justify-center px-5 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-xs uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              {option.cta.label}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
