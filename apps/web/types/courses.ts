/**
 * Online course (Medusa "Programmes" collection product) shape used by the
 * /programs Online Courses section. Defined here so the Server Component page
 * and the client section can share it without importing across the boundary.
 */
export interface Course {
  id: string
  handle: string
  title: string
  description: string | null
  /** metadata.category from Medusa, e.g. "resonance-repatterning" | "bundle" */
  category: string
  prices: Array<{ currency_code: string; amount: number }>
}
