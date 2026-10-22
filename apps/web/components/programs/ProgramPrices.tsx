'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useCart } from '@/lib/cart'
import { programPriceIn, type ProgramPriceTexts } from '@/lib/programs/program-prices'

interface ProgramPricesValue {
  texts: Record<string, ProgramPriceTexts>
  defaultCurrency: string
}

const ProgramPricesContext = createContext<ProgramPricesValue>({ texts: {}, defaultCurrency: 'zar' })

interface ProgramPricesProviderProps {
  /** Rand and dollar texts per programme slug, from the server. */
  texts: Record<string, ProgramPriceTexts>
  /** The visitor's currency from the server (D021), used until a cart exists. */
  defaultCurrency: string
  children: ReactNode
}

export function ProgramPricesProvider({ texts, defaultCurrency, children }: ProgramPricesProviderProps) {
  const value = useMemo(() => ({ texts, defaultCurrency }), [texts, defaultCurrency])
  return <ProgramPricesContext.Provider value={value}>{children}</ProgramPricesContext.Provider>
}

/** Looks up a programme's price (by slug) in the visitor's currency. */
export function useProgramPrices(): { priceOf: (slug: string) => string; currency: string } {
  const { texts, defaultCurrency } = useContext(ProgramPricesContext)
  const { cart } = useCart()
  // Same rule as the shop cards: the cart's currency once there is one.
  const currency = (cart?.currency_code ?? defaultCurrency).toLowerCase()
  return { priceOf: (slug) => programPriceIn(texts[slug], currency), currency }
}
