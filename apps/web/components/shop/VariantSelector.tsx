'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { useHydrated } from '@/lib/useHydrated'
import { maxQuantity } from '@/components/cart/cartRules'
import { getSpotsInfo } from '@/lib/inventory/spots'
import { isCapacityLimitedHandle } from '@/lib/inventory/group-sessions'
import { isComingSoonVariant } from './productKind'
import type { MedusaVariant } from '@/types/medusa'

// The price in the buyer's currency, or null. Never another currency's price:
// a variant without a USD price is "price on request" to a USD visitor, not a
// rand figure or a converted one (D021, Johan's rule).
export function getPriceForCurrency(variant: MedusaVariant, currencyCode: string): number | null {
  const match = (variant.prices ?? []).find((p) => p.currency_code === currencyCode.toLowerCase())
  return match ? match.amount / 100 : null
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
  /** Heading over the variant buttons, matched to what is sold (productKind.ts). */
  chooseLabel?: string
  /** The visitor's currency from the server, used until a cart exists (D021). */
  defaultCurrency?: string
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  dark = false,
  productHandle,
  chooseLabel = 'Choose an Option',
  defaultCurrency = 'zar',
}: VariantSelectorProps) {
  const [pendingState, setPendingState] = useState<'idle' | 'loading' | 'error'>('idle')
  // The variant the last successful add put in the cart. The confirmation stays
  // on screen for that variant (no timed reset, KI066) and clears by itself
  // when the buyer picks a different one.
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null)
  const [addToCartError, setAddToCartError] = useState<string | null>(null)
  const { addItem, cart, currency } = useCart()
  // Until React has taken over the server-rendered page, a click on these
  // buttons does nothing (KI066). They render disabled with a pending look
  // so the buyer sees the page is still getting ready instead of a lost click.
  const ready = useHydrated()
  const cartCurrency = cart?.currency_code ?? currency ?? defaultCurrency
  const isCapacityLimited = isCapacityLimitedHandle(productHandle)

  if (variants.length === 0) {
    return (
      <Link
        href="/contact"
        className="inline-block py-4 px-8 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
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
  // Listed but not for sale yet (metadata.coming_soon on the variant).
  const comingSoon = selectedVariant ? isComingSoonVariant(selectedVariant) : false

  const headingClass = dark ? 'text-white' : 'text-brand-ink'
  const priceClass = dark ? 'text-white' : 'text-brand-ink'
  const buttonState: 'idle' | 'loading' | 'added' | 'error' =
    pendingState !== 'idle'
      ? pendingState
      : selectedVariant && addedVariantId === selectedVariant.id
        ? 'added'
        : 'idle'
  // After an add, items that allow more than one per order (the book) keep a
  // live "Add another"; one-per-order items (sessions, seats, courses) stay on
  // "Added to cart" with the button off.
  const existingLine = selectedVariant
    ? cart?.items?.find((item) => item.variant_id === selectedVariant.id)
    : undefined
  const canAddAnother = existingLine ? maxQuantity(existingLine) > existingLine.quantity : false

  async function handleAddToCart() {
    if (!selectedVariant || !ready) return
    setPendingState('loading')
    setAddToCartError(null)
    // One-per-order items (sessions, seats, courses) are already in the cart:
    // a second add would make Medusa raise the line to 2 (site check C19).
    const existing = cart?.items?.find((item) => item.variant_id === selectedVariant.id)
    if (existing && maxQuantity(existing) === 1) {
      setAddedVariantId(selectedVariant.id)
      setPendingState('idle')
      return
    }
    try {
      await addItem(selectedVariant.id, 1)
      setAddedVariantId(selectedVariant.id)
      setPendingState('idle')
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
      setPendingState('error')
      setTimeout(() => setPendingState('idle'), 4000)
    }
  }

  return (
    <div className="space-y-8">
      {hasMultipleVariants && (
        <div>
          <p className={`text-xs uppercase tracking-[0.3em] font-medium ${dark ? 'text-brand-accent-400' : 'text-brand-accent'} mb-4`}>
            {chooseLabel}
          </p>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariantId
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onSelect(variant.id)}
                  disabled={!ready}
                  aria-pressed={isSelected}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    ready ? '' : 'opacity-60 cursor-wait'
                  } ${
                    isSelected
                      ? 'bg-brand-accent-600 text-white border-brand-accent-600'
                      : dark
                        ? 'border-white/30 text-white/80 hover:border-brand-accent-400 hover:text-brand-accent-400 bg-transparent'
                        : 'border-brand-primary-300 text-brand-ink hover:border-brand-accent hover:text-brand-accent bg-transparent'
                  }`}
                >
                  {variant.title}
                  {isComingSoonVariant(variant) ? <span className="ml-2 text-xs opacity-80">(coming soon)</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price display */}
      <div>
        {selectedPrice !== null ? (
          <p className={`text-4xl font-semibold tracking-tight ${priceClass}`}>
            {formatVariantPrice(selectedPrice, cartCurrency)}
          </p>
        ) : (
          <p className={`text-xl font-light ${headingClass} opacity-60`}>
            Price on request
          </p>
        )}
        {/* No "Only N spots left" count until Suzanne gives dates (sourcing
            report 6 Oct, decision 6). Sold-out handling below stays. */}
      </div>

      {/* CTA */}
      {comingSoon ? (
        <div className="space-y-3">
          <p className={`text-sm font-medium ${dark ? 'text-white/70' : 'text-brand-muted'}`}>
            This format is being prepared and is not available to buy yet.
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className={`w-full sm:w-auto sm:min-w-[240px] py-4 px-8 rounded-button text-base font-medium cursor-not-allowed ${
              dark ? 'bg-white/10 text-white/60 border border-white/20' : 'bg-brand-sand text-brand-muted border border-brand-border'
            }`}
          >
            Coming Soon
          </button>
          <p className={`text-sm ${dark ? 'text-white/60' : 'text-brand-muted'}`}>
            <Link
              href="/contact"
              className={`font-medium underline underline-offset-4 transition-colors duration-200 ${dark ? 'text-brand-accent-400 hover:text-white' : 'text-brand-accent hover:text-brand-primary'}`}
            >
              Let me know when it is available
            </Link>
          </p>
        </div>
      ) : soldOut ? (
        <div className="space-y-3">
          <p className={`text-sm font-medium ${dark ? 'text-white/70' : 'text-brand-muted'}`}>
            This cohort is fully booked.
          </p>
          <Link
            href="/contact"
            className="inline-block w-full sm:w-auto sm:min-w-[240px] py-4 px-8 rounded-button text-base font-medium text-center bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Join the Waitlist
          </Link>
        </div>
      ) : selectedPrice !== null ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!ready || (buttonState !== 'idle' && !(buttonState === 'added' && canAddAnother))}
            aria-busy={!ready || buttonState === 'loading'}
            className={`w-full sm:w-auto sm:min-w-[240px] py-4 px-8 rounded-button text-base font-medium transition-all duration-300 ${
              !ready
                ? 'bg-brand-accent-600 text-white/60 cursor-wait'
                : buttonState === 'added' && !canAddAnother
                ? 'bg-emerald-700 text-white cursor-default'
                : buttonState === 'error'
                  ? 'bg-red-600 text-white cursor-default'
                  : buttonState === 'loading'
                    ? 'bg-brand-accent-600 text-white/60 cursor-wait'
                    : 'bg-brand-accent-600 hover:bg-brand-accent-700 text-white hover:-translate-y-0.5 hover:shadow-lg'
            }`}
          >
            {!ready
              ? 'Loading...'
              : buttonState === 'loading'
              ? 'Adding...'
              : buttonState === 'added'
                ? canAddAnother
                  ? 'Add another'
                  : 'Added to cart ✓'
                : buttonState === 'error'
                  ? addToCartError
                    ? 'Spot no longer available'
                    : 'Could not add. Try again.'
                  : 'Add to Cart'}
          </button>
          {buttonState === 'added' ? (
            <p role="status" className={`text-sm ${dark ? 'text-white/80' : 'text-brand-ink'}`}>
              {hasMultipleVariants && selectedVariant ? `${selectedVariant.title} is in your cart. ` : 'This item is in your cart. '}
              <Link
                href="/cart"
                className={`font-medium underline underline-offset-4 transition-colors duration-200 ${dark ? 'text-brand-accent-400 hover:text-white' : 'text-brand-accent hover:text-brand-primary'}`}
              >
                View cart →
              </Link>
            </p>
          ) : buttonState === 'error' && addToCartError ? (
            <p className={`text-sm font-medium ${dark ? 'text-red-400' : 'text-red-600'}`}>
              {addToCartError}{' '}
              <Link
                href="/contact"
                className={`underline underline-offset-4 transition-colors duration-200 ${dark ? 'hover:text-red-300' : 'hover:text-red-800'}`}
              >
                Join waitlist
              </Link>
            </p>
          ) : null}
          {/* No payment-plan note: payment plans are not offered on any of Suzanne's live sites
              (content-sourcing 6 Oct, section 10; Johan's decision 15). */}
        </div>
      ) : (
        <Link
          href="/contact"
          className="inline-block py-4 px-8 rounded-button text-base font-medium bg-brand-accent-600 hover:bg-brand-accent-700 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Contact Us to Discuss Pricing
        </Link>
      )}
    </div>
  )
}
