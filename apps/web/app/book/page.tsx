import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import BookContent from '@/components/book/BookContent'
import { getProductPrices } from '@/lib/shop/product-prices'
import { ipCountry } from '@/lib/geoip'
import { CURRENCY_COOKIE, visitorCurrency } from '@/lib/visitor-region'

const BOOK_HANDLE = 'the-latest-book-by-suzanne'

// The price follows the visitor's currency (D021, L-USD3), so the page is
// rendered per request like /shop; the Medusa price read stays cached for 5 minutes.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Breakthrough Trilogy',
  description:
    'Breakthrough Trilogy by Dr. Suzanne Ravenall: Overcoming the Impossible & Living Life Beyond Limitation. A quest to find an upgraded version of you. Available to pre-order.',
}

export default async function BookPage() {
  const [prices, reqHeaders, reqCookies] = await Promise.all([getProductPrices(BOOK_HANDLE), headers(), cookies()])
  const currency = visitorCurrency(reqHeaders, reqCookies.get(CURRENCY_COOKIE)?.value, process.env, ipCountry(reqHeaders))
  return <BookContent prices={prices} defaultCurrency={currency} />
}
