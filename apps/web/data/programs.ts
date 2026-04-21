export type Program = {
  slug: string
  name: string
  category: 'practitioner' | 'self-paced' | 'live' | 'group'
  shortDescription: string
  description: string
  price?: string
  currency?: string
  duration?: string
  features: string[]
  isPublished: boolean
  isFeatured: boolean
}

export const PROGRAMS: Program[] = [
  // PRACTITIONER PROGRAMMES
  {
    slug: 'resonance-repatterning-basic-5-series',
    name: 'Resonance Repatterning Basic 5 Series',
    category: 'practitioner',
    shortDescription:
      'Unlock your subconscious blueprints and train as a certified Resonance Repatterning practitioner.',
    description:
      'Ever wondered why you work so hard at something and it simply doesn\'t materialise? A major cause of this is that our subconscious beliefs — mostly unknown to the conscious mind — are active in our everyday life, working hard at either being helpful or harmful, but mostly harmful and interfering with creating the life we want and deserve. This comprehensive 5-series training programme prepares you for certification as a Resonance Repatterning practitioner. Not only will your life be transformed, you will have the tools to help others transform theirs.',
    duration: 'Multi-session series (self-study + live accelerated class)',
    features: [
      'Full Basic 5 Training Series with demos',
      'Self-study online modules',
      'Accelerated live retaker class for certification',
      'Covers: Fundamentals, Primary Patterns, Unconscious Patterns, Chakra Patterns, 5 Elements & Meridians',
      'Internationally certified through the Resonance Repatterning Institute',
      'Run via Zoom — attend from anywhere in the world',
    ],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: 'resonance-repatterning-06-inner-cultivation',
    name: 'Resonance Repatterning 06: Inner Cultivation',
    category: 'practitioner',
    shortDescription:
      'Restore harmony between heaven and earth energies through the inner tradition of Chinese Acupuncture.',
    description:
      'The Inner Cultivation Programme focuses on exploring the depletion of our life energy due to subconscious negative beliefs and disturbed emotions. These issues often lead to suffering, illness, relationship problems, and a decline in overall mental and emotional wellbeing. Drawing from the inner tradition of Chinese Acupuncture, the healing process centres around restoring harmony between the heavenly yang and the earthly yin energies within ourselves and our lives.',
    duration: 'To be announced — dates coming soon',
    features: [
      'Deep exploration of the 12 meridians and life energy',
      'Subconscious belief clearing techniques',
      'Chinese Acupuncture inner tradition teachings',
      'Yin and yang energy harmonisation',
      'Group repatterning sessions via Zoom',
      'Certification pathway for practitioners',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'resonance-repatterning-08-principles-of-relationship',
    name: 'Resonance Repatterning 08: Principles of Relationship',
    category: 'practitioner',
    shortDescription:
      'Shift your relational resonance and create new neural connections for transformative ways of relating.',
    description:
      'In the realm of self-healing within our relationships, two vital elements come into play: shifting our resonance and embracing loving connections. By applying the powerful repatternings found in the Principles of Relationship programme, we get to resonate with new neural connections and memory imprints, paving the way for fresh and transformative ways of relating to take root.',
    duration: 'To be announced — dates coming soon',
    features: [
      'Neural connection repatterning for relationships',
      'Memory imprint transformation techniques',
      'Practitioner-level relationship repatterning skills',
      'Healing relational trauma at the energetic level',
      'Group repatterning and coaching sessions',
      'Certification pathway for practitioners',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'resonance-repatterning-09-energetics-of-relationship',
    name: 'Resonance Repatterning 09: Energetics of Relationship',
    category: 'practitioner',
    shortDescription:
      'Explore the electric circuit of human connection and resolve relational dysfunction at its energetic root.',
    description:
      'In the captivating journey of Energetics of Relationship, our connections with others are likened to the flow of electricity. It delves into the mysteries of attraction and why some people ignite a spark within us while others don\'t, even shedding light on why close relationships may lose their spark. This programme explores how quarrels, conflicts, childhood traumas, and intimacy issues can be tied to dysfunction in our "electric circuit" of relationships.',
    duration: 'To be announced — dates coming soon',
    features: [
      'Understanding the energetics of human attraction',
      'Clearing relational "circuit" dysfunction',
      'Childhood trauma and its relational impact',
      'Practitioner skills for working with couples and individuals',
      'Intimacy and conflict resolution repatterning',
      'Certification pathway for practitioners',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'energy-clearing-basic',
    name: 'Energy Clearing: Self Clearing Level 1 (Basic)',
    category: 'practitioner',
    shortDescription:
      'Learn to clear your own energy field and remove the hidden blocks that prevent your forward movement.',
    description:
      'We are physical and energetic beings. From a physical perspective we have many systems that carry information or fluid through our body — our circulatory system, lymph system, nervous system. Our energy system is the same: we have many channels that carry information and energy, but for most of us, we don\'t see this through the physical eye. There are countless scientific studies that support this. We mostly neglect our energy field in favour of our physical, and when we do clear our physical, it often neglects the countless underlying causes that prevent our forward movement.',
    duration: 'New date coming soon — self-study available now',
    features: [
      'Understand your personal energy field and its systems',
      'Identify and clear energetic blocks',
      'Self-clearing techniques you can use daily',
      'Scientific context for energy work',
      'Practical tools for ongoing energetic hygiene',
      'Foundation for the Advanced level',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'energy-clearing-advanced',
    name: 'Energy Clearing: Clearing Others Level 2 (Advanced)',
    category: 'practitioner',
    shortDescription:
      'Develop the skills to facilitate energetic clearing for others and support their healing journey.',
    description:
      'Building on the Basic level, this advanced programme trains you to work with other people\'s energy fields. We are physical and energetic beings, and our energy system has many channels that carry information and energy. Once you have mastered self-clearing, you are ready to extend this gift to others — facilitating their healing and clearing the blocks that have prevented their growth.',
    duration: 'New date coming soon — self-study available now',
    features: [
      'Advanced energy field assessment and clearing',
      'Techniques for clearing others safely and effectively',
      'Working with group and collective energy',
      'Protection and grounding for practitioners',
      'Integration with other healing modalities',
      'Practitioner certification pathway',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'akashic-navigator-basic',
    name: 'Akashic Navigator: Basic',
    category: 'practitioner',
    shortDescription:
      'Access the Akashic Records to read and clear the energetic blueprints shaping your life.',
    description:
      'For just one moment, imagine you had the ability to alter your relationship with success and everything happening in your life. Imagine having the ability to improve your intuition to such an extent that you receive daily guidance in the direction you are moving in. This is completely possible. The Akashic Records are the energetic records of all souls\' lives — a compendium of all events, thoughts, words, emotions, and intent ever to have occurred. Access and rewrite your life\'s blueprint through the Akashic Records.',
    duration: 'Live dates to be announced — self-study available now',
    features: [
      'Access and navigate the Akashic Records',
      'Read energetic imprints for yourself and others',
      'Clear ancestral patterns and constrictions',
      'Work with money, career, relationships, and purpose',
      'Develop and trust your intuitive guidance system',
      'Foundation for the Advanced Akashic Navigator programme',
    ],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: 'akashic-navigator-advanced',
    name: 'Akashic Navigator: Advanced',
    category: 'practitioner',
    shortDescription:
      'Deepen your Akashic mastery and develop the skills to guide others through their records.',
    description:
      'Building on the Basic Akashic Navigator, this advanced programme takes you deeper into working with the Akashic Records — both for yourself and for others. Imagine having the ability to improve your intuition to such an extent that you receive daily guidance in the direction you are moving in. Medical studies now show that ancestral patterns carried through our DNA can disrupt our lives unknowingly — all of which can be addressed through the Akashic Records.',
    duration: 'Live dates to be announced — self-study available now',
    features: [
      'Advanced Akashic reading and clearing techniques',
      'Facilitating Akashic sessions for clients',
      'DNA-level ancestral pattern clearing',
      'Working with past lives and soul contracts',
      'Business, career, and relationship Akashic navigation',
      'Akashic Intuitive Coach certification pathway',
    ],
    isPublished: true,
    isFeatured: false,
  },

  // SELF-PACED PROGRAMMES
  {
    slug: 'trauma-to-transcendence',
    name: 'Trauma to Transcendence',
    category: 'self-paced',
    shortDescription:
      'Break the hold of your childhood brain on your adult self and create a life of true freedom.',
    description:
      'Brain development is much more than a story about biology. From our earliest years, relationships with others play a key role in shaping how our brain grows and develops. From early experiences of neglect, lack of love or just not having our needs met, we generate beliefs — helpful and harmful. These early experiences trip us up in early childhood and impact our brain development in such a significant way. Fast forward to adult life: having forgotten about the decisions made, the adult finds potential is reduced and far too limiting and self-defeating. 95% of people experience some kind of trauma — most don\'t even recognise it. This programme changes that.',
    price: '299',
    currency: 'USD',
    duration: 'Self-paced online — access for as long as you need',
    features: [
      'Review your life from a different perspective and learn how to fix what is tripping you up',
      'Let go of the past with an abundance of tools to navigate your life differently',
      'Deep understanding of how your experiences have shaped your current actions',
      'Understand how your thoughts create your reality and learn to change them',
      'How to reprogramme your mind and nervous system',
      'Understand why you are here and replan what you want from your life',
      'Lifetime access to all recordings and materials',
    ],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: 'love-and-relationships',
    name: 'Love & Relationships',
    category: 'self-paced',
    shortDescription:
      'Attract a healthy, loving partner by first becoming your healthiest, most whole self.',
    description:
      'We attract people at our common level of woundedness or our common level of emotional health. This means that if you want to attract a healthy, loving partner, you need to become that healthy person first. This does not mean attaining some imagined level of perfection — it means the kind of energy you project has everything to do with the kind of person you attract. Through 6 repatterning sessions we explore how to shift from insecure to secure energy, from seeking to giving, from longing to loving.',
    duration: '6 sessions of 2 hours each — study at your own pace',
    features: [
      'Learn to accept, value and love yourself and define your own worth',
      'Connect with your inner resource of love, wisdom and strength',
      'Heal your fear of rejection and learn not to take rejection personally',
      'Heal your fear of engulfment by developing a strong, loving adult self',
      'Learn to be happy before you are in a relationship',
      'Shift from insecure energy (taker or caretaker) to secure, loving energy',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'intuition-in-my-personal-capacity',
    name: 'Intuition in My Personal Capacity',
    category: 'self-paced',
    shortDescription:
      'Activate your inner guidance system and use intuition to navigate every area of your personal life.',
    description:
      'To activate the Law of Attraction in your life, you must identify and change your limiting beliefs — particularly those about what is possible for you. Throughout our lives, since childhood, we\'ve created limiting beliefs that have been internalised over time and accepted as truth, even when they are not. This programme helps you develop and trust your intuition as a practical, daily guidance system for your personal life, relationships, health, and wellbeing.',
    duration: 'Self-paced online — coming soon',
    features: [
      'Identify and dissolve limiting beliefs about your potential',
      'Develop practical intuitive skills for everyday decision-making',
      'Learn to read your own energy signals accurately',
      'Apply intuition to health, relationships, and personal growth',
      'Build confidence in your inner knowing',
      'Access higher guidance for navigating life\'s challenges',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'intuition-in-business',
    name: 'Intuition in Business',
    category: 'self-paced',
    shortDescription:
      'Harness intuitive intelligence as a powerful business and leadership tool.',
    description:
      'Given the opportunity, pretty much everyone would love to accumulate more wealth, make more money, and live a more abundant life. However, many people have a poor relationship with money and as a result have trouble manifesting wealth. Financial success starts in the mind — and the number one thing holding people back is their belief system concerning wealth and money. This programme integrates intuitive intelligence with practical business application.',
    duration: 'Self-paced online — coming soon',
    features: [
      'Break limiting beliefs about money and business success',
      'Develop intuitive decision-making for business and leadership',
      'Identify and clear unconscious blocks to financial abundance',
      'Apply the Law of Attraction to business goals and opportunities',
      'Build a mindset for sustainable wealth creation',
      'Integrate intuition with strategy for aligned business growth',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'become-an-energy-ninja',
    name: 'Become an Energy Ninja',
    category: 'self-paced',
    shortDescription:
      'Master energy for an abundant life and become an unstoppable force in every area of your world.',
    description:
      'Everything starts as — and everything is — energy. Our body represents our personal reality, our very own "here and now," and if we are not present in it, the impact in the world is weak, even if our mind and ideas are very strong. In this programme, learn how to change your world by using an unseen force. Bring this force into every area of your life, change your world and become an unstoppable force. Mastering energy for an abundant life — Level 1.',
    duration: 'New date coming soon — self-paced available',
    features: [
      'Understand energy as the foundation of all reality',
      'Techniques for increasing and directing personal energy',
      'Clear energy drains and blocks in your daily life',
      'Bring energetic presence into every area of your life',
      'Build an energetic foundation for abundance and success',
      'Practical daily energy mastery tools',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'getting-unstuck',
    name: 'Getting Unstuck',
    category: 'self-paced',
    shortDescription:
      'Break free from the same cycles that have held you back — no matter what you\'ve tried before.',
    description:
      'Have you ever wanted to change? A different career, better health, improved body, better relationship — but in some way it escapes you? Can\'t seem to move forward no matter what you try? Have you tried numerous approaches, woken up with the burning inner knowing that you need to change, but you\'re stuck in the same cycle over and over again? If the answer to any of these questions is yes, then this is for you.',
    duration: 'Self-paced online',
    features: [
      'Identify the hidden patterns keeping you in the same cycle',
      'Practical tools to break through stuckness immediately',
      'Understand why previous attempts haven\'t worked',
      'Create lasting momentum towards the life you want',
      'Reprogram the subconscious beliefs that create stagnation',
      'Build confidence and clarity to take decisive action',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'finding-my-purpose',
    name: 'Finding My Purpose',
    category: 'self-paced',
    shortDescription:
      'Discover why you are here and realign with the deepest calling of your authentic self.',
    description:
      'To activate the Law of Attraction in your life, you must identify and change your limiting beliefs — particularly those about what you are meant to be and do. Throughout our lives, since childhood, we\'ve created limiting beliefs about our worth and potential that have been internalised over time and accepted as true even when they are not. This programme guides you through the process of uncovering your authentic purpose.',
    duration: 'Self-paced online — coming soon',
    features: [
      'Uncover your authentic life purpose through deep inner work',
      'Release the conditioning that has obscured your true calling',
      'Identify the unique gifts you are here to share with the world',
      'Align your daily life with your deepest values and desires',
      'Create a meaningful vision for your next chapter',
      'Build the courage and clarity to live your purpose fully',
    ],
    isPublished: true,
    isFeatured: false,
  },

  // LIVE PROGRAMMES
  {
    slug: 'mindfulness',
    name: 'Mindfulness',
    category: 'live',
    shortDescription:
      'Experience decreased stress, increased focus, and lasting happiness through mindfulness meditation practice.',
    description:
      'You may have heard that mindfulness — the ability to be fully present in the moment — can have numerous benefits, everything from decreased stress and sadness to increased levels of focus and happiness. But what exactly is mindfulness? And how can you recognise it and reap its many benefits? Mindfulness meditation practice is one way to truly experience the current moment and integrate that awareness into your everyday life. Suzanne\'s approach blends classical mindfulness with the deeper healing work of repatterning.',
    duration: 'Coming soon — watch this space',
    features: [
      'Practical mindfulness meditation techniques',
      'How to be fully present in daily life',
      'Reduce stress, anxiety, and reactivity',
      'Increase focus, clarity, and emotional resilience',
      'Integrate mindfulness into your existing routines',
      'Live sessions via Zoom with Suzanne',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'meditation',
    name: 'Meditation',
    category: 'live',
    shortDescription:
      'Train in awareness, gain a healthy sense of perspective, and begin to truly understand your inner world.',
    description:
      'Meditation isn\'t about becoming a different person, a new person, or even a better person. It\'s about training in awareness and getting a healthy sense of perspective. You\'re not trying to turn off your thoughts or feelings. You\'re learning to observe them without judgement. And eventually, you may start to better understand them as well. Suzanne\'s meditation sessions incorporate deep healing practices that go beyond standard mindfulness.',
    duration: 'Coming soon — watch this space',
    features: [
      'Learn to observe thoughts and feelings without judgement',
      'Establish a consistent and nourishing meditation practice',
      'Alpha state and deeper meditation techniques',
      'Working room and secret garden visualisation practices',
      'Facing the shadow — healing through meditation',
      'Live guided sessions with Suzanne via Zoom',
    ],
    isPublished: true,
    isFeatured: false,
  },

  // GROUP PROGRAMMES
  {
    slug: 'money-mastery',
    name: 'Money Mastery',
    category: 'group',
    shortDescription:
      'Dissolve your subconscious money blocks and build a coherent, abundant relationship with wealth.',
    description:
      'Given the opportunity, pretty much everyone would love to accumulate more wealth, make more money, and live a more abundant life. However, many people have a poor relationship with money and as a result have trouble manifesting wealth into their lives. Financial success starts in the mind, and the number one thing holding many people back is their belief system concerning wealth and money. Over 6 repatterning sessions we cover the beliefs, blocks, and new patterns needed to shift your relationship with money permanently.',
    duration: '6 sessions of 2 hours each over 6 weeks',
    features: [
      'Discover and dissolve your limiting beliefs about money',
      'Identify where these limiting beliefs come from and clear them',
      'Decide on your new relationship with money and how you want it manifested',
      'The power of intention applied to financial goals',
      'Make a plan, take responsibility, and act with aligned energy',
      'Recorded sessions available — same energetic benefit as live attendance',
    ],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: 'career-progression',
    name: 'Career Progression',
    category: 'group',
    shortDescription:
      'Align your career with your authentic potential and remove the blocks holding you back from your next level.',
    description:
      'To activate the Law of Attraction in your life, you must identify and change your limiting beliefs — particularly those about what you can achieve professionally. Throughout our lives, since childhood, we\'ve created limiting beliefs about our worth, capability, and potential that have been internalised over time and accepted as true, even when they are not. Over 6 repatterning sessions we move you towards being coherently aligned with the career that you desire.',
    duration: '6 sessions of 2 hours each over 6 weeks — live date coming soon',
    features: [
      'Discover the blocks preventing your career advancement',
      'Get clear about what career success truly means for you',
      'Remove limiting beliefs about your professional worth',
      'Making a plan and taking responsibility for your next step',
      'The power of intention applied to career goals',
      'Group repatterning and mini-coaching sessions',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'attraction-frequency',
    name: 'Attraction Frequency',
    category: 'group',
    shortDescription:
      'Raise your vibration, resonate with positivity, and learn to manifest what you truly desire.',
    description:
      'Come and join this Group Repatterning class and learn to resonate with the attraction frequency — manifest your own positivity, light, and love. How are you vibrating right now? How do you cope with your vibration in the world? How do you manage the challenges that arise — do you navigate around them and remain consistent, or do you hide, blame, and criticise when pushed into a corner? A vibration is a state of being, the atmosphere, or the energetic quality of a person, place, thought, or thing.',
    duration: '4-session series',
    features: [
      'Understand your current vibrational state and how to shift it',
      'Learn to resonate with the attraction frequency',
      'Manifest positivity, love, and abundance into your life',
      'Manage challenges without dropping your vibration',
      'Group repatterning for collective energetic shifts',
      'Practical tools for maintaining high vibration daily',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'develop-super-confidence',
    name: 'Develop Super Confidence',
    category: 'group',
    shortDescription:
      'Build unshakeable self-belief and the confidence to tackle every aspect of the life you want to create.',
    description:
      'Confidence within oneself is a complete game changer. As Henry Ford famously said: "Whether you think you can, or you think you can\'t — you\'re right." Most of us struggle to have the confidence to tackle the various aspects of our lives we know we need to address in order to create the life we truly want. We need confidence to speak up, to try new career opportunities, to embark on health programmes, and to make the choices that can be absolute game changers in our lives.',
    duration: '4-session series',
    features: [
      'Identify the root cause of your confidence blocks',
      'Reprogram self-doubt at the subconscious level',
      'Build a strong, stable sense of self-worth',
      'Develop the confidence to speak up, step up, and show up',
      'Group repatterning and coaching for accelerated shifts',
      'Practical confidence-building tools for everyday use',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'shedding-excess-weight',
    name: 'Shedding Excess Weight',
    category: 'group',
    shortDescription:
      'Release the emotional root causes of excess weight and create a body that reflects your true vitality.',
    description:
      'We hold onto excess weight because our earlier childhood needs were not met. We come up with incredible strategies to have our needs met in order to survive — our perception as a child — and then we bury them. They are most often not discovered throughout the average person\'s life. This programme goes beyond diet and exercise to address the deep emotional and energetic causes of weight retention.',
    duration: '4-session series — live date coming soon',
    features: [
      'Identify the childhood strategies creating weight retention',
      'Clear the emotional root causes of comfort eating and self-sabotage',
      'Reprogram your body image at the subconscious level',
      'Release shame and develop a loving relationship with your body',
      'Group repatterning for collective healing and support',
      'Recorded sessions available for self-study',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'being-a-great-boundary-setter',
    name: 'Being a Great Boundary Setter',
    category: 'group',
    shortDescription:
      'Learn to set, hold, and communicate boundaries from a place of love rather than fear.',
    description:
      'Setting boundaries can be one of the most challenging aspects of being human — something that 99% of all humans were not taught as they were growing up. We may have been taught "no" or had no boundaries ourselves, so it can feel completely alien. What is a boundary? How do I know when one has been transgressed? And how do I put one in place and hold it there? Through this 4-session series, part repatterning class and part coaching, find out what is underneath this behaviour and move into a new way of being.',
    duration: '4 sessions — live date coming soon',
    features: [
      'Understand what a boundary truly is and why it matters',
      'Identify when boundaries have been crossed and why you allow it',
      'Clear the childhood roots of boundary difficulties',
      'Set and maintain boundaries from love, not fear',
      'Communicate boundaries clearly and confidently',
      'Recorded sessions available for self-study',
    ],
    isPublished: true,
    isFeatured: false,
  },
]

export function getProgramBySlug(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug)
}

export function getProgramsByCategory(
  category: Program['category'],
): Program[] {
  return PROGRAMS.filter((p) => p.category === category && p.isPublished)
}
