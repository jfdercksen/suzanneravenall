/**
 * Transformation Pathways — typed catalogue.
 *
 * `description` is the card copy from docs/content-source/pathways-overview-cards.md.
 * `detail` (optional) carries the full pathway page content supplied by Suzanne in
 * docs/content-source/pathways/{slug}.md — a tagline plus overview paragraphs —
 * present only where `hasDetailContent` is true.
 *
 * Two pathways have no supplied detail content yet and keep the coming-soon
 * fallback on their detail pages:
 * - `reclaim-your-power` — its source page is an "under construction" stub
 * - `young-minds-architecture` — the old WordPress source URL 404s
 *
 * `groupPathways` are the upcoming Group Transformation Pathways (immersions)
 * currently in development — cards only, no detail pages yet.
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
  /** Short positioning line shown under "About This Pathway". */
  tagline: string
  /** Overview paragraphs, in order, from the supplied pathway brief. */
  overview: string[]
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
      tagline:
        'Recognising and interrupting the repeating patterns that keep you stuck.',
      overview: [
        'Many people experience recurring situations in life that seem to repeat no matter how much effort they make to change them.',
        'This pathway focuses on identifying the deeper emotional and behavioural patterns behind these cycles so that they can be understood, interrupted, and ultimately transformed.',
      ],
    },
  },
  {
    slug: 'reclaim-your-power',
    title: 'Reclaim Your Power',
    description:
      'Reconnect with your inner authority, reduce self-sabotage, and strengthen intentional action.',
    category: 'personal',
    featured: false,
    // The source page for this pathway is still an "under construction" stub —
    // no detail content has been supplied yet.
    hasDetailContent: false,
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
      tagline: 'Creating a new internal foundation for the next chapter of your life.',
      overview: [
        'There are seasons in life when change is no longer optional and something deeper needs to shift.',
        'This transformation pathway is designed to help you move beyond old limitations, re-evaluate the structures shaping your life, and begin building a more aligned, empowered future.',
      ],
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
      tagline:
        'Installing a new mindset architecture for clarity, growth and transformation.',
      overview: [
        'Many of the beliefs, reactions, and emotional responses we operate from were installed years ago and may no longer serve the life we want to create.',
        'This transformation pathway focuses on identifying outdated mental and emotional programming and replacing it with a stronger, more supportive internal operating system that aligns with your goals and future vision.',
        'Through this process you begin building a mindset structure that supports growth, resilience, and forward momentum.',
      ],
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
      tagline: 'A future bigger than survival. Rewrite your future.',
      overview: [
        'Many people carry experiences that shaped their lives in powerful ways. While survival strategies may have helped at the time, they can later become patterns that hold life in place.',
        'This transformation pathway focuses on understanding how past experiences influence present behaviour, emotional responses, and personal identity.',
        'Through guided exploration and pattern recognition, the goal is to move beyond simply coping with the past and begin building a future that is larger than survival.',
      ],
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
      tagline:
        'Building inner steadiness, emotional strength, and a stronger foundation for life.',
      overview: [
        'Life can place constant pressure on the mind, emotions, and nervous system, making it difficult to stay grounded and steady through challenge.',
        'This transformation pathway is designed to strengthen resilience from the inside out, helping you build greater emotional capacity, clearer responses, and a more fortified sense of self.',
        'The work focuses on creating internal stability so that you are not only able to recover from difficulty, but also move through life with greater confidence, adaptability, and strength.',
      ],
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
      tagline:
        'Moving beyond awareness into deeper pattern recognition, rewiring, and personal mastery.',
      overview: [
        'Many people begin by recognising the patterns that shape their emotions, behaviours, and decisions — but lasting transformation requires more than awareness alone.',
        'This transformation pathway is designed to help deepen your understanding of recurring internal patterns and strengthen your ability to work with them consciously and effectively.',
        'The focus is on developing greater self-leadership, emotional insight, and the capacity to respond differently, so that patterns no longer run life automatically.',
      ],
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
      tagline:
        'Supporting strong emotional foundations, healthy development, and lifelong inner stability.',
      overview: [
        'The early years of life shape how children and young people understand themselves, respond to challenges, and build confidence in the world around them.',
        'This transformation pathway is designed to support stronger emotional foundations, helping young people develop resilience, self-awareness, and healthier internal patterns from an early stage.',
        'The focus is on creating a steadier base for growth so that children and young people can move forward with greater confidence, emotional wellbeing, and a stronger sense of self.',
      ],
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
      tagline:
        'Helping young people understand, regulate, and navigate their emotional world with confidence.',
      overview: [
        'Young people today face increasing emotional pressure from school, social environments, and the rapidly changing world around them.',
        'This pathway focuses on helping young minds develop a deeper understanding of their emotions while building the tools needed to respond to challenges in a healthier and more balanced way.',
        'By strengthening emotional awareness and resilience early in life, young people can develop stronger confidence, clearer thinking, and greater stability as they grow.',
      ],
    },
  },
  {
    slug: 'young-minds-architecture',
    title: 'Young Minds Architecture',
    description:
      'Strengthen the inner structures that support resilience, identity, confidence, and empowered thinking.',
    category: 'youth',
    featured: false,
    // No live source page exists for this pathway (the old WordPress URL 404s) —
    // no detail content has been supplied yet.
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
      tagline:
        'Introducing the foundations of pattern awareness and how our internal patterns shape behaviour and choices.',
      overview: [
        'From an early age people begin developing patterns that influence how they think, respond emotionally, and interact with the world around them.',
        'This pathway focuses on helping individuals understand the foundations of these patterns, creating awareness of how beliefs, experiences, and emotional responses begin to shape behaviour.',
        'By recognising these foundations early, individuals can begin building healthier internal frameworks that support growth, resilience, and more empowered choices in life.',
      ],
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
      tagline:
        'Strengthening self-trust, personal direction, and the ability to navigate life with clarity.',
      overview: [
        'Many people move through life influenced by external expectations, pressure, or uncertainty about what direction to take.',
        'This pathway focuses on helping individuals reconnect with their internal guidance system — the inner compass that supports confident decision making and authentic choices.',
        "By strengthening self-awareness and trust in one's internal direction, individuals can begin navigating life with greater clarity, alignment, and confidence.",
      ],
    },
  },
]

// ── Group Transformation Pathways (in development) ─────────────────────────
// Upcoming group immersions — Suzanne is still writing the full programmes,
// so these carry only the honest cohort-format framing. No detail pages yet.

export interface GroupPathway {
  id: string
  title: string
  description: string
}

export const groupPathways: GroupPathway[] = [
  {
    id: '3-day-immersion',
    title: '3-Day Immersion',
    description:
      'A focused three-day group immersion in a live cohort, guided by Suzanne throughout.',
  },
  {
    id: '8-week-immersion',
    title: '8-Week Immersion',
    description:
      'An eight-week group cohort journey with live guidance from Suzanne along the way.',
  },
  {
    id: '12-week-immersion',
    title: '12-Week Immersion',
    description:
      'A twelve-week group cohort immersion, guided live by Suzanne from start to finish.',
  },
  {
    id: '12-month-immersion',
    title: '12-Month Immersion',
    description:
      'A year-long group cohort immersion with sustained live guidance from Suzanne.',
  },
]

export const personalPathways = pathways.filter((p) => p.category === 'personal')
export const youthPathways = pathways.filter((p) => p.category === 'youth')

export const pathwayBySlug = (slug: string): Pathway | undefined =>
  pathways.find((p) => p.slug === slug)

export const featuredPathway = pathways.find((p) => p.featured)

export const categoryLabel = (category: PathwayCategory): string =>
  category === 'youth' ? 'Young People Pathway' : 'Personal Pathway'
