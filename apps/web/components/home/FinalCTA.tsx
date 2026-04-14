import Image from 'next/image'
import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section aria-labelledby="finalcta-heading" className="relative py-28 lg:py-36 overflow-hidden">
      {/* Background image — reduced opacity so overlay can reliably carry text */}
      <Image
        src="/images/coaching-bg.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center opacity-30"
      />
      {/* Overlay — two layers: solid base + gradient to ensure centre text area is fully readable */}
      <div className="absolute inset-0 bg-brand-primary/90" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/60 via-transparent to-brand-primary/60" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <h2 id="finalcta-heading" className="text-4xl lg:text-5xl font-display text-white leading-tight">
          Your breakthrough is one conversation away
        </h2>
        <p className="mt-6 text-white/70 text-lg leading-relaxed max-w-xl mx-auto">
          Schedule a complimentary discovery call. No obligation — just clarity on where you are, where you want to be, and whether working together is the right fit.
        </p>
        <Link
          href="/contact"
          className="mt-10 inline-flex items-center justify-center px-10 py-5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-lg rounded-button transition-colors duration-150"
        >
          Book Discovery Call
        </Link>
        <p className="mt-4 text-white/40 text-sm">Complimentary 30-minute session · No obligation</p>
      </div>
    </section>
  )
}
