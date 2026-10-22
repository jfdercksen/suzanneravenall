// The programme pages' price in the visitor's currency (D021, L-USD3).
//
// data/programs.ts carries a rand price per programme (the live-shop
// self-study price) and a Thinkific dollar price that is not what checkout
// charges. So a South African visitor keeps the rand price exactly as it was,
// and a visitor anywhere else sees the dollar price Medusa holds for the SAME
// variant: the one whose rand amount is the programme's rand price. When
// Medusa has no such dollar price the page says "Price on request". A dollar
// price is never derived from rand (Johan's rule) and never another currency.

import type { Program } from '@/data/programs'
import type { ProductVariant } from '@/types/medusa'
import { formatDisplayPrice } from '@/components/shop/shopCatalogue'

export const PRICE_ON_REQUEST = 'Price on request'

/** Both texts per programme; the page picks one by the visitor's currency. */
export interface ProgramPriceTexts {
  zar: string
  usd: string
  /** The amounts behind the texts in cents, null for "Price on request" (for "From" prices). */
  zarCents: number | null
  usdCents: number | null
}

function formatRand(amount: number): string {
  // The format the programme pages have always used: "R13,950".
  return `R${amount.toLocaleString('en-US')}`
}

function amountIn(variant: ProductVariant, currency: string): number | null {
  const price = variant.prices.find((p) => p.currency_code.toLowerCase() === currency)
  return price ? price.amount : null
}

/**
 * The variants the programme's price stands for: those whose rand amount
 * (cents) is the programme's rand price. Without a rand price on the
 * programme, a single-variant product is unambiguous, so it stands for itself.
 */
function matchingVariants(program: Program, variants: ProductVariant[]): ProductVariant[] {
  if (program.priceZar == null) return variants.length === 1 ? variants : []
  const cents = Math.round(program.priceZar * 100)
  return variants.filter((v) => amountIn(v, 'zar') === cents)
}

function lowest(amounts: Array<number | null>): number | null {
  const present = amounts.filter((a): a is number => a !== null)
  return present.length > 0 ? Math.min(...present) : null
}

/**
 * The rand and dollar texts for one programme. `variants` is the Medusa
 * product behind program.shopHandle, or null when there is none or Medusa
 * could not be reached.
 */
export function programPriceTexts(program: Program, variants: ProductVariant[] | null | undefined): ProgramPriceTexts {
  const matches = variants ? matchingVariants(program, variants) : []

  const zarCents =
    program.priceZar != null ? Math.round(program.priceZar * 100) : lowest(matches.map((v) => amountIn(v, 'zar')))
  const usdCents = lowest(matches.map((v) => amountIn(v, 'usd')))
  return textsFor(zarCents, usdCents)
}

function textsFor(zarCents: number | null, usdCents: number | null): ProgramPriceTexts {
  return {
    zar: zarCents !== null ? formatRand(zarCents / 100) : PRICE_ON_REQUEST,
    usd: usdCents !== null ? formatDisplayPrice({ amount: usdCents, currency_code: 'usd' }) : PRICE_ON_REQUEST,
    zarCents,
    usdCents,
  }
}

/** The lowest price per currency across several programmes, for a "From" card. */
export function lowestProgramPrice(all: ProgramPriceTexts[]): ProgramPriceTexts {
  return textsFor(lowest(all.map((t) => t.zarCents)), lowest(all.map((t) => t.usdCents)))
}

/** The text for the visitor's currency; "Price on request" when it is unknown. */
export function programPriceIn(texts: ProgramPriceTexts | undefined, currency: string): string {
  if (!texts) return PRICE_ON_REQUEST
  return currency.toLowerCase() === 'usd' ? texts.usd : texts.zar
}

/** The currency label shown after a price ("USD", "ZAR"), none after "Price on request". */
export function programPriceSuffix(text: string, currency: string): string | null {
  if (text === PRICE_ON_REQUEST) return null
  return currency.toLowerCase() === 'usd' ? 'USD' : 'ZAR'
}
