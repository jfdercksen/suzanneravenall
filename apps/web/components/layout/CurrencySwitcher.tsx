'use client'

import { useState } from 'react'
import { useCart, type Currency } from '@/lib/cart'

const OPTIONS: Array<{ value: Currency; label: string; name: string }> = [
  { value: 'zar', label: 'ZAR', name: 'South African rand' },
  { value: 'usd', label: 'USD', name: 'US dollar' },
]

interface CurrencySwitcherProps {
  className?: string
}

// ZAR / USD toggle for the header, the mobile menu and the footer (D021). The
// choice is a cookie the server-rendered prices read; the cart moves to the
// matching store region. Hidden while USD is switched off or still loading.
// All three placements sit on the black ground, so one white-on-black style.
export function CurrencySwitcher({ className = '' }: CurrencySwitcherProps) {
  const { currency, usdEnabled, setCurrency } = useCart()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!usdEnabled || !currency) return null

  async function choose(next: Currency) {
    if (next === currency || busy) return
    setBusy(true)
    setError(null)
    try {
      await setCurrency(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the currency')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <div role="group" aria-label="Currency" aria-busy={busy} className="inline-flex rounded-full border border-white/30 p-0.5">
        {OPTIONS.map(({ value, label, name }) => {
          const active = value === currency
          return (
            <button
              key={value}
              type="button"
              onClick={() => choose(value)}
              disabled={busy}
              aria-pressed={active}
              aria-label={`Show prices in ${name}`}
              className={`px-2.5 py-1 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${
                active ? 'bg-white text-brand-primary' : 'text-white/80 hover:text-white hover:bg-white/10'
              } ${busy ? 'cursor-wait opacity-70' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
