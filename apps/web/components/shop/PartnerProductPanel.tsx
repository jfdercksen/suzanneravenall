import { ExternalLink } from 'lucide-react'
import { PARTNER_LINK_REL, type PartnerProduct } from '@/data/partnerProducts'

/**
 * A partner's product (Suzanne, 12 Nov 2026): clearly marked as a partner
 * product, bought on the partner's site through Suzanne's affiliate link
 * (new tab, rel="sponsored noopener"). It never goes in our cart. A bare <a>
 * on purpose: next/link is for internal pages only.
 */
export function PartnerProductPanel({ partner }: { partner: PartnerProduct }) {
  return (
    <div data-testid="partner-product-panel" className="rounded-card border border-brand-border bg-white p-6 sm:p-8">
      <span className="inline-block mb-4 text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full bg-brand-primary-900 text-white">
        Partner product
      </span>
      <h2 className="text-2xl font-medium tracking-tight text-brand-primary mb-3">From our partner, {partner.partnerName}</h2>
      <p className="text-brand-muted leading-relaxed mb-6">
        {partner.partnerName} is a partner of Dr. Suzanne Ravenall. You buy it on the {partner.partnerName} site, not in
        this shop, and {partner.partnerName} handles your purchase and access.
      </p>
      <a
        href={partner.url}
        target="_blank"
        rel={PARTNER_LINK_REL}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 text-white text-xs uppercase tracking-widest font-medium rounded-button transition-all duration-300"
      >
        {partner.ctaLabel}
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="sr-only">(opens the {partner.partnerName} site in a new tab)</span>
      </a>
    </div>
  )
}
