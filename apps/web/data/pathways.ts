/**
 * Transformation Pathways — typed catalogue.
 *
 * `description` is the card copy from docs/content-source/pathways-overview-cards.md.
 * `detail` (optional) is paraphrased tagline/objective copy from the individual
 * stub pages in docs/content-source/pathways/{slug}.md — present only where
 * `hasDetailContent` is true. `young-minds-architecture` has no live source page
 * (the old WordPress URL 404s), so it carries no detail content.
 */

export type PathwaySlug =
  | 'break-the-loop'
  | 'reclaim-your-power'
  | 'reinvent-your-life'
  | 'upgrade-your-operating-system'
  | 'trauma-to-breakthrough'
  | 'resilience-fortification'
  | 'pattern-mastery'
  | 'children-young-people-foundations-for-life'
  | 'emotional-mastery-for-young-minds'
  | 'young-minds-architecture'
  | 'pattern-foundations'
  | 'inner-compass'

export type PathwayCategory = 'personal' | 'youth'

export interface PathwayDetail {
  tagline: string
  objective: string
}

export interface Pathway {
  slug: PathwaySlug
  title: string
  description: string
  category: PathwayCategory
  featured: boolean
  hasDetailContent: boolean
  detail?: PathwayDetail
}

export const pathways: Pathway[] = [
  // ── Personal pathways ───────────────────────────────────────────────────
  {
    slug: 'break-the-loop',
    title: 'Break the Loop',
    description:
      'Interrupt recurring cycles, increase awareness, and begin shifting long-standing internal patterns.',
    category: 'personal',
    featured: true,
    hasDetailContent: true,
    detail: {
      tagline: 'Recognise and interrupt the patterns that keep you cycling back to the same place.',
      objective:
        'This pathway surfaces the deeper emotional and behavioural patterns driving recurring situations, so they can be understood, interrupted and ultimately changed.',
    },
  },
  {
    slug: 'reclaim-your-power',
    title: 'Reclaim Your Power',
    description:
      'Reconnect with your inner authority, reduce self-sabotage, and strengthen intentional action.',
    category: 'personal',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Step back into your own authority.',
      objective:
        'A pathway for reconnecting with your inner authority, easing self-sabotage and strengthening intentional, self-directed action. Fuller content is being prepared.',
    },
  },
  {
    slug: 'reinvent-your-life',
    title: 'Reinvent Your Life',
    description:
      'Create a new internal architecture for the next chapter of your life with clarity and direction.',
    category: 'personal',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Build a new internal foundation for the next chapter of your life.',
      objective:
        'When change is no longer optional, this pathway helps you move past old limits, re-examine the structures shaping your life, and build a more aligned and empowered future.',
    },
  },
  {
    slug: 'upgrade-your-operating-system',
    title: 'Upgrade Your Operating System',
    description:
      'Challenge outdated internal programming and install stronger patterns for growth and resilience.',
    category: 'personal',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Install a new mindset architecture for clarity, growth and momentum.',
      objective:
        'Many of your beliefs and automatic responses were installed years ago. This pathway helps you identify outdated mental and emotional programming and replace it with an internal operating system that supports your goals.',
    },
  },
  {
    slug: 'trauma-to-breakthrough',
    title: 'Trauma to Breakthrough',
    description:
      'A future bigger than survival. Move toward healing, expansion, and a reimagined future.',
    category: 'personal',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'A future bigger than survival. Rewrite what comes next.',
      objective:
        'Survival strategies that once protected you can later hold life in place. This pathway explores how past experience shapes present behaviour and identity, helping you move from coping to building a future larger than survival.',
    },
  },
  {
    slug: 'resilience-fortification',
    title: 'Resilience & Fortification',
    description:
      'Build emotional steadiness, capacity, and inner strength for navigating challenge with clarity.',
    category: 'personal',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Build inner steadiness and strength from the inside out.',
      objective:
        'Constant pressure can make it hard to stay grounded. This pathway strengthens emotional capacity, clearer responses and a more fortified sense of self, so you recover from difficulty and meet challenge with confidence.',
    },
  },
  {
    slug: 'pattern-mastery',
    title: 'Pattern Mastery',
    description:
      'Move beyond awareness into mastery by learning to recognise, rewire, and lead your patterns.',
    category: 'personal',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Move from awareness into mastery of your patterns.',
      objective:
        'Recognising your patterns is only the start. This pathway deepens your understanding of recurring internal patterns and builds your ability to work with them consciously, developing self-leadership and the capacity to respond differently.',
    },
  },

  // ── Youth pathways ──────────────────────────────────────────────────────
  {
    slug: 'children-young-people-foundations-for-life',
    title: 'Children & Young People Foundations for Life',
    description:
      'Support stronger foundations for emotional wellbeing, self-development, and healthy internal growth.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Strong emotional foundations for healthy, lifelong growth.',
      objective:
        'The early years shape how young people understand themselves and meet challenges. This pathway supports stronger emotional foundations, resilience and self-awareness, giving children a steadier base to grow from.',
    },
  },
  {
    slug: 'emotional-mastery-for-young-minds',
    title: 'Emotional Mastery for Young Minds',
    description:
      'Develop emotional awareness, self-regulation, and confidence in navigating the inner world.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Help young people navigate their emotional world with confidence.',
      objective:
        'Young people face rising emotional pressure from school, social life and a fast-changing world. This pathway builds emotional awareness and the tools to respond to challenge in healthier, more balanced ways.',
    },
  },
  {
    slug: 'young-minds-architecture',
    title: 'Young Minds Architecture',
    description:
      'Strengthen the inner structures that support resilience, identity, confidence, and empowered thinking.',
    category: 'youth',
    featured: false,
    hasDetailContent: false,
  },
  {
    slug: 'pattern-foundations',
    title: 'Pattern Foundations',
    description:
      'Introduce pattern awareness early so young people can understand how thoughts and beliefs shape behaviour.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Introduce pattern awareness early in life.',
      objective:
        'From an early age we develop patterns that influence how we think, feel and respond. This pathway builds early awareness of how beliefs and experiences shape behaviour, so healthier internal frameworks can form.',
    },
  },
  {
    slug: 'inner-compass',
    title: 'Inner Compass',
    description:
      'Strengthen self-trust, direction, and the ability to make grounded choices from within.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      tagline: 'Strengthen self-trust and a clear sense of direction.',
      objective:
        'Many people move through life shaped by outside expectations and uncertainty. This pathway helps reconnect with an internal guidance system, strengthening self-awareness and trust so choices feel clearer and more aligned.',
    },
  },
]

export const personalPathways = pathways.filter((p) => p.category === 'personal')
export const youthPathways = pathways.filter((p) => p.category === 'youth')

export const pathwayBySlug = (slug: string): Pathway | undefined =>
  pathways.find((p) => p.slug === slug)

export const featuredPathway = pathways.find((p) => p.featured)

export const categoryLabel = (category: PathwayCategory): string =>
  category === 'youth' ? 'Young People Pathway' : 'Personal Pathway'
