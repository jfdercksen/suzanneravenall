const areas = [
  {
    label: 'Mindset',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3z" />
      </svg>
    ),
  },
  {
    label: 'Relationships',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: 'Business',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    label: 'Health',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: 'Leadership',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

export default function FocusAreas() {
  return (
    <section aria-labelledby="focus-heading" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-brand-accent text-xs font-semibold uppercase tracking-widest mb-3">
            Areas of Focus
          </p>
          <h2 id="focus-heading" className="text-3xl lg:text-4xl font-semibold text-brand-primary">
            Every area of your life, transformed
          </h2>
        </div>

        {/* Horizontal scroll on mobile, grid on lg */}
        <div className="flex gap-6 overflow-x-auto pb-4 lg:pb-0 lg:grid lg:grid-cols-5 lg:overflow-visible snap-x snap-mandatory">
          {areas.map(({ label, icon }) => (
            <div
              key={label}
              className="flex-none w-40 lg:w-auto snap-center flex flex-col items-center gap-4 p-6 rounded-card border border-gray-100 hover:border-brand-accent/30 hover:shadow-card transition-all duration-200 group cursor-default"
            >
              <div className="text-brand-primary group-hover:text-brand-accent transition-colors duration-200">
                {icon}
              </div>
              <span className="text-sm font-semibold text-brand-primary tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
