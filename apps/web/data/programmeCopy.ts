import { ph, type RichLine } from '@/lib/content/richLine'
import type { ProgramSeries } from '@/data/programs'

/**
 * Long-form programme pages from Suzanne's 8 Nov copy documents, verbatim:
 * 03 Energy Clearing Certification (Level 1, Level 2), 04 Akashic Navigator
 * Certification (Level 1, Level 2), 05 The Inner Sanctuary, 06 Present.
 * Her [square bracket] placeholders stay visible (ph(...)) with the person
 * who fills them. A programme with an entry here renders the long-form page
 * (components/programs/ProgrammeLongForm.tsx); the rest keep the generic one.
 */

export interface ProgrammeCopy {
  /** Header eyebrow from her document, e.g. "Self-Study · AADP Accredited". */
  eyebrow: string
  /** Level name shown above the programme name, e.g. "Level 1 · Foundations". */
  level?: string
  /** Bold opening line of "What This Programme Is". */
  lead: string
  whatItIs: string[]
  /** Bold closing line of "What This Programme Is". */
  whatItIsClosing?: string
  /** Present: "Why This Programme Is Different", right after what it is. */
  different?: { heading: string; paragraphs: string[] }
  whoHeading: string
  whoIntro: string
  who: string[]
  whoNote?: string
  learn: { title: string; body: RichLine }[]
  after: { title: string; body: string }[]
  /** "Programme Details" rows; 'price' renders the visitor-currency price. */
  details: { label: string; value: RichLine | 'price' }[]
  /** "What's Included" (her 8 Nov mail): lesson and video counts first. */
  whatsIncluded?: RichLine[]
  certification?: { heading: string; lead?: string; paragraphs: RichLine[] }
  /** Bold-labelled scope line ("Scope of practice:") or a plain disclaimer. */
  scope?: { label?: string; text: string }
  /** Present: "Looking to go deeper? The Inner Sanctuary..." */
  closingNote?: RichLine
  /** Her button label ("Enrol in Level 1", "Register Your Interest"). */
  ctaLabel: string
}

/** The level ladder for a practitioner series, shown on both levels. */
export interface SeriesPath {
  heading: string
  steps: { label: string; text: string; slug: string }[]
  note: string
}

const AADP_CERT_PENDING = ph('AADP board certification is applied for directly with the AADP, and a separate AADP fee applies.', 'Suzanne')

export const SERIES_PATHS: Partial<Record<ProgramSeries, SeriesPath>> = {
  'energy-clearing': {
    heading: 'Your Path to Practitioner',
    steps: [
      { label: 'Level 1 · Foundations', text: 'spot, track and clear dense energy in your own system.', slug: 'energy-clearing-basic' },
      { label: 'Level 2 · Advanced', text: 'spot, track and clear dense energy for others, as a certified practitioner.', slug: 'energy-clearing-advanced' },
    ],
    note: 'Level 1 is the required foundation for Level 2.',
  },
  'akashic-navigator': {
    heading: 'Your Path to Akashic Navigator',
    steps: [
      { label: 'Level 1 · Navigating Your Own Records', text: 'open, read and work with your own Akashic Records.', slug: 'akashic-navigator-basic' },
      { label: 'Level 2 · Navigating for Others', text: 'read the Records for clients, as a certified Akashic Navigator.', slug: 'akashic-navigator-advanced' },
    ],
    note: 'Level 1 is the required foundation for Level 2.',
  },
}

export const PROGRAMME_COPY: Record<string, ProgrammeCopy> = {
  // ── 03 Energy Clearing, Level 1 ───────────────────────────────────────────
  'energy-clearing-basic': {
    eyebrow: 'Self-Study · AADP Accredited',
    level: 'Level 1 · Foundations',
    lead: 'You are more than a physical body. You are an electrical, energetic system.',
    whatItIs: [
      'Every heartbeat generates an electromagnetic field that can be measured beyond the body. Every thought sends electrical signals across the brain. Every cell carries a charge. Medicine already measures this electrical activity with the ECG and the EEG. You are an energetic being as well as a physical one.',
      "When your energy flows freely, you feel clear, light and alive. But energy doesn't only flow. It can also become dense and dark: heavy, stagnant and stuck. It builds up from stress, old emotion, trauma, difficult relationships and environments, and from the patterns and atmospheres we absorb from other people without realising it.",
      'Dense energy weighs you down. You feel drained, heavy, foggy or "not yourself" in ways that rest can\'t fix. Most people never learn to recognise it, so they carry it for years.',
      'Level 1 teaches you to spot dense and dark energy, track where it is held and where it came from, and clear it from your own system, at your own pace, from anywhere in the world.',
    ],
    whoHeading: "Who It's For",
    whoIntro: 'This programme is for you if you are:',
    who: [
      'Sensitive to energy, picking up on people, places and atmospheres, and feeling drained or heavy without knowing why',
      'Drawn to energy work and want to learn it properly, with structure, depth and a clear method',
      "Someone who has done inner work and senses there is an energetic layer you haven't yet reached",
      'A coach, therapist or wellness practitioner exploring energy work before training to use it with clients',
      'Planning to become a practitioner, because every practitioner starts by clearing their own system first',
    ],
    whoNote: 'No previous energy training is needed.',
    learn: [
      { title: 'Your energy field and its systems', body: 'How your personal energy field works, the systems that carry energy and information through your body, and how they connect to your nervous system, emotions and patterns.' },
      { title: 'The science behind the work', body: 'The scientific context for energy work: what is measurable, what research is exploring, and how energy connects to the biology you already understand.' },
      { title: 'Understanding dense and dark energy', body: 'What dense and dark energy are, how they differ from clear, flowing energy, and how they build up in your system from stress, emotion, trauma, people and places.' },
      { title: 'Spotting it', body: "How to recognise dense energy in your body, emotions and surroundings: the heaviness, the drain, the fog and the shift in your state. You'll know when it's there, rather than just feeling off." },
      { title: 'Tracking it', body: 'How to trace dense energy to where it is held in your system and where it came from, whether that is a person, a place, an event or an old pattern. Clearing lasts when you know the source.' },
      { title: 'Clearing it', body: 'Practical, step-by-step methods to release dense and dark energy and restore clear flow, shown on video so you can follow along and practise as you learn.' },
      { title: 'Daily self-clearing and energetic hygiene', body: "A simple daily practice to clear what you pick up before it builds up, plus tools to stay grounded and protected so you stop absorbing other people's heaviness." },
    ],
    after: [
      { title: 'Spot dense and dark energy', body: 'Recognise heavy, stuck energy in yourself and your surroundings, instead of just feeling drained without knowing why.' },
      { title: 'Track it to its source', body: 'Find where it is held in your system and where it came from, so you clear the cause rather than the symptom.' },
      { title: 'Clear it yourself', body: 'Release dense energy and restore flow with proven, step-by-step techniques.' },
      { title: 'Feel lighter, clearer and more energised', body: 'More vitality, more ease and more space inside, in your body, your mood and your day.' },
      { title: 'Stay grounded and protected', body: "A daily practice that keeps your system clear, so you stop carrying everyone else's energy." },
      { title: 'Be ready for Advanced', body: 'A solid foundation to move on to Level 2 and learn to clear energy for others.' },
    ],
    details: [
      { label: 'Format', value: 'fully self-study, online' },
      { label: 'Content', value: '100 lessons · 10 hours of video' },
      { label: 'Pace', value: 'start any time and learn at your own pace. Lessons are short, so they fit around your life.' },
      // Source: her Thinkific course page (lessons, video hours, materials) and her current site's Guided Programmes page (access), read 11 Nov 2026.
      { label: 'Access', value: 'yours for as long as you need it' },
      { label: 'Includes', value: 'workbook, clearing protocol, checklist, energy exercises, glossary and a short quiz after each lesson' },
      { label: 'Accreditation', value: 'accredited by the American Association of Drugless Practitioners (AADP)' },
      { label: 'Investment', value: 'price' },
    ],
    whatsIncluded: [
      '100 lessons, 10 hours of video',
      'Understand your personal energy field and its systems',
      'Identify and clear energetic blocks',
      'Self-clearing techniques you can use daily',
      'Scientific context for energy work',
      'Practical tools for ongoing energetic hygiene',
      'Foundation for the Advanced level',
    ],
    certification: {
      heading: 'Internationally Recognised Certification',
      lead: 'Your training, independently accredited.',
      paragraphs: [
        'This programme is accredited by the American Association of Drugless Practitioners (AADP), an international professional body that offers board certification and professional membership to holistic health practitioners around the world.',
        'On successful completion, you will receive your Level 1 Energy Clearing certificate from The Ravenall Institute, and you will be eligible to apply for board certification with the AADP.',
        [AADP_CERT_PENDING],
      ],
    },
    scope: { label: 'Scope of practice:', text: 'Energy clearing is a complementary practice. It is not a medical or psychological treatment and does not replace professional healthcare.' },
    ctaLabel: 'Enrol in Level 1',
  },

  // ── 03 Energy Clearing, Level 2 ───────────────────────────────────────────
  'energy-clearing-advanced': {
    eyebrow: 'Practitioner Certification · AADP Accredited',
    level: 'Level 2 · Advanced',
    lead: "You've cleared your own system. Now learn to clear it for others.",
    whatItIs: [
      "In Level 1 you learned to spot, track and clear dense and dark energy in yourself. You've felt the difference: the lightness, the clarity, the energy coming back.",
      "Level 2 is where you turn that personal practice into a professional skill. You will learn to read another person's energy field, find where dense energy is held and where it came from, and clear it safely and effectively, while staying grounded and protected yourself.",
      "Working on someone else's energy is very different from working on your own. It takes deeper sensitivity, a reliable method, clear ethics and strong energetic boundaries. This programme gives you all four.",
      'Level 2 is your path to becoming a certified Energy Clearing Practitioner.',
    ],
    whoHeading: "Who It's For",
    whoIntro: 'This programme is for you if you:',
    who: [
      'Have completed Level 1 and have an established self-clearing practice',
      'Want to work with clients, as a new practice or alongside existing work in coaching, therapy, healing or wellness',
      'Already sense energy in others and want a structured, professional method to work with what you pick up',
      'Are ready to hold space for others with confidence, safety and integrity',
    ],
    whoNote: 'Level 1 is a prerequisite for Level 2.',
    learn: [
      { title: "Reading another person's energy", body: "How to tune into someone else's energy field, sense where dense and dark energy is held, and tell the difference between what is theirs and what is yours." },
      { title: 'Advanced tracking', body: 'How to trace dense energy in a client to its source, whether a person, an event, an environment, a generational or long-held pattern, and how to work in layers when it runs deep.' },
      { title: 'Advanced clearing techniques', body: "Deeper, more powerful methods to clear dense and dark energy from another person's system and restore clear, balanced flow." },
      { title: 'Structuring a session', body: 'How to run a professional clearing session from start to finish: preparing, opening, reading, tracking, clearing, closing and aftercare.' },
      { title: 'Protecting yourself', body: "Advanced grounding and protection so you can do this work without absorbing your clients' energy, which is essential for a sustainable practice." },
      { title: 'Ethics, consent and scope', body: 'How to work safely and professionally: informed consent, boundaries, confidentiality, knowing your limits and when to refer a client to medical or psychological care.' },
      { title: 'Supervised practice', body: [ph('Practice sessions with clients or peers, reviewed and assessed: details to confirm.', 'Suzanne')] },
    ],
    after: [
      { title: 'Read energy in others', body: "Sense where dense and dark energy is held in another person's system, and know what is theirs and what is yours." },
      { title: 'Track to the root', body: "Trace a client's dense energy to its source and work through it layer by layer." },
      { title: 'Clear energy for others', body: "Use advanced techniques to clear dense energy safely and effectively, and restore your client's flow." },
      { title: 'Run a professional session', body: 'Lead clients through a structured clearing session with confidence, from opening to aftercare.' },
      { title: 'Work without taking it on', body: 'Stay grounded, clear and protected, however heavy the energy you work with.' },
      { title: 'Practise as a certified Energy Clearing Practitioner', body: 'Professionally certified and ready to work with clients, ethically and within your scope.' },
    ],
    details: [
      // Source: her Thinkific course page (lessons, video hours, materials) and her current site's Guided Programmes page (access), read 11 Nov 2026.
      { label: 'Format', value: 'self-study, online. A live Zoom intake is offered on register your interest.' },
      { label: 'Content', value: '39 lessons · 4.5 hours of video' },
      { label: 'Practical component', value: [ph('supervised practice sessions · case studies · assessment', 'Suzanne')] },
      { label: 'Prerequisite', value: 'completion of Level 1' },
      // Suzanne, 10 Nov 2026: the same body (AADP) applies to all practitioner training.
      { label: 'Accreditation', value: 'accredited by the American Association of Drugless Practitioners (AADP)' },
      { label: 'Investment', value: 'price' },
    ],
    whatsIncluded: [
      '39 lessons and 4.5 hours of video',
      'Advanced energy field assessment and clearing',
      'Techniques for clearing others safely and effectively',
      'Working with group and collective energy',
      'Protection and grounding for practitioners',
      'Integration with other healing modalities',
      'Practitioner certification pathway',
    ],
    certification: {
      heading: 'Certified Practitioner Status',
      paragraphs: [
        'On successful completion, including your practical assessment, you will be certified as an Energy Clearing Practitioner by The Ravenall Institute, and you will be eligible to apply for board certification with the AADP.',
        [AADP_CERT_PENDING],
      ],
    },
    scope: { label: 'Scope of practice:', text: 'Energy clearing is a complementary practice. It is not a medical or psychological treatment and does not replace professional healthcare. Certified practitioners are trained to work within their scope and refer clients on where appropriate.' },
    ctaLabel: 'Enrol in Level 2',
  },

  // ── 04 Akashic Navigator, Level 1 ─────────────────────────────────────────
  'akashic-navigator-basic': {
    eyebrow: 'Foundations · For Yourself',
    level: 'Level 1 · Navigating Your Own Records',
    lead: 'What if every pattern you have ever lived left a record, and you could learn to read it?',
    whatItIs: [
      'For thousands of years, wisdom traditions across the world have described a field of information that holds the story of every soul: every experience, every choice, every lesson and every pattern, across this life and beyond it. In Sanskrit it is called the Akasha. Today it is known as the Akashic Records.',
      'You do not have to believe anything to begin. You can approach this work with curiosity, as a skeptic or as someone who has always sensed there is more. All you need is openness to explore, and the willingness to see what you find.',
      'In our pattern work, we trace behaviour back to its root: the moment, the meaning and the unmet need that created it. Sometimes the root goes deeper than this lifetime can explain. The Akashic Records offer another way to look: a doorway to the deeper story behind the patterns that shape your life.',
      'Level 1 teaches you to open, navigate and read your own Akashic Records safely, so you can access insight, clarity and guidance about your own life and patterns.',
    ],
    whoHeading: "Who It's For",
    whoIntro: 'This programme is for you if you:',
    who: [
      'Feel there is a deeper story behind the patterns, relationships and themes that keep repeating in your life',
      'Have done inner work and want to explore what lies beneath the psychology',
      'Are curious about the Akashic Records and want to learn to access them properly, with structure and safety',
      'Want clearer guidance on your purpose, your choices and your direction',
      'Are drawn to intuitive and metaphysical work, and want a grounded, practical way into it',
      'Plan to read for others one day, because every Akashic practitioner starts by learning to navigate their own records',
    ],
    whoNote: 'No previous experience is needed.',
    learn: [
      { title: 'Understanding the Akashic Records', body: "What the Records are, where the idea comes from across traditions, and how they can be understood as a field of information about your soul's journey and patterns." },
      { title: 'Preparing to open the Records', body: 'How to ground, clear and centre yourself so you enter the Records from a calm, clear state, and why preparation shapes the quality of what you receive.' },
      { title: 'Opening and closing safely', body: 'A structured method to open and close your own Records with intention, protection and respect.' },
      { title: 'Asking powerful questions', body: 'How to frame questions that open up insight rather than shut it down. The quality of the question shapes the quality of the answer.' },
      { title: 'Receiving and interpreting guidance', body: "How guidance comes through, as images, words, feelings, knowing or sensations, and how to tell true insight from wishful thinking, fear or the mind's chatter." },
      { title: 'Tracing patterns to their source', body: 'How to use the Records to explore the deeper origins of the patterns, themes and relationships that keep repeating in your life.' },
      { title: 'Integrating what you receive', body: 'How to bring insight from the Records into everyday life through reflection, embodiment and action, so it changes how you live rather than staying an interesting experience.' },
    ],
    after: [
      { title: 'Open your own Records with confidence', body: 'Access your Akashic Records safely and reliably, using a clear, structured method.' },
      { title: 'Ask questions that bring real insight', body: 'Frame questions that open the door to clarity, direction and understanding.' },
      { title: 'Trust what you receive', body: 'Recognise how guidance comes through for you, and tell genuine insight from mind, fear or wishful thinking.' },
      { title: 'See the deeper story behind your patterns', body: 'Understand the themes and patterns that keep repeating in your life from a new and deeper perspective.' },
      { title: 'Live with more clarity and direction', body: 'Make choices with greater confidence in your purpose and your path.' },
      { title: 'Be ready for Level 2', body: 'A solid personal practice, ready to learn how to navigate the Records for others.' },
    ],
    details: [
      // Source: her Thinkific course page (lessons, video hours, materials) and her current site's Guided Programmes page (access), read 11 Nov 2026.
      { label: 'Format', value: 'self-study, online. A live Zoom intake is offered on register your interest.' },
      { label: 'Content', value: '130 lessons · 12.5 hours of video' },
      { label: 'Pace', value: 'start any time and learn at your own pace' },
      { label: 'Access', value: 'yours for as long as you need it' },
      { label: 'Includes', value: 'guided meditations in video and audio, the channelled sacred prayer, reference guides and a short quiz after each lesson' },
      { label: 'Accreditation', value: 'accredited by the American Association of Drugless Practitioners (AADP)' },
      { label: 'Investment', value: 'price' },
    ],
    whatsIncluded: [
      '130 lessons and 12.5 hours of video',
      'Learn to access and read your own Akashic Record',
      'Clear blocks, constrictions and ancestral patterns affecting this lifetime',
      'Work on money, finances and abundance',
      'Work on career, purpose and romantic relationships',
      'Strengthen your relationship with self, friendships and family',
      'Receive daily intuitive guidance for the direction you are moving in',
    ],
    scope: { text: 'Akashic Records work is a spiritual and intuitive practice. It is not a substitute for medical, psychological, legal or financial advice.' },
    ctaLabel: 'Enrol in Level 1',
  },

  // ── 04 Akashic Navigator, Level 2 ─────────────────────────────────────────
  'akashic-navigator-advanced': {
    eyebrow: 'Practitioner Certification',
    level: 'Level 2 · Navigating for Others',
    lead: "You've learned to navigate your own Records. Now learn to open them for others.",
    whatItIs: [
      "In Level 1 you learned to open, read and work with your own Akashic Records. You've experienced the clarity they bring and the deeper story they reveal behind your patterns.",
      "Level 2 is where your personal practice becomes a professional skill. You will learn to open another person's Records with their permission, receive guidance on their behalf, and share it in a way that is clear, compassionate and empowering.",
      'Reading for someone else carries real responsibility. People come to a reading at turning points in their lives, often carrying questions that matter deeply. This work asks for clear ethics, strong boundaries, a reliable method and the ability to hold space with care. This programme gives you all of these.',
      'Level 2 is your path to becoming a certified Akashic Navigator.',
    ],
    whoHeading: "Who It's For",
    whoIntro: 'This programme is for you if you:',
    who: [
      'Have completed Level 1 and have an established practice of navigating your own Records',
      'Want to offer Akashic readings as a new practice or alongside existing work in coaching, therapy, healing or wellness',
      'Feel called to help others see the deeper story behind their patterns and find their direction',
      'Are ready to hold space for others with integrity, compassion and professionalism',
    ],
    whoNote: 'Level 1 is a prerequisite for Level 2.',
    learn: [
      { title: 'Opening Records for others', body: "How to open and close another person's Akashic Records with their permission, safely and with clear intention." },
      { title: 'Holding a clear channel', body: 'How to keep your own thoughts, opinions and energy out of the reading, so that what you share is guidance for them, not projection from you.' },
      { title: 'Helping clients ask the right questions', body: 'How to guide clients to shape questions that lead to real insight and empowerment, rather than prediction or dependence.' },
      { title: 'Delivering guidance with care', body: 'How to share what you receive in a way that is honest, compassionate and empowering, including when the guidance is difficult to hear.' },
      { title: 'Patterns across time', body: 'How to help clients explore the deeper origins of the patterns, relationships and themes that keep repeating in their lives, and what they can do with that understanding.' },
      { title: 'Structuring a professional reading', body: 'How to run a reading from start to finish: preparation, consent, opening, questions, guidance, closing and integration.' },
      { title: 'Ethics, consent and boundaries', body: 'How to work responsibly: permission, confidentiality, empowering rather than creating dependence, knowing your limits and when to refer a client to medical, psychological or other professional support.' },
      { title: 'Protecting your energy', body: 'Grounding and clearing practices so you can read for others without taking on their energy.' },
      { title: 'Supervised practice', body: [ph('Practice readings with clients or peers, reviewed and assessed: details to confirm.', 'Suzanne')] },
    ],
    after: [
      { title: 'Open the Records for others', body: "Access another person's Akashic Records safely, with permission and with confidence." },
      { title: 'Hold a clear, clean channel', body: 'Keep yourself out of the way, so your clients receive guidance for them, not your opinions.' },
      { title: 'Deliver readings that empower', body: 'Share guidance with honesty and compassion, so clients leave clearer, stronger and more in charge of their own lives.' },
      { title: 'Help clients see their deeper patterns', body: 'Guide clients to understand the deeper story behind the patterns that keep repeating for them.' },
      { title: 'Run a professional reading', body: 'Lead a structured, ethical session from preparation to integration.' },
      { title: 'Practise as a certified Akashic Navigator', body: 'Certified by The Ravenall Institute and ready to offer professional Akashic readings.' },
    ],
    details: [
      // Source: her Thinkific course page (lessons, video hours, materials) and her current site's Guided Programmes page (access), read 11 Nov 2026.
      { label: 'Format', value: 'self-study, online. A live Zoom intake is offered on register your interest.' },
      { label: 'Content', value: '39 lessons · 9.5 hours of video' },
      { label: 'Practical component', value: [ph('supervised practice readings · case studies · assessment', 'Suzanne')] },
      { label: 'Prerequisite', value: 'completion of Level 1' },
      { label: 'Accreditation', value: 'accredited by the American Association of Drugless Practitioners (AADP)' },
      { label: 'Investment', value: 'price' },
    ],
    whatsIncluded: [
      '39 lessons and 9.5 hours of video, including a full demonstration session',
      'Learn to read the Akashic Records for others',
      'Discover why clients are here, their past, and answers to critical questions',
      'Clear blocks, constrictions and ancestral patterns for others',
      'Address ancestral patterns carried through DNA',
      'Help others navigate life, business, career and relationships with greater ease',
      'Akashic Navigator & Intuitive Coach certification pathway',
    ],
    certification: {
      heading: 'Certified Akashic Navigator',
      paragraphs: [
        'On successful completion, including your practical assessment, you will be certified as an Akashic Navigator by The Ravenall Institute.',
        // Suzanne, 10 Nov 2026: the same body (AADP) applies to all practitioner training.
        'You will be eligible to apply for board certification with the American Association of Drugless Practitioners (AADP).',
      ],
    },
    scope: { text: 'Akashic Records work is a spiritual and intuitive practice. It is not a substitute for medical, psychological, legal or financial advice. Certified Navigators are trained to work within their scope and refer clients on where appropriate.' },
    ctaLabel: 'Enrol in Level 2',
  },

  // ── 05 The Inner Sanctuary ────────────────────────────────────────────────
  meditation: {
    eyebrow: 'Meditation for Deep Healing · Live with Suzanne via Zoom',
    lead: "Meditation isn't about becoming someone else. It's about coming home to yourself.",
    whatItIs: [
      "Most people think meditation means emptying your mind or stopping your thoughts. It doesn't. Meditation is training in awareness: learning to observe your thoughts and feelings without judgement, and gaining a healthier perspective on them. Over time, you start to understand them, and to see the patterns underneath.",
      "The Inner Sanctuary goes further than standard mindfulness. Alongside the foundations of a steady practice, you'll learn to reach deeper brain states, work with powerful guided visualisations, and use meditation as a tool for healing, including meeting the parts of yourself you've kept in the shadows.",
    ],
    whatItIsClosing: "This isn't meditation to escape your life. It's meditation to transform it.",
    whoHeading: 'Who This Is For',
    whoIntro: 'This programme is for you if you:',
    who: [
      "Have tried meditation before and found it hard to stick with, or felt it didn't go deep enough",
      'Have a busy, restless mind and want to find real calm without forcing it',
      'Want more than relaxation: meditation that heals, clears and transforms',
      'Are ready to meet yourself more honestly, including the parts you usually avoid',
      'Want a consistent practice that actually becomes part of your life',
      'Are new to meditation and want to learn it properly, with expert guidance from the start',
    ],
    learn: [
      { title: 'The foundations of awareness', body: 'How to observe your thoughts and feelings without judgement, so you can respond to them rather than be ruled by them.' },
      { title: 'A practice that lasts', body: "How to build a consistent, nourishing meditation practice that fits your life and that you'll want to return to." },
      { title: 'Alpha state and deeper meditation', body: 'Techniques to move into the alpha brainwave state, the calm, relaxed and receptive state linked to creativity, learning and inner change, and then deeper still.' },
      { title: 'The Working Room and the Secret Garden', body: 'Two powerful guided visualisation practices. The Working Room is an inner space for solving problems, gaining insight and creating change. The Secret Garden is a place of restoration, safety and renewal.' },
      { title: 'Facing the shadow', body: "How to use meditation to gently meet the parts of yourself you've hidden, denied or pushed away, and to heal and integrate them rather than run from them." },
      { title: 'Live guided sessions with Suzanne', body: 'Every session is guided live by Suzanne, so you can ask questions, get support and deepen your practice with expert guidance.' },
    ],
    after: [
      { title: 'Find calm on demand', body: 'Settle a busy mind and an activated body, with techniques you can use anywhere, at any time.' },
      { title: 'Have a practice that sticks', body: 'A consistent meditation practice you enjoy and can sustain for life.' },
      { title: 'Access deeper states', body: 'Move into alpha and deeper meditative states, where insight, healing and change happen most easily.' },
      { title: 'Understand your inner world', body: 'See your thoughts, feelings and patterns more clearly, and stop being swept along by them.' },
      { title: "Heal what you've been avoiding", body: 'Meet and integrate the shadow parts of yourself, with more self-acceptance and less inner conflict.' },
      { title: 'Feel more at home in yourself', body: 'More peace, more clarity and a deeper connection to who you really are.' },
    ],
    details: [
      { label: 'Format', value: 'live group programme' },
      { label: 'Delivery', value: 'live via Zoom with Suzanne' },
      { label: 'Duration', value: [ph('number of sessions · length of each session · over X weeks', 'Suzanne')] },
      { label: 'Next intake', value: 'register your interest and we will let you know when the next intake opens' },
      // Suzanne, 10 Nov 2026: "Yes recordings available".
      { label: 'Recordings', value: 'available if you miss a live session' },
      { label: 'Investment', value: 'price' },
    ],
    scope: { text: 'Meditation is a complementary practice and is not a substitute for medical or psychological care. If you are currently in treatment for a mental health condition, please speak to your healthcare provider before starting.' },
    ctaLabel: 'Register Your Interest',
  },

  // ── 06 Present ────────────────────────────────────────────────────────────
  mindfulness: {
    eyebrow: 'Mindfulness for Everyday Life · Live with Suzanne via Zoom',
    lead: 'Your life only ever happens in one place: this moment. Most of us are rarely here for it.',
    whatItIs: [
      'We spend our days replaying the past, rehearsing the future and reacting on autopilot. We eat without tasting, listen without hearing and move through whole days without really being there. Stress builds, reactivity takes over, and life passes in a blur.',
      "Mindfulness is the ability to be fully present: aware of what is happening, inside you and around you, as it happens, without judgement. It isn't about sitting still for hours or emptying your mind. It is a practical skill you can use while you work, drive, parent, lead or have a difficult conversation.",
      'Research over several decades has linked mindfulness practice to lower stress, better focus and greater emotional resilience. Present teaches you the classical practices, and then takes them further.',
    ],
    whatItIsClosing: "Awareness is where change begins. You can't change a pattern you can't see.",
    different: {
      heading: 'Why This Programme Is Different',
      paragraphs: [
        "Most mindfulness courses stop at calm. Present blends classical mindfulness with Suzanne's pattern work, so you don't just learn to feel calmer. You learn to notice the patterns that drive your stress, reactions and habits as they fire, and to create the space to choose something different.",
        'That space between what happens and how you respond is where your freedom lives. This programme teaches you how to find it, again and again, in everyday life.',
      ],
    },
    whoHeading: 'Who This Is For',
    whoIntro: 'This programme is for you if you:',
    who: [
      'Feel constantly busy, rushed or scattered, and rarely fully present in your own life',
      'React before you think, and want more control over how you respond',
      'Live with ongoing stress or anxiety and want practical tools that actually help',
      'Struggle to focus, with a mind that jumps from one thing to the next',
      'Have tried mindfulness apps but never made it stick',
      'Are new to mindfulness and want to learn it properly, from the start, with live guidance',
    ],
    learn: [
      { title: 'What mindfulness really is', body: "A clear, practical understanding of mindfulness, beyond the buzzword: what it is, what it isn't, and how to recognise when you're in it." },
      { title: 'Core mindfulness practices', body: 'Simple, proven techniques, including breath awareness, body scans and mindful observation, that train your attention and calm your nervous system.' },
      { title: 'Mindfulness in daily life', body: 'How to bring presence into ordinary moments: work, meals, conversations, commuting and the moments that usually pass on autopilot.' },
      { title: 'Responding instead of reacting', body: 'How to catch stress, anxiety and reactivity as they arise, and create the pause that lets you choose your response.' },
      { title: 'Noticing your patterns', body: 'How to use mindful awareness to spot the patterns behind your habits and reactions as they happen. This is the first step in changing them.' },
      { title: 'Building it into your routine', body: 'How to weave short, realistic mindfulness practices into the routines you already have, so it becomes a habit rather than another task.' },
      { title: 'Live sessions with Suzanne', body: 'Every session is guided live by Suzanne, so you can practise together, ask questions and get support as your practice grows.' },
    ],
    after: [
      { title: 'Be more present', body: 'Spend more of your life actually here, in your work, your relationships and your everyday moments.' },
      { title: 'Feel less stressed', body: 'Practical tools to calm your mind and body when pressure builds, wherever you are.' },
      { title: 'Respond instead of react', body: 'A pause between trigger and reaction, and the freedom to choose what you do with it.' },
      { title: 'Think with more focus and clarity', body: 'A steadier, more focused mind that is easier to direct and harder to scatter.' },
      { title: 'Catch your patterns as they happen', body: 'Notice the habits and reactions that run your life, in the moment, so they lose their grip.' },
      { title: 'Have a practice that fits your life', body: 'Mindfulness woven into your existing routines, simple and sustainable.' },
    ],
    details: [
      { label: 'Format', value: 'live group programme' },
      { label: 'Delivery', value: 'live via Zoom with Suzanne' },
      { label: 'Duration', value: [ph('number of sessions · length of each session · over X weeks', 'Suzanne')] },
      { label: 'Next intake', value: 'register your interest and we will let you know when the next intake opens' },
      // Suzanne, 10 Nov 2026: "Yes recordings available".
      { label: 'Recordings', value: 'available if you miss a live session' },
      { label: 'Investment', value: 'price' },
    ],
    closingNote: [
      'Looking to go deeper? ',
      { link: 'The Inner Sanctuary', href: '/programs/meditation' },
      ' takes meditation further, into deeper brain states, guided visualisation and shadow work.',
    ],
    scope: { text: 'Mindfulness is a complementary practice and is not a substitute for medical or psychological care. If you are currently in treatment for a mental health condition, please speak to your healthcare provider before starting.' },
    ctaLabel: 'Register Your Interest',
  },
}

export const getProgrammeCopy = (slug: string): ProgrammeCopy | undefined => PROGRAMME_COPY[slug]
