// NOTE: the `color` field below uses full Tailwind class strings (not interpolated).
// Tailwind's JIT scanner requires complete class names — never build them dynamically.
const testimonials = [
  {
    quote: "In three sessions I dismantled a self-sabotage pattern I'd carried for 30 years. My business doubled in the following six months.",
    name: 'Sarah M.',
    title: 'CEO, Cape Town',
    result: 'Revenue doubled in 6 months',
    initials: 'SM',
    color: 'bg-brand-accent',
  },
  {
    quote: "Dr. Suzanne's Neuro-Repatterning® method is unlike anything I've experienced. The shift was immediate and it has lasted.",
    name: 'James T.',
    title: 'Executive Director, Johannesburg',
    result: 'Leadership transformation',
    initials: 'JT',
    color: 'bg-brand-primary-700',
  },
  {
    quote: "I came in sceptical. Within weeks I had clarity I hadn't felt in years and landed a partnership I'd been chasing for two years.",
    name: 'Priya K.',
    title: 'Entrepreneur, Durban',
    result: 'Landed 7-figure partnership',
    initials: 'PK',
    color: 'bg-brand-primary-600',
  },
]

export default function TestimonialsSection() {
  return (
    <section aria-labelledby="testimonials-heading" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-brand-accent text-xs font-semibold uppercase tracking-widest mb-3">
            Client Results
          </p>
          <h2 id="testimonials-heading" className="text-3xl lg:text-4xl font-semibold text-brand-primary">
            Real people. Real breakthroughs.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(({ quote, name, title, result, initials, color }) => (
            <figure
              key={name}
              className="relative flex flex-col bg-gray-50 rounded-card p-8 shadow-card"
            >
              {/* Quote mark */}
              <div className="text-brand-accent/20 text-8xl font-serif leading-none select-none absolute top-4 left-6">&ldquo;</div>

              <blockquote className="relative text-gray-700 text-base leading-relaxed flex-1 mt-4">
                {quote}
              </blockquote>

              {/* figcaption contains attribution — result badge and author info together */}
              <figcaption className="mt-6">
                <div className="inline-flex items-center gap-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-none" />
                  <span className="text-brand-accent text-xs font-semibold uppercase tracking-wide">
                    {result}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {/* Avatar — initials placeholder until real client photos are provided */}
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center flex-none`}>
                    <span className="text-white text-sm font-semibold">{initials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-brand-primary text-sm">{name}</p>
                    <p className="text-gray-500 text-xs">{title}</p>
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
