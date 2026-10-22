/**
 * The fixed links in the intake mail (Shayna's template, 21 Oct 2026).
 *
 * RR_INTRO_COURSE_URL: the public page of Thinkific course 1896029 (product
 * 1987025, published, not hidden), read from the Thinkific API on 22 Oct.
 * Her template linked the /manage/ admin URL, which a buyer cannot open.
 */

export const RR_INTRO_COURSE_NAME = 'Rapid Repatterning Session Introduction'
export const RR_INTRO_COURSE_URL =
  'https://ravenallinstitute-9629.thinkific.com/courses/Rapid-Repatterning-Session-Introduction'
export const RR_INTRO_COUPON = 'free22'
export const ZOOM_URL = 'https://zoom.us/j/3603768111'

/** Rapid Repatterning sessions and packages (product handles), not Resonance Repatterning. */
export function isRapidRepatterning(serviceKey: string): boolean {
  return serviceKey.startsWith('rapid-repatterning')
}
