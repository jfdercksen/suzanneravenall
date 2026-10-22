import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { PROGRAMS } from '@/data/programs'
import { ProgramPricesProvider } from '@/components/programs/ProgramPrices'
import { getProgramPriceTexts } from '@/lib/programs/fetch-program-prices'
import { ipCountry } from '@/lib/geoip'
import { CURRENCY_COOKIE, visitorCurrency } from '@/lib/visitor-region'
import ProgramsPageClient from './ProgramsPageClient'

// Prices follow the visitor's currency (D021, L-USD3), so the page is rendered
// per request like /shop; the Medusa price read stays cached for 5 minutes.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Programmes',
  description:
    "Explore Dr. Suzanne Ravenall's transformation programmes: practitioner training, self-paced online courses, live sessions, and group workshops designed for dramatic change.",
}

export default async function ProgramsPage() {
  const [priceTexts, reqHeaders, reqCookies] = await Promise.all([
    getProgramPriceTexts(PROGRAMS.filter((p) => p.isPublished)),
    headers(),
    cookies(),
  ])
  const currency = visitorCurrency(reqHeaders, reqCookies.get(CURRENCY_COOKIE)?.value, process.env, ipCountry(reqHeaders))

  return (
    <ProgramPricesProvider texts={priceTexts} defaultCurrency={currency}>
      <ProgramsPageClient />
    </ProgramPricesProvider>
  )
}
