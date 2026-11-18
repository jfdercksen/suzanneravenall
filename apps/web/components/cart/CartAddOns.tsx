'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCart, formatPrice } from '@/lib/cart'
import { cartAddOnOffers, cartAddOnPairings, type CartProductFacts } from '@/lib/shop/addons'

interface CartAddOnsProps {
  /** The store facts the cart page read (useCartProductFacts); null while reading. */
  facts: ReadonlyMap<string, CartProductFacts> | null
}

/**
 * Add-ons that go with what is in the cart (Johan's pairings, 17 Nov 2026,
 * lib/shop/addons.ts). Nothing is added for the buyer: each add-on has its
 * own Add button. An add-on already in the cart is not offered, except Bonus
 * Lifetime Access until there is one per qualifying programme (18 Nov); its
 * Add then raises the quantity of the line already there, since Medusa merges
 * the same variant into one line. The block is left out when the store cannot
 * be read.
 */
export function CartAddOns({ facts }: CartAddOnsProps) {
  const { cart, addItem } = useCart()
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!cart || !facts) return null
  const offers = cartAddOnOffers(cartAddOnPairings(cart.items, facts), facts, cart.currency_code)
  if (offers.length === 0) return null

  async function handleAdd(variantId: string) {
    setAdding(variantId)
    setError(null)
    try {
      await addItem(variantId, 1)
    } catch {
      setError('That add-on could not be added. Please try again.')
    } finally {
      setAdding(null)
    }
  }

  return (
    <motion.section
      aria-labelledby="cart-add-ons-heading"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10 rounded-2xl border border-brand-border bg-brand-sand p-6"
    >
      <p className="mb-2 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">Add-ons</p>
      <h2 id="cart-add-ons-heading" className="text-lg font-medium text-brand-ink">
        Goes with your order
      </h2>
      <ul className="mt-4 divide-y divide-brand-border">
        {offers.map((offer) => (
          <li key={offer.handle} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-ink">{offer.title}</p>
              <p className="mt-0.5 text-xs text-brand-muted">
                {formatPrice(offer.amount, cart.currency_code)}
                {offer.variantTitle ? ` ${offer.variantTitle.toLowerCase()}` : ''}
                {offer.goesWith.length > 0 ? `. Goes with ${offer.goesWith.join(', ')}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleAdd(offer.variantId)}
              disabled={adding !== null}
              aria-label={`Add ${offer.title} to your cart`}
              className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-button border border-brand-primary-300 bg-white text-sm font-medium text-brand-ink hover:border-brand-primary hover:bg-brand-cream disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {adding === offer.variantId ? 'Adding...' : 'Add'}
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </motion.section>
  )
}
