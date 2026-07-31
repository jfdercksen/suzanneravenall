/**
 * Transformation Pathways — typed catalogue.
 *
 * `description` is the card copy from docs/content-source/pathways-overview-cards.md.
 * `detail` carries the full pathway page content supplied by Suzanne in
 * "Transformation Pathways Website Pages response 1" (full-page brief covering
 * every pathway). Present only where `hasDetailContent` is true.
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
  /** Hero subhead — the one-line framing shown under the pathway title. */
  heroSubhead: string
  /**
   * Primary hero CTA label (adult pathways only, e.g. "Find My Pattern").
   * Omit for youth pathways — the hero then shows a single "Book a Discovery
   * Session" button instead of two.
   */
  heroCtaPrimaryLabel?: string
  /** Where the primary hero CTA links. Defaults to /contact when omitted. */
  heroCtaPrimaryHref?: string
  /** "What This Pathway Is" paragraphs, in order. */
  whatThisPathwayIs: string[]
  /** "Who It's For" bullet list. */
  whoItsFor: string[]
  /** "What We Work On" bullet list. */
  whatWeWorkOn: string[]
  /** "Outcomes" bullet list. */
  outcomes: string[]
  /** Short punchy quote block, shown after Outcomes (adult pathways only). */
  signatureMessage?: string[]
  /** Closing CTA section headline (adult pathways only). */
  ctaSectionHeadline?: string
  /** Closing CTA section body copy. */
  ctaSectionBody: string
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
      heroSubhead:
        'When the same pattern keeps showing up in a different disguise, it is no longer bad luck. It is a loop.',
      heroCtaPrimaryLabel: 'Find My Pattern',
      heroCtaPrimaryHref: '/discover-your-pattern',
      whatThisPathwayIs: [
        'If you keep ending up in the same emotional pain, the same relationship dynamic, the same self-sabotage, the same fear, or the same stop-start cycle, this pathway is designed to help you interrupt the pattern at its root and create a new way forward.',
        'Break the Loop is for people who are exhausted by repetition.',
        'You may look successful on the outside, but inside you know something keeps pulling you back into the same emotional, behavioural, or energetic pattern. You may overthink, overgive, shut down, people-please, procrastinate, react, collapse, repeat toxic relationships, or keep rebuilding your confidence from scratch.',
        'This pathway helps you identify the hidden pattern underneath the behaviour, understand where it began, and repattern it so you can stop living the same experience on repeat.',
      ],
      whoItsFor: [
        'You keep repeating the same pattern in relationships, work, money, or health',
        'You know what to do, but cannot seem to do it consistently',
        'You feel trapped in cycles of self-sabotage, fear, overgiving, or emotional overwhelm',
        'You are tired of insight without lasting change',
        'You want to get to the root cause, not just manage symptoms',
      ],
      whatWeWorkOn: [
        'Identify the hidden loop driving the behaviour',
        'Uncover the unconscious beliefs and emotional imprints beneath it',
        'Understand the role of your nervous system, past adaptation, and pattern repetition',
        'Release the old pattern at root level',
        'Install a new internal response that supports freedom, choice, and momentum',
      ],
      outcomes: [
        'Recognise your pattern before it takes over',
        'Respond differently instead of repeating automatically',
        'Feel less hooked, reactive, and emotionally trapped',
        'Build new choices into everyday life',
        'Create real movement where you used to feel stuck',
      ],
      signatureMessage: [
        'You are not broken.',
        'You are patterned.',
        'And patterns can be changed.',
      ],
      ctaSectionHeadline: 'Ready to stop repeating what you have already outgrown?',
      ctaSectionBody:
        'Break the Loop helps you interrupt the unconscious pattern and create a new future from a new internal blueprint.',
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
      heroSubhead: 'Come back to yourself.',
      heroCtaPrimaryLabel: 'Start My Journey',
      whatThisPathwayIs: [
        'If life, relationships, trauma, loss, criticism, or years of over-adapting have left you disconnected from your voice, your truth, your confidence, or your boundaries, this pathway helps you rebuild from the inside out.',
        'Reclaim Your Power is about returning to the parts of you that got buried under survival.',
        'So many people live far away from themselves. They are capable, caring, and functional, but underneath they feel invisible, uncertain, emotionally hijacked, afraid to disappoint others, or disconnected from their own authority.',
        'This pathway helps you restore inner safety, self-trust, emotional strength, and the ability to choose yourself without guilt.',
      ],
      whoItsFor: [
        'You struggle with boundaries, self-worth, or speaking up',
        'You often abandon yourself to keep the peace',
        'You feel drained by people, situations, or emotional demands',
        'You have lost confidence in your own voice, intuition, or decision-making',
        'You want to feel strong, clear, and grounded again',
      ],
      whatWeWorkOn: [
        'Rebuilding self-trust and inner authority',
        'Healing the patterns that taught you to shrink, perform, fix, or disappear',
        'Strengthening your emotional range and nervous system regulation',
        'Reconnecting you to your needs, truth, and direction',
        'Developing practical life tools for boundaries, difficult conversations, and self-leadership',
      ],
      outcomes: [
        'Feel more anchored in yourself',
        'Say yes and no with greater clarity',
        'Stop leaking energy into guilt, fear, and over-responsibility',
        'Trust your own judgement again',
        'Show up with more confidence, calm, and personal authority',
      ],
      signatureMessage: [
        'Power is not force.',
        'Power is self-connection, self-trust, and the courage to stop abandoning yourself.',
      ],
      ctaSectionHeadline: 'Ready to come home to yourself?',
      ctaSectionBody:
        'Reclaim Your Power helps you rebuild the inner foundation that changes everything outside you.',
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
      heroSubhead: 'When the old life no longer fits, this is where the new one begins.',
      heroCtaPrimaryLabel: 'Begin My Reinvention',
      whatThisPathwayIs: [
        'For the person standing at a crossroads, after loss, burnout, divorce, career change, empty nest, identity shift, or a deep inner knowing that the life you built is no longer the life you are meant to live.',
        'Reinvent Your Life is designed for seasons of transition.',
        'Sometimes life changes because you chose it. Sometimes it changes because it forced you to. Either way, there comes a point when your old identity, old structures, old patterns, and old survival strategies can no longer carry the future you are here to build.',
        'This pathway helps you let go of what no longer fits, rewire the patterns that keep you tied to the past, and create a new identity, direction, and life architecture that is aligned with who you are becoming.',
      ],
      whoItsFor: [
        'You are in a major life transition or identity shift',
        'You feel lost, stuck, or uncertain about what comes next',
        'You know something has to change, but you do not know how to move forward',
        'You want to stop rebuilding from pain and start creating from possibility',
        'You are ready for a new chapter, but need support to step into it fully',
      ],
      whatWeWorkOn: [
        'Releasing old identities, roles, and emotional attachments',
        'Understanding the patterns that kept your life organised around survival or limitation',
        'Clarifying what you want now and who you need to become to hold it',
        'Repatterning internal beliefs and behaviours to match the next chapter',
        'Building a stronger, truer foundation for the life ahead',
      ],
      outcomes: [
        'Feel clearer about who you are now',
        'Stop clinging to what is over',
        'Reconnect to purpose, possibility, and direction',
        'Make stronger decisions with less fear',
        'Create a life that reflects your growth, not your past',
      ],
      signatureMessage: [
        'Reinvention is not about becoming someone else.',
        'It is about becoming more fully who you were always meant to be.',
      ],
      ctaSectionHeadline: 'Ready to begin again with intention?',
      ctaSectionBody:
        'Reinvent Your Life helps you move from ending to emergence, with clarity, courage, and a new internal blueprint.',
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
      heroSubhead:
        'A new mindset is not enough if the system underneath it is still wired for the old you.',
      heroCtaPrimaryLabel: 'Upgrade My Inner System',
      whatThisPathwayIs: [
        'This pathway is for people who are ready for a true internal upgrade, rewiring the beliefs, emotional responses, mental habits, and subconscious patterns that shape performance, relationships, confidence, and results.',
        'Your operating system is the internal code running your life.',
        'It shapes what you believe is possible, how you respond under pressure, what you tolerate, how you relate, how you perform, and what you unconsciously create again and again.',
        'If your mindset says one thing but your deeper wiring says another, your results will keep following the deeper code.',
        'This pathway helps you identify the outdated internal programs you are still running and install a more aligned, more powerful, more future-ready system.',
      ],
      whoItsFor: [
        'You want to think, feel, and perform at a higher level',
        'You know your internal wiring is limiting your results',
        'You are ready to shift beliefs, habits, emotional defaults, and self-concept',
        'You want lasting change, not surface-level motivation',
        'You are building a new chapter and need a stronger internal foundation to hold it',
      ],
      whatWeWorkOn: [
        'Identifying outdated mental and emotional programming',
        'Rewiring limiting beliefs, identity structures, and behavioural defaults',
        'Installing stronger inner responses for confidence, clarity, consistency, and action',
        'Aligning subconscious patterns with conscious goals',
        'Creating a mindset and nervous system that support the life you want to build',
      ],
      outcomes: [
        'Feel less internally conflicted',
        'Access more consistency, focus, and emotional control',
        'Think and choose from a more empowered identity',
        'Build habits and patterns that support the future you want',
        'Move from coping to consciously creating',
      ],
      signatureMessage: [
        'You do not rise by wishful thinking.',
        'You rise by upgrading the system that runs your life.',
      ],
      ctaSectionHeadline: 'Ready for a full internal upgrade?',
      ctaSectionBody:
        'Upgrade Your Operating System helps you install a new way of thinking, feeling, and functioning, from the inside out.',
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
      heroSubhead:
        'This pathway is for those who have lived in survival mode for too long, and know there must be more than just getting through the day.',
      heroCtaPrimaryLabel: 'Begin My Healing Journey',
      whatThisPathwayIs: [
        'Trauma changes more than how you feel. It can shape your nervous system, identity, relationships, self-worth, choices, and expectations of life.',
        'This pathway is not about forcing positivity over pain. It is about safely understanding the patterns survival created, gently repatterning what trauma wired into the system, and building a future that is no longer organised around fear, collapse, hypervigilance, or emotional pain.',
        'This is the movement from survival to selfhood. From pain to possibility. From coping to breakthrough.',
      ],
      whoItsFor: [
        'You have experienced trauma, chronic stress, emotional pain, or overwhelming life experiences',
        'You feel stuck in survival patterns even when life looks "fine" on the outside',
        'You struggle with fear, shutdown, hypervigilance, overwhelm, or deep emotional triggers',
        'You want healing that is deep, practical, compassionate, and future-focused',
        'You are ready to build a life that is not defined by what happened to you',
      ],
      whatWeWorkOn: [
        'Understanding how trauma shaped your current patterns and responses',
        'Expanding emotional capacity and nervous system safety',
        'Identifying and shifting the adaptations created to survive',
        'Releasing trauma-linked beliefs, emotional charges, and internal survival codes',
        'Rebuilding identity, self-trust, hope, and future orientation',
      ],
      outcomes: [
        'Feel safer in your body and inner world',
        'Experience fewer automatic survival responses',
        'Understand yourself with more compassion and less shame',
        'Rebuild trust, resilience, and emotional stability',
        'Move toward a future that feels larger than your past',
      ],
      signatureMessage: [
        'What happened to you may have shaped your survival.',
        'It does not have to shape your future.',
      ],
      ctaSectionHeadline: 'Ready to move beyond survival?',
      ctaSectionBody:
        'Trauma to Breakthrough helps you repattern pain at the root and build a future that feels safe, strong, and truly yours.',
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
      heroSubhead:
        'This pathway helps you become less easily knocked over by stress, challenge, pressure, uncertainty, and the emotional demands of life, while becoming more grounded, adaptable, and internally equipped.',
      heroCtaPrimaryLabel: 'Build My Resilience',
      whatThisPathwayIs: [
        'Resilience is more than bouncing back. It is the ability to stay connected to yourself under pressure, recover faster, think more clearly, and meet life without collapsing into old patterns.',
        'Fortification means building the inner strength, emotional range, nervous system capacity, and practical life skills that help you handle life better.',
        'This pathway is for people who want to feel stronger, steadier, and more capable in the face of everyday life as well as major challenge.',
      ],
      whoItsFor: [
        'You feel easily overwhelmed by stress or uncertainty',
        'You want to become emotionally stronger and more adaptable',
        'You are managing a lot and want better tools to handle life well',
        'You want to build lasting capacity, not just recover from crises',
        'You want a stronger internal foundation for work, family, leadership, or personal wellbeing',
      ],
      whatWeWorkOn: [
        'Expanding your window of tolerance and emotional capacity',
        'Strengthening nervous system regulation and recovery',
        'Building practical life skills for stress, pressure, communication, and challenge',
        'Identifying the patterns that weaken you under pressure',
        'Fortifying mindset, identity, and behavioural responses for everyday resilience',
      ],
      outcomes: [
        'Stay steadier under pressure',
        'Recover more quickly from emotional setbacks',
        'Feel less reactive and more resourceful',
        'Handle difficult situations with more skill and calm',
        'Build a deeper sense of strength, stability, and trust in yourself',
      ],
      signatureMessage: [
        'Life may not get lighter overnight.',
        'But you can become stronger in the way you meet it.',
      ],
      ctaSectionHeadline: 'Ready to build a stronger inner foundation?',
      ctaSectionBody:
        'Resilience & Fortification helps you create the emotional strength and practical capacity to handle life with greater ease and power.',
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
      heroSubhead:
        'Pattern Mastery is for those who are ready to go beyond fixing symptoms and learn how patterns truly shape thoughts, emotions, behaviours, relationships, performance, and outcomes.',
      heroCtaPrimaryLabel: 'Explore Pattern Mastery',
      whatThisPathwayIs: [
        'Everything repeats until it is understood.',
        'Pattern Mastery is a deeper level pathway for people who want to understand the architecture beneath their life. It brings awareness to the unconscious structures that organise experience, how you think, choose, relate, protect, perform, collapse, succeed, avoid, and recreate the familiar.',
        'This pathway is not only about healing. It is about mastery. It is about learning to read your patterns, interrupt them consciously, and create a more intentional internal and external life.',
      ],
      whoItsFor: [
        'You want to understand yourself at a deeper level',
        'You are ready for advanced inner work and transformation',
        'You keep noticing repeating emotional, behavioural, or life themes',
        'You are fascinated by the root causes of human behaviour and change',
        'You want tools for self-awareness, self-leadership, and lasting transformation',
      ],
      whatWeWorkOn: [
        'Identifying recurring personal patterns and survival strategies',
        'Understanding childhood adaptations, subconscious beliefs, and emotional coding',
        'Learning how patterns shape results across relationships, work, health, and purpose',
        'Developing the ability to catch and shift patterns in real time',
        'Building mastery, self-awareness, and conscious choice into the way you live',
      ],
      outcomes: [
        'Understand the hidden architecture of your life more clearly',
        'Notice patterns earlier and shift them faster',
        'Feel more conscious, empowered, and intentional',
        'Stop being run by unconscious programming',
        'Build a life shaped by awareness rather than automatic repetition',
      ],
      signatureMessage: [
        'When you master the pattern, you stop living by default.',
        'You begin living by design.',
      ],
      ctaSectionHeadline: 'Ready to go deeper?',
      ctaSectionBody:
        'Pattern Mastery helps you decode the hidden architecture of your life and turn awareness into transformation.',
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
      heroSubhead:
        'Support young people to build the emotional, mental, and inner foundations they will carry into relationships, school, identity, resilience, and adult life.',
      whatThisPathwayIs: [
        'These pathways are designed to help children and young people develop self-awareness, emotional strength, healthy internal patterns, and the life tools so many people only learn much later, after years of struggle.',
        'The earlier we help young people understand emotions, patterns, identity, boundaries, and inner guidance, the stronger their foundation becomes.',
        'These pathways are not about pathologising children. They are about equipping them. Helping them understand themselves, regulate emotions, respond to life with greater confidence, and develop the internal architecture for wellbeing, relationships, and growth.',
      ],
      whoItsFor: [],
      whatWeWorkOn: [],
      outcomes: [],
      ctaSectionBody:
        'Support them with the foundations they will carry for life.',
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
      heroSubhead:
        'Helping children understand, express, and manage their emotions with confidence.',
      whatThisPathwayIs: [
        'This pathway helps children and young people build emotional literacy, self-awareness, and healthy ways to understand and express what they feel.',
        'Rather than becoming overwhelmed, shut down, reactive, or confused by their emotions, they learn how to recognise what is happening inside them and respond in healthier ways.',
      ],
      whoItsFor: [
        'Struggle with emotional outbursts, shutdown, or overwhelm',
        'Need support understanding and naming what they feel',
        'Find it hard to express emotions in healthy ways',
        'Need stronger emotional tools for school, friendships, or home life',
      ],
      whatWeWorkOn: [
        'Emotional awareness and vocabulary',
        'Recognising feelings in the body',
        'Understanding triggers and reactions',
        'Healthy expression of emotions',
        'Tools for calming, grounding, and self-regulation',
      ],
      outcomes: [
        'Understand their emotions more clearly',
        'Feel less overwhelmed by big feelings',
        'Express themselves more safely and confidently',
        'Build emotional strength and self-awareness',
      ],
      ctaSectionBody: 'Help them build emotional skills for life.',
    },
  },
  {
    slug: 'young-minds-architecture',
    title: 'Young Minds Architecture',
    description:
      'Strengthen the inner structures that support resilience, identity, confidence, and empowered thinking.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      heroSubhead:
        'Building the inner structures that support confidence, identity, thinking, and decision-making.',
      whatThisPathwayIs: [
        'Young Minds Architecture focuses on the development of a strong inner foundation.',
        'It helps children and teens understand how thoughts, beliefs, self-image, emotions, and choices begin to form, and how to build healthier internal patterns early.',
      ],
      whoItsFor: [
        'Need support with confidence, identity, or self-belief',
        'Struggle with negative self-talk or insecurity',
        'Feel uncertain, lost, or easily influenced by others',
        'Need stronger inner foundations as they grow',
      ],
      whatWeWorkOn: [
        'Self-image and self-worth',
        'Thought patterns and mindset foundations',
        'Confidence and identity development',
        'Healthy decision-making',
        'Inner safety and self-trust',
      ],
      outcomes: [
        'Build stronger confidence from within',
        'Understand how their thinking shapes behaviour',
        'Develop healthier self-belief',
        'Make more grounded choices',
      ],
      ctaSectionBody: 'Give them the architecture for a stronger future.',
    },
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
      heroSubhead:
        'Helping young people understand the patterns that shape behaviour, relationships, and self-worth.',
      whatThisPathwayIs: [
        'Pattern Foundations introduces children and teens to the idea that patterns are created early, and that awareness creates choice.',
        'It gives them language and tools to notice what they repeat, what triggers them, what behaviours they fall into, and how to begin making different choices.',
      ],
      whoItsFor: [
        'Repeat certain reactions, behaviours, or friendship dynamics',
        'Get stuck in the same emotional loops',
        'Need support with self-awareness and behaviour change',
        'Would benefit from understanding how patterns are formed',
      ],
      whatWeWorkOn: [
        'Understanding habits, reactions, and patterns',
        'Awareness of triggers and repeated responses',
        'Early foundations of self-reflection',
        'Building new choices and healthier behaviours',
        'Relational patterns and social dynamics',
      ],
      outcomes: [
        'Recognise patterns earlier',
        'Understand why they react the way they do',
        'Build better choices and behaviours',
        'Develop stronger self-awareness for life',
      ],
      ctaSectionBody: 'Awareness early on can change a lifetime.',
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
      heroSubhead:
        'Helping young people trust themselves, know themselves, and navigate life with greater clarity.',
      whatThisPathwayIs: [
        'Inner Compass helps children and young people connect to their own inner guidance, values, voice, and sense of direction.',
        'In a world full of pressure, comparison, noise, and influence, this pathway helps them build the confidence to know what feels right for them and make choices that are aligned with who they are.',
      ],
      whoItsFor: [
        'Need support with confidence, decision-making, or self-trust',
        'Are easily influenced by peers or external pressure',
        'Feel disconnected from themselves',
        'Need help finding their own voice and direction',
      ],
      whatWeWorkOn: [
        'Self-trust and inner guidance',
        'Values and decision-making',
        'Boundaries and confidence',
        'Voice, expression, and identity',
        'Navigating life from inner alignment',
      ],
      outcomes: [
        'Trust themselves more deeply',
        'Make better choices with more confidence',
        'Feel more connected to who they are',
        'Develop inner direction and strength',
      ],
      ctaSectionBody: 'Help them build a compass they can carry for life.',
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
