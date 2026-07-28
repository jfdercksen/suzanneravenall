/**
 * Explore topic → Pattern Diagnostic quiz mapping.
 *
 * Suzanne's CTA flow (27 Jul 2026): on every explore topic page the FIRST
 * step is that topic's pattern quiz, the SECOND step is a discovery call.
 * Quiz slugs live in data/patternQuizzes.ts — the mapping is close to the
 * explore topic slugs but not 1:1, so it is made explicit here.
 */

import { patternQuizzes, type PatternQuiz } from '@/data/patternQuizzes'
import type { TopicSlug } from '@/app/explore/topics'

const topicToQuizSlug: Record<TopicSlug, string> = {
  'emotional-nervous-system-mastery': 'nervous-system',
  'relationships-attachment-patterns': 'relationships',
  'next-level-health-vitality-longevity': 'vitality-longevity',
  'health-energy-intelligence': 'health-energy',
  'identity-purpose-activation': 'identity-purpose',
  'leadership-high-performance': 'leadership-performance',
  'life-transitions-reinvention': 'life-transitions',
  'intuition-as-patterned-intelligence': 'intuition',
}

/** Per-topic quiz CTA labels. Relationships wording is Suzanne's exact copy. */
const quizCtaLabels: Record<TopicSlug, string> = {
  'emotional-nervous-system-mastery': 'Take the Nervous System Pattern Scan',
  'relationships-attachment-patterns': 'Take the Attachment Pattern Scan',
  'next-level-health-vitality-longevity': 'Take the Vitality Pattern Scan',
  'health-energy-intelligence': 'Take the Health & Energy Pattern Scan',
  'identity-purpose-activation': 'Take the Identity Pattern Scan',
  'leadership-high-performance': 'Take the Performance Pattern Scan',
  'life-transitions-reinvention': 'Take the Life Transitions Pattern Scan',
  'intuition-as-patterned-intelligence': 'Take the Intuition Pattern Scan',
}

/** The topic's quiz from the canonical catalogue, or undefined if unmapped. */
export function getTopicQuiz(slug: TopicSlug): PatternQuiz | undefined {
  return patternQuizzes.find((quiz) => quiz.slug === topicToQuizSlug[slug])
}

/** The quiz CTA button label for a topic. Falls back to the hub wording. */
export function getTopicQuizLabel(slug: TopicSlug): string {
  return quizCtaLabels[slug] ?? 'Take the Free Pattern Scan'
}
