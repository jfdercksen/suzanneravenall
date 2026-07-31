/**
 * Explore topic → Transformation Pathway CTA mapping.
 *
 * Source: Suzanne's "mapping buttons" email (15 Apr 2026) to Wynand. Each
 * topic's primary pathway CTA reads "Start [Pathway Name]" and links to that
 * pathway's detail page; the secondary session CTA always routes to the
 * Rapid Repatterning private session, per her instruction that session links
 * "all go to rapid repatterning."
 */

import type { TopicSlug } from '@/app/explore/topics'
import type { PathwaySlug } from '@/data/pathways'

export interface TopicPathwayMapping {
  pathwaySlug: PathwaySlug
  pathwayCtaLabel: string
  sessionCtaLabel: string
}

const RAPID_REPATTERNING_HREF = '/services/private-sessions/rapid-repatterning'

const topicPathwayMap: Record<TopicSlug, TopicPathwayMapping> = {
  'emotional-nervous-system-mastery': {
    pathwaySlug: 'resilience-fortification',
    pathwayCtaLabel: 'Start Resilience & Fortification',
    sessionCtaLabel: 'Nervous System Reset Session',
  },
  'relationships-attachment-patterns': {
    pathwaySlug: 'reclaim-your-power',
    pathwayCtaLabel: 'Start Reclaim Your Power',
    sessionCtaLabel: 'Relationship Repatterning Session',
  },
  'health-energy-intelligence': {
    pathwaySlug: 'trauma-to-breakthrough',
    pathwayCtaLabel: 'Start Trauma to Breakthrough',
    sessionCtaLabel: 'Health Pattern Reset Session',
  },
  'identity-purpose-activation': {
    pathwaySlug: 'upgrade-your-operating-system',
    pathwayCtaLabel: 'Start Upgrade Your Operating System',
    sessionCtaLabel: 'Identity Upgrade Session',
  },
  'leadership-high-performance': {
    pathwaySlug: 'pattern-mastery',
    pathwayCtaLabel: 'Start Pattern Mastery',
    sessionCtaLabel: 'Performance Strategy Session',
  },
  'life-transitions-reinvention': {
    pathwaySlug: 'reinvent-your-life',
    pathwayCtaLabel: 'Start Reinvent Your Life',
    sessionCtaLabel: 'Reinvention Reset Session',
  },
  'intuition-as-patterned-intelligence': {
    pathwaySlug: 'break-the-loop',
    pathwayCtaLabel: 'Start Break the Loop',
    sessionCtaLabel: 'Intuition Calibration Session',
  },
  'next-level-health-vitality-longevity': {
    pathwaySlug: 'resilience-fortification',
    pathwayCtaLabel: 'Start Resilience & Fortification',
    sessionCtaLabel: 'Vitality & Longevity Optimisation Session',
  },
}

export const getTopicPathwayMapping = (slug: TopicSlug): TopicPathwayMapping =>
  topicPathwayMap[slug]

export const RAPID_REPATTERNING_SESSION_HREF = RAPID_REPATTERNING_HREF
