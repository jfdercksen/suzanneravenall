import type { Quiz, QuizCategory } from '@/app/explore/quizzes/types'

/**
 * Dominant pattern: sum each category's answered values, highest score wins.
 * Ties resolve to the LAST category in `quiz.categories` (put the
 * "balanced/no dominant pattern" catch-all result last when authoring a quiz).
 *
 * Used both client-side (QuizFlow, for the instant on-screen result) and
 * server-side (/api/quiz/complete, which re-derives the result rather than
 * trusting the client's value).
 */
export function computeResult(quiz: Quiz, answers: Record<number, number>): QuizCategory {
  const scores: Record<QuizCategory, number> = Object.fromEntries(
    quiz.categories.map((category) => [category, 0])
  )

  for (const question of quiz.questions) {
    scores[question.category] += answers[question.id] ?? 0
  }

  return quiz.categories.reduce<QuizCategory>(
    (best, category) => (scores[category] >= scores[best] ? category : best),
    quiz.categories[0]
  )
}
