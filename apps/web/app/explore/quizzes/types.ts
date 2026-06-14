/**
 * Shared types for the Explore diagnostic quizzes.
 *
 * Quiz 1 (nervous-system) is the template. The other 7 topic quizzes will be
 * added as new data files that satisfy these types and register in ./index.ts.
 */

export type QuizCategory = 'fight' | 'flight' | 'freeze' | 'mixed'

export interface QuizQuestion {
  id: number
  text: string
  category: QuizCategory
}

export interface QuizResult {
  title: string
  subtitle: string
  /** The reflection copy — "MIRROR" section. */
  mirror: string
  /** "WHAT'S REALLY HAPPENING" — the mechanism. */
  mechanism: string
  /** "IMPACT" — what happens if the pattern continues. */
  impact: string[]
  /** "THE SHIFT" — what changes after repatterning. */
  shift: string[]
  /** Primary CTA button label. */
  cta: string
}

export interface Quiz {
  slug: string
  title: string
  subtitle: string
  intro: string
  questions: QuizQuestion[]
  results: Record<QuizCategory, QuizResult>
}
