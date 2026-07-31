import type { Quiz } from './types'
import { nervousSystemQuiz } from './nervous-system'
import { lifeTransitionsQuiz } from './life-transitions'
import { intuitionQuiz } from './intuition'
import { relationshipsQuiz } from './relationships'
import { healthEnergyQuiz } from './health-energy'
import { identityPurposeQuiz } from './identity-purpose'
import { leadershipQuiz } from './leadership'
import { vitalityLongevityQuiz } from './vitality-longevity'

/**
 * Registry of Explore diagnostic quizzes, keyed by topic slug.
 *
 * All 8 topic quizzes are now registered — the dynamic route and QuizFlow
 * component handle any registered slug.
 */
export const quizzes: Record<string, Quiz> = {
  [nervousSystemQuiz.slug]: nervousSystemQuiz,
  [lifeTransitionsQuiz.slug]: lifeTransitionsQuiz,
  [intuitionQuiz.slug]: intuitionQuiz,
  [relationshipsQuiz.slug]: relationshipsQuiz,
  [healthEnergyQuiz.slug]: healthEnergyQuiz,
  [identityPurposeQuiz.slug]: identityPurposeQuiz,
  [leadershipQuiz.slug]: leadershipQuiz,
  [vitalityLongevityQuiz.slug]: vitalityLongevityQuiz,
}

export const quizBySlug = (slug: string): Quiz | undefined => quizzes[slug]
