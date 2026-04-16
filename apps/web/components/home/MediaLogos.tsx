'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const logos = [
  { src: '/logos/media/women-magazine.png',      alt: 'Women Magazine' },
  { src: '/logos/media/africa-investor.png',     alt: 'Africa Investor' },
  { src: '/logos/media/ceo-magazine.png',        alt: 'CEO Magazine' },
  { src: '/logos/media/entrepreneur.png',        alt: 'Entrepreneur Magazine' },
  { src: '/logos/media/media-5.png',             alt: '' },
  { src: '/logos/media/media-6.png',             alt: '' },
  { src: '/logos/media/media-7.png',             alt: '' },
  { src: '/logos/media/media-8.png',             alt: '' },
  { src: '/logos/media/media-9.png',             alt: '' },
  { src: '/logos/media/media-10.png',            alt: '' },
  { src: '/logos/media/media-11.png',            alt: '' },
  { src: '/logos/media/business-excellence.png', alt: 'Business Excellence Awards' },
]

// Split into two rows for the mobile two-row layout
const row1 = logos.slice(0, 6)
const row2 = logos.slice(6)

interface LogoStripProps {
  items: typeof logos
  reverse?: boolean
  size?: 'sm' | 'lg'
}

function LogoStrip({ items, reverse = false, size = 'sm' }: LogoStripProps) {
  // Duplicate for seamless loop — the -50% keyframe relies on the strip being exactly 2× the natural width
  const doubled = [...items, ...items]
  const animClass = reverse ? 'animate-logo-scroll-reverse' : 'animate-logo-scroll'
  const itemClass = size === 'lg'
    ? 'flex-shrink-0 h-12 w-36 relative'
    : 'flex-shrink-0 h-10 w-28 relative'
  const gapClass = size === 'lg' ? 'gap-14' : 'gap-10'
  const imgSizes = size === 'lg' ? '144px' : '112px'

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
            className="object-contain brightness-0 invert opacity-70"
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
}

export default function MediaLogos({
  id,
  quote = '\u201cWhen in doubt, make a fool of yourself. There is a microscopically thin line between being brilliantly creative and acting like the most gigantic idiot on earth. So what the hell, leap.\u201d',
  quoteAttribution = 'Cynthia Heimel',
}: MediaLogosProps) {
  return (
    <section id={id} aria-label="As seen in media" className="bg-gray-950 py-16">

      {/* Quote */}
      <motion.blockquote
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: 'easeOut' as const }}
        className="text-center max-w-3xl mx-auto px-4 mb-12"
      >
        <p className="text-white/70 text-base md:text-lg font-light italic leading-relaxed">
          {quote}
        </p>
        <footer className="mt-3 text-white/40 text-sm tracking-widest uppercase not-italic">
          — {quoteAttribution}
        </footer>
      </motion.blockquote>

      {/* "As seen on" label */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
        className="max-w-7xl mx-auto px-4 mb-6"
      >
        <p className="text-center text-xs font-medium tracking-[0.3em] uppercase text-white/50">
          As seen on
        </p>
      </motion.div>

      {/*
        Edge fade masks — overflow-hidden + CSS mask are combined in .logo-ticker-fade.
        Wider gradient stop (12%/88%) ensures the fade is perceptible.
      */}
      <div className="logo-ticker-fade">
        {/* Mobile: two rows scrolling in opposite directions */}
        <div className="flex flex-col gap-8 lg:hidden">
          <LogoStrip items={row1} />
          <LogoStrip items={row2} reverse />
        </div>

        {/* Desktop: single larger row with all logos */}
        <div className="hidden lg:block">
          <LogoStrip items={logos} size="lg" />
        </div>
      </div>
    </section>
  )
}
