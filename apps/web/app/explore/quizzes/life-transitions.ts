import type { Quiz } from './types'

export const lifeTransitionsQuiz: Quiz = {
  slug: 'life-transitions-reinvention',
  title: 'How Are You Navigating This Life Transition?',
  subtitle: 'When life changes, we all respond differently.',
  intro: `Feeling stuck, overwhelmed, or disconnected? Life transitions don't hit everyone the same way: the pattern you fall into shapes what you need next.

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
      mirror: `You're standing on the edge of something new, but fear and vulnerability are making it hard to take the first step. The prospect of beginning again may feel overwhelming, and self-doubt can be paralysing. Starting over is daunting for everyone, especially when the stakes feel high and your confidence is shaky.`,
      mechanism: `Your hesitation is a sign that your courage is building, not that you're failing. What's really getting in the way is rarely the transition itself: it's past disappointments, fear of making mistakes, or pressure to get it "right" the first time.`,
      impact: [
        'Doubt and anxiety keep you from trusting your own decisions',
        'Small decisions start to feel high-stakes',
        'Momentum stalls before it can build',
        'Self-doubt becomes paralysing instead of protective',
      ],
      shift: [
        'You take one small, low-risk step, and prove starting is possible',
        'Hesitation becomes grounded, courageous action',
        'You trust your own decisions again',
        'Momentum builds instead of stalling',
      ],
      cta: 'Start Your Reinvention Reset',
    },
    'stalled-rebuilder': {
      title: 'The Stalled Rebuilder',
      subtitle: 'Your Pattern: The Stalled Rebuilder',
      mirror: `You know something needs to change. You've known it for a while now: the job, the relationship, the routine, the version of yourself you've outgrown. But knowing isn't the same as moving, and you're stuck in the gap between wanting more and having no clear way to begin again.

From the outside, it might look like you're simply taking your time. Internally, it feels heavier than that. You start to plan, and the plan stalls. You research your options, and the research quietly becomes another form of avoidance. Every path forward seems to demand a burst of energy or certainty you don't currently have, so you wait for the moment you'll finally feel ready, and that moment doesn't come.`,
      mechanism: `Your system has learned: "If I can't see the whole path, it isn't safe to take the first step." This isn't a lack of ambition or drive. It's a protective loop that demands certainty before it will release momentum, so you keep gathering information and revising the plan, waiting for a clarity that motion itself is usually what produces.`,
      impact: [
        'You stay stuck between wanting more and not knowing how to start',
        'Small, ordinary tasks start to feel disproportionately heavy',
        'Clarity keeps slipping just out of reach, no matter how much you think it through',
        'Preparing to change quietly substitutes for actually changing',
      ],
      shift: [
        'What\'s actually holding you back becomes visible instead of vague',
        'You find the support and structure that turn intention into real rebuilding',
        'Small, imperfect steps start to feel possible again, before you feel "ready"',
        'Momentum builds because you\'re moving, not because you finally figured it all out',
      ],
      cta: 'Start Your Reinvention Reset',
    },
    'identity-drifter': {
      title: 'The Identity Drifter',
      subtitle: 'Your Pattern: The Identity Drifter',
      mirror: `You feel disconnected from who you used to be, and you can't yet describe who you're becoming. The roles, routines and relationships that once told you who you were don't fit the same way anymore, but nothing has stepped in to replace them. You know what you're not any longer. What comes next is still unclear.

This tends to show up as a quiet unease more than a crisis. You move through familiar routines and feel like you're watching yourself slightly from outside. Decisions that used to be automatic now take more thought, because the person making them has changed and the old defaults no longer apply. It can feel like grief for a version of you that no longer exists, mixed with anticipation for one that hasn't arrived yet.`,
      mechanism: `Your system has learned: "Without a clear identity to stand on, nothing is safe or certain." So it keeps reaching backward for the self you used to be, because a known identity, even an outdated one, feels safer than an unformed one. Reinvention is disorienting precisely because it asks you to release an old sense of self before a new one has fully formed, and that in-between isn't a sign something's wrong. It's the transition itself.`,
      impact: [
        'The familiar no longer fits, but nothing has stepped in to replace it yet',
        'The future feels uncertain rather than open with possibility',
        'It\'s easier to say who you\'re not anymore than who you\'re becoming',
        'Everyday decisions feel heavier, because the person making them has changed',
      ],
      shift: [
        'You reconnect with a steadier, more current sense of self',
        'You navigate the in-between with more confidence, instead of grasping for who you used to be',
        'Uncertainty starts to feel like possibility instead of loss',
        'You build an identity forward, rather than trying to reconstruct the one you left behind',
      ],
      cta: 'Start Your Reinvention Reset',
    },
    'conscious-rebuilder': {
      title: 'The Conscious Rebuilder',
      subtitle: 'Your Pattern: The Conscious Rebuilder',
      mirror: `You're meeting this transition with intention rather than being knocked off course by it. You've already done real work: naming what needs to change, taking deliberate steps, building genuine self-awareness about your own patterns. Where others are still finding their footing, you're already walking with a sense of direction.

That clarity is real, and it isn't the finish line. Conscious rebuilders are the ones most at risk of mistaking early momentum for completed change: the insight has landed, some first steps have been taken, and it's tempting to coast on that progress rather than keep deepening it. The transitions that hold aren't just the ones that start well. They're the ones that get built on, deliberately, past the point where things start to feel manageable again.`,
      mechanism: `Your system has learned: "Once I understand the pattern, the work is basically done." Insight feels like resolution, so momentum can quietly plateau right when a bit more structure and support would turn early clarity into a transformation that actually compounds and lasts.`,
      impact: [
        'Early momentum can quietly stall once the first sense of relief sets in',
        'Self-awareness alone doesn\'t guarantee the change compounds over time',
        'Progress plateaus right at the point that used to feel like "enough"',
        'Without deeper support, insight risks staying insight instead of becoming lasting change',
      ],
      shift: [
        'You keep building momentum instead of plateauing at "better"',
        'Your transformation deepens rather than just continuing on autopilot',
        'Clarity compounds into change that holds under real-world pressure',
        'You move from managing the transition well to fully completing it',
      ],
      cta: 'Deepen Your Reinvention Reset',
    },
  },
}
