'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

// Underline for the emphasised words of a header headline. Kept here so every
// page draws it the same way (white at 60%, never a colour).
export const HEADER_UNDERLINE =
  'underline decoration-white/60 decoration-2 underline-offset-8 sm:underline-offset-[10px]'

type PageHeaderProps = {
  /** Heading id; the section is labelled by it. */
  id: string
  /** Short signpost label. Never one that repeats the logo. */
  eyebrow?: string
  title: ReactNode
  /** One paragraph at most. Anything more belongs below the header. */
  description?: ReactNode
  /** Photo behind the header. Give either image or video. */
  image?: string
  /** Looping background video; poster is the still shown until it plays. */
  video?: { src: string; poster: string }
  /** object-position for the 320px phone crop, e.g. 'object-[30%_50%]'.
   *  Pass a literal class string: Tailwind only generates classes it can see
   *  written out in source, so a value built at runtime will not apply. */
  mobileCrop?: string
  /** 'right' puts the text in a right-hand column from sm, for pictures whose
   *  subject stands on the left of the frame (AboutHero is the example). */
  align?: 'left' | 'right'
  /** CTA row: white fill for the main action, white outline for the rest. */
  children?: ReactNode
}

// HEADER RULE (.claude/rules/design-rules.md) for inner pages, the template
// Johan approved on the 15 Sep design canvas. The picture is the header: it
// shows at full strength and the text sits on a black band at its bottom
// edge. Below sm the picture takes the top 320px and the text sits on black
// beneath it, so nothing covers a face. components/home/Hero.tsx and
// components/about/AboutHero.tsx are full-screen versions of the same rule.
export function PageHeader({
  id,
  eyebrow,
  title,
  description,
  image,
  video,
  mobileCrop = 'object-center',
  align = 'left',
  children,
}: PageHeaderProps) {
  const mediaClass = `object-cover ${mobileCrop} sm:object-center`

  return (
    <section
      aria-labelledby={id}
      className="relative flex flex-col justify-end bg-brand-primary-900 sm:min-h-[560px] lg:min-h-[640px] overflow-hidden"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-80 sm:h-full">
        {video ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={video.poster}
            className={`absolute inset-0 w-full h-full ${mediaClass}`}
          >
            <source src={video.src} type="video/mp4" />
          </video>
        ) : image ? (
          <Image src={image} alt="" fill priority sizes="100vw" className={mediaClass} />
        ) : null}
      </div>

      {/* Scrim attached to the text band only: a fade from clear to black/65,
          then black/65 to black/85 behind the text. Below sm the fade runs to
          the section ground exactly where the 320px picture ends (224 + 96). */}
      <div className="relative z-10 pt-56 sm:pt-0">
        <div aria-hidden="true" className="h-24 lg:h-32 bg-gradient-to-t from-brand-primary-900 sm:from-black/65 to-transparent" />
        <div className="bg-gradient-to-t from-black/85 to-black/65">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-20 lg:pb-24">
            {/* Right-aligned headers use the AboutHero column: narrow on
                tablets so its left edge clears the subject. */}
            <div className={align === 'right' ? 'sm:ml-auto sm:max-w-md lg:max-w-2xl' : undefined}>
              {eyebrow && (
                <motion.p
                  {...fadeUp(0)}
                  className="text-white/80 text-xs font-medium tracking-[0.25em] uppercase mb-4"
                >
                  {eyebrow}
                </motion.p>
              )}

              <motion.h1
                id={id}
                {...fadeUp(0.15)}
                className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.05] [text-wrap:balance]"
              >
                {title}
              </motion.h1>

              {description && (
                <motion.p
                  {...fadeUp(0.3)}
                  className="mt-4 lg:mt-5 text-sm sm:text-base lg:text-lg text-white/85 max-w-xl"
                >
                  {description}
                </motion.p>
              )}

              {children && (
                <motion.div
                  {...fadeUp(0.45)}
                  className="mt-6 lg:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3"
                >
                  {children}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
