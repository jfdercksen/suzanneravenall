'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import type { MedusaVariant } from '@/types/medusa'

function getZarPrice(variant: MedusaVariant): number | null {
  const price = (variant.prices ?? []).find((p) => p.currency_code === 'zar')
  return price ? price.amount / 100 : null
}

function formatPrice(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface VariantSelectorProps {
  variants: MedusaVariant[]
  selectedVariantId: string
  onSelect: (id: string) => void
  /** When rendered on a dark background, invert text colours */
  dark?: boolean
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  dark = false,
}: VariantSelectorProps) {
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'added' | 'error'>('idle')
  const { addItem } = useCart()

  if (variants.length === 0) {
    return (
      <Link
        href="/contact"
        className="inline-block py-4 px-8 rounded-button text-base font-semibold bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      >
        Contact Us to Discuss Options
      </Link>
    )
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0]
  const selectedPrice = selectedVariant ? getZarPrice(selectedVariant) : null
  const hasMultipleVariants = variants.length > 1

  const headingClass = dark ? 'text-white' : 'text-gray-900'
  const priceClass = dark ? 'text-white' : 'text-gray-900'
  const noteClass = dark ? 'text-white/50' : 'text-gray-400'

  async function handleAddToCart() {
    if (!selectedVariant) return
    setButtonState('loading')
    try {
      await addItem(selectedVariant.id, 1)
      setButtonState('added')
      setTimeout(() => setButtonState('idle'), 2500)
    } catch {
      setButtonState('error')
      setTimeout(() => setButtonState('idle'), 3000)
    }
  }

  return (
    <div className="space-y-8">
      {hasMultipleVariants && (
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Choose Your Programme
          </p>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariantId
              return (
                <button
                  key={variant.id}
                  onClick={() => onSelect(variant.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    isSelected
                      ? 'bg-brand-accent-600 text-white border-brand-accent-600'
                      : dark
                        ? 'border-white/30 text-white/80 hover:border-brand-accent hover:text-brand-accent bg-transparent'
                        : 'border-gray-300 text-gray-700 hover:border-brand-accent hover:text-brand-accent bg-transparent'
                  }`}
                >
                  {variant.title}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price display */}
      <div>
        {selectedPrice !== null ? (
          <p className={`text-4xl font-light ${priceClass}`}>
            {formatPrice(selectedPrice)}
          </p>
        ) : (
          <p className={`text-xl font-light ${headingClass} opacity-60`}>
            Contact us to discuss pricing
          </p>
        )}
      </div>

      {/* CTA */}
      {selectedPrice !== null ? (
        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={buttonState !== 'idle'}
            className={`w-full sm:w-auto sm:min-w-[240px] py-4 px-8 rounded-button text-base font-semibold transition-all duration-300 ${
              buttonState === 'added'
                ? 'bg-emerald-600 text-white cursor-default'
                : buttonState === 'error'
                  ? 'bg-red-600 text-white cursor-default'
                  : buttonState === 'loading'
                    ? 'bg-brand-accent-600 text-white/60 cursor-wait'
                    : 'bg-brand-accent-600 hover:bg-brand-accent-700 text-white hover:-translate-y-0.5 hover:shadow-lg'
            }`}
          >
            {buttonState === 'loading'
              ? 'Adding...'
              : buttonState === 'added'
                ? 'Added to cart ✓'
                : buttonState === 'error'
                  ? 'Could not add — try again'
                  : 'Add to Cart'}
          </button>
          {buttonState === 'added' ? (
            <Link
              href="/cart"
              className={`text-sm font-medium underline underline-offset-4 transition-colors duration-200 ${dark ? 'text-brand-accent hover:text-white' : 'text-brand-accent hover:text-brand-primary'}`}
            >
              View cart →
            </Link>
          ) : (
            <p className={`text-sm ${noteClass}`}>Payment plans available — contact us</p>
          )}
        </div>
      ) : (
        <Link
          href="/contact"
          className="inline-block py-4 px-8 rounded-button text-base font-semibold bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Contact Us to Discuss Pricing
        </Link>
      )}
    </div>
  )
}
