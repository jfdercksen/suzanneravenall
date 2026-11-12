import Link from 'next/link'
import { getProgramCta, type Program } from '@/data/programs'

/**
 * The shop page of a live programme that has no date and no self-study on
 * sale (Suzanne, 12 Nov 2026): register interest instead of a variant to buy.
 * It names no date and no "soon": none is set. One button per programme the
 * product stands for (the Intuition product holds Personal and Business).
 */
export function RegisterInterestPanel({ programmes }: { programmes: Program[] }) {
  const single = programmes.length === 1
  return (
    <div data-testid="register-interest-panel" className="rounded-card border border-brand-border bg-white p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">Live via Zoom</p>
      <h2 className="text-2xl font-medium tracking-tight text-brand-primary mb-3">Register your interest</h2>
      <p className="text-brand-muted leading-relaxed mb-6">
        {single ? 'This programme runs' : 'These programmes run'} live with Dr. Suzanne Ravenall via Zoom. No dates are
        set yet. Register your interest and Suzanne&apos;s team will contact you when a date is set.
      </p>
      <ul className="flex flex-col gap-3">
        {programmes.map((programme) => (
          <li key={programme.slug} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {!single && <span className="font-medium text-brand-ink">{programme.name}</span>}
            <Link
              href={getProgramCta(programme).href}
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-xs uppercase tracking-widest font-medium rounded-button transition-all duration-300"
            >
              Register Your Interest
              {/* The name is printed beside the button; screen readers hear it in the button too. */}
              {!single && <span className="sr-only">: {programme.name}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-brand-muted">
        {programmes.map((programme, i) => (
          <span key={programme.slug}>
            {i > 0 && ' · '}
            <Link
              href={`/programs/${programme.slug}`}
              className="text-brand-accent hover:text-brand-primary underline underline-offset-4 transition-colors duration-200"
            >
              {single ? 'About the programme' : `About ${programme.name}`}
            </Link>
          </span>
        ))}
      </p>
    </div>
  )
}
