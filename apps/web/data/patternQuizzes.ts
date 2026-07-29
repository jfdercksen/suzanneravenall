/**
 * Pattern Diagnostic Hub — quiz catalogue.
 *
 * Each entry maps to a native diagnostic quiz at /explore/{topicSlug}/quiz,
 * gated by a name/surname/email capture (see components/quiz/QuizGate.tsx).
 * Quizzes without a registered data file yet (see app/explore/quizzes/index.ts)
 * fall through to that route's "coming soon" screen.
 */

import type { TopicSlug } from '@/app/explore/topics'

export type PatternQuizCategory =
  | 'emotional'
  | 'relationships'
  | 'health'
  | 'identity'
  | 'leadership'
  | 'transitions'
  | 'intuition'
  | 'vitality'

export interface PatternQuiz {
  slug: string
  topicSlug: TopicSlug
  title: string
  question: string
  description: string
  category: PatternQuizCategory
  icon: string
}

export const patternQuizzes: PatternQuiz[] = [
  {
    slug: 'nervous-system',
    topicSlug: 'emotional-nervous-system-mastery',
    title: 'Emotional Mastery & Nervous System',
    question: 'What Nervous System Pattern Is Running Your Life?',
    description: 'Discover how your system responds to stress',
    category: 'emotional',
    icon: '🧠',
  },
  {
    slug: 'relationships',
    topicSlug: 'relationships-attachment-patterns',
    title: 'Relationships & Attachment',
    question: 'What Attachment Pattern Is Shaping Your Relationships?',
    description: 'Understand how you connect and why patterns repeat',
    category: 'relationships',
    icon: '💞',
  },
  {
    slug: 'health-energy',
    topicSlug: 'health-energy-intelligence',
    title: 'Health & Energy Intelligence',
    question: 'Is Stress Rewiring Your Body?',
    description: 'Decode your energy and stress patterns',
    category: 'health',
    icon: '⚡',
  },
  {
    slug: 'identity-purpose',
    topicSlug: 'identity-purpose-activation',
    title: 'Identity & Purpose',
    question: 'What Identity Pattern Is Limiting Your Growth?',
    description: 'Reveal the internal blueprint shaping your life',
    category: 'identity',
    icon: '🧭',
  },
  {
    slug: 'leadership-performance',
    topicSlug: 'leadership-high-performance',
    title: 'Leadership & Performance',
    question: 'What Performance Pattern Is Capping Your Potential?',
    description: "Identify what's limiting your output and leadership",
    category: 'leadership',
    icon: '🎯',
  },
  {
    slug: 'life-transitions',
    topicSlug: 'life-transitions-reinvention',
    title: 'Life Transitions',
    question: 'How Are You Navigating This Life Transition?',
    description: 'Understand where you are and how to move forward',
    category: 'transitions',
    icon: '🌊',
  },
  {
    slug: 'intuition',
    topicSlug: 'intuition-as-patterned-intelligence',
    title: 'Intuition',
    question: 'Is Your Intuition Clear or Distorted?',
    description: 'Learn how you make decisions internally',
    category: 'intuition',
    icon: '✨',
  },
  {
    slug: 'vitality-longevity',
    topicSlug: 'next-level-health-vitality-longevity',
    title: 'Vitality & Longevity',
    question: 'Is Your System Built for Long-Term Performance?',
    description: 'Assess your energy, recovery and sustainability',
    category: 'vitality',
    icon: '🌿',
  },
]

/** The default quiz used for global "not sure where to start" CTAs. */
export const masterPatternQuizUrl = '/explore/emotional-nervous-system-mastery/quiz'

const categoryLabels: Record<PatternQuizCategory, string> = {
  emotional: 'Emotional Mastery',
  relationships: 'Relationships',
  health: 'Health & Energy',
  identity: 'Identity & Purpose',
  leadership: 'Leadership',
  transitions: 'Life Transitions',
  intuition: 'Intuition',
  vitality: 'Vitality & Longevity',
}

export const categoryLabel = (category: PatternQuizCategory): string => categoryLabels[category]