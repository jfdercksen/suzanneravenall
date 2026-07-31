import type { Quiz } from './types'

export const identityPurposeQuiz: Quiz = {
  slug: 'identity-purpose-activation',
  title: 'What Identity Pattern Is Limiting Your Growth?',
  subtitle: 'Holding yourself back is not a personality trait. It is a pattern.',
  intro: `Most people think their limitations are just "who they are." But identity is not fixed. It is patterned: shaped by what you learned to believe about your worth, your capability and your place in the world, long before you had any say in it.

When that patterning goes unexamined, it shows up as hidden ceilings. You downplay wins that should feel good. You overwork just to feel adequate. You stay busy without ever feeling clear on where you're actually going. It doesn't look like a crisis. It looks like your normal.

This 2-minute diagnostic will reveal:
- Your dominant identity pattern
- Why it formed
- How it is limiting your growth
- What it takes to shift it`,

  questions: [
    { id: 1, text: 'I downplay my success', category: 'invisible-one' },
    { id: 2, text: 'I fear being fully seen', category: 'invisible-one' },
    { id: 3, text: 'I overwork to prove myself', category: 'prover' },
    { id: 4, text: 'I feel unclear about my purpose', category: 'drifter' },
    { id: 5, text: 'I hold myself back', category: 'drifter' },
    { id: 6, text: 'I seek validation externally', category: 'prover' },
    { id: 7, text: 'I doubt my capabilities', category: 'prover' },
    { id: 8, text: 'I feel disconnected from what I want', category: 'invisible-one' },
    { id: 9, text: 'I struggle to make bold decisions', category: 'drifter' },
    { id: 10, text: 'I feel stuck in an old version of myself', category: 'drifter' },
  ],

  // Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4

  // Tie-break order: emerging-leader (the "stepping into growth" outcome) wins
  // ties, including the all-zero case.
  categories: ['invisible-one', 'prover', 'drifter', 'emerging-leader'],

  results: {
    prover: {
      title: 'The Prover',
      subtitle: 'Your Pattern: The Prover',
      mirror: `You get things done. You deliver, you achieve, you're the one people can count on. From the outside it looks like drive. But underneath the achievement is a quieter, more exhausting question: is this enough yet? You chase the next result hoping it will finally answer it, and it never quite does.`,
      mechanism: `Your system has learned: "I am only worth something if I perform." So it keeps pushing you to prove yourself, over and over, because the proof never sticks. Competence became the price of belonging early on, and your system has been paying it ever since.`,
      impact: [
        'Achievement that never feels like enough',
        'Burnout disguised as ambition',
        'Constant need for external validation',
        'Capability masking deep self-doubt',
      ],
      shift: [
        'You know your worth without needing to prove it',
        'You achieve from choice, not compulsion',
        'Your confidence holds even without applause',
        'You do less, and it lands harder',
      ],
      cta: 'Stop Proving. Start Knowing Your Worth.',
    },
    'invisible-one': {
      title: 'The Invisible One',
      subtitle: 'Your Pattern: The Invisible One',
      mirror: `You've built a quiet talent for shrinking. You deflect the compliment, change the subject, let someone else take the credit that was rightfully yours. Being seen feels risky, so you've learned to stay just out of view, even in rooms where you've earned the spotlight. Somewhere along the way, staying small started to feel safer than being known.`,
      mechanism: `Your system has learned: "It is safer to be overlooked than to be truly seen." So it keeps you deflecting, minimising and hiding your own light, because visibility once felt like exposure, not recognition. The pattern protected you once. Now it is the ceiling.`,
      impact: [
        'Success that never gets acknowledged, least of all by you',
        "Opportunities missed because you didn't put yourself forward",
        'Growing distance from what you actually want',
        'Relationships and rooms where your real self never shows up',
      ],
      shift: [
        'You receive recognition without deflecting it',
        'You take up space that is rightfully yours',
        "You reconnect with what you actually want, not just what's safe",
        'Visibility feels like power, not exposure',
      ],
      cta: 'Be Seen. Take Up Space. Repattern.',
    },
    drifter: {
      title: 'The Drifter',
      subtitle: 'Your Pattern: The Drifter',
      mirror: `You're not in crisis. You're in limbo. Days move, tasks get done, but there's no real sense of direction underneath it. You hesitate on the decisions that could actually change things, and you catch yourself still living by the rules of a version of you that has long since moved on. It's not that you can't move. It's that you're not sure which way is actually yours.`,
      mechanism: `Your system has learned: "It is safer to stay undecided than to commit and be wrong." So it keeps you circling instead of choosing, because an old version of you once got burned by a bold move, and the caution never fully switched off.`,
      impact: [
        'Years passing without a real sense of progress',
        'Big decisions deferred until they make themselves',
        "A growing gap between who you are and who you're being",
        'Energy spent maintaining a life that no longer fits',
      ],
      shift: [
        'A clear, felt sense of direction',
        'Decisions made from conviction, not hesitation',
        'A version of yourself you actually recognise',
        'Momentum that compounds instead of resetting',
      ],
      cta: 'Find Your Direction. Repattern Now.',
    },
    'emerging-leader': {
      title: 'The Emerging Leader',
      subtitle: 'Your Pattern: The Emerging Leader',
      mirror: `You're not stuck. You've already started stepping into a clearer, more grounded version of yourself: one who owns their success, knows their direction and makes decisions without waiting for permission. That shift is real, and it's worth building on.`,
      mechanism: `You've done real work to loosen the old identity patterns that used to hold you back. What's left is not repair. It's expansion: refining the belief, the visibility and the boundaries that let this next-level version of you lead fully.`,
      impact: [
        'Growth plateauing without a next stretch to grow into',
        'Old patterns resurfacing under real pressure',
        'Capability outpacing the identity holding it',
        'Momentum without a clear edge to aim it at',
      ],
      shift: [
        'Full ownership of your capability and your success',
        'Leadership that holds steady under pressure',
        'A next-level identity that matches your next-level goals',
        'Sustained momentum instead of plateau',
      ],
      cta: 'Explore the Full Identity Upgrade Intensive',
    },
  },
}
