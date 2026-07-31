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
    // A question's category should always be one of quiz.categories (and thus
    // already a key in `scores`), but fall back to 0 rather than corrupt the
    // tally with NaN if a quiz's data ever drifts out of sync.
    scores[question.category] = (scores[question.category] ?? 0) + (answers[question.id] ?? 0)
  }

  if (quiz.categories.length === 0) {
    throw new Error(`computeResult: quiz "${quiz.slug}" declares no categories`)
  }

  return quiz.categories.reduce<QuizCategory>(
    (best, category) => ((scores[category] ?? 0) >= (scores[best] ?? 0) ? category : best),
    // Safe: quiz.categories.length === 0 is checked above, so index 0 exists.
    quiz.categories[0]!
  )
}
