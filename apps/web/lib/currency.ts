// Shared currency formatting helpers — single source of truth for symbol lookup.

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ZAR: 'R',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
}

export function getCurrencySymbol(currency: string | undefined): string {
  if (!currency) return 'R'
  return CURRENCY_SYMBOLS[currency] ?? currency
}
