import Link from 'next/link'
import { RichText } from '@/components/shared/RichText'
import { ph, type RichLine } from '@/lib/content/richLine'

/** Suzanne supplies both (listed per owner in the hand-over). */
export const SAFEGUARDING_POLICY: RichLine = [ph('Safeguarding policy document and link', 'Suzanne')]
export const PARENTAL_CONSENT: RichLine = [ph('How parental consent works: who signs, when, and what it covers', 'Suzanne')]

/**
 * Shown on every pathway for minors (Suzanne, 8 Nov, item 7.4): her own
 * "Safeguarding & scope" line, the safeguarding policy, how parental consent
 * works, her credentials, and the scope-of-practice line framing the work as
 * education, coaching and skill building with a referral for clinical needs.
 * The policy and the consent process are hers to supply, so they stay visible
 * placeholders. She asked for this wording to be checked before it goes live.
 */
export function SafeguardingBlock({ line }: { line: RichLine }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
        For Parents
      </p>
      <h2
        id="safeguarding-heading"
        className="text-3xl lg:text-4xl font-medium tracking-tight text-brand-primary leading-tight mb-6"
      >
        Safeguarding &amp; scope
      </h2>
      <p className="text-base lg:text-lg text-brand-muted font-light leading-relaxed mb-10">
        <RichText line={line} />
      </p>
      <dl className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-card border border-brand-border bg-white p-6">
          <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent mb-3">
            Safeguarding policy
          </dt>
          <dd className="text-sm text-brand-muted font-light leading-relaxed">
            <RichText line={SAFEGUARDING_POLICY} />
          </dd>
        </div>
        <div className="rounded-card border border-brand-border bg-white p-6">
          <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent mb-3">
            Parental consent
          </dt>
          <dd className="text-sm text-brand-muted font-light leading-relaxed">
            <RichText line={PARENTAL_CONSENT} />
          </dd>
        </div>
        <div className="rounded-card border border-brand-border bg-white p-6">
          <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent mb-3">
            Credentials
          </dt>
          <dd className="text-sm text-brand-muted font-light leading-relaxed">
            Dr. Suzanne Ravenall is a Certified Family Trauma Specialist (CFTP), a Certified
            Clinical Trauma Specialist (CCTSI) and a Certified Master Behaviour Coach (BSI, UK).{' '}
            <Link
              href="/about"
              className="text-brand-primary underline underline-offset-4 decoration-brand-primary-300 hover:decoration-brand-primary"
            >
              All qualifications
            </Link>
          </dd>
        </div>
        <div className="rounded-card border border-brand-border bg-white p-6">
          <dt className="text-xs uppercase tracking-[0.2em] font-medium text-brand-accent mb-3">
            Scope of practice
          </dt>
          <dd className="text-sm text-brand-muted font-light leading-relaxed">
            This is education, coaching and skill building, not treatment or therapy. Where
            clinical support is needed, we refer on to a registered health professional.
          </dd>
        </div>
      </dl>
    </div>
  )
}
