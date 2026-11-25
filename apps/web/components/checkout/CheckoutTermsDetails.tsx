import Link from 'next/link'
import {
  LIVE_TERMS,
  LIVE_TERMS_INTRO,
  LIVE_TERMS_TITLE,
  MEDIA_TERMS,
  MEDIA_TERMS_TITLE,
  REFUND_TERMS,
  REFUND_TERMS_TITLE,
} from '@/lib/legal/booking-terms'

/**
 * The booking terms, expandable under the checkout tick so the buyer can read
 * them before ticking (Suzanne, 24 Nov 2026: "they can expand it if they want
 * to check it before they tick it"). Same words as /legal/terms 4, 4B and 4C.
 */
export function CheckoutTermsDetails() {
  return (
    <details className="mt-2 ml-7 text-sm text-brand-ink">
      <summary className="cursor-pointer font-medium underline underline-offset-4 hover:text-brand-primary">
        Read the booking terms
      </summary>
      <div className="mt-3 max-h-72 overflow-y-auto p-4 bg-brand-sand border border-brand-border rounded-card space-y-3">
        <p>
          <span className="font-medium">{REFUND_TERMS_TITLE}:</span> {REFUND_TERMS}
        </p>
        <p>
          <span className="font-medium">{MEDIA_TERMS_TITLE}:</span> {MEDIA_TERMS}
        </p>
        <p>
          <span className="font-medium">{LIVE_TERMS_TITLE}:</span> {LIVE_TERMS_INTRO}
        </p>
        <ul className="list-disc list-outside pl-5 space-y-1">
          {LIVE_TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
        <p>
          The full{' '}
          <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Terms and Conditions
          </Link>{' '}
          also cover sessions, cancellations and your account.
        </p>
      </div>
    </details>
  )
}
