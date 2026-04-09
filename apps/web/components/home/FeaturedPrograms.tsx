import Image from 'next/image'
import Link from 'next/link'

const programs = [
  {
    title: 'Breakthrough Intensive',
    subtitle: '3-Day Private Immersion',
    description: 'Three days of deep 1:1 work to uncover and dissolve the core pattern driving every obstacle in your life.',
    price: 'From R15,000',
    image: '/images/suzanne-casual.jpg',
    href: '/services',
    badge: 'Most Powerful',
  },
  {
    title: 'Group Transformation',
    subtitle: '8-Week Live Program',
    description: 'A structured 8-week journey with a small cohort. Weekly live sessions, community support, and lasting change.',
    price: 'From R4,500',
    image: '/images/group-coaching.jpg',
    href: '/services',
    badge: 'Most Popular',
  },
  {
    title: 'Practitioner Certification',
    subtitle: 'Professional Licensing',
    description: 'Become a certified Neuro-Repatterning® practitioner. Learn the methodology. Build your coaching practice.',
    price: 'From R18,000',
    image: '/images/program-feature.png',
    href: '/services',
    badge: null,
  },
]

export default function FeaturedPrograms() {
  return (
    <section aria-labelledby="programs-heading" className="py-20 lg:py-28 bg-brand-primary">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-brand-accent text-xs font-semibold uppercase tracking-widest mb-3">
            Featured Programs
          </p>
          <h2 id="programs-heading" className="text-3xl lg:text-4xl font-semibold text-white">
            The fastest path to your breakthrough
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map(({ title, subtitle, description, price, image, href, badge }) => (
            <div
              key={title}
              className="group relative bg-brand-primary-800 rounded-card overflow-hidden hover:shadow-card-hover transition-shadow duration-300 flex flex-col"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary-800 to-transparent" />
                {badge && (
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-accent text-white text-xs font-semibold uppercase tracking-wide">
                      {badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-brand-accent text-xs font-semibold uppercase tracking-wider mb-1">{subtitle}</p>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-white/60 text-sm leading-relaxed flex-1">{description}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-white font-semibold">{price}</span>
                  <Link
                    href={href}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-700 text-white font-semibold text-sm rounded-button transition-colors duration-150"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
