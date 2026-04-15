/**
 * Explore topic data — all copy sourced from the Suzanne Ravenall
 * scraped WordPress pages in infra/scripts/scraped-content/explore-*.md.
 *
 * Do not invent content for these topics. If a field needs a new value,
 * pull it from the source .md file for that slug.
 */

export type TopicSlug =
  | 'emotional-nervous-system-mastery'
  | 'relationships-attachment-patterns'
  | 'next-level-health-vitality-longevity'
  | 'intuition-as-patterned-intelligence'
  | 'leadership-high-performance'
  | 'life-transitions-reinvention'
  | 'health-energy-intelligence'
  | 'identity-purpose-activation'

export type Topic = {
  slug: TopicSlug
  title: string
  shortDescription: string
  heroHeadline: string
  heroSubheadline: string
  overview: string[]
  corePrinciple: string
  discover: { title: string; body: string }[]
  approach: { step: string; title: string; body: string }[]
  metaTitle: string
  metaDescription: string
}

export const topics: Topic[] = [
  {
    slug: 'emotional-nervous-system-mastery',
    title: 'Emotional & Nervous System Mastery',
    shortDescription:
      'You don’t have an emotional problem. You have a nervous system pattern.',
    heroHeadline: 'Emotional Mastery Begins in the Nervous System',
    heroSubheadline:
      'If your emotions feel overwhelming, unpredictable or exhausting — it’s not because you’re too emotional. It’s because your nervous system has learned a pattern.',
    overview: [
      'Most people believe their emotions are the problem. “I’m anxious.” “I overreact.” “I shut down.” So they try to control them.',
      'But emotions are not the cause — they are the output. They are the result of how your nervous system is interpreting the world.',
      'If your nervous system feels unsafe, you will experience anxiety — even in safe environments. If your system expects pressure, you will feel stress — even when nothing is wrong. If your system learned to shut down, you will disconnect — even when you want to engage.',
    ],
    corePrinciple: 'This is not personality. This is patterning.',
    discover: [
      {
        title: 'You feel calm without forcing it',
        body: 'Regulation replaces the constant effort of managing yourself.',
      },
      {
        title: 'You respond instead of react',
        body: 'Pressure no longer pulls you into fight, flight, or freeze.',
      },
      {
        title: 'You think clearly under pressure',
        body: 'Clarity returns because the nervous system isn’t hijacking it.',
      },
      {
        title: 'You stop feeling “on edge”',
        body: 'Your baseline shifts out of survival and back into safety.',
      },
      {
        title: 'Your energy stabilises',
        body: 'Output becomes sustainable — not powered by pressure.',
      },
    ],
    approach: [
      {
        step: '01',
        title: 'Nervous system regulation',
        body: 'We reset the physiological baseline so the body stops defaulting to survival.',
      },
      {
        step: '02',
        title: 'Subconscious pattern decoding',
        body: 'We locate the pattern your system has been running — below conscious thought.',
      },
      {
        step: '03',
        title: 'Emotional reset',
        body: 'We clear the charge held in the old pattern so it no longer runs you.',
      },
      {
        step: '04',
        title: 'Identity recalibration',
        body: 'You integrate as the version of you who no longer needs the pattern to feel safe.',
      },
    ],
    metaTitle: 'Emotional & Nervous System Mastery | Dr. Suzanne Ravenall',
    metaDescription:
      'Emotional mastery begins in the nervous system. Repattern anxiety, overwhelm and reactivity at the level where they’re actually formed.',
  },
  {
    slug: 'relationships-attachment-patterns',
    title: 'Relationships & Attachment Patterns',
    shortDescription:
      'Love isn’t the problem. The pattern is.',
    heroHeadline: 'Love Isn’t the Problem. The Pattern Is.',
    heroSubheadline:
      'If you keep experiencing the same relationship dynamics — different person, same feeling — it’s not coincidence. It’s pattern.',
    overview: [
      'You don’t choose relationships consciously. You choose what feels familiar to your nervous system. Your mind thinks it is choosing love, but your body is selecting what it already knows. Familiar dynamics read as “home,” even when they are chaotic.',
      'Safety gets interpreted as recognition, not health. If intensity once felt like love, you’ll keep chasing intensity. If distance felt protective, you’ll keep agreeing to distance.',
      'Your attachment pattern formed early. It taught your system what connection should feel like, what to expect from others, and how to stay safe — so now you may chase connection (anxious), avoid closeness (avoidant), or move between both (push-pull).',
    ],
    corePrinciple:
      'You are not attracted to what is healthy. You are attracted to what is recognisable.',
    discover: [
      {
        title: 'Connection feels safe',
        body: 'Closeness stops triggering the old fear response.',
      },
      {
        title: 'Communication becomes clear',
        body: 'You can express needs without bracing for rejection.',
      },
      {
        title: 'You stop repeating the same cycle',
        body: 'The familiar dynamic no longer pulls you in.',
      },
      {
        title: 'You choose from values, not from pattern',
        body: 'Chemistry stops being confused with familiarity.',
      },
    ],
    approach: [
      {
        step: '01',
        title: 'Nervous system regulation',
        body: 'We settle the system so it stops scanning for the familiar dynamic.',
      },
      {
        step: '02',
        title: 'Subconscious pattern decoding',
        body: 'We uncover the attachment template running beneath your choices.',
      },
      {
        step: '03',
        title: 'Emotional reset',
        body: 'We clear the charge on the original wound so the pattern loses its pull.',
      },
      {
        step: '04',
        title: 'Identity recalibration',
        body: 'You become the version of you who can receive and sustain healthy connection.',
      },
    ],
    metaTitle: 'Relationships & Attachment Patterns | Dr. Suzanne Ravenall',
    metaDescription:
      'You don’t choose relationships consciously — you choose what feels familiar to your nervous system. Repattern the attachment template underneath the cycle.',
  },
  {
    slug: 'next-level-health-vitality-longevity',
    title: 'Next-Level Health, Vitality & Longevity',
    shortDescription:
      'Your ceiling isn’t your effort. It’s the pattern your system runs under pressure.',
    heroHeadline: 'Vitality Isn’t Willpower. It’s Pattern.',
    heroSubheadline:
      'Top performers don’t just work harder — they operate from different internal patterns. Shift the pattern and output follows.',
    overview: [
      'Performance is the output of the pattern you are running under pressure. The way your system learned to drive results — overdrive, reactivity, chaos — keeps repeating until the internal operating system changes.',
      'High performers often run one of three programs on repeat: overdrive (always-on output that burns energy faster than you can recover), reactivity (decisions driven by threat response that produce errors and erode trust), or lack of structure (inconsistent systems that create sporadic wins).',
      'The outcome is predictable: plateau, exhaustion, ineffective leadership, inconsistency. Pushing harder only reinforces the same pattern.',
    ],
    corePrinciple: 'Your ceiling is not your skill level. It’s your pattern.',
    discover: [
      {
        title: 'Calm, clear decision-making',
        body: 'Pressure stops hijacking your thinking.',
      },
      {
        title: 'Sustainable performance',
        body: 'Output comes from capacity, not from cortisol.',
      },
      {
        title: 'Strategic leadership',
        body: 'You lead from signal, not from reactivity.',
      },
      {
        title: 'Teams align around your clarity',
        body: 'The people around you feel the shift in your system.',
      },
    ],
    approach: [
      {
        step: '01',
        title: 'Nervous system regulation',
        body: 'We rebuild the physiological base that sustainable performance actually runs on.',
      },
      {
        step: '02',
        title: 'Subconscious pattern decoding',
        body: 'We locate the performance pattern — overdrive, reactivity, or chaos — that’s capping your results.',
      },
      {
        step: '03',
        title: 'Performance pattern upgrade',
        body: 'We install the operating pattern your next level actually requires.',
      },
      {
        step: '04',
        title: 'Identity recalibration',
        body: 'You integrate as the leader whose vitality matches their ambition.',
      },
    ],
    metaTitle: 'Next-Level Health, Vitality & Longevity | Dr. Suzanne Ravenall',
    metaDescription:
      'Vitality is pattern, not willpower. Repattern the internal operating system so output becomes sustainable — not powered by pressure.',
  },
  {
    slug: 'intuition-as-patterned-intelligence',
    title: 'Intuition as Patterned Intelligence',
    shortDescription: 'Intuition isn’t magic. It’s pattern recognition.',
    heroHeadline: 'Intuition Is Not Magic. It’s Pattern Recognition.',
    heroSubheadline:
      'Top performers don’t just work harder — they operate from different internal patterns. Shift the pattern and intuition sharpens.',
    overview: [
      'Performance is the output of the pattern you are running under pressure. The way your system learned to read the room — under overdrive, reactivity, or chaos — keeps repeating until the internal operating system changes.',
      'Intuition is your nervous system reading signal faster than the conscious mind can. When the system is dysregulated, signal gets drowned by noise — you second-guess, override, or miss what your body already knew.',
      'Regulate the system and intuition returns as reliable, patterned intelligence — not a lucky hunch.',
    ],
    corePrinciple: 'Your ceiling is not your skill level. It’s your pattern.',
    discover: [
      {
        title: 'Calm, clear decision-making',
        body: 'You trust the read instead of overriding it.',
      },
      {
        title: 'Sustainable performance',
        body: 'Good calls stop costing you energy you can’t afford.',
      },
      {
        title: 'Strategic leadership',
        body: 'You lead from signal, not from noise.',
      },
      {
        title: 'Teams align around your clarity',
        body: 'Certainty in you creates certainty in the room.',
      },
    ],
    approach: [
      {
        step: '01',
        title: 'Nervous system regulation',
        body: 'Signal can only be heard once the system stops drowning it in threat response.',
      },
      {
        step: '02',
        title: 'Subconscious pattern decoding',
        body: 'We surface the patterns that have been overriding your internal read.',
      },
      {
        step: '03',
        title: 'Intuitive pattern recognition',
        body: 'We train the system to recognise signal — and act on it without hesitation.',
      },
      {
        step: '04',
        title: 'Identity recalibration',
        body: 'You integrate as the leader whose decisions are backed by patterned intelligence.',
      },
    ],
    metaTitle: 'Intuition as Patterned Intelligence | Dr. Suzanne Ravenall',
    metaDescription:
      'Intuition is pattern recognition, not magic. Repattern the nervous system and your internal read becomes reliable, strategic intelligence.',
  },
  {
    slug: 'leadership-high-performance',
    title: 'Leadership & High Performance',
    shortDescription: 'High performance isn’t effort. It’s pattern.',
    heroHeadline: 'High Performance Isn’t Effort. It’s Pattern.',
    heroSubheadline:
      'Top performers don’t just work harder — they operate from different internal patterns. Shift the pattern and output follows.',
    overview: [
      'Performance is the output of the pattern you are running under pressure. The way your system learned to drive results — overdrive, reactivity, chaos — keeps repeating until the internal operating system changes.',
      'High performers often run one of three programs on repeat: overdrive (always-on output that burns energy faster than you can recover), reactivity (decisions driven by threat response that produce errors and erode trust), or lack of structure (inconsistent systems that create sporadic wins and unreliable teams).',
      'You see: plateau, exhaustion, ineffective leadership, inconsistency. Pushing harder only reinforces the same pattern — interpreting intensity as progress and recycling the same stress chemistry.',
    ],
    corePrinciple: 'Your ceiling is not your skill level. It’s your pattern.',
    discover: [
      {
        title: 'Calm, clear decision-making',
        body: 'You lead without the volume of the threat response in the background.',
      },
      {
        title: 'Sustainable performance',
        body: 'You stop trading recovery for results.',
      },
      {
        title: 'Strategic leadership',
        body: 'Teams receive one clear signal instead of a mixed one.',
      },
      {
        title: 'Teams align around your clarity',
        body: 'Your regulated system sets the tone for the room.',
      },
    ],
    approach: [
      {
        step: '01',
        title: 'Nervous system regulation',
        body: 'We rebuild the baseline so the body can operate at your ambition without collapsing.',
      },
      {
        step: '02',
        title: 'Subconscious pattern decoding',
        body: 'We name the performance pattern — overdrive, reactivity, or inconsistency — that’s capping the team.',
      },
      {
        step: '03',
        title: 'Performance pattern upgrade',
        body: 'We install the leadership operating system this chapter actually needs.',
      },
      {
        step: '04',
        title: 'Identity recalibration',
        body: 'You become the leader whose clarity the team can organise around.',
      },
    ],
    metaTitle: 'Leadership & High Performance | Dr. Suzanne Ravenall',
    metaDescription:
      'High performance is pattern, not effort. Repattern the internal operating system so leadership, energy and output finally align.',
  },
  {
    slug: 'life-transitions-reinvention',
    title: 'Life Transitions & Reinvention',
    shortDescription: 'You’re not lost. You’re between identities.',
    heroHeadline: 'When Life Changes, Patterns Decide What Happens Next',
    heroSubheadline:
      'You are not lost. You are between identities — one is dissolving while the next hasn’t formed yet. That space in-between is not failure; it’s pattern reconfiguration.',
    overview: [
      'Transitions strip away familiar patterns before new ones exist. That’s why everything feels uncertain.',
      'When life shifts, old patterns no longer work and a new identity hasn’t been anchored. What has always created certainty no longer fits this chapter — and your system hasn’t coded who you are becoming, so it hesitates.',
      'The in-between feels unstable and shows up as confusion, fear, or paralysis — feeling stuck even when you want to move forward.',
    ],
    corePrinciple: 'Transitions don’t break you. They expose your patterns.',
    discover: [
      {
        title: 'Clarity',
        body: 'You stop waiting to feel certain before you move.',
      },
      {
        title: 'Direction',
        body: 'A coherent next chapter emerges from the reconfiguration.',
      },
      {
        title: 'Rebuilding',
        body: 'You build forward from identity, not from panic.',
      },
      {
        title: 'Stability in the in-between',
        body: 'You can stand in uncertainty without collapsing into it.',
      },
    ],
    approach: [
      {
        step: '01',
        title: 'Nervous system regulation',
        body: 'We steady the system so the in-between stops reading as threat.',
      },
      {
        step: '02',
        title: 'Subconscious pattern decoding',
        body: 'We surface the old identity pattern that’s still running in the background.',
      },
      {
        step: '03',
        title: 'Emotional reset',
        body: 'We close what the old chapter was still holding on to.',
      },
      {
        step: '04',
        title: 'Identity recalibration',
        body: 'You anchor the new identity before the circumstances have fully caught up.',
      },
    ],
    metaTitle: 'Life Transitions & Reinvention | Dr. Suzanne Ravenall',
    metaDescription:
      'You’re not lost — you’re between identities. Move through transition by repatterning the old identity and anchoring the next one.',
  },
  {
    slug: 'health-energy-intelligence',
    title: 'Health & Energy Intelligence',
    shortDescription:
      'Your body is not failing you. It is responding to patterns.',
    heroHeadline: 'Your Body Is Not Failing You. It Is Responding to Patterns.',
    heroSubheadline:
      'Symptoms are not random — they are signals. Your nervous system assigns meaning to every sensation, and when the pattern stays the same, the signals do too.',
    overview: [
      'Fatigue, tension, and pain are your body reporting how safe it feels — not proof that it’s broken.',
      'When your nervous system is under constant stress, cortisol rises and your body stays on alert, keeping you wired even when you’re trying to rest. Recovery decreases — sleep, digestion, and repair get deprioritised while the system keeps scanning for risk. Inflammation increases as the immune system overfires.',
      'Over time this creates fatigue, burnout, immune disruption and chronic symptoms. Rest alone doesn’t change the pattern — if your system still feels unsafe, it stays activated.',
    ],
    corePrinciple: 'Your body is not the problem. It is the messenger.',
    discover: [
      {
        title: 'Energy stabilises',
        body: 'You stop crashing after every output cycle.',
      },
      {
        title: 'Recovery improves',
        body: 'Sleep, digestion and repair come back online.',
      },
      {
        title: 'The body begins to regulate',
        body: 'Symptoms quieten because the system is no longer on alert.',
      },
      {
        title: 'You leave survival mode',
        body: 'Your body gets to return to repair instead of defence.',
      },
    ],
    approach: [
      {
        step: '01',
        title: 'Nervous system regulation',
        body: 'We bring the system out of the cortisol-first operating mode.',
      },
      {
        step: '02',
        title: 'Subconscious pattern decoding',
        body: 'We name the safety pattern your body has been protecting against.',
      },
      {
        step: '03',
        title: 'Emotional reset',
        body: 'We release the charge your tissues have been storing.',
      },
      {
        step: '04',
        title: 'Identity recalibration',
        body: 'You integrate as the version of you whose body is allowed to feel safe.',
      },
    ],
    metaTitle: 'Health & Energy Intelligence | Dr. Suzanne Ravenall',
    metaDescription:
      'Your body is not broken — it is responding to patterns. Repattern the nervous system so energy, recovery and resilience return.',
  },
  {
    slug: 'identity-purpose-activation',
    title: 'Identity & Purpose Activation',
    shortDescription:
      'You don’t have a motivation problem. You have an identity pattern.',
    heroHeadline: 'You Don’t Have a Motivation Problem. You Have an Identity Pattern.',
    heroSubheadline:
      'You don’t act based on what you want. You act based on who you believe you are. Every choice is filtered through identity — and identity keeps you loyal to what feels true about you, even when it contradicts what you want next.',
    overview: [
      'If your identity says “stay invisible,” you play small no matter how big the goal.',
      'Your identity is built from past experiences, conditioning, and survival adaptations. Old moments defined who you think you must be to stay safe or valued. Roles you were praised or punished for convinced you that certain identities are “right.” You learned strategies — prove yourself, stay invisible, drift — that kept you safe then and run you now.',
      'This creates identity patterns like The Prover, The Invisible One, and The Drifter — patterns that hold you back, make you doubt your capability, and keep you in what feels familiar.',
    ],
    corePrinciple: 'Your life reflects your identity — not your goals.',
    discover: [
      {
        title: 'Decisions change',
        body: 'Action stops fighting the old identity story.',
      },
      {
        title: 'Confidence rises',
        body: 'You stop needing to prove — or hide — to feel safe.',
      },
      {
        title: 'Direction becomes clear',
        body: 'Purpose stops being abstract and becomes embodied.',
      },
      {
        title: 'You match where you’re going',
        body: 'You show up as the identity your next chapter actually needs.',
      },
    ],
    approach: [
      {
        step: '01',
        title: 'Nervous system regulation',
        body: 'We settle the system so a new identity is allowed to feel safe.',
      },
      {
        step: '02',
        title: 'Subconscious pattern decoding',
        body: 'We surface the identity pattern — Prover, Invisible One, Drifter — still running the show.',
      },
      {
        step: '03',
        title: 'Emotional reset',
        body: 'We release the original survival adaptation that built the old identity.',
      },
      {
        step: '04',
        title: 'Identity recalibration',
        body: 'You anchor the identity that matches where you’re actually going.',
      },
    ],
    metaTitle: 'Identity & Purpose Activation | Dr. Suzanne Ravenall',
    metaDescription:
      'You don’t have a motivation problem — you have an identity pattern. Shift the identity and behaviour follows.',
  },
]

export const topicBySlug = (slug: string): Topic | undefined =>
  topics.find((t) => t.slug === slug)

export const relatedTopics = (slug: string, count = 3): Topic[] => {
  const others = topics.filter((t) => t.slug !== slug)
  const startIndex = topics.findIndex((t) => t.slug === slug)
  const ordered = [
    ...others.slice(startIndex),
    ...others.slice(0, startIndex),
  ]
  return ordered.slice(0, count)
}
