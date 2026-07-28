// Programme catalogue — content and pricing sourced from:
// - docs/content-source/thinkific-wc-mapping.md (published Thinkific course list + USD prices)
// - infra/scripts/migrations/thinkific-products-seed.json (descriptions, usd_price, zar_price, Medusa handles)
// - infra/scripts/scraped-content/programmes.md (old-site programmes copy)
// - docs/content-source/services/akashic-intuitive-mastery.md (Akashic Records copy)
//
// NUMBERING NOTE: the site numbers the Resonance Repatterning relationship programmes
// 06 / 08 / 09 (Suzanne's numbering). Thinkific labels "Principles of Relationships" as
// "Program 7" — it is the SAME course; keep the site numbering here.

export type ProgramSeries =
  | 'resonance-repatterning'
  | 'energy-clearing'
  | 'akashic-navigator'

export type Program = {
  slug: string
  image: string
  name: string
  category: 'practitioner' | 'self-paced' | 'live' | 'group'
  /** Practitioner parent block this programme belongs to (practitioner category only) */
  series?: ProgramSeries
  shortDescription: string
  description: string
  /** Price in USD (from Thinkific). */
  priceUsd?: number
  /** Price in ZAR (from the WooCommerce/Medusa catalogue). */
  priceZar?: number
  /** Medusa product handle for the purchasable variant — CTA links to /shop/{shopHandle}. */
  shopHandle?: string
  duration?: string
  features: string[]
  isPublished: boolean
  isFeatured: boolean
}

export const PROGRAMS: Program[] = [
  // ── PRACTITIONER — Resonance Repatterning (all currently offered self-study) ──
  {
    slug: 'resonance-repatterning-basic-5-series',
    image: '/images/products/resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom.jpeg',
    name: 'The Basic Five (Programs 1–5)',
    category: 'practitioner',
    series: 'resonance-repatterning',
    shortDescription:
      'Unlock your subconscious blueprints and train as a certified Resonance Repatterning practitioner.',
    description:
      'Ever wondered why you work so hard at something and it simply doesn\'t materialise? A major cause of this is that our subconscious beliefs — mostly unknown to the conscious mind — are active in our everyday life, working hard at either being helpful or harmful, but mostly harmful and interfering with creating the life we want and deserve. This comprehensive 5-series training programme prepares you for certification as a Resonance Repatterning practitioner. Not only will your life be transformed, you will have the tools to help others transform theirs.',
    priceUsd: 2540,
    priceZar: 13950,
    shopHandle: 'resonance-repatterning-full-basic-5-series-demo-s-self-study-online-with-mentoring',
    duration: 'Self-study — start anytime',
    features: [
      'Full Basic Five training series (Programs 1–5) with practical demos',
      'Self-study online modules — work through at your own pace',
      'All repatternings as demos / talk-throughs, plus resources',
      'Covers: Fundamentals, Primary Patterns, Unconscious Patterns, Chakra Patterns, 5 Elements & Meridians',
      'Internationally certified through the Resonance Repatterning Institute',
      'Study online from anywhere in the world',
    ],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: 'resonance-repatterning-06-inner-cultivation',
    image: '/images/generated/explore-repatterning.webp',
    name: 'Program 6: Inner Cultivation',
    category: 'practitioner',
    series: 'resonance-repatterning',
    shortDescription:
      'Restore harmony between heaven and earth energies through the inner tradition of Chinese Acupuncture.',
    description:
      'The Inner Cultivation Programme focuses on exploring the depletion of our life energy due to subconscious negative beliefs and disturbed emotions. These issues often lead to suffering, illness, relationship problems, and a decline in overall mental and emotional wellbeing. Drawing from the inner tradition of Chinese Acupuncture, the healing process centres around restoring harmony between the heavenly yang and the earthly yin energies within ourselves and our lives.',
    priceUsd: 550,
    priceZar: 4205,
    shopHandle: 'resonance-repatterning-inner-cultivation-self-study',
    duration: 'Self-study — start anytime',
    features: [
      'Deep exploration of the 12 meridians and life energy',
      'Subconscious belief clearing techniques',
      'Chinese Acupuncture inner tradition teachings',
      'Yin and yang energy harmonisation',
      'Practical repatterning sessions and demos included',
      'Certification pathway for practitioners',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'resonance-repatterning-08-principles-of-relationship',
    image: '/images/products/resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study.jpeg',
    name: 'Program 8: Principles of Relationship',
    category: 'practitioner',
    series: 'resonance-repatterning',
    shortDescription:
      'Shift your relational resonance and create new neural connections for transformative ways of relating.',
    description:
      'In the realm of self-healing within our relationships, two vital elements come into play: shifting our resonance and embracing loving connections. By applying the powerful repatternings found in the Principles of Relationship programme, we get to resonate with new neural connections and memory imprints, paving the way for fresh and transformative ways of relating to take root.',
    priceUsd: 550,
    priceZar: 5315,
    shopHandle: 'resonance-repatterning-program-7-principle-of-relationships-self-study',
    duration: 'Self-study — start anytime',
    features: [
      'Neural connection repatterning for relationships',
      'Memory imprint transformation techniques',
      'Practitioner-level relationship repatterning skills',
      'Healing relational trauma at the energetic level',
      'Practical repatterning sessions and demos included',
      'Certification pathway for practitioners',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'resonance-repatterning-09-energetics-of-relationship',
    image: '/images/products/resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study.jpeg',
    name: 'Program 9: Energetics of Relationship',
    category: 'practitioner',
    series: 'resonance-repatterning',
    shortDescription:
      'Explore the electric circuit of human connection and resolve relational dysfunction at its energetic root.',
    description:
      'In the captivating journey of Energetics of Relationship, our connections with others are likened to the flow of electricity. It delves into the mysteries of attraction and why some people ignite a spark within us while others don\'t, even shedding light on why close relationships may lose their spark. This programme explores how quarrels, conflicts, childhood traumas, and intimacy issues can be tied to dysfunction in our "electric circuit" of relationships.',
    priceUsd: 550,
    priceZar: 5315,
    shopHandle: 'resonance-repatterning-program-9-energetics-of-relationships-self-study',
    duration: 'Self-study — start anytime',
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

  // ── PRACTITIONER — Energy Clearing ──
  {
    slug: 'energy-clearing-basic',
    image: '/images/products/deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom.png',
    name: 'Energy Clearing: Self Clearing Level 1 (Basic)',
    category: 'practitioner',
    series: 'energy-clearing',
    shortDescription:
      'Learn to clear your own energy field and remove the hidden blocks that prevent your forward movement.',
    description:
      'We are physical and energetic beings. From a physical perspective we have many systems that carry information or fluid through our body — our circulatory system, lymph system, nervous system. Our energy system is the same: we have many channels that carry information and energy, but for most of us, we don\'t see this through the physical eye. There are countless scientific studies that support this. We mostly neglect our energy field in favour of our physical, and when we do clear our physical, it often neglects the countless underlying causes that prevent our forward movement.',
    priceUsd: 350,
    priceZar: 7860,
    shopHandle: 'art-of-deep-clearing-level-1-self-study',
    duration: 'Live via Zoom — new date coming soon; self-study available now',
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
    image: '/images/products/deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom.png',
    name: 'Energy Clearing: Clearing Others Level 2 (Advanced)',
    category: 'practitioner',
    series: 'energy-clearing',
    shortDescription:
      'Develop the skills to facilitate energetic clearing for others and support their healing journey.',
    description:
      'Building on the Basic level, this advanced programme trains you to work with other people\'s energy fields. We are physical and energetic beings, and our energy system has many channels that carry information and energy. Once you have mastered self-clearing, you are ready to extend this gift to others — facilitating their healing and clearing the blocks that have prevented their growth.',
    priceUsd: 350,
    priceZar: 7860,
    shopHandle: 'art-of-deep-clearing-level-2-self-study',
    duration: 'Live via Zoom — new date coming soon; self-study available now',
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

  // ── PRACTITIONER — Akashic Navigator ──
  {
    slug: 'akashic-navigator-basic',
    image: '/images/products/akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom.png',
    name: 'Akashic Navigator: Basic',
    category: 'practitioner',
    series: 'akashic-navigator',
    shortDescription:
      'Access and rewrite your life\'s blueprint through the Akashic Records — and create the future that you desire.',
    description:
      'For a moment, just one moment, imagine you had the ability to alter your relationship with success and everything happening in your life. Imagine having the ability to improve your intuition to such an extent that you receive daily guidance in the direction you are moving in. This is completely possible. The Akashic Records are the energetic records of all souls\' lives — a compendium of all events, thoughts, words, emotions, and intent ever to have occurred. Each soul has its own Akashic Record, like a series of books with each book representing one lifetime. Your problems are not happening in a haphazard manner, and they are not meaningless roadblocks — your life is working even when you don\'t think so, and you can move through it with less resistance and more expansion when you understand it. In this Fundamentals programme (Clearing Self, Level 1) you learn to access your own records: reading them to receive information, and clearing the blocks, constrictions and ancestral patterns affecting this lifetime.',
    priceUsd: 500,
    priceZar: 10295,
    shopHandle: 'akashic-navigator-and-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom',
    duration: 'Live via Zoom — dates to be announced; self-study available now',
    features: [
      'Learn to access and read your own Akashic Record',
      'Clear blocks, constrictions and ancestral patterns affecting this lifetime',
      'Work on money, finances and abundance',
      'Work on career, purpose and romantic relationships',
      'Strengthen your relationship with self, friendships and family',
      'Receive daily intuitive guidance for the direction you are moving in',
    ],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: 'akashic-navigator-advanced',
    image: '/images/products/akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom.jpeg',
    name: 'Akashic Navigator: Advanced',
    category: 'practitioner',
    series: 'akashic-navigator',
    shortDescription:
      'Learn to read the Akashic Records for others and help them navigate life with wisdom and ease.',
    description:
      'Learn to read the Akashic Records for others — learn why they are here, their past and much more, and learn how to help others navigate life with much more wisdom and ease, with key answers to critical questions. The Akashic Records are an amazing resource to help you see beyond the veil, to clear disruption in a person\'s path and navigate life, business, career and relationships with much greater ease. Many medical studies now show that ancestral patterns carried through our DNA can disrupt our lives unknowingly — all of which can be addressed through the Akashic Records. Building on the Fundamentals level, this Advanced programme (Clearing Others, Level 2) develops the reading and clearing skills to work with clients.',
    priceUsd: 500,
    priceZar: 10295,
    shopHandle: 'akashic-navigator-and-intuitive-coaching-clearing-others-level-2-advanced-live-via-zoom',
    duration: 'Live via Zoom — dates to be announced; self-study available now',
    features: [
      'Learn to read the Akashic Records for others',
      'Discover why clients are here, their past, and answers to critical questions',
      'Clear blocks, constrictions and ancestral patterns for others',
      'Address ancestral patterns carried through DNA',
      'Help others navigate life, business, career and relationships with greater ease',
      'Akashic Navigator & Intuitive Coach certification pathway',
    ],
    isPublished: true,
    isFeatured: false,
  },

  // ── SELF-STUDY PROGRAMMES ──
  {
    slug: 'trauma-to-transcendence',
    image: '/images/products/trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-your-adult-self-live.jpeg',
    name: 'Trauma to Transcendence',
    category: 'self-paced',
    shortDescription:
      'Break the hold of your childhood brain on your adult self and create a life of true freedom.',
    description:
      'Brain development is much more than a story about biology. From our earliest years, relationships with others play a key role in shaping how our brain grows and develops. From early experiences of neglect, lack of love or just not having our needs met, we generate beliefs — helpful and harmful. These early experiences trip us up in early childhood and impact our brain development in such a significant way. Fast forward to adult life: having forgotten about the decisions made, the adult finds potential is reduced and far too limiting and self-defeating. 95% of people experience some kind of trauma — most don\'t even recognise it. This programme changes that.',
    priceUsd: 220,
    priceZar: 3320,
    shopHandle: 'new-trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-your-adult-self-self-study-online',
    duration: 'Self-study online — access for as long as you need',
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
    image: '/images/products/love-relationships-live.jpeg',
    name: 'Love & Relationships',
    category: 'self-paced',
    shortDescription:
      'Attract a healthy, loving partner by first becoming your healthiest, most whole self.',
    description:
      'We attract people at our common level of woundedness or our common level of emotional health. This means that if you want to attract a healthy, loving partner, you need to become that healthy person first. This does not mean attaining some imagined level of perfection — it means the kind of energy you project has everything to do with the kind of person you attract. Through 6 repatterning sessions we explore how to shift from insecure to secure energy, from seeking to giving, from longing to loving.',
    priceUsd: 220,
    priceZar: 1610,
    shopHandle: 'love-relationships-self-study',
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
    image: '/images/products/intuition-in-my-personal-capacity-live.png',
    name: 'Intuition in My Personal Capacity',
    category: 'self-paced',
    shortDescription:
      'Activate your inner guidance system and use intuition to navigate every area of your personal life.',
    description:
      'To activate the Law of Attraction in your life, you must identify and change your limiting beliefs — particularly those about what is possible for you. Throughout our lives, since childhood, we\'ve created limiting beliefs that have been internalised over time and accepted as truth, even when they are not. This programme helps you develop and trust your intuition as a practical, daily guidance system for your personal life, relationships, health, and wellbeing.',
    priceUsd: 220,
    priceZar: 1610,
    shopHandle: 'intuition-in-my-personal-capacity-1-self-study',
    duration: 'Self-study online — start anytime',
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
    image: '/images/focus/mindset.webp',
    name: 'Intuition in Business',
    category: 'self-paced',
    shortDescription:
      'Harness intuitive intelligence as a powerful business and leadership tool.',
    description:
      'Given the opportunity, pretty much everyone would love to accumulate more wealth, make more money, and live a more abundant life. However, many people have a poor relationship with money and as a result have trouble manifesting wealth. Financial success starts in the mind — and the number one thing holding people back is their belief system concerning wealth and money. This programme integrates intuitive intelligence with practical business application.',
    priceUsd: 220,
    priceZar: 1610,
    shopHandle: 'intuition-in-my-business-capacity-self-study',
    duration: 'Self-study online — start anytime',
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
    image: '/images/products/be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live.jpeg',
    name: 'Become an Energy Ninja — Level 1',
    category: 'self-paced',
    shortDescription:
      'Master energy for an abundant life and become an unstoppable force in every area of your world.',
    description:
      'Everything starts as — and everything is — energy. Our body represents our personal reality, our very own "here and now," and if we are not present in it, the impact in the world is weak, even if our mind and ideas are very strong. In this programme, learn how to change your world by using an unseen force. Bring this force into every area of your life, change your world and become an unstoppable force. Mastering energy for an abundant life — Level 1.',
    priceUsd: 220,
    priceZar: 4980,
    shopHandle: 'be-an-energy-ninja-level-1-self-study',
    duration: 'Self-study online — start anytime',
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
    slug: 'become-an-energy-ninja-level-2',
    image: '/images/products/be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live.png',
    name: 'Become an Energy Ninja — Level 2',
    category: 'self-paced',
    shortDescription:
      'Energy practices for repatterning your life — the next level of mastering energy for an abundant life.',
    description:
      'Level 2 of Mastering Energy for an Abundant Life: energy practices for repatterning your life. Building directly on Level 1, this programme takes the foundational truth that everything starts as — and everything is — energy, and turns it into daily practice. Deepen the energy work begun in Level 1, strengthen your energetic presence, and apply this unseen force deliberately to repattern every area of your life.',
    priceUsd: 220,
    priceZar: 4980,
    shopHandle: 'be-an-energy-ninja-mastering-energy-for-an-abundant-life-level-2-energy-practices-for-repatterning-your-life-self-study',
    duration: 'Self-study online — start anytime',
    features: [
      'Daily energy practices for repatterning your life',
      'Deepen the energy mastery foundations from Level 1',
      'Strengthen your energetic presence in the world',
      'Apply energy work to health, abundance, relationships and purpose',
      'Practical practices you can integrate into everyday routines',
      'Study at your own pace with ongoing access',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'getting-unstuck',
    image: '/images/products/getting-unstuck-self-study.png',
    name: 'Getting Unstuck',
    category: 'self-paced',
    shortDescription:
      'Break free from the same cycles that have held you back — no matter what you\'ve tried before.',
    description:
      'Have you ever wanted to change? A different career, better health, improved body, better relationship — but in some way it escapes you? Can\'t seem to move forward no matter what you try? Have you tried numerous approaches, woken up with the burning inner knowing that you need to change, but you\'re stuck in the same cycle over and over again? If the answer to any of these questions is yes, then this is for you. At a high level, learn how the system functions to produce stuckness or flow, what\'s underneath that stuckness, how to identify the patterns that hold us back, where these patterns come from, and how to start the journey of overcoming stuckness.',
    priceUsd: 110,
    priceZar: 1660,
    shopHandle: 'getting-unstuck',
    duration: 'Self-study online — start anytime',
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
    image: '/images/products/finding-my-life-purpose-live.png',
    name: 'Finding My Purpose',
    category: 'self-paced',
    shortDescription:
      'Discover why you are here and realign with the deepest calling of your authentic self.',
    description:
      'To activate the Law of Attraction in your life, you must identify and change your limiting beliefs — particularly those about what you are meant to be and do. Throughout our lives, since childhood, we\'ve created limiting beliefs about our worth and potential that have been internalised over time and accepted as true even when they are not. This programme guides you through the process of uncovering your authentic purpose.',
    priceUsd: 220,
    priceZar: 995,
    shopHandle: 'finding-my-life-purpose-self-study',
    duration: 'Self-study online — start anytime',
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
  {
    slug: 'coherence-muscle-testing',
    image: '/images/products/coherence-muscle-testing-self-study-online-2.jpeg',
    name: 'Coherence Muscle Testing',
    category: 'self-paced',
    shortDescription:
      '"It\'s like having your own personal guru at the end of your arms" — learn the technique that reveals what is life-enhancing and life-depleting for your body-mind system.',
    description:
      'With this simple technique we can dive deeply into the unconscious and figure out disrupting patterns in a second — right to their core — and help others do the same. You can change a mood in a second. Muscle checking helps us check what is life-enhancing and life-depleting for our body-mind system, and what we resonate with that is helpful or harmful. We can discover blockages preventing our movement or life-depleting habits, find out what we need to move in a positive direction, even what is holding us back, or why something in our life doesn\'t seem to want to manifest. When we use our own inner guru as the guiding force in this way, we simply can\'t go wrong. This is an invaluable tool that everyone should have.',
    priceUsd: 110,
    priceZar: 1610,
    shopHandle: 'coherence-muscle-testing-self-study-online',
    duration: 'Self-study online — start anytime',
    features: [
      'Learn accurate coherence muscle checking step by step',
      'Identify what is life-enhancing and life-depleting for your body-mind system',
      'Uncover disrupting patterns in seconds — right to their core',
      'Discover the blockages preventing your forward movement',
      'Find out why something in your life doesn\'t seem to want to manifest',
      'Use your own inner guidance as a daily decision-making tool',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'rapid-repatterning-introduction',
    image: '/images/products/rapid-repatterning-session.jpeg',
    name: 'Rapid Repatterning: An Introduction',
    category: 'self-paced',
    shortDescription:
      'Discover what sits underneath the stuckness you feel — and how to start the journey of overcoming it.',
    description:
      'An introduction to Rapid Repatterning. At a high level: what\'s underneath that stuckness we feel, how to identify the patterns that hold us back, where these patterns come from, and how to start the journey of overcoming stuckness.',
    priceUsd: 99,
    priceZar: 1995,
    shopHandle: 'rapid-repatterning-session-introduction',
    duration: 'Self-study online — start anytime',
    features: [
      'Understand what sits underneath the stuckness you feel',
      'Identify the patterns that hold you back',
      'Learn where these patterns come from',
      'Start the journey of overcoming stuckness',
      'An accessible introduction to Suzanne\'s Rapid Repatterning method',
      'Watch in your own time, as often as you need',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'post-traumatic-growth',
    image: '/images/products/post-traumatic-growth-self-study-online.png',
    name: 'Post-Traumatic Growth',
    category: 'self-paced',
    shortDescription:
      'Trauma shakes up our world — and right there is the opportunity to change.',
    description:
      'Trauma or stress shakes up our world and forces us to take another look at our goals and dreams — and right there is the opportunity to change. Struggling to get moving? Here are some tips and techniques to get moving.',
    priceUsd: 15,
    priceZar: 220,
    shopHandle: 'post-traumatic-growth',
    duration: 'Self-study online — recorded presentation',
    features: [
      'Understand how trauma and stress reshape our goals and dreams',
      'Recognise the opportunity for change inside adversity',
      'Practical tips and techniques to get moving again',
      'Recorded presentation by Dr. Suzanne Ravenall',
      'Watch in your own time, as often as you need',
    ],
    isPublished: true,
    isFeatured: false,
  },

  // ── LIVE PROGRAMMES ──
  {
    slug: 'mindfulness',
    image: '/images/products/mindfulness-live.png',
    name: 'Mindfulness',
    category: 'live',
    shortDescription:
      'Experience decreased stress, increased focus, and lasting happiness through mindfulness meditation practice.',
    description:
      'You may have heard that mindfulness — the ability to be fully present in the moment — can have numerous benefits, everything from decreased stress and sadness to increased levels of focus and happiness. But what exactly is mindfulness? And how can you recognise it and reap its many benefits? Mindfulness meditation practice is one way to truly experience the current moment and integrate that awareness into your everyday life. Suzanne\'s approach blends classical mindfulness with the deeper healing work of repatterning.',
    priceUsd: 440,
    priceZar: 2770,
    shopHandle: 'mindfulness-live-via-zoom',
    duration: 'Live via Zoom — new dates to be announced',
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
    image: '/images/products/meditation-live-via-zoom.jpeg',
    name: 'Meditation',
    category: 'live',
    shortDescription:
      'Train in awareness, gain a healthy sense of perspective, and begin to truly understand your inner world.',
    description:
      'Meditation isn\'t about becoming a different person, a new person, or even a better person. It\'s about training in awareness and getting a healthy sense of perspective. You\'re not trying to turn off your thoughts or feelings. You\'re learning to observe them without judgement. And eventually, you may start to better understand them as well. Suzanne\'s meditation sessions incorporate deep healing practices that go beyond standard mindfulness.',
    priceUsd: 440,
    priceZar: 2770,
    shopHandle: 'meditation-self-study',
    duration: 'Live via Zoom — new dates to be announced',
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

  // ── RECORDED GROUP SESSIONS (Resonance Repatterning group session recordings) ──
  {
    slug: 'money-mastery',
    image: '/images/products/money-mastery-group-session.png',
    name: 'Money Mastery',
    category: 'group',
    shortDescription:
      'Dissolve your subconscious money blocks and build a coherent, abundant relationship with wealth.',
    description:
      'Given the opportunity, pretty much everyone would love to accumulate more wealth, make more money, and live a more abundant life. However, many people have a poor relationship with money and as a result have trouble manifesting wealth into their lives. Financial success starts in the mind, and the number one thing holding many people back is their belief system concerning wealth and money. Over 6 repatterning sessions we cover the beliefs, blocks, and new patterns needed to shift your relationship with money permanently.',
    priceUsd: 90,
    priceZar: 1500,
    duration: 'Recorded series — 6 sessions of 2 hours each',
    features: [
      'Discover and dissolve your limiting beliefs about money',
      'Identify where these limiting beliefs come from and clear them',
      'Decide on your new relationship with money and how you want it manifested',
      'The power of intention applied to financial goals',
      'Make a plan, take responsibility, and act with aligned energy',
      'Recorded sessions — the same energetic benefit as live attendance',
    ],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: 'career-progression',
    image: '/images/products/career-progression-group-session.png',
    name: 'Career Progression',
    category: 'group',
    shortDescription:
      'Align your career with your authentic potential and remove the blocks holding you back from your next level.',
    description:
      'To activate the Law of Attraction in your life, you must identify and change your limiting beliefs — particularly those about what you can achieve professionally. Throughout our lives, since childhood, we\'ve created limiting beliefs about our worth, capability, and potential that have been internalised over time and accepted as true, even when they are not. Over 6 repatterning sessions we move you towards being coherently aligned with the career that you desire.',
    priceUsd: 90,
    priceZar: 1500,
    duration: 'Recorded series — 6 sessions of 2 hours each',
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
    image: '/images/products/group-session-attraction-frequency-recorded.png',
    name: 'Attraction Frequency',
    category: 'group',
    shortDescription:
      'Raise your vibration, resonate with positivity, and learn to manifest what you truly desire.',
    description:
      'Join this group repatterning series and learn to resonate with the attraction frequency — manifest your own positivity, light, and love. How are you vibrating right now? How do you cope with your vibration in the world? How do you manage the challenges that arise — do you navigate around them and remain consistent, or do you hide, blame, and criticise when pushed into a corner? A vibration is a state of being, the atmosphere, or the energetic quality of a person, place, thought, or thing.',
    priceUsd: 90,
    priceZar: 1500,
    duration: 'Recorded series — 4 sessions',
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
    image: '/images/products/group-session-develop-super-confidence.png',
    name: 'Develop Super Confidence',
    category: 'group',
    shortDescription:
      'Build unshakeable self-belief and the confidence to tackle every aspect of the life you want to create.',
    description:
      'Confidence within oneself is a complete game changer. As Henry Ford famously said: "Whether you think you can, or you think you can\'t — you\'re right." Most of us struggle to have the confidence to tackle the various aspects of our lives we know we need to address in order to create the life we truly want. We need confidence to speak up, to try new career opportunities, to embark on health programmes, and to make the choices that can be absolute game changers in our lives.',
    priceUsd: 90,
    priceZar: 1500,
    duration: 'Recorded series — 4 sessions',
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
    image: '/images/products/group-session-shedding-excess-weight.png',
    name: 'Shedding Excess Weight',
    category: 'group',
    shortDescription:
      'Release the emotional root causes of excess weight and create a body that reflects your true vitality.',
    description:
      'We hold onto excess weight because our earlier childhood needs were not met. We come up with incredible strategies to have our needs met in order to survive — our perception as a child — and then we bury them. They are most often not discovered throughout the average person\'s life. In order to shed excess weight on the outside, we need to focus on shedding the excess weight on the inside. This programme goes beyond diet and exercise to address the deep emotional and energetic causes of weight retention.',
    priceUsd: 90,
    priceZar: 1500,
    shopHandle: 'resonance-repatterning-group-session-shedding-excess-weight',
    duration: 'Recorded series — 6 group repatterning sessions over 4 weeks',
    features: [
      'Identify the childhood strategies creating weight retention',
      'Clear the emotional root causes of comfort eating and self-sabotage',
      'Reprogram your body image at the subconscious level',
      'Release shame and develop a loving relationship with your body',
      'Group repatterning for collective healing and support',
      'Recorded sessions — work through the series in your own time',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'being-a-great-boundary-setter',
    image: '/images/products/group-session-being-a-great-boundary-setter-booked-as-a-series-only.png',
    name: 'Being a Great Boundary Setter',
    category: 'group',
    shortDescription:
      'Learn to set, hold, and communicate boundaries from a place of love rather than fear.',
    description:
      'Setting boundaries can be one of the most challenging aspects of being human — something that 99% of all humans were not taught as they were growing up. We may have been taught "no" or had no boundaries ourselves, so it can feel completely alien. What is a boundary? How do I know when one has been transgressed? And how do I put one in place and hold it there? Through this 4-session series, part repatterning class and part coaching, find out what is underneath this behaviour and move into a new way of being.',
    priceUsd: 90,
    priceZar: 1500,
    shopHandle: 'resonance-repatterning-group-session-boundary-setting',
    duration: 'Recorded series — 4 sessions',
    features: [
      'Understand what a boundary truly is and why it matters',
      'Identify when boundaries have been crossed and why you allow it',
      'Clear the childhood roots of boundary difficulties',
      'Set and maintain boundaries from love, not fear',
      'Communicate boundaries clearly and confidently',
      'Recorded sessions — work through the series in your own time',
    ],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'nice-or-not-nice-communication',
    image: '/images/products/group-session-nice-or-not-nice-in-communication-booked-as-a-series-only.jpeg',
    name: 'Nice or Not Nice Communication',
    category: 'group',
    shortDescription:
      'Release the fear behind communication and learn when to be tough — and when not to be.',
    description:
      'Join us for this part coaching, part group repatterning session series to release the fear behind communication — knowing when to be tough or not, and being challenged in being neutral. Learn to say what needs to be said from a place of clarity and neutrality, rather than fear, appeasement, or aggression.',
    priceUsd: 90,
    priceZar: 1500,
    shopHandle: 'resonance-repatterning-group-session-communication',
    duration: 'Recorded group session series',
    features: [
      'Release the fear behind communication',
      'Know when to be tough — and when not to be',
      'Practise staying neutral when challenged',
      'Part coaching, part group repatterning',
      'Recorded sessions — work through the series in your own time',
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

export function getProgramsBySeries(series: ProgramSeries): Program[] {
  return PROGRAMS.filter((p) => p.series === series && p.isPublished)
}

export function isResonanceRepatterning(program: Program): boolean {
  return program.series === 'resonance-repatterning'
}

/**
 * Related programmes for the "You might also like" block.
 *
 * Resonance Repatterning is NOT Suzanne's own programme, so it must never be
 * cross-promoted from non-RR detail pages. On RR pages themselves, relating
 * other RR programmes is fine.
 */
export function getRelatedPrograms(program: Program, limit = 3): Program[] {
  const published = PROGRAMS.filter(
    (p) => p.isPublished && p.slug !== program.slug,
  )

  if (isResonanceRepatterning(program)) {
    return published
      .filter((p) => p.category === program.category)
      .slice(0, limit)
  }

  const categoryMates = published.filter(
    (p) => p.category === program.category && !isResonanceRepatterning(p),
  )
  const inHouseFill = published.filter(
    (p) =>
      p.category !== program.category &&
      !isResonanceRepatterning(p) &&
      (p.category === 'self-paced' || p.category === 'live' || p.category === 'group'),
  )
  return [...categoryMates, ...inHouseFill].slice(0, limit)
}
