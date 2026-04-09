const stats = [
  { value: '20+', label: 'Years Experience' },
  { value: '1,000+', label: 'Lives Transformed' },
  { value: '30+', label: 'Countries' },
  { value: 'Dr.', label: 'B.Msc · M.Msc · Msc.D.' },
]

export default function TrustBar() {
  return (
    <section aria-label="Trust indicators" className="bg-brand-primary py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-white/20">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center lg:px-8">
              {/* dt = term/label, dd = value — correct dl semantics */}
              <dd className="text-4xl lg:text-5xl font-light text-white">{value}</dd>
              <dt className="mt-2 text-sm font-medium text-white/60 uppercase tracking-wider">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
