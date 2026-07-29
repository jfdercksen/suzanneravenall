import type { Quiz } from './types'
import { nervousSystemQuiz } from './nervous-system'
import { lifeTransitionsQuiz } from './life-transitions'

/**
 * Registry of Explore diagnostic quizzes, keyed by topic slug.
 *
 * The other 6 topic quizzes will be added here once their data files are
 * built — the dynamic route and QuizFlow component already handle any
 * registered slug.
 */
export const quizzes: Record<string, Quiz> = {
  [nervousSystemQuiz.slug]: nervousSystemQuiz,
  [lifeTransitionsQuiz.slug]: lifeTransitionsQuiz,
}

export const quizBySlug = (slug: string): Quiz | undefined => quizzes[slug]
