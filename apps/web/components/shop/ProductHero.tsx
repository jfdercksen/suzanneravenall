'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { MedusaProduct } from '@/types/medusa'

interface ProductHeroProps {
  product: MedusaProduct
}

export function ProductHero({ product }: ProductHeroProps) {
  const primaryCategory = product.categories[0]

  // Extract first sentence from description as transformation promise.
  // Guard against empty-string description — "".concat('.') would render a lone ".".
  const rawSentence = product.description?.split('. ')[0]?.trim().replace(/[.!?]$/, '') ?? ''
  const transformationPromise = rawSentence ? `${rawSentence}.` : 'Transform how you experience life.'

  return (
    <section className="relative w-full min-h-[60vh] flex items-end bg-brand-primary overflow-hidden">
      {/* Background image */}
      {product.thumbnail && (
        <div className="absolute inset-0">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-brand-primary/75" />
        </div>
      )}

      {/* Gradient fallback — always rendered, but hidden when thumbnail is present */}
      {!product.thumbnail && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-800 to-brand-primary-700" />
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/50">
            <li>
              <Link href="/shop" className="text-white/70 hover:text-white transition-colors duration-200">
                Shop
              </Link>
            </li>
            {primaryCategory && (
              <>
                <li aria-hidden="true" className="text-white/30">
                  /
                </li>
                <li>
                  <Link
                    href={`/shop?category=${primaryCategory.handle}`}
                    className="text-white/70 hover:text-white transition-colors duration-200"
                  >
                    {primaryCategory.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true" className="text-white/30">
              /
            </li>
            <li className="text-white/50 truncate max-w-[200px]" aria-current="page">
              {product.title}
            </li>
          </ol>
        </nav>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl lg:text-6xl font-light text-white mb-6 max-w-3xl leading-tight"
        >
          {product.title}
        </motion.h1>

        {/* Transformation promise */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg lg:text-xl text-white/70 max-w-2xl leading-relaxed mb-8"
        >
          {transformationPromise}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm text-white/60 italic"
        >
          Join thousands of clients worldwide
        </motion.p>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
    </section>
  )
}
