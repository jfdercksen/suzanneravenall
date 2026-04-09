import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative min-h-[90vh] lg:min-h-screen flex items-end lg:items-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />

      {/* Gradient overlay — strong left, fades right so image shows */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/90 via-brand-primary/65 to-brand-primary/20" />
      {/* Bottom fade for text legibility on mobile */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/80 via-transparent to-transparent lg:hidden" />

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 pb-20 lg:pb-0 pt-32 lg:pt-0">
          <p className="text-brand-accent text-xs font-semibold uppercase tracking-widest mb-5">
            Transformation Coaching · Neuro-Repatterning®
          </p>
          <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-[4.5rem] font-light text-white leading-[1.08] max-w-2xl lg:max-w-3xl">
            Unlock your most extraordinary self
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-white/80 max-w-lg font-light leading-relaxed">
            Break the patterns. Rewrite the story. Become unstoppable.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-150 text-center"
            >
              Book Discovery Call
            </Link>
            <Link
              href="/#lead-magnet"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/50 hover:border-white text-white font-semibold rounded-button transition-colors duration-150 text-center"
            >
              Free Masterclass
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
