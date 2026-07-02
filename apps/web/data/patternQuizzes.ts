/**
 * Pattern Diagnostic Hub — quiz catalogue.
 *
 * Each entry maps to an external ScoreApp quiz. No quiz logic lives in this
 * repo — these are outbound links that open in a new tab.
 */

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
  title: string
  question: string
  description: string
  scoreAppUrl: string
  category: PatternQuizCategory
  icon: string
}

export const patternQuizzes: PatternQuiz[] = [
  {
    slug: 'nervous-system',
    title: 'Emotional Mastery & Nervous System',
    question: 'What Nervous System Pattern Is Running Your Life?',
    description: 'Discover how your system responds to stress',
    scoreAppUrl: 'https://suzanne-jym5givl.scoreapp.com',
    category: 'emotional',
    icon: '🧠',
  },
  {
    slug: 'relationships',
    title: 'Relationships & Attachment',
    question: 'What Attachment Pattern Is Shaping Your Relationships?',
    description: 'Understand how you connect and why patterns repeat',
    scoreAppUrl: 'https://suzanne-2cndcdzh.scoreapp.com',
    category: 'relationships',
    icon: '💞',
  },
  {
    slug: 'health-energy',
    title: 'Health & Energy Intelligence',
    question: 'Is Stress Rewiring Your Body?',
    description: 'Decode your energy and stress patterns',
    scoreAppUrl: 'https://suzanne-zziobqap.scoreapp.com',
    category: 'health',
    icon: '⚡',
  },
  {
    slug: 'identity-purpose',
    title: 'Identity & Purpose',
    question: 'What Identity Pattern Is Limiting Your Growth?',
    description: 'Reveal the internal blueprint shaping your life',
    scoreAppUrl: 'https://suzanne-60gx8k3c.scoreapp.com',
    category: 'identity',
    icon: '🧭',
  },
  {
    slug: 'leadership-performance',
    title: 'Leadership & Performance',
    question: 'What Performance Pattern Is Capping Your Potential?',
    description: "Identify what's limiting your output and leadership",
    scoreAppUrl: 'https://suzanne-xgdzwxdj.scoreapp.com',
    category: 'leadership',
    icon: '🎯',
  },
  {
    slug: 'life-transitions',
    title: 'Life Transitions',
    question: 'How Are You Navigating This Life Transition?',
    description: 'Understand where you are and how to move forward',
    scoreAppUrl: 'https://suzanne-vvbqjb24.scoreapp.com',
    category: 'transitions',
    icon: '🌊',
  },
  {
    slug: 'intuition',
    title: 'Intuition',
    question: 'Is Your Intuition Clear or Distorted?',
    description: 'Learn how you make decisions internally',
    scoreAppUrl: 'https://suzanne-nxih3hok.scoreapp.com',
    category: 'intuition',
    icon: '✨',
  },
  {
    slug: 'vitality-longevity',
    title: 'Vitality & Longevity',
    question: 'Is Your System Built for Long-Term Performance?',
    description: 'Assess your energy, recovery and sustainability',
    scoreAppUrl: 'https://suzanne-jcwf0faw.scoreapp.com',
    category: 'vitality',
    icon: '🌿',
  },
]

/** The default quiz used for global "not sure where to start" CTAs — same URL as the nervous-system entry above. */
export const masterPatternQuizUrl = 'https://suzanne-jym5givl.scoreapp.com'

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