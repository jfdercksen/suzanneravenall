import type { Quiz } from './types'

/**
 * PLACEHOLDER RESULTS: fearful-starter is fully sourced from a real completed
 * run (screenshots in `Scoring App/vvbqjb24.scoreapp.com/`). stalled-rebuilder,
 * identity-drifter and conscious-rebuilder are drafted from the short
 * landing-page archetype blurbs only — Johan is clicking through the other
 * three answer paths to capture their full result pages. Replace mirror /
 * mechanism / impact / shift for those three once that lands.
 */
export const lifeTransitionsQuiz: Quiz = {
  slug: 'life-transitions-reinvention',
  title: 'How Are You Navigating This Life Transition?',
  subtitle: 'When life changes, we all respond differently.',
  intro: `Feeling stuck, overwhelmed, or disconnected? Life transitions don't hit everyone the same way — the pattern you fall into shapes what you need next.

This 2-minute diagnostic will reveal:
- Your dominant transition archetype
- What's really getting in the way
- What to do to move forward with clarity`,

  questions: [
    { id: 1, text: 'I feel uncertain about my future', category: 'identity-drifter' },
    { id: 2, text: 'I struggle to move forward', category: 'stalled-rebuilder' },
    { id: 3, text: 'I feel overwhelmed by change', category: 'fearful-starter' },
    { id: 4, text: 'I feel disconnected from who I was', category: 'identity-drifter' },
    { id: 5, text: 'I lack clarity on next steps', category: 'stalled-rebuilder' },
    { id: 6, text: 'I feel stuck', category: 'stalled-rebuilder' },
    { id: 7, text: 'I feel fear about starting again', category: 'fearful-starter' },
    { id: 8, text: 'I struggle to take action', category: 'stalled-rebuilder' },
    { id: 9, text: 'I feel emotionally unsettled', category: 'fearful-starter' },
    { id: 10, text: "I don't trust my decisions right now", category: 'fearful-starter' },
  ],

  // Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4

  // Tie-break order: conscious-rebuilder (the "embracing change with clarity"
  // outcome) wins ties, including the all-zero case.
  categories: ['stalled-rebuilder', 'identity-drifter', 'fearful-starter', 'conscious-rebuilder'],

  results: {
    'fearful-starter': {
      title: 'The Fearful Starter',
      subtitle: 'Your Pattern: The Fearful Starter',
      mirror: `You're standing on the edge of something new, but fear and vulnerability are making it hard to take the first step. The prospect of beginning again may feel overwhelming, and self-doubt can be paralysing. Starting over is daunting for everyone — especially when the stakes feel high and your confidence is shaky.`,
      mechanism: `Your hesitation is a sign that your courage is building, not that you're failing. What's really getting in the way is rarely the transition itself — it's past disappointments, fear of making mistakes, or pressure to get it "right" the first time.`,
      impact: [
        'Doubt and anxiety keep you from trusting your own decisions',
        'Small decisions start to feel high-stakes',
        'Momentum stalls before it can build',
        'Self-doubt becomes paralysing instead of protective',
      ],
      shift: [
        'You take one small, low-risk step — and prove starting is possible',
        'Hesitation becomes grounded, courageous action',
        'You trust your own decisions again',
        'Momentum builds instead of stalling',
      ],
      cta: 'Start Your Reinvention Reset',
    },
    'stalled-rebuilder': {
      title: 'The Stalled Rebuilder',
      subtitle: 'Your Pattern: The Stalled Rebuilder',
      mirror: `You know something needs to change, but moving forward feels impossible. You're stuck between wanting more and not knowing how to begin again.`,
      mechanism: `This isn't a lack of ambition — it's a lack of a clear next step. Uncovering what's actually holding you back is what turns "I know I should change" into real forward motion.`,
      impact: [
        'You stay stuck between wanting more and not knowing how to start',
        'Small tasks feel disproportionately heavy',
        'Clarity keeps slipping just out of reach',
      ],
      shift: [
        'What\'s holding you back becomes visible instead of vague',
        'You find the support that turns intention into rebuilding',
        'Forward motion, even small, starts to feel possible again',
      ],
      cta: 'Start Your Reinvention Reset',
    },
    'identity-drifter': {
      title: 'The Identity Drifter',
      subtitle: 'Your Pattern: The Identity Drifter',
      mirror: `You feel disconnected from who you used to be and unsure of who you're becoming. The familiar no longer fits, and the future feels uncertain.`,
      mechanism: `Reinvention is disorienting precisely because it asks you to let go of an old sense of self before a new one has fully formed. That in-between isn't a sign something's wrong — it's the transition itself.`,
      impact: [
        'The familiar no longer fits, but nothing has replaced it yet',
        'The future feels uncertain rather than open',
        'It\'s hard to say who you\'re becoming, only who you\'re not anymore',
      ],
      shift: [
        'You reconnect with a steadier sense of self',
        'You navigate the transition with more confidence',
        'Uncertainty starts to feel like possibility instead of loss',
      ],
      cta: 'Start Your Reinvention Reset',
    },
    'conscious-rebuilder': {
      title: 'The Conscious Rebuilder',
      subtitle: 'Your Pattern: The Conscious Rebuilder',
      mirror: `You're embracing change with intention and self-awareness, ready to reinvent with clarity. This transition hasn't knocked you off course — you're already meeting it deliberately.`,
      mechanism: `Having momentum doesn't mean the work is done. Even a conscious, well-supported transition benefits from deepening the transformation rather than coasting on early progress.`,
      impact: [
        'Early momentum can quietly stall without deeper support',
        'Self-awareness alone doesn\'t guarantee the transition compounds',
      ],
      shift: [
        'You keep building momentum instead of plateauing',
        'Your transformation deepens rather than just continues',
        'Clarity compounds into lasting change',
      ],
      cta: 'Deepen Your Reinvention Reset',
    },
  },
}
