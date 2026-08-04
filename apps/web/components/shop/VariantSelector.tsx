'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { getSpotsInfo } from '@/lib/inventory/spots'
import { isCapacityLimitedHandle } from '@/lib/inventory/group-sessions'
import type { MedusaVariant } from '@/types/medusa'

function getPriceForCurrency(variant: MedusaVariant, currencyCode: string): number | null {
  const prices = variant.prices ?? []
  const match = prices.find((p) => p.currency_code === currencyCode)
  if (match) return match.amount / 100
  // Fall back to ZAR if the requested currency has no price
  const zar = prices.find((p) => p.currency_code === 'zar')
  return zar ? zar.amount / 100 : null
}

function formatVariantPrice(amount: number, currencyCode: string): string {
  if (currencyCode === 'usd') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface VariantSelectorProps {
  variants: MedusaVariant[]
  selectedVariantId: string
  onSelect: (id: string) => void
  /** When rendered on a dark background, invert text colours */
  dark?: boolean
  /**
   * Parent product's handle — required to trust `inventory_quantity` on a
   * variant. Many unrelated self-paced products have variants titled "Live
   * via Zoom" too; without this gate their (untracked, but sometimes
   * present as 0-valued) inventory_quantity could fabricate a "Sold Out"
   * badge. See isCapacityLimitedHandle's doc comment.
   */
  productHandle?: string
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  dark = false,
  productHandle,
}: VariantSelectorProps) {
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'added' | 'error'>('idle')
  const [addToCartError, setAddToCartError] = useState<string | null>(null)
  const { addItem, cart } = useCart()
  const cartCurrency = cart?.currency_code ?? 'zar'
  const isCapacityLimited = isCapacityLimitedHandle(productHandle)

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
  const selectedPrice = selectedVariant ? getPriceForCurrency(selectedVariant, cartCurrency) : null
  const hasMultipleVariants = variants.length > 1
  const spots =
    selectedVariant && isCapacityLimited ? getSpotsInfo(selectedVariant.inventory_quantity) : null
  const soldOut = spots?.soldOut ?? false

  const headingClass = dark ? 'text-white' : 'text-gray-900'
  const priceClass = dark ? 'text-white' : 'text-gray-900'
  const noteClass = dark ? 'text-white/70' : 'text-gray-400'

  async function handleAddToCart() {
    if (!selectedVariant) return
    setButtonState('loading')
    setAddToCartError(null)
    try {
      await addItem(selectedVariant.id, 1)
      setButtonState('added')
      setTimeout(() => setButtonState('idle'), 2500)
    } catch (err) {
      // A cohort can sell out between page load and click (the homepage/shop
      // count can be up to 5 min stale — see getFeaturedCohort's revalidate
      // window). Medusa's own complete-cart inventory check is the real
      // guard; this just gives that specific failure an honest message
      // instead of a generic "try again".
      const message = err instanceof Error ? err.message.toLowerCase() : ''
      const looksLikeStockIssue =
        message.includes('stock') || message.includes('inventory') || message.includes('available')
      setAddToCartError(
        looksLikeStockIssue
          ? 'Someone just took the last spot for this cohort. Please join the waitlist instead.'
          : null
      )
      setButtonState('error')
      setTimeout(() => setButtonState('idle'), 4000)
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
                        ? 'border-white/30 text-white/80 hover:border-brand-accent hover:text-brand-accent-400 bg-transparent'
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
            {formatVariantPrice(selectedPrice, cartCurrency)}
          </p>
        ) : (
          <p className={`text-xl font-light ${headingClass} opacity-60`}>
            Contact us to discuss pricing
          </p>
        )}
        {spots !== null && !spots.soldOut && (
          <p className="mt-2 text-sm font-medium text-brand-accent-400">
            Only {spots.spotsRemaining} spot{spots.spotsRemaining === 1 ? '' : 's'} left for this
            cohort
          </p>
        )}
      </div>

      {/* CTA */}
      {soldOut ? (
        <div className="space-y-3">
          <p className={`text-sm font-medium ${dark ? 'text-white/70' : 'text-gray-500'}`}>
            This cohort is fully booked.
          </p>
          <Link
            href="/contact"
            className="inline-block w-full sm:w-auto sm:min-w-[240px] py-4 px-8 rounded-button text-base font-semibold text-center bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Join the Waitlist
          </Link>
        </div>
      ) : selectedPrice !== null ? (
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
                  ? addToCartError
                    ? 'Spot no longer available'
                    : 'Could not add. Try again.'
                  : 'Add to Cart'}
          </button>
          {buttonState === 'added' ? (
            <Link
              href="/cart"
              className={`text-sm font-medium underline underline-offset-4 transition-colors duration-200 ${dark ? 'text-brand-accent hover:text-white' : 'text-brand-accent hover:text-brand-primary'}`}
            >
              View cart →
            </Link>
          ) : buttonState === 'error' && addToCartError ? (
            <p className="text-sm font-medium text-red-400">
              {addToCartError}{' '}
              <Link
                href="/contact"
                className="underline underline-offset-4 hover:text-red-300 transition-colors duration-200"
              >
                Join waitlist
              </Link>
            </p>
          ) : (
            <p className={`text-sm ${noteClass}`}>Payment plans available: contact us</p>
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
