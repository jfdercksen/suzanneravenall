'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ProductVariant {
  id: string
  title: string
  prices: Array<{ currency_code: string; amount: number }>
}

interface MedusaProduct {
  id: string
  handle: string
  title: string
  description: string | null
  thumbnail: string | null
  variants: ProductVariant[]
  categories: Array<{ id: string; handle: string; name: string }>
  collection: { id: string; handle: string; title: string } | null
}

interface DeliveryBadge {
  label: string
  className: string
}

function getDeliveryBadge(handle: string, title: string): DeliveryBadge {
  const text = `${handle} ${title}`.toLowerCase()

  if (text.includes('live-via-zoom') || text.includes(' live')) {
    return { label: 'Live', className: 'bg-brand-accent/20 text-brand-accent border border-brand-accent' }
  }
  if (text.includes('self-study') || text.includes('self-paced')) {
    return { label: 'Self Paced', className: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' }
  }
  if (text.includes('in-person')) {
    return { label: 'In-Person', className: 'bg-amber-900/40 text-amber-400 border border-amber-700' }
  }
  if (text.includes('recorded')) {
    return { label: 'Recorded', className: 'bg-purple-900/40 text-purple-400 border border-purple-800' }
  }

  return { label: 'Session', className: 'bg-gray-800 text-gray-300' }
}

function getLowestZarPrice(variants: ProductVariant[]): number | null {
  const zarPrices = variants
    .flatMap((v) => v.prices)
    .filter((p) => p.currency_code === 'zar')
    .map((p) => p.amount)

  if (zarPrices.length === 0) return null

  return Math.min(...zarPrices)
}

function PriceDisplay({ variants }: { variants: ProductVariant[] }) {
  const lowestCents = getLowestZarPrice(variants)

  if (lowestCents === null) {
    return <span className="text-2xl font-light text-white/60">Contact us</span>
  }

  const rands = lowestCents / 100
  const hasMultipleVariants = variants.length > 1
  const formatted = new Intl.NumberFormat('en-ZA').format(rands)

  return (
    <span className="text-2xl font-light text-white">
      {hasMultipleVariants ? 'from ' : ''}R{formatted}
    </span>
  )
}

interface ProductCardProps {
  product: MedusaProduct
  index: number
}

export function ProductCard({ product, index }: ProductCardProps) {
  const badge = getDeliveryBadge(product.handle, product.title)
  const primaryCategory = product.categories[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
    >
      <Link href={`/shop/${product.handle}`} className="block group">
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-white/5 hover:border-brand-accent hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={product.thumbnail ?? '/images/shop/placeholder.jpg'}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-opacity duration-500" />
          </div>

          <div className="p-6 flex flex-col gap-3">
            {primaryCategory && (
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">
                {primaryCategory.name}
              </p>
            )}

            <h3 className="text-xl font-semibold text-white leading-snug line-clamp-2">
              {product.title}
            </h3>

            <div className="flex items-center justify-between gap-3 mt-1">
              <PriceDisplay variants={product.variants} />
              <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${badge.className}`}>
                {badge.label}
              </span>
            </div>

            <p className="mt-2 text-sm font-medium text-white/50 group-hover:text-brand-accent transition-colors duration-300">
              View Programme →
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
