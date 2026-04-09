import Image from 'next/image'
import Link from 'next/link'

export default function AboutTeaser() {
  return (
    <section aria-labelledby="about-heading" className="py-20 lg:py-28 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image — left on desktop */}
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-card overflow-hidden shadow-card-hover">
              <Image
                src="/images/suzanne-casual.jpg"
                alt="Dr. Suzanne Ravenall"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>
            {/* Floating credential badge */}
            <div className="absolute -bottom-4 -right-4 lg:-right-8 bg-brand-primary text-white rounded-card p-4 shadow-card-hover">
              <p className="text-xs text-white/60 uppercase tracking-wider mb-0.5">Academic credentials</p>
              <p className="font-semibold text-sm">B.Msc · M.Msc · Msc.D.</p>
            </div>
          </div>

          {/* Text — right on desktop */}
          <div className="lg:pl-4">
            <p className="text-brand-accent text-xs font-semibold uppercase tracking-widest mb-4">
              About Dr. Suzanne
            </p>
            <h2 id="about-heading" className="text-3xl lg:text-4xl font-semibold text-brand-primary leading-tight">
              Science-backed coaching with a track record of real results
            </h2>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Dr. Suzanne Ravenall developed Neuro-Repatterning® after two decades of clinical study and thousands of hours with private clients across four continents. Her methodology targets the childhood brain patterns that sabotage adult success — and dissolves them at the root.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              The result is not motivation. It is permanent, measurable change.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-150"
              >
                Meet Suzanne
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-semibold rounded-button transition-colors duration-150"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
