'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { MedusaProduct } from '@/types/medusa'

interface ProductHeroProps {
  product: MedusaProduct
}

// HEADER RULE (.claude/rules/design-rules.md), laid out like
// components/shared/PageHeader.tsx: the picture shows at full strength and the
// text sits on a black band at its bottom edge. Below sm the picture takes the
// top 320px and the text sits on black beneath it. Kept inline rather than on
// PageHeader because the breadcrumb has no slot there.
export function ProductHero({ product }: ProductHeroProps) {
  const primaryCategory = product.categories[0]

  // Extract first sentence from description as transformation promise.
  // Guard against empty-string description — "".concat('.') would render a lone ".".
  const rawSentence = product.description?.split('. ')[0]?.trim().replace(/[.!?]$/, '') ?? ''
  const transformationPromise = rawSentence ? `${rawSentence}.` : 'Transform how you experience life.'

  return (
    <section className="relative flex flex-col justify-end w-full bg-brand-primary-900 sm:min-h-[560px] lg:min-h-[640px] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-80 sm:h-full">
        {/* Background image */}
        {product.thumbnail && (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}

        {/* Photo fallback: dark heroes must be imagery-backed, never flat colour */}
        {!product.thumbnail && (
          <Image
            src="/images/hero-bg-suzanne-ravenall.jpg"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      {/* Scrim attached to the text band only: a fade from clear to black/65,
          then black/65 to black/85 behind the text. Below sm the fade runs to
          the section ground exactly where the 320px picture ends (224 + 96). */}
      <div className="relative z-10 w-full pt-56 sm:pt-0">
        <div aria-hidden="true" className="h-24 lg:h-32 bg-gradient-to-t from-brand-primary-900 sm:from-black/65 to-transparent" />
        <div className="bg-gradient-to-t from-black/85 to-black/65">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-20 lg:pb-24">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/80">
                <li>
                  <Link href="/shop" className="text-white/80 hover:text-white transition-colors duration-200">
                    Shop
                  </Link>
                </li>
                {primaryCategory && (
                  <>
                    <li aria-hidden="true" className="text-white/50">
                      /
                    </li>
                    <li>
                      <Link
                        href={`/shop?category=${primaryCategory.handle}`}
                        className="text-white/80 hover:text-white transition-colors duration-200"
                      >
                        {primaryCategory.name}
                      </Link>
                    </li>
                  </>
                )}
                <li aria-hidden="true" className="text-white/50">
                  /
                </li>
                <li className="text-white/80 truncate max-w-[200px]" aria-current="page">
                  {product.title}
                </li>
              </ol>
            </nav>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.05] [text-wrap:balance]"
            >
              {product.title}
            </motion.h1>

            {/* Transformation promise */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-4 lg:mt-5 text-sm sm:text-base lg:text-lg text-white/85 max-w-xl"
            >
              {transformationPromise}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4 text-sm text-white/70 italic"
            >
              Join thousands of clients worldwide
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}
