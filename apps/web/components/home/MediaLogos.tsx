'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const logos = [
  { src: '/logos/media/women-magazine.png',                      alt: 'Women Magazine' },
  { src: '/logos/media/africa-investor.png',                     alt: 'Africa Investor' },
  { src: '/logos/media/ceo-magazine.png',                        alt: 'CEO Magazine' },
  { src: '/logos/media/entrepreneur.png',                        alt: 'Entrepreneur Magazine' },
  { src: '/logos/media/sabc.png',                                alt: 'SABC' },
  { src: '/logos/media/sunday-times.png',                        alt: 'Sunday Times' },
  { src: '/logos/media/the-start.png',                           alt: 'The Start' },
  { src: '/logos/media/engineering-news-mining-weekly.png',      alt: 'Engineering News & Mining Weekly' },
  { src: '/logos/media/global-100-2020.png',                     alt: 'Global 100' },
  { src: '/logos/media/herald-international-tribune.png',        alt: 'Herald International Tribune' },
  { src: '/logos/media/top-women-in-business-and-government.png', alt: 'Top Women in Business and Government' },
  { src: '/logos/media/business-excellence.png',                 alt: 'Business Excellence Awards' },
]

// Split into two rows for the mobile two-row layout
const row1 = logos.slice(0, 6)
const row2 = logos.slice(6)

type Tone = 'dark' | 'light'

interface LogoStripProps {
  items: typeof logos
  reverse?: boolean
  size?: 'sm' | 'lg'
  tone?: Tone
}

function LogoStrip({ items, reverse = false, size = 'sm', tone = 'dark' }: LogoStripProps) {
  // Duplicate for seamless loop — the -50% keyframe relies on the strip being exactly 2× the natural width
  const doubled = [...items, ...items]
  const animClass = reverse ? 'animate-logo-scroll-reverse' : 'animate-logo-scroll'
  const itemClass = size === 'lg'
    ? 'flex-shrink-0 h-12 w-36 relative'
    : 'flex-shrink-0 h-10 w-28 relative'
  const gapClass = size === 'lg' ? 'gap-14' : 'gap-10'
  const imgSizes = size === 'lg' ? '144px' : '112px'
  const logoClass = tone === 'light'
    ? 'object-contain brightness-0 opacity-55'
    : 'object-contain brightness-0 invert opacity-70'

  // No overflow-hidden here — the parent masked wrapper handles clipping+fading
  return (
    <div className={`${animClass} flex ${gapClass} w-max`}>
      {doubled.map(({ src, alt }, i) => (
        <div key={`${src}-${i}`} aria-hidden={alt === '' ? true : undefined} className={itemClass}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={imgSizes}
            className={logoClass}
          />
        </div>
      ))}
    </div>
  )
}

interface MediaLogosProps {
  id?: string
  quote?: string
  quoteAttribution?: string
  /** 'dark' (default) keeps the dark warm-ink band; 'light' renders the
   *  Tony-Robbins-style press band on a light background. */
  tone?: Tone
}

export default function MediaLogos({
  id,
  quote = '“Decode the Pattern. Unlock Your Potential.”',
  quoteAttribution = 'Dr. Suzanne Ravenall',
  tone = 'dark',
}: MediaLogosProps) {
  const isLight = tone === 'light'

  return (
    <section
      id={id}
      aria-label="As seen in media"
      className={isLight ? 'bg-brand-sand py-16 border-y border-brand-border' : 'bg-brand-primary-900 py-16'}
    >

      {/* Quote */}
      <motion.blockquote
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.8, ease: 'easeOut' as const }}
        className="text-center max-w-3xl mx-auto px-4 mb-12"
      >
        <p className={`text-base lg:text-lg font-light italic leading-relaxed ${isLight ? 'text-brand-primary' : 'text-white/80'}`}>
          {quote}
        </p>
        <footer className={`mt-3 text-sm tracking-widest uppercase not-italic ${isLight ? 'text-brand-muted' : 'text-white/60'}`}>
          {quoteAttribution}
        </footer>
      </motion.blockquote>

      {/* "As seen on" label */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
        className="max-w-7xl mx-auto px-4 mb-6"
      >
        <p className={`text-center text-xs font-medium tracking-[0.3em] uppercase ${isLight ? 'text-brand-muted' : 'text-white/70'}`}>
          As seen in
        </p>
      </motion.div>

      {/*
        Edge fade masks — overflow-hidden + CSS mask are combined in .logo-ticker-fade.
        Wider gradient stop (12%/88%) ensures the fade is perceptible.
      */}
      <div className="logo-ticker-fade">
        {/* Mobile: two rows scrolling in opposite directions */}
        <div className="flex flex-col gap-8 lg:hidden">
          <LogoStrip items={row1} tone={tone} />
          <LogoStrip items={row2} reverse tone={tone} />
        </div>

        {/* Desktop: single larger row with all logos */}
        <div className="hidden lg:block">
          <LogoStrip items={logos} size="lg" tone={tone} />
        </div>
      </div>
    </section>
  )
}
