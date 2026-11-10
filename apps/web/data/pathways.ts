/**
 * Transformation Pathways: typed catalogue.
 *
 * 8 Nov 2026: Pattern Mastery and the four Young People Pathways carry
 * Suzanne's own copy verbatim (mail body and attachment 02) in the rich
 * fields of PathwayDetail; the old youth slugs redirect (next.config.mjs).
 *
 * `description` is the card copy from docs/content-source/pathways-overview-cards.md.
 * `detail` carries the full pathway page content supplied by Suzanne in
 * "Transformation Pathways Website Pages response 1" (full-page brief covering
 * every pathway). Present only where `hasDetailContent` is true.
 *
 * `groupPathways` are the upcoming Group Transformation Pathways (immersions)
 * currently in development — cards only, no detail pages yet.
 */

import { contactHref } from '@/app/contact/enquiry'
import { ph, type RichLine } from '@/lib/content/richLine'

export type PathwaySlug =
  | 'break-the-loop'
  | 'reclaim-your-power'
  | 'reinvent-your-life'
  | 'upgrade-your-operating-system'
  | 'trauma-to-breakthrough'
  | 'resilience-fortification'
  | 'pattern-mastery'
  | 'pattern-foundations-children'
  | 'pattern-foundations-teens'
  | 'inner-compass'
  | 'the-family-pattern'

export type PathwayCategory = 'personal' | 'youth'

export interface PathwayDetail {
  /** Hero subhead — the one-line framing shown under the pathway title. */
  heroSubhead: string
  /**
   * Primary hero CTA label (adult pathways only, e.g. "Find My Pattern").
   * Omit for youth pathways: they show a single "Register Interest" enquiry
   * button instead (decision 14, 6 Oct; see components/pathways/PathwayDetail.tsx).
   */
  heroCtaPrimaryLabel?: string
  /** Where the primary hero CTA links. Defaults to /discover-your-pattern when omitted. */
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

  // ── Rich copy (Suzanne's 8 Nov documents). All optional: the older
  //    pathways keep the plain lists above. ───────────────────────────────
  /** Header eyebrow override (e.g. "Intuition for Young People · Ages 10–18"). */
  eyebrow?: string
  /** Bold opening line of "What This Pathway Is". */
  lead?: string
  /** Bold closing line of "What This Pathway Is". */
  whatThisClosing?: string
  /** Lead-in above the Who It's For list ("This pathway is for you if:"). */
  whoItsForIntro?: string
  /** Paragraph after the Who It's For list. */
  whoItsForNote?: RichLine
  /** Lead-in above the work items. */
  workIntro?: string
  /** Headed items for What We Work On; replace the plain list when present. */
  workItems?: { title: string; subtitle?: string; body: string }[]
  /** Line after the work items (Teens: the next step to Inner Compass). */
  workNote?: RichLine
  /** Former pathway names that live on as session themes (8 Nov). */
  sessionThemes?: string[]
  /** Bold line after the outcomes. */
  outcomesClosing?: string
  /** Pathway-specific "How the Work Happens"; the shared text otherwise. */
  howItHappens?: string[]
  /** Format line; Suzanne's placeholder until she supplies it. */
  format?: RichLine
  /** Pathway-specific "Why This Work Is Different"; the shared text otherwise. */
  whyDifferent?: string[]
  /** Pattern Mastery's "Want to do this work with others?" block. */
  withOthers?: { heading: string; body: RichLine }
  /** Her own buttons for the closing band. */
  ctas?: { label: string; href: string }[]
  /** Minors pages: her "Safeguarding & scope" line. Its presence shows the safeguarding block. */
  safeguarding?: RichLine
}

export interface Pathway {
  slug: PathwaySlug
  title: string
  /** Age band or audience on the card and header ("Ages 7–12", "For parents"). */
  ageLabel?: string
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
    // Suzanne's 8 Nov copy, verbatim (item 7.2). The foundations pathway name
    // and the format line are her placeholders.
    slug: 'pattern-mastery',
    title: 'Pattern Mastery',
    description:
      'The advanced pathway for people who’ve already done the work.',
    category: 'personal',
    featured: false,
    hasDetailContent: true,
    detail: {
      heroSubhead: 'The advanced pathway for people who’ve already done the work',
      heroCtaPrimaryLabel: 'Apply for Pattern Mastery',
      heroCtaPrimaryHref: contactHref('coaching', 'Apply for Pattern Mastery'),
      lead: 'Everything repeats until it’s understood. Once it’s mastered, it no longer has to repeat.',
      whatThisPathwayIs: [
        'You’ve done the work. You’ve had the breakthroughs, cleared the obvious blocks and changed a great deal. But you’ve also noticed something: the patterns are subtler now. They show up in new forms, at deeper layers and in places you didn’t expect.',
        'That isn’t failure. It’s the next level.',
        'Pattern Mastery is for people ready to go beyond healing a pattern to understanding the whole architecture beneath their life: the unconscious structures that organise how you think, choose, relate, protect, perform, succeed, avoid and recreate the familiar.',
        'Earlier work changes the patterns that run you. This pathway teaches you to read them yourself, so you’re no longer waiting for the next breakthrough. You become the one who creates it.',
      ],
      whatThisClosing: 'This isn’t about being fixed. It’s about mastery.',
      whoItsForIntro: 'This pathway is for you if:',
      whoItsFor: [
        'You’ve already done significant inner work, through Pattern Intelligence™, therapy, coaching or other modalities, and you’re ready for what comes next',
        'You’ve cleared the surface and are now meeting the deeper layers, the subtler patterns that only appear once the obvious ones have gone',
        'You recognise your themes but want to see the whole system, how your patterns connect, feed each other and trace back to a common root',
        'You want independence, not dependence: the ability to catch, decode and shift patterns yourself, in real time',
        'You’re fascinated by why people do what they do, and you want to understand it at the deepest level, starting with yourself',
      ],
      whoItsForNote: [
        'This isn’t a starting point. If you’re new to this work, begin with ',
        ph('Foundations pathway name', 'Suzanne'),
        ' and come back to Pattern Mastery when you’re ready to go deeper.',
      ],
      whatWeWorkOn: [],
      workItems: [
        {
          title: 'Mapping your pattern architecture',
          body: 'Most of us carry a small number of core patterns, and each one creates many sub-patterns. Together we map yours: your core patterns, how they branch and how they connect across your life.',
        },
        {
          title: 'Tracking patterns to the root',
          body: 'You learn to follow a pattern back through its layers, peeling them away one at a time, to the original moment, meaning and unmet need that created it. When the root is reached and the system feels safe, the whole pattern can let go.',
        },
        {
          title: 'Decoding the meaning',
          body: 'We’re meaning-making beings. It isn’t the event that wires a pattern in, it’s the meaning we gave it. You learn to find and rewrite the meanings still shaping your choices.',
        },
        {
          title: 'Catching patterns in real time',
          body: 'You learn to recognise a pattern firing in your body as it happens, and to interrupt it consciously before it runs its course.',
        },
        {
          title: 'Embodying the new pattern',
          body: 'Insight alone doesn’t hold. We anchor each change in your nervous system and body through state, action and practice, until the new way becomes your natural way.',
        },
      ],
      outcomes: [
        'See the hidden architecture of your life, and how your patterns connect into one system',
        'Catch patterns earlier and shift them faster, often within moments rather than months',
        'Become your own pattern tracker, able to decode what’s happening without needing someone else to show you',
        'Live consciously instead of automatically, with real choice where there used to be reaction',
        'Hold your growth for good, because you’ve mastered the process, not just finished it',
      ],
      outcomesClosing: 'When you master the pattern, you stop living by default and start living by design.',
      howItHappens: [
        'Pattern Mastery is an advanced, multi-session pathway. It combines deep pattern mapping and Rapid Repatterning™ with nervous system work, embodiment practice and the skills of self-led pattern tracking.',
        'Each session builds on the one before. You work on your own life while learning the method behind it, and between sessions you practise applying it independently.',
      ],
      format: [ph('Format: number of sessions · duration · 1:1 / small group · investment', 'Suzanne')],
      whyDifferent: [
        'Most approaches stop at the problem, or at the breakthrough. Pattern Mastery goes further.',
        'We don’t just identify the pattern and shift it. We teach you to see the system that creates patterns, so that whatever comes up in the future, you can work with it yourself.',
        'This is the difference between being helped and being able.',
      ],
      withOthers: {
        heading: 'Want to do this work with others?',
        body: [
          'Pattern Mastery teaches you to apply the method to yourself. Using it with clients is a trained profession. If that’s where you’re heading, explore ',
          { link: 'Practitioner Certification', href: '/programs#practitioner' },
          '.',
        ],
      },
      ctas: [
        { label: 'Apply for Pattern Mastery', href: contactHref('coaching', 'Apply for Pattern Mastery') },
        { label: 'Book a Discovery Call', href: '/contact#book' },
      ],
      ctaSectionHeadline: 'Want to do this work with others?',
      ctaSectionBody:
        'When you master the pattern, you stop living by default and start living by design.',
    },
  },

  // ── Young People Pathways ───────────────────────────────────────────────
  // Suzanne, 8 Nov 2026: reduced to four. Copy verbatim from her attachment
  // "Young People Pathways website copy" (02). The old pathway names live on
  // as session themes. [Format] lines and the safeguarding policy link are
  // her placeholders and stay visible until she supplies them.
  {
    slug: 'pattern-foundations-children',
    title: 'Pattern Foundations: Children',
    ageLabel: 'Ages 7–12',
    description:
      'Help your child understand their feelings, build confidence and develop healthy inner foundations, through play, story and connection.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      heroSubhead:
        'Help your child understand their feelings, build confidence and develop healthy inner foundations, through play, story and connection.',
      lead: 'The patterns we learn as children become the life we live as adults.',
      whatThisPathwayIs: [
        'Between the ages of 7 and 12, children are forming the inner beliefs that will shape their lives: whether they are good enough, whether they are safe, whether their feelings matter, and what they need to do to be loved.',
        'Pattern Foundations: Children helps your child build healthy foundations during these years. In a way that is playful, gentle and age-appropriate, children learn to understand their feelings, calm their bodies, believe in themselves and notice the "stuck" moments that keep repeating.',
        'This is not about fixing your child. Nothing is wrong with them. It is about giving them tools that most of us never received.',
      ],
      whoItsForIntro: 'This pathway is for your child if they:',
      whoItsFor: [
        "Have big feelings they don't yet know how to handle: meltdowns, worries, anger or tears that seem out of proportion",
        'Struggle with confidence: holding back, giving up quickly or saying "I can\'t" before they have tried',
        'Worry a lot: about school, friends, change or getting things wrong',
        'Find friendships hard: feeling left out, struggling to fit in or getting caught up in conflict',
        'Are going through change: a new school, a move, a family separation, a loss or a new sibling',
        'Are simply wonderful, and you want to give them the strongest possible start',
      ],
      whatWeWorkOn: [],
      workItems: [
        {
          title: 'Understanding feelings',
          body: 'Children learn to name what they feel, understand that all feelings are allowed, and see that feelings are messages, not problems.',
        },
        {
          title: 'Calming the body',
          body: 'Simple, fun tools help them settle their nervous system when they are upset, anxious or overwhelmed. These are skills they can use anywhere, from the classroom to bedtime.',
        },
        {
          title: 'Building inner confidence',
          body: 'We help them grow a sense of "I can" and "I\'m enough" that doesn\'t depend on being perfect or always getting it right.',
        },
        {
          title: 'Spotting the stuck moments',
          body: 'Through story and play, children start to notice the patterns that repeat for them, like the moment they always give up, freeze or get cross, and learn they can choose something different.',
        },
        {
          title: 'Listening to their inner voice',
          body: 'Children learn that their body gives them helpful signals: the calm "yes" feeling and the "uh-oh" feeling. They practise noticing these signals, trusting them, and talking about them with a grown-up they trust.',
        },
        {
          title: 'Parent partnership',
          body: "Parents join regular sessions so the tools continue at home. You learn your child's patterns, how to support them, and how to respond in ways that strengthen what they are learning.",
        },
      ],
      sessionThemes: ['Foundations for Life', 'Pattern Foundations'],
      outcomes: [
        'Fewer meltdowns and calmer recovery when big feelings arrive',
        'Greater confidence to try, make mistakes and keep going',
        'Less worry, and the tools to settle it when it comes',
        'Stronger friendships, built on understanding themselves and others',
        "Trust in their own inner signals, and the confidence to speak up when something doesn't feel right",
        'A closer parent–child connection, with a shared language for feelings',
        'Foundations for life: emotional skills they will carry into adolescence and beyond',
      ],
      outcomesClosing: 'Give your child the foundations you wish you had.',
      howItHappens: [
        'Sessions are playful, warm and built around how children actually learn: through games, stories, drawing, movement and connection. Your child never needs to explain or analyse. We meet them where they are.',
        'The pathway combines sessions with your child and sessions with you as a parent, so what your child learns is understood, supported and practised at home.',
      ],
      format: [ph('Format: number of child sessions · number of parent sessions · duration · in person / online · investment', 'Suzanne')],
      whyDifferent: [
        'Most support for children manages behaviour by rewarding the good and correcting the bad. But behaviour is never the problem. It is the evidence of what a child is feeling and needing underneath.',
        'We work with what is beneath the behaviour. When a child feels understood and safe, and has tools that fit their age, change happens naturally.',
      ],
      safeguarding: [
        'All work with children is carried out with full parental consent and under our safeguarding policy ',
        ph('link', 'Suzanne'),
        '. This pathway is educational and developmental, not a clinical service. Where clinical support may be helpful, we will discuss this with you and refer appropriately.',
      ],
      ctas: [{ label: 'Book a Parent Discovery Call', href: '/contact#book' }],
      ctaSectionBody: 'Give your child the foundations you wish you had.',
    },
  },
  {
    slug: 'pattern-foundations-teens',
    title: 'Pattern Foundations: Teens',
    ageLabel: 'Ages 13–18',
    description: 'Emotional mastery and a strong sense of identity, for the most formative years of life.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      heroSubhead: 'Emotional mastery and a strong sense of identity, for the most formative years of life.',
      lead: 'The teenage years are when identity is built, and when patterns lock in.',
      whatThisPathwayIs: [
        "Adolescence is one of the most powerful periods of brain development in a person's life. The brain is rewiring at speed. Identity is forming. The pressure of school, friendships, social media, the future and fitting in all arrive at once.",
        'That makes these years a challenge, and also a huge opportunity. Patterns that form now can last a lifetime, but the teenage brain is also remarkably able to change.',
        'Pattern Foundations: Teens is a two-stage pathway that helps young people understand their emotions and build a strong sense of who they are. They learn to recognise the patterns forming in their lives and to choose who they want to become.',
      ],
      whatThisClosing: 'A pathway built for teenagers, not one done to them.',
      whoItsForIntro: 'This pathway is for teens who:',
      whoItsFor: [
        'Feel overwhelmed by pressure from school, exams, friendships, family or social media',
        'Struggle with anxiety, stress or low mood, or switch off to cope',
        'Doubt themselves, compare themselves constantly or feel they are never enough',
        'Feel unsure of who they are, or feel they have to be someone else to fit in',
        'Get caught in repeating patterns like procrastination, people-pleasing, conflict or giving up',
        'Are capable and driven, and want an edge in self-awareness, focus and confidence',
      ],
      whatWeWorkOn: [],
      workIntro: 'The pathway moves through two stages, each building on the last.',
      workItems: [
        {
          title: 'Stage 1 · Emotional Mastery',
          subtitle: 'Understanding the inner world',
          body: 'Teens learn how their brain and nervous system respond to pressure, why emotions can feel so overwhelming, and practical tools to calm their system, think clearly and respond rather than react.',
        },
        {
          title: 'Stage 2 · Identity',
          subtitle: 'Who am I, really?',
          body: 'Teens explore the beliefs and stories they have already absorbed about who they are, what they are capable of and what they need to do to fit in. They learn which ones are really theirs, and which are patterns they can let go of.',
        },
      ],
      workNote: [
        'Ready for the next step? ',
        { link: 'Inner Compass', href: '/transformation-pathways/inner-compass' },
        ' builds on this pathway, helping teens trust their intuition and find their direction.',
      ],
      sessionThemes: ['Emotional Mastery for Young Minds', 'Young Minds Architecture'],
      outcomes: [
        'Calm under pressure: tools for stress, exams and overwhelm that actually work',
        'Emotional resilience, to bounce back instead of shutting down or blowing up',
        "A stronger sense of self: confidence that doesn't depend on likes, grades or approval",
        'Healthier relationships with friends, family and themselves',
        'Pattern awareness for life: the ability to notice and change patterns, a skill most adults never learn',
      ],
      outcomesClosing: 'Help them become who they are meant to be, not who their patterns say they are.',
      howItHappens: [
        "Sessions are interactive, honest and relevant to teenagers' real lives. We use practical tools, real-world scenarios, reflection and body-based techniques, without lectures and without judgement.",
        "Teens work through both stages over the course of the pathway, with parent check-ins at key points so families stay connected to the journey while respecting the teen's growing independence.",
      ],
      format: [ph('Format: number of sessions per stage · duration · 1:1 / small group · in person / online · investment', 'Suzanne')],
      whyDifferent: [
        'Most support for teens focuses on what they should do: study harder, be more confident, make better choices. But teens usually know what they should do. What gets in the way is the pattern underneath.',
        'We help young people understand why they do what they do, and give them the tools to change it. That is the most powerful skill they can take into adulthood.',
      ],
      safeguarding: [
        'All work with young people under 18 is carried out with parental consent and under our safeguarding policy ',
        ph('link', 'Suzanne'),
        '. This pathway is educational and developmental, not a clinical service. Where clinical support may be helpful, we will discuss this with the family and refer appropriately.',
      ],
      ctas: [{ label: 'Book a Discovery Call', href: '/contact#book' }],
      ctaSectionBody: 'Help them become who they are meant to be, not who their patterns say they are.',
    },
  },
  {
    slug: 'inner-compass',
    title: 'Inner Compass',
    // Her attachment says 10–18 throughout; her mail body said 8-18. The
    // attachment is the final copy (listed for Suzanne to confirm).
    ageLabel: 'Ages 10–18',
    description:
      'Help young people hear, trust and use their intuition, and find a direction that comes from within.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      heroSubhead:
        'Help young people hear, trust and use their intuition, and find a direction that comes from within.',
      eyebrow: 'Intuition for Young People · Ages 10–18',
      lead: 'Every young person has an inner compass. Most are never taught how to read it.',
      whatThisPathwayIs: [
        'Young people are surrounded by noise: opinions from parents, teachers, friends and social media, and the constant pressure to compare, fit in and get it right. In all that noise, the quietest voice gets lost. It is their own inner knowing.',
        "Intuition isn't magic, and it isn't luck. It is the brain and body processing information faster than conscious thought can follow, a natural intelligence that every young person has. Like any intelligence, it can be developed.",
        'Inner Compass helps young people hear their intuition, trust it and use it wisely. They learn to tell the difference between fear and inner knowing, to make decisions that feel right as well as look right, and to find a direction that comes from within rather than from pressure.',
      ],
      whatThisClosing: 'The skill that helps them choose well, long after they have left home.',
      whoItsForIntro: 'This pathway is for young people who:',
      whoItsFor: [
        'Second-guess themselves and look to everyone else before trusting their own sense of things',
        'Struggle with decisions, big or small, from friendships to subject choices to "what should I do?"',
        'Are easily swayed by peer pressure, social media or the need to fit in',
        "Feel things deeply and pick up on more than others, but don't know what to do with it",
        'Feel lost about direction and want to know what is truly right for them',
        'Have already built their foundations through Pattern Foundations, and are ready for the next step',
      ],
      whatWeWorkOn: [],
      workItems: [
        {
          title: 'Understanding intuition',
          body: 'In language that fits their age, young people learn what intuition is, how the brain and body produce it, and why it is a real form of intelligence that people in high-pressure jobs rely on every day.',
        },
        {
          title: 'Hearing the signal',
          body: 'They learn to notice how intuition shows up in their own body, the calm "yes" and the quiet "no", and to make space for it in a noisy world.',
        },
        {
          title: 'Fear or intuition?',
          body: "This is one of the most important skills of all. They learn the difference between the loud, urgent voice of fear and the calm, steady voice of inner knowing, so fear can't pass itself off as wisdom.",
        },
        {
          title: 'Trusting and testing',
          body: 'Through practical exercises and real-life decisions, they build trust in their intuition step by step, learning when to follow it, when to check it, and how to combine gut feeling with clear thinking.',
        },
        {
          title: 'Finding their direction',
          body: 'They use their inner compass for what matters to them: friendships, choices, values and the future they want, and set a direction that comes from inside rather than from comparison.',
        },
        {
          title: 'Speaking up',
          body: "They learn that when something doesn't feel right, their intuition deserves a voice, and that telling a trusted adult is a strength, not a weakness.",
        },
      ],
      outcomes: [
        "Trust in their own judgement, instead of relying on everyone else's",
        'The ability to tell fear from intuition, so they can respond to what is real',
        'Confident decisions, with less overthinking and fewer regrets',
        'Resilience to peer pressure, because their compass points to their own values',
        'A clear sense of direction that feels like theirs',
        'A lifelong skill: intuition they can draw on in every chapter of their life',
      ],
      outcomesClosing: 'Teach them to trust the voice that knows them best: their own.',
      howItHappens: [
        'Sessions are interactive, practical and grounded in real life. We use body-based exercises, guided reflection, real decision-making scenarios and age-appropriate explanations of the science, so intuition feels natural and trustworthy rather than mysterious.',
        'Sessions are adapted to age, with younger participants (10–12) and teens (13–18) working at different depths. Inner Compass works best after a Pattern Foundations pathway, because intuition comes through most clearly once a young person has the tools to calm their system. It can also be taken on its own.',
      ],
      format: [ph('Format: number of sessions · duration · 1:1 / small group · in person / online · investment', 'Suzanne')],
      whyDifferent: [
        'Most young people are taught to listen to everyone except themselves. They are told what to think, what to choose and who to become.',
        'Inner Compass teaches them to listen inward, with intuition grounded in an understanding of how the brain and body work rather than in guesswork. It is one of the most valuable things a young person can carry into adulthood.',
      ],
      safeguarding: [
        'All work with young people under 18 is carried out with parental consent and under our safeguarding policy ',
        ph('link', 'Suzanne'),
        '. This pathway is educational and developmental, not a clinical service.',
      ],
      ctas: [{ label: 'Book a Discovery Call', href: '/contact#book' }],
      ctaSectionBody: 'Teach them to trust the voice that knows them best: their own.',
    },
  },
  {
    slug: 'the-family-pattern',
    title: 'The Family Pattern',
    ageLabel: 'For parents',
    description:
      'Children learn their patterns at home. Change the family pattern, and you change what your child inherits.',
    category: 'youth',
    featured: false,
    hasDetailContent: true,
    detail: {
      heroSubhead:
        'Children learn their patterns at home. Change the family pattern, and you change what your child inherits.',
      lead: "Children don't learn who to be from what we tell them. They learn it from what we live.",
      whatThisPathwayIs: [
        'Every family has patterns: ways of handling stress, conflict, love, success and failure that are passed down without anyone choosing them. Most of us parent the way we were parented, or spend our energy trying hard not to, and both are driven by patterns we never chose.',
        'None of us were given a manual. We were handed our own unresolved patterns and asked to raise children anyway.',
        'The Family Pattern is a pathway for parents who want to understand the patterns shaping their family, so they can stop passing on what hurt them and pass on what they would like their children to inherit.',
      ],
      whatThisClosing: 'When a parent changes their pattern, the whole family changes.',
      whoItsForIntro: 'This pathway is for you if:',
      whoItsFor: [
        'You find yourself reacting the way your parents did, and hate it',
        'The same conflicts keep repeating at home, with your children, your partner or both',
        'Your child is struggling, and you sense that some of it comes from inside the family system',
        'You feel exhausted, guilty or out of your depth as a parent',
        'You are co-parenting through separation or change, and want to protect your children from the fallout',
        'You want to raise emotionally healthy children, and know it starts with you',
      ],
      whatWeWorkOn: [],
      workItems: [
        {
          title: 'Seeing the family pattern',
          body: 'We map the patterns running through your family: how stress, conflict, love and emotion are handled, and where those patterns came from in your own upbringing.',
        },
        {
          title: 'Your triggers, their behaviour',
          body: "You learn why certain behaviours in your child set off such strong reactions in you. Often it is an old pattern of yours being touched, not just your child's behaviour.",
        },
        {
          title: 'Regulating yourself first',
          body: "A calm parent teaches a child's nervous system what calm feels like. You learn practical tools to steady yourself in the hardest moments, so your child can learn from your example.",
        },
        {
          title: "Understanding your child's patterns",
          body: "You learn to see the need beneath your child's behaviour, and to respond in ways that help them feel safe, understood and able to grow.",
        },
        {
          title: 'Breaking the cycle',
          body: 'You choose consciously which patterns end with you, and which values, strengths and ways of loving you want to pass on.',
        },
      ],
      outcomes: [
        'Calmer responses in the moments that used to set you off',
        'Fewer repeating conflicts, and better repair when they happen',
        'A deeper connection with your children, built on understanding rather than control',
        'Less guilt, more confidence as a parent',
        'A healthier family system, where everyone feels safer to be themselves',
        'A legacy you choose, not one you simply inherit',
      ],
      outcomesClosing: 'The pattern can end with you. And something better can begin.',
      howItHappens: [
        'The Family Pattern is a multi-session pathway for one parent, both parents or co-parents. Sessions combine pattern mapping, Rapid Repatterning™ for your own triggers, nervous-system tools and practical parenting strategies you can use straight away.',
        'It can be taken on its own, or alongside a Pattern Foundations or Inner Compass pathway for your child, so the whole family moves forward together.',
      ],
      format: [ph('Format: number of sessions · duration · individual / couple · in person / online · investment', 'Suzanne')],
      whyDifferent: [
        'Most parenting support teaches techniques: what to say, how to set consequences, which routine to follow. Those can help, but under stress every parent falls back on their pattern.',
        'We work at the level of the pattern itself, in you and in your family system. That is why the change lasts, and why your children feel it.',
      ],
      ctas: [{ label: 'Book a Discovery Call', href: '/contact#book' }],
      ctaSectionBody: 'The pattern can end with you. And something better can begin.',
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

/** Item 7.1: every pathway page carries a Book button to the private sessions. */
export const PATHWAY_BOOKING_HREF = '/services#private'

export const personalPathways = pathways.filter((p) => p.category === 'personal')
export const youthPathways = pathways.filter((p) => p.category === 'youth')

export const pathwayBySlug = (slug: string): Pathway | undefined =>
  pathways.find((p) => p.slug === slug)

export const featuredPathway = pathways.find((p) => p.featured)

export const categoryLabel = (category: PathwayCategory): string =>
  category === 'youth' ? 'Young People Pathway' : 'Personal Pathway'
