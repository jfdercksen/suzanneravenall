import type { Quiz } from './types'
import { nervousSystemQuiz } from './nervous-system'

/**
 * Registry of Explore diagnostic quizzes, keyed by topic slug.
 *
 * Only `emotional-nervous-system-mastery` has a quiz today. The other 7 topic
 * quizzes will be added here once their data files are built — the dynamic
 * route and QuizFlow component already handle any registered slug.
 */
export const quizzes: Record<string, Quiz> = {
  [nervousSystemQuiz.slug]: nervousSystemQuiz,
}

export const quizBySlug = (slug: string): Quiz | undefined => quizzes[slug]
