import type { Quiz } from './types'

export const healthEnergyQuiz: Quiz = {
  slug: 'health-energy-intelligence',
  title: 'Is Stress Rewiring Your Body?',
  subtitle: "Your body isn't failing you. It's adapting to patterns.",
  intro: `Your body has been trying to tell you something for a while now. The fatigue that sleep doesn't fix. The tension that sits in your shoulders no matter how many times you roll them out. The energy that used to feel steady and now feels borrowed against tomorrow. These aren't random malfunctions. They are physical patterns, formed the same way emotional and behavioural patterns form: through repetition, adaptation and survival.

When your body is under sustained pressure, physical or psychological, it doesn't just tolerate the load. It reorganises around it. Your nervous system, hormones, immune response and sleep architecture all recalibrate to keep you functioning under conditions they were never designed to sustain long term. That recalibration isn't weakness. It's intelligence, adapting to what you've asked of it.

This 2-minute diagnostic will reveal:
- Your dominant health and energy pattern
- Why your body adapted this way
- What it's costing you if the pattern continues
- What shifts once the pattern is addressed at its root`,

  questions: [
    { id: 1, text: 'I feel fatigued even after rest', category: 'energy-dysregulated' },
    { id: 2, text: 'My energy fluctuates daily', category: 'energy-dysregulated' },
    { id: 3, text: 'I experience stress-related symptoms', category: 'stress-overloaded' },
    { id: 4, text: 'My sleep is inconsistent', category: 'energy-dysregulated' },
    { id: 5, text: 'I feel wired but tired', category: 'hidden-burnout' },
    { id: 6, text: 'I struggle to recover from stress', category: 'stress-overloaded' },
    { id: 7, text: 'I have ongoing health concerns', category: 'hidden-burnout' },
    { id: 8, text: 'I rely on stimulants to function', category: 'hidden-burnout' },
    { id: 9, text: 'I feel physically tense often', category: 'stress-overloaded' },
    { id: 10, text: 'My body feels inflamed or reactive', category: 'stress-overloaded' },
  ],

  // Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4

  // Tie-break order: resilient-at-risk (the "coping but should act now" outcome)
  // wins ties, including the all-zero case.
  categories: ['energy-dysregulated', 'hidden-burnout', 'stress-overloaded', 'resilient-at-risk'],

  results: {
    'stress-overloaded': {
      title: 'Stress-Overloaded System',
      subtitle: 'Your Pattern: Stress-Overloaded System',
      mirror: `Your body is running a threat-response that never fully switches off. The tension you carry in your jaw, neck or chest isn't incidental, it's your system staying braced for whatever comes next. Recovery doesn't come easily, even when you rest, because rest and safety aren't the same thing to a body that's stuck in high alert.

You may notice this most in the small physical signals: headaches that show up under pressure, a stomach that reacts before your mind catches up, a body that feels tight even on an easy day. None of this is you being fragile. It's a system doing exactly what it was conditioned to do.`,
      mechanism: `Your body has learned: "I must stay braced for the next demand." Sustained stress, without enough recovery in between, teaches your physiology to treat readiness as the baseline state rather than the exception. Over time, that constant bracing becomes the default setting your body defaults back to, even in moments that don't call for it.`,
      impact: [
        'Chronic muscular tension and stress-related pain',
        'Poor recovery between demands, so stress compounds instead of resolving',
        'Low-grade inflammation that builds quietly over months',
        'Increased risk of stress-linked illness the longer the pattern runs unaddressed',
      ],
      shift: [
        'Your body drops out of constant threat-response and into genuine recovery',
        'Physical tension releases instead of accumulating',
        'Inflammation and stress-related symptoms ease as the nervous system recalibrates',
        'You meet demands from a settled baseline, not a braced one',
      ],
      cta: 'Book Your Health Pattern Consultation',
    },
    'energy-dysregulated': {
      title: 'Energy Dysregulated',
      subtitle: 'Your Pattern: Energy Dysregulated',
      mirror: `Your energy doesn't follow a rhythm you can rely on. Some days you have plenty, other days the same routine leaves you flat by mid-morning. Rest doesn't reliably restore you either: you can sleep a full night and still wake up running on empty, or crash in the afternoon for no obvious reason.

This unpredictability makes it hard to plan around your own capacity. You end up guessing which version of your energy will show up, and building your day around that guess instead of a steady baseline you can count on.`,
      mechanism: `Your body has learned: "I must run on whatever fuel is available, whenever it's available." When demand and recovery stop lining up consistently, your system stops maintaining a steady rhythm and starts operating reactively instead, drawing on reserves unevenly rather than replenishing them on a predictable cycle.`,
      impact: [
        'Fatigue that persists even after what should be adequate rest',
        'Unreliable output, since you can\'t predict which days will carry energy and which won\'t',
        'Disrupted sleep architecture that makes true recovery harder to reach',
        'Difficulty planning or committing, because your own capacity feels unpredictable',
      ],
      shift: [
        'Energy that follows a steady, predictable rhythm day to day',
        'Sleep that actually restores you, not just time spent unconscious',
        'Reliable output you can plan your life and work around',
        'Trust in your body\'s rhythm instead of working against it',
      ],
      cta: 'Book Your Health Pattern Consultation',
    },
    'hidden-burnout': {
      title: 'Hidden Burnout Pattern',
      subtitle: 'Your Pattern: Hidden Burnout Pattern',
      mirror: `From the outside, you look like you're managing fine. You're still showing up, still delivering, still ticking the boxes. But underneath that functioning surface, something is quietly running down. You feel wired even when you're exhausted, and you've come to depend on caffeine, sugar or sheer willpower just to get through an ordinary day.

This is the pattern that's easiest to miss, in yourself and in others, because it doesn't look like a crisis. There's no dramatic collapse to point to. Just a slow, invisible erosion happening beneath a surface that still appears to be coping.`,
      mechanism: `Your body has learned: "I must keep performing even when the tank is empty." When the cost of stopping feels higher than the cost of pushing through, your system starts borrowing against reserves it hasn't rebuilt, and covers the gap with stimulants, adrenaline or sheer momentum instead of genuine recovery.`,
      impact: [
        'Growing dependency on stimulants just to reach baseline function',
        'Health concerns that surface gradually and get dismissed as "just being busy"',
        'A quiet erosion of capacity that\'s easy to miss until it becomes a crisis',
        'Higher risk of a sudden, harder crash the longer the pattern goes unaddressed',
      ],
      shift: [
        'Energy that comes from genuine capacity, not stimulants or adrenaline',
        'Early warning signs get addressed before they become a breakdown',
        'Real, sustainable function instead of performance propped up by hidden cost',
        'A body and system that can be trusted again, not just managed',
      ],
      cta: 'Book Your Health Pattern Consultation',
    },
    'resilient-at-risk': {
      title: 'Resilient but At Risk',
      subtitle: 'Your Pattern: Resilient but At Risk',
      mirror: `You're coping well, and that's real. Your body has genuine resilience: you recover reasonably, your energy holds up most days, and stress doesn't knock you off course the way it might for others. This isn't a pattern that needs rescuing.

But resilience isn't a fixed asset. It's a resource that gets drawn down under sustained demand, and the early signs are already there if you look closely: a bit more tension than usual, a recovery that takes slightly longer than it used to, an energy reserve that isn't quite as deep as it was a year ago. Right now you have a window to reinforce what's working, before those small signals become a bigger pattern.`,
      mechanism: `Your body has developed real capacity, and it's currently being tested by the pace you're sustaining. Resilience holds until it doesn't, quietly, without much warning, unless it's actively reinforced rather than simply relied on.`,
      impact: [
        'Small physical signals (tension, slower recovery, dips in energy) that are easy to dismiss now',
        'Resilience that erodes gradually under sustained load if it isn\'t reinforced',
        'A buffer against future stress that thins out without you noticing',
        'A harder, later reckoning if the current pace continues unchecked',
      ],
      shift: [
        'Resilience that\'s actively protected, not just relied on',
        'A stronger buffer against whatever demands come next',
        'Early signals caught and addressed while they\'re still minor',
        'Sustained clarity and capacity, protected for the long term',
      ],
      cta: 'Book Your Health Pattern Consultation to Protect What\'s Working',
    },
  },
}
