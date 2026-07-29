import { describe, it, expect } from 'vitest'
import { quizzes } from './index'

// QuizCategory was widened from a 4-value union to `string` so each quiz can
// declare its own categories — that removes the compiler's guarantee that
// `Quiz.categories` and `Quiz.results` stay in sync. This test is the
// runtime guard: every quiz in the registry must have a result entry for
// every category it declares, and every question's category must be one of
// the quiz's declared categories.
describe('quizzes registry', () => {
  for (const [slug, quiz] of Object.entries(quizzes)) {
    describe(slug, () => {
      it('has a result entry for every declared category', () => {
        for (const category of quiz.categories) {
          expect(quiz.results[category], `missing results.${category}`).toBeDefined()
        }
      })

      it('has no orphaned result entries outside its declared categories', () => {
        for (const category of Object.keys(quiz.results)) {
          expect(quiz.categories, `results.${category} has no matching declared category`).toContain(
            category,
          )
        }
      })

      it('every question references a declared category', () => {
        for (const question of quiz.questions) {
          expect(
            quiz.categories,
            `question ${question.id} has unregistered category "${question.category}"`,
          ).toContain(question.category)
        }
      })

      it('has at least one question and one category', () => {
        expect(quiz.questions.length).toBeGreaterThan(0)
        expect(quiz.categories.length).toBeGreaterThan(0)
      })
    })
  }
})
