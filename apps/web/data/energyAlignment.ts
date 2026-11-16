/**
 * Energy Clearing is now Energy Alignment & Optimisation (Suzanne, 12 Nov
 * 2026: "Re energy - yes please"). Her spelling from her 12 Nov document:
 * British "Optimisation", the ampersand, and the trademark on the first use
 * on a page, as the site marks Rapid Repatterning® and Pattern Intelligence™.
 *
 * Only visible names changed. The ids keep the old name on purpose, so orders,
 * access and the sale guard keep working (KI116): series and membership track
 * 'energy-clearing', Medusa handles, SKUs, category handles, Thinkific ids.
 */
export const EAO_NAME = 'Energy Alignment & Optimisation'

/** The name with its trademark, for the first use on a page. */
export const EAO_MARKED = `${EAO_NAME}™`

/** Her one-line description of the programme (12 Nov document). */
export const EAO_STRAPLINE = "Aligning the body's energy systems for coherence, capacity and performance."

/** A name without the trademark, for later uses on a page that already carries it. */
export function withoutTrademark(text: string): string {
  return text.replaceAll('™', '')
}
