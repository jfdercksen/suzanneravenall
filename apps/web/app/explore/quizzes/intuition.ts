import type { Quiz } from './types'

/**
 * Question-to-category tags are not exposed in the ScoreApp editor for this
 * quiz — Johan confirmed only the 4 result pages are visible, not per-question
 * scoring tags. The mapping below is inferred from question wording and
 * cross-checked against the result copy; the 10 questions split 4/3/3 across
 * fear-based / overthinking-override / emotional-distortion. clear-inner-compass
 * has no dedicated questions — it is the fallback/tie-break result when none of
 * the other three dominate, matching the nervous-system quiz's "mixed" pattern.
 */
export const intuitionQuiz: Quiz = {
  slug: 'intuition-as-patterned-intelligence',
  title: 'Is Your Intuition Helping You or Holding You Back?',
  subtitle: 'Second-guessing isn\'t a personality trait. It\'s a pattern.',
  intro: `Do you find yourself second guessing, overthinking, or feeling disconnected from your own inner guidance? Your intuition isn't unreliable. It's being shaped by a pattern you can't yet see.

This 2-minute diagnostic will reveal:
- Your dominant intuition pattern
- What's really shaping your decisions right now
- How to reconnect with your inner guidance`,

  questions: [
    { id: 1, text: 'I second guess my decisions', category: 'overthinking-override' },
    { id: 2, text: 'I struggle to trust my gut', category: 'fear-based' },
    { id: 3, text: 'I overanalyse situations', category: 'overthinking-override' },
    { id: 4, text: "I feel confused about what's right", category: 'overthinking-override' },
    { id: 5, text: 'I act on impulse and regret it', category: 'emotional-distortion' },
    { id: 6, text: 'I feel emotionally clouded', category: 'emotional-distortion' },
    { id: 7, text: 'I struggle with clarity', category: 'emotional-distortion' },
    { id: 8, text: 'I seek external validation', category: 'fear-based' },
    { id: 9, text: 'I feel disconnected from inner guidance', category: 'fear-based' },
    { id: 10, text: 'I feel unsure of my instincts', category: 'fear-based' },
  ],

  // Answer scale: No, not really=0, Rarely=1, Sometimes=2, Yes, this is very true for me=3

  // Tie-break order: clear-inner-compass (the healthy-connection outcome) wins
  // ties, including the all-zero case.
  categories: ['fear-based', 'overthinking-override', 'emotional-distortion', 'clear-inner-compass'],

  results: {
    'fear-based': {
      title: 'Fear-Based Intuition',
      subtitle: 'Your Pattern: Fear-Based Intuition',
      mirror: `You may often find yourself hesitating, seeking safety, or second-guessing your decisions because fear subtly influences your inner signals. It can feel like your instincts are always warning you, making you avoid risks or opportunities that might actually serve you.`,
      mechanism: `You're not alone in feeling caught between wanting to trust your gut and worrying about what might go wrong. Recognising that fear can disguise itself as intuition is the first step to reclaiming your inner clarity.`,
      impact: [
        'Hesitation and missed opportunities',
        'Avoiding choices that could actually serve you',
        'Chronic self-questioning',
        'Feeling caught between trusting your gut and fearing what could go wrong',
      ],
      shift: [
        'Pause before decisions and notice where your guidance feels tense or urgent (a sign fear is speaking, not intuition)',
        'Ask whether a choice is truly misaligned, or if fear is steering you away',
        'Journal moments when your initial instinct was right, to build evidence for self-trust',
        'Shift from fear-based patterns to a clearer, calmer awareness of what\'s right for you',
      ],
      cta: 'Book Your Intuition Calibration Session',
    },
    'overthinking-override': {
      title: 'Overthinking Override',
      subtitle: 'Your Pattern: Overthinking Override',
      mirror: `Your results suggest you tend to analyse every detail, replay decisions, and struggle to hear your inner knowing through the mental noise. It's as if your mind is always searching for the perfect answer, but clarity remains just out of reach.`,
      mechanism: `This pattern is common among high achievers and deep thinkers: it's a sign of intelligence, not deficiency. The challenge is that constant analysis can drown out the quiet voice of intuition and leave you feeling mentally exhausted.`,
      impact: [
        'Analysis paralysis that blocks your natural intuitive signals',
        'Mental exhaustion from constant analysis',
        'Clarity that stays just out of reach',
        'Second-guessing that erodes decision-making confidence',
      ],
      shift: [
        'Take short pauses to check in with your body\'s signals before making a choice',
        'Notice if clarity feels calm, or if doubt comes with mental tension',
        'Set limits on seeking external advice and tune back into your own wisdom',
        'Use grounding exercises like mindful breathing to reconnect with your intuitive sense',
      ],
      cta: 'Break the Overthinking Cycle',
    },
    'emotional-distortion': {
      title: 'Emotional Distortion',
      subtitle: 'Your Pattern: Emotional Distortion',
      mirror: `Your intuition may feel clouded by strong emotions, sometimes leading to impulsive actions, or uncertainty and regret once the emotional wave has passed. You might notice that what feels right in the moment changes quickly, leaving you unsure of your true direction.`,
      mechanism: `It's both a gift and a challenge to feel things deeply. Emotions are powerful messengers, but when they overwhelm your clarity, it's easy to lose track of what your intuition is actually telling you.`,
      impact: [
        'Impulsive actions followed by regret',
        'What feels right shifts quickly, leaving you unsure of your direction',
        'Difficulty separating true intuition from emotional overwhelm',
        'Emotional waves that cloud your judgement in the moment',
      ],
      shift: [
        'Pause before acting on intense feelings and journal what comes up',
        'Use grounding activities like stepping outside or slow breathing to return to calm before deciding',
        'Notice the difference between choices that bring gentle peace and those that feel urgent or emotionally charged',
        'Separate emotional reactions from true intuitive nudges',
      ],
      cta: 'Cultivate Clarity and Self-Trust',
    },
    'clear-inner-compass': {
      title: 'Clear Inner Compass',
      subtitle: 'Your Pattern: Clear Inner Compass',
      mirror: `You have a strong, consistent connection to your intuition. Decisions often feel aligned, and you trust your inner guidance even when others question your choices. This clarity brings a sense of ease and confidence in navigating life's challenges.`,
      mechanism: `You've built genuine trust with your intuitive sense, but that doesn't mean the work is done. Even a clear connection benefits from being deepened and refined rather than left to coast.`,
      impact: [
        'Alignment and ease in decision-making',
        'Confidence even when others question your choices',
        'A steady inner compass through life\'s challenges',
      ],
      shift: [
        'Journal your intuitive hits and reflect on how they guide your path',
        'Notice the subtle signals that distinguish calm clarity from reactive urges',
        'Use those signals as guideposts in moments of uncertainty',
        'Share your experience to inspire others to trust their own inner wisdom',
      ],
      cta: 'Deepen Your Intuitive Clarity',
    },
  },
}
