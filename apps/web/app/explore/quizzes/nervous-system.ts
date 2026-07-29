import type { Quiz } from './types'

export const nervousSystemQuiz: Quiz = {
  slug: 'emotional-nervous-system-mastery',
  title: 'What Nervous System Pattern Is Running Your Life?',
  subtitle: 'Your reactions aren\'t random. They\'re patterned.',
  intro: `Most people try to control their emotions. But emotions are not the problem. They are the output of a deeper system — your nervous system. When that system is patterned by stress, trauma or pressure, it creates automatic responses: Overreaction. Anxiety. Shutdown. Burnout.

This 2-minute diagnostic will reveal:
- Your dominant nervous system pattern
- Why it formed
- How it is affecting your life
- What to do to shift it`,

  questions: [
    { id: 1, text: 'I feel "on edge" or alert even when nothing is wrong', category: 'fight' },
    { id: 2, text: 'I find it difficult to switch off or relax fully', category: 'flight' },
    { id: 3, text: 'I react quickly in stressful situations and regret it later', category: 'fight' },
    { id: 4, text: 'I tend to overthink or anticipate problems before they happen', category: 'flight' },
    { id: 5, text: 'I feel overwhelmed by small or everyday tasks', category: 'freeze' },
    { id: 6, text: 'I avoid conflict or difficult conversations', category: 'freeze' },
    { id: 7, text: 'When things feel too much, I shut down or withdraw', category: 'freeze' },
    { id: 8, text: 'I feel responsible for keeping everything under control', category: 'fight' },
    { id: 9, text: 'My energy fluctuates — I go from high output to exhaustion', category: 'mixed' },
    { id: 10, text: 'I replay conversations or situations in my mind', category: 'flight' },
    { id: 11, text: 'I struggle to feel calm, safe or settled in my body', category: 'mixed' },
    { id: 12, text: 'I push myself even when I know I\'m tired', category: 'fight' },
  ],

  // Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4

  // Tie-break order: mixed (Regulated Responder) wins ties, including the
  // all-zero case — matches the original hardcoded computeResult behavior.
  categories: ['fight', 'flight', 'freeze', 'mixed'],

  results: {
    fight: {
      title: 'The Hyper-Alert Achiever',
      subtitle: 'Your Pattern: The Hyper-Alert Achiever',
      mirror: `You are driven, capable and often the one others rely on. From the outside, you look in control. But internally, your system is running at a high level of alertness — even when it doesn't need to. You don't slow down easily. You push through. You carry responsibility. And over time, that becomes exhausting.`,
      mechanism: `Your nervous system has learned: "I must stay in control to stay safe." This creates a constant activation of your stress response — even in non-threatening situations. It's not weakness. It's a highly conditioned survival pattern.`,
      impact: [
        'Chronic stress and burnout',
        'Irritability and overreaction',
        'Difficulty switching off',
        'Pressure in relationships',
        'Long-term health impact',
      ],
      shift: [
        'You maintain high performance — without pressure',
        'You feel calm, focused and in control',
        'You respond instead of react',
        'You lead from clarity, not stress',
      ],
      cta: 'Book Your Nervous System Reset',
    },
    flight: {
      title: 'The Anxious Anticipator',
      subtitle: 'Your Pattern: The Anxious Anticipator',
      mirror: `Your mind is always active. You think ahead. Plan ahead. Prepare ahead. But instead of clarity, this often creates anxiety. You may find yourself overthinking decisions, imagining worst-case scenarios, struggling to switch off mentally.`,
      mechanism: `Your system has learned: "I must anticipate to stay safe." This keeps your nervous system in a future-focused stress loop.`,
      impact: [
        'Anxiety and mental fatigue',
        'Decision paralysis',
        'Difficulty being present',
        'Sleep disruption',
      ],
      shift: [
        'Mental clarity',
        'Calm focus',
        'Confident decisions',
        'Trust in your internal guidance',
      ],
      cta: 'Calm the System. Rewire the Pattern.',
    },
    freeze: {
      title: 'The Withdrawn Protector',
      subtitle: 'Your Pattern: The Withdrawn Protector',
      mirror: `When things feel too much — you pull back. You may avoid difficult situations, feel stuck or disconnected, struggle to take action. This isn't laziness. It's protection.`,
      mechanism: `Your system has learned: "It's safer to shut down than to engage." This creates a freeze response — where energy drops and action stops.`,
      impact: [
        'Procrastination',
        'Missed opportunities',
        'Feeling disconnected',
        'Loss of momentum',
      ],
      shift: [
        'Safe engagement',
        'Increased energy',
        'Confidence in action',
        'Reconnection to life',
      ],
      cta: 'Reconnect. Re-engage. Repattern.',
    },
    mixed: {
      title: 'The Regulated Responder',
      subtitle: 'Your Pattern: The Regulated Responder',
      mirror: `Your system is relatively balanced. You are able to stay calm under pressure, respond thoughtfully, recover from stress. But this doesn't mean there aren't deeper patterns still shaping your potential.`,
      mechanism: `You have developed a level of regulation — but refinement is possible.`,
      impact: [
        'Stable performance',
        'Emotional resilience',
        'Strong decision-making',
      ],
      shift: [
        'Peak performance',
        'Deeper alignment',
        'Greater clarity',
        'Expanded capacity',
      ],
      cta: 'Optimise Your System Further',
    },
  },
}
