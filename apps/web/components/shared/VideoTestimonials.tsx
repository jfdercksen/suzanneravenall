'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const videos = [
  { id: '8Yw_n8NribA', name: 'Transformation Highlights' },
  { id: 'wPTh5Z8iwwU', name: 'Matheo' },
  { id: 'E4x3YETXHSA', name: 'International Client' },
  { id: 'iHe9dZq1YdY', name: 'Amelia' },
  { id: 'nLrXITVsXz8', name: 'Jayne' },
  { id: 'Gz3NUPWdxAI', name: 'Ivana' },
]

interface VideoTestimonialsProps {
  /** Hide the "View all testimonials" link when the component is rendered on /testimonials itself */
  showViewAllLink?: boolean
}

export default function VideoTestimonials({ showViewAllLink = true }: VideoTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const activeVideo = videos[activeIndex]!

  function selectVideo(index: number) {
    if (index !== activeIndex) {
      setActiveIndex(index)
      setPlaying(false)
    }
  }

  return (
    <section aria-labelledby="video-testimonials-heading" className="bg-white py-14 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
            What Clients Say
          </p>
          <h2 id="video-testimonials-heading" className="text-4xl lg:text-6xl font-light text-brand-primary mb-4">
            Real transformations. Real people.
          </h2>
          <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto">
            Hear directly from clients who have experienced the Rapid Repatterning® process with Suzanne.
          </p>
        </motion.div>

        {/* Featured video — no iframe until user clicks play (privacy-first) */}
        <motion.div
          className="relative aspect-video w-full max-w-4xl mx-auto rounded-card overflow-hidden bg-black mb-8 lg:mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <AnimatePresence mode="wait">
            {playing ? (
              <motion.div
                key={`iframe-${activeIndex}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={`${activeVideo.name}: client testimonial`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </motion.div>
            ) : (
              <motion.button
                key={`thumb-${activeIndex}`}
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ${activeVideo.name} testimonial`}
                className="absolute inset-0 w-full h-full group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={`https://img.youtube.com/vi/${activeVideo.id}/maxresdefault.jpg`}
                  alt={activeVideo.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 896px"
                  className="object-cover"
                  priority={activeIndex === 0}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-brand-accent flex items-center justify-center shadow-[0_0_40px_rgba(23,25,244,0.6)] group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-6 h-6 lg:w-8 lg:h-8 text-white translate-x-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-5 pt-16">
                  <p className="text-white font-medium text-sm lg:text-base">{activeVideo.name}</p>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Thumbnail strip — parent handles entrance; each button controls its own opacity via animate */}
        <motion.div
          role="radiogroup"
          aria-label="Video testimonials"
          className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-6 lg:gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {videos.map((video, i) => (
            <motion.button
              key={video.id}
              type="button"
              onClick={() => selectVideo(i)}
              role="radio"
              aria-label={`Watch ${video.name}`}
              aria-checked={i === activeIndex}
              className={`relative flex-none w-40 lg:w-auto aspect-video rounded-sm overflow-hidden transition-shadow duration-300 ${
                i === activeIndex
                  ? 'ring-2 ring-brand-accent ring-offset-2 ring-offset-white'
                  : ''
              }`}
              animate={{ opacity: i === activeIndex ? 1 : 0.5 }}
              whileHover={{ opacity: i === activeIndex ? 1 : 0.8 }}
              transition={{ duration: 0.25 }}
            >
              <Image
                src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                alt={video.name}
                fill
                sizes="(max-width: 1024px) 160px, 16vw"
                className="object-cover"
              />

              {/* Small play icon */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  i === activeIndex ? 'bg-brand-accent' : 'bg-white/80'
                }`}>
                  <svg
                    className={`w-3 h-3 translate-x-px ${i === activeIndex ? 'text-white' : 'text-gray-800'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Name label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6">
                <p className="text-white text-xs font-medium truncate">{video.name}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* View all link — hidden on /testimonials where the component is embedded */}
        {showViewAllLink && (
          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-medium text-brand-accent hover:text-brand-accent-700 transition-colors duration-300"
            >
              View all testimonials <span aria-hidden="true">&rarr;</span>
            </Link>
          </motion.div>
        )}

      </div>
    </section>
  )
}
