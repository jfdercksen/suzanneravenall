'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useCart } from '@/lib/cart'
import { getSpotsInfo, isLiveVariantTitle } from '@/lib/inventory/spots'
import { isCapacityLimitedHandle } from '@/lib/inventory/group-sessions'
import { getHighlightBadge } from '@/data/shopHighlights'
import type { MedusaProduct, ProductVariant } from '@/types/medusa'

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'private-sessions':              '/images/generated/session-coaching.webp',
  'akashic-coaching':              '/images/generated/explore-akashic.webp',
  'executive-coaching':            '/images/generated/session-coaching.webp',
  'rapid-repatterning':            '/images/generated/explore-repatterning.webp',
  'resonance-repatterning-sessions': '/images/generated/explore-repatterning.webp',
  'transformation-coaching':       '/images/generated/explore-transformation.webp',
  'energetic-clearing':            '/images/generated/explore-energy.webp',
  'exploring-the-alpha-mind':      '/images/generated/explore-mindfulness.webp',
  'rapid-transformation-therapy':  '/images/generated/session-coaching.webp',
  'family-coaching':               '/images/generated/group-coaching-real.webp',
  'group-sessions':                '/images/generated/group-coaching-real.webp',
  'group-sessions-live':           '/images/generated/group-coaching-real.webp',
  'group-sessions-recorded':       '/images/generated/group-coaching-real.webp',
  'rp-live':                       '/images/generated/explore-repatterning.webp',
  'rp-self-paced':                 '/images/generated/explore-repatterning.webp',
  'akashic-live':                  '/images/generated/explore-akashic.webp',
  'akashic-self-paced':            '/images/generated/explore-akashic.webp',
  'energy-clearing-live':          '/images/generated/explore-energy.webp',
  'energy-clearing-self-paced':    '/images/generated/explore-energy.webp',
  'life-enhancing-live':           '/images/generated/explore-transformation.webp',
  'life-enhancing-self-paced':     '/images/generated/explore-transformation.webp',
  'meditation-programmes':         '/images/generated/explore-mindfulness.webp',
  'books':                         '/images/book-cover.png',
  'digital-downloads':             '/images/generated/explore-resonance.webp',
}

interface CategoryNode {
  id: string
  handle: string
  name: string
  parent_category_id: string | null
}

interface DeliveryBadge {
  label: string
  className: string
}

/**
 * Real, inventory-backed "spots left" badge for the product's Live variant,
 * when one exists and the store API returned tracked inventory for it.
 * Takes priority over the generic delivery-format badge — a real seat count
 * is more useful (and more honest) than "Live" on its own.
 *
 * Gated on isCapacityLimitedHandle — many unrelated self-paced products also
 * have variants titled "Live via Zoom" and must never show a fabricated
 * spots/sold-out badge (see isCapacityLimitedHandle's doc comment).
 */
function getRealSpotsBadge(handle: string, variants: ProductVariant[]): DeliveryBadge | null {
  if (!isCapacityLimitedHandle(handle)) return null

  const liveVariant = variants.find((v) => isLiveVariantTitle(v.title))
  if (!liveVariant) return null

  const spots = getSpotsInfo(liveVariant.inventory_quantity)
  if (spots === null) return null

  if (spots.soldOut) {
    return { label: 'Sold Out', className: 'bg-gray-100 text-gray-500 border border-gray-200' }
  }

  return {
    label: `${spots.spotsRemaining} spot${spots.spotsRemaining === 1 ? '' : 's'} left`,
    className: 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30',
  }
}

function getDeliveryBadge(handle: string, title: string): DeliveryBadge {
  const text = `${handle} ${title}`.toLowerCase()

  if (text.includes('live-via-zoom') || text.includes(' live')) {
    return { label: 'Live', className: 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30' }
  }
  if (text.includes('self-study') || text.includes('self-paced')) {
    return { label: 'Self Paced', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
  }
  if (text.includes('in-person')) {
    return { label: 'In-Person', className: 'bg-amber-50 text-amber-700 border border-amber-200' }
  }
  if (text.includes('recorded')) {
    return { label: 'Recorded', className: 'bg-purple-50 text-purple-700 border border-purple-200' }
  }

  return { label: 'Session', className: 'bg-gray-100 text-gray-600' }
}

/**
 * Walks the category tree to return the root (top-level) category for the
 * first directly-assigned category on the product.
 * Uses allCategories (the full tree from the page fetch) to resolve parents.
 */
function getRootCategory(
  productCategories: CategoryNode[],
  allCategories: CategoryNode[]
): CategoryNode | null {
  if (productCategories.length === 0) return null

  const lookup = new Map(allCategories.map((c) => [c.id, c]))

  for (const cat of productCategories) {
    let current: CategoryNode | undefined = lookup.get(cat.id) ?? cat
    // Walk up until we reach a root (parent_category_id === null)
    while (current && current.parent_category_id !== null) {
      const parent = lookup.get(current.parent_category_id)
      if (!parent) break
      current = parent
    }
    if (current) return current
  }

  return productCategories[0] ?? null
}

interface LowestPrice {
  amount: number
  currency_code: string
}

function getLowestPriceForCurrency(variants: ProductVariant[], currency: string): LowestPrice | null {
  const allPrices = variants.flatMap((v) => v.prices)

  // Try the visitor's currency first; fall back to ZAR.
  const inCurrency = allPrices.filter((p) => p.currency_code === currency)
  if (inCurrency.length > 0) {
    return { amount: Math.min(...inCurrency.map((p) => p.amount)), currency_code: currency }
  }

  const inZar = allPrices.filter((p) => p.currency_code === 'zar')
  if (inZar.length > 0) {
    return { amount: Math.min(...inZar.map((p) => p.amount)), currency_code: 'zar' }
  }

  return null
}

function PriceDisplay({ variants, currency }: { variants: ProductVariant[]; currency: string }) {
  const lowest = getLowestPriceForCurrency(variants, currency)

  if (!lowest) {
    return <span className="text-2xl font-light text-gray-500">Contact us</span>
  }

  const amount = lowest.amount / 100
  const hasMultipleVariants = variants.length > 1
  const prefix = hasMultipleVariants ? 'from ' : ''

  if (lowest.currency_code === 'usd') {
    return (
      <span className="text-2xl font-semibold tracking-tight text-gray-900">
        {prefix}${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </span>
    )
  }

  return (
    <span className="text-2xl font-semibold tracking-tight text-gray-900">
      {prefix}R{amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
    </span>
  )
}

interface ProductCardProps {
  product: MedusaProduct
  index: number
  allCategories?: CategoryNode[]
  defaultCurrency?: string
}

export function ProductCard({ product, index, allCategories = [], defaultCurrency = 'zar' }: ProductCardProps) {
  const { cart } = useCart()
  const currency = cart?.currency_code ?? defaultCurrency

  const badge =
    getRealSpotsBadge(product.handle, product.variants) ??
    getDeliveryBadge(product.handle, product.title)
  // Decision-guidance badge (launch audit item 15) — data-driven, renders
  // nothing unless the product is explicitly flagged (see data/shopHighlights.ts).
  const highlight = getHighlightBadge(product)
  const leafCategory = product.categories[0] ?? null
  const rootCategory = getRootCategory(product.categories, allCategories)

  const productImage =
    product.thumbnail ??
    (leafCategory !== null ? CATEGORY_IMAGE_MAP[leafCategory.handle] : undefined) ??
    (rootCategory !== null ? CATEGORY_IMAGE_MAP[rootCategory.handle] : undefined) ??
    '/images/generated/explore-vitality.webp'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
    >
      <Link href={`/shop/${product.handle}`} className="block group">
        <div className="bg-white rounded-card overflow-hidden border border-gray-100 shadow-sm hover:border-brand-accent hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
          {/* Change 1: aspect-[4/3] instead of aspect-video for taller, more impactful images */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={productImage}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Neutral overlay — starts light (image is vivid), darkens slightly on hover */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-all duration-300" />
            {/* Decision-guidance badge — absolutely positioned over the image so
                unflagged cards keep an identical layout (no shift). */}
            {highlight && (
              <span className="absolute top-3 left-3 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-accent-600 text-white shadow-lg">
                {highlight.label}
              </span>
            )}
          </div>

          <div className="p-6 flex flex-col gap-3">
            {/* Change 2: Show root category name (e.g. "Private Sessions"), not the leaf sub-category */}
            {rootCategory && (
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">
                {rootCategory.name}
              </p>
            )}

            <h3 className="text-xl font-semibold text-brand-primary leading-snug line-clamp-2">
              {product.title}
            </h3>

            <div className="flex items-center justify-between gap-3 mt-1">
              <PriceDisplay variants={product.variants} currency={currency} />
              <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${badge.className}`}>
                {badge.label}
              </span>
            </div>

            {/* Change 6: Stronger, action-oriented CTA */}
            <p className="mt-2 text-sm font-medium text-gray-500 group-hover:text-brand-accent transition-colors duration-300">
              Explore &amp; Enrol →
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
