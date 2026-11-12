/**
 * Partner products: listed in the shop, bought on the partner's own site,
 * never through our cart (Suzanne, 12 Nov 2026: "Yes bring it over this is a
 * partner"). The link is kept exactly as it is on her current shop, the
 * affiliate code included, so the partner still credits her.
 *
 * The Medusa product (apps/medusa/src/scripts/shop-changes-2026-11-12.ts)
 * carries the copy and image; the link lives here, in code, so the page never
 * sends a visitor to a URL taken from editable data.
 */

export interface PartnerProduct {
  /** Medusa product handle. */
  handle: string
  partnerName: string
  /** The partner's page, exactly as on the old shop. */
  url: string
  /** The old shop's button text. */
  ctaLabel: string
}

/** rel for every partner link: an affiliate link (sponsored) that opens a new tab. */
export const PARTNER_LINK_REL = 'sponsored noopener'

export const PARTNER_PRODUCTS: readonly PartnerProduct[] = [
  {
    handle: 'brainwave-club',
    partnerName: 'Brainwave Club',
    // https://suzanneravenall.com/wp-json/wc/store/v1/products?slug=brainwave-club (add_to_cart.url), 12 Nov 2026
    url: 'https://jv.brainwave.club/27-jv001-welcome-to-brainwave-club?hop=srav7700',
    ctaLabel: 'Read More',
  },
]

export function partnerProductFor(handle: string): PartnerProduct | undefined {
  return PARTNER_PRODUCTS.find((p) => p.handle === handle)
}
