'use client'

import { motion } from 'framer-motion'
import type { MedusaProduct } from '@/types/medusa'
import { ProductCard } from './ProductCard'

interface ShopAddOnsProps {
  products: MedusaProduct[]
  defaultCurrency?: string
}

/** The anchor the filter bar's Add-ons link jumps to. */
export const ADD_ONS_SECTION_ID = 'add-ons'

/**
 * The Add-ons band on /shop (Suzanne approved, 17 Nov 2026): the support
 * packages, Bonus Lifetime Access and the certification observation fee, in
 * one place instead of scattered through the catalogue. Cream ground under
 * the sand catalogue; the cards carry their own border. Renders nothing when
 * the store returned none of them.
 */
export function ShopAddOns({ products, defaultCurrency = 'zar' }: ShopAddOnsProps) {
  if (products.length === 0) return null
  return (
    <section
      id={ADD_ONS_SECTION_ID}
      aria-labelledby="shop-add-ons-heading"
      className="w-full bg-brand-cream py-20 lg:py-32 scroll-mt-48"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-12 lg:mb-16"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">Add-ons</p>
          <h2 id="shop-add-ons-heading" className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary">
            Add to Your Journey
          </h2>
          <p className="mt-6 text-base lg:text-lg text-brand-muted font-light leading-relaxed">
            Support between sessions, lifetime access to the self-study programme for a level you have bought, and the
            certification observation fee.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} defaultCurrency={defaultCurrency} />
          ))}
        </div>
      </div>
    </section>
  )
}
