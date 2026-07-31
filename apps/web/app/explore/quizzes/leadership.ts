import type { Quiz } from './types'

export const leadershipQuiz: Quiz = {
  slug: 'leadership-high-performance',
  title: 'What Performance Pattern Is Capping Your Potential?',
  subtitle: 'Your ceiling is not talent. It is patterned.',
  intro: `You carry big responsibilities, push through exhaustion, and stay switched on, yet something still is not right. The environment is not the real problem. There is a hidden performance pattern running underneath it, capping what you are actually capable of.

Most leaders try to fix this with more effort: more hours, more discipline, more willpower. But the ceiling is not a willpower problem. It is a pattern problem, and patterns do not shift through effort. They shift when you see them clearly.

This 2-minute diagnostic will reveal:
- Your dominant leadership pattern
- Why it formed and what it is costing you
- What sustainable high performance actually looks like for you`,

  questions: [
    { id: 1, text: 'I feel overwhelmed by responsibility', category: 'overloaded-driver' },
    { id: 2, text: 'I struggle to delegate', category: 'visionary-without-structure' },
    { id: 3, text: 'I experience decision fatigue', category: 'reactive-leader' },
    { id: 4, text: 'I feel pressure constantly', category: 'overloaded-driver' },
    { id: 5, text: 'I react quickly under stress', category: 'reactive-leader' },
    { id: 6, text: 'I lack time for strategic thinking', category: 'visionary-without-structure' },
    { id: 7, text: 'I feel mentally overloaded', category: 'reactive-leader' },
    { id: 8, text: 'I struggle to switch off', category: 'overloaded-driver' },
    { id: 9, text: 'I push through exhaustion', category: 'overloaded-driver' },
    { id: 10, text: 'I feel stuck at a performance plateau', category: 'visionary-without-structure' },
  ],

  // Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4

  // Tie-break order: strategic-integrator (the "sustainable high performance"
  // outcome) wins ties, including the all-zero case.
  categories: ['reactive-leader', 'visionary-without-structure', 'overloaded-driver', 'strategic-integrator'],

  results: {
    'overloaded-driver': {
      title: 'The Overloaded Driver',
      subtitle: 'Your Pattern: The Overloaded Driver',
      mirror: `You push relentlessly, take on too much, and rarely switch off. Overwhelm and exhaustion are constant companions, but you keep driving forward, often at the expense of clarity and well-being.`,
      mechanism: `Your system has learned: "If I carry it myself, it gets done properly." Somewhere along the way, capability turned into obligation. Every task that lands on your desk feels like yours to hold, so the load only ever grows. It never redistributes.`,
      impact: [
        'Burnout that no holiday fully resolves',
        'Declining quality of decisions as fatigue compounds',
        'Strained relationships with family and team',
        'A business or team that cannot function without you in it',
      ],
      shift: [
        'You carry responsibility without carrying exhaustion',
        'Your output rises while your hours drop',
        'Your team grows more capable because you finally let them',
        'You lead with energy instead of running on empty',
      ],
      cta: 'Carry Less. Lead More.',
    },
    'reactive-leader': {
      title: 'The Reactive Leader',
      subtitle: 'Your Pattern: The Reactive Leader',
      mirror: `You're always putting out fires, responding to urgent demands, and feeling the pressure of constant change. Strategic thinking takes a back seat as you struggle to get ahead of the curve.`,
      mechanism: `Your system has learned: "I have to respond now or it will fall apart." That belief keeps you locked in urgency mode, so every day gets filled by whatever shouts loudest instead of what actually matters most.`,
      impact: [
        'Strategy gets permanently postponed for the next emergency',
        'Decision fatigue that erodes judgment by mid-afternoon',
        'A team that mirrors your reactivity instead of your direction',
        'Growth that stalls because no one is steering it',
      ],
      shift: [
        'You set the agenda instead of reacting to it',
        'Decisions come from clarity, not adrenaline',
        'Your team operates on a plan, not a series of fires',
        'You create space for the thinking that actually moves the business',
      ],
      cta: 'Get Ahead of the Curve.',
    },
    'visionary-without-structure': {
      title: 'The Visionary Without Structure',
      subtitle: 'Your Pattern: The Visionary Without Structure',
      mirror: `You have big ideas and strong ambition, but lack the systems or habits to turn vision into consistent results. Progress stalls and frustration builds as momentum slips away.`,
      mechanism: `Your system has learned: "The idea is the hard part, the rest will follow." It rarely does. Without structure to hold it, even the strongest vision dissipates into a dozen half-finished starts, and the gap between what you see and what you ship keeps widening.`,
      impact: [
        'A trail of started-but-unfinished initiatives',
        'A team unclear on priorities because none are ever locked in',
        'Growing self-doubt as ambition outpaces delivery',
        'Opportunities that pass by while the systems catch up',
      ],
      shift: [
        'Your ideas convert into consistent, compounding results',
        'You build systems that hold momentum even when you step back',
        'Your team executes with confidence because priorities are clear',
        'Vision and delivery finally move at the same speed',
      ],
      cta: 'Turn Vision Into Results.',
    },
    'strategic-integrator': {
      title: 'The Strategic Integrator',
      subtitle: 'Your Pattern: The Strategic Integrator',
      mirror: `You balance high performance with sustainable habits, clear focus, and strong boundaries. You integrate strategy with action, leading with presence and energy.`,
      mechanism: `You have already done the work of aligning how you lead with how you actually operate. That does not mean there is nothing left. At this level, the next gains come from refinement, not repair, sharpening the pattern you have built rather than fixing one that is broken.`,
      impact: [
        'Strong performance that still has an unclaimed ceiling above it',
        'Good decisions that could become faster and more instinctive',
        'A capable team that could be stretched further',
      ],
      shift: [
        'You operate at your genuine edge, not just a comfortable plateau',
        'Your influence extends further with the same effort',
        'You build a legacy structure, not just a strong quarter',
        'You move from managing performance to compounding it',
      ],
      cta: 'Book Your Strategic Expansion Call',
    },
  },
}
