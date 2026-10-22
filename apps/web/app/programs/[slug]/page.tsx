import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getProgramBySlug, getRelatedPrograms } from '@/data/programs'
import { ProgramPricesProvider } from '@/components/programs/ProgramPrices'
import { getProgramPriceTexts } from '@/lib/programs/fetch-program-prices'
import { ipCountry } from '@/lib/geoip'
import { CURRENCY_COOKIE, visitorCurrency } from '@/lib/visitor-region'
import ProgramDetailClient from './ProgramDetailClient'

type Props = { params: Promise<{ slug: string }> }

// The price follows the visitor's currency (D021, L-USD3), so the page is
// rendered per request like /shop; the Medusa price read stays cached for 5 minutes.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const program = getProgramBySlug(slug)
  if (!program || !program.isPublished) notFound()
  return {
    title: `${program.name}`,
    description: program.shortDescription,
  }
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params
  const program = getProgramBySlug(slug)
  if (!program || !program.isPublished) return notFound()

  // Related programmes: never cross-promotes Resonance Repatterning from
  // non-RR pages (see getRelatedPrograms in data/programs.ts)
  const related = getRelatedPrograms(program, 3)

  const [priceTexts, reqHeaders, reqCookies] = await Promise.all([
    getProgramPriceTexts([program]),
    headers(),
    cookies(),
  ])
  const currency = visitorCurrency(reqHeaders, reqCookies.get(CURRENCY_COOKIE)?.value, process.env, ipCountry(reqHeaders))

  return (
    <ProgramPricesProvider texts={priceTexts} defaultCurrency={currency}>
      <ProgramDetailClient program={program} relatedPrograms={related} />
    </ProgramPricesProvider>
  )
}
