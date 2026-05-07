export function formatAmount(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2)
  const formatted = amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const symbol = currency.toUpperCase() === 'ZAR' ? 'R' : currency.toUpperCase()
  return `${symbol} ${formatted}`
}
