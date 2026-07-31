import type { Quiz } from './types'

export const vitalityLongevityQuiz: Quiz = {
  slug: 'next-level-health-vitality-longevity',
  title: 'Is Your System Built for Long-Term Performance?',
  subtitle: 'Burnout does not happen overnight. It is patterned.',
  intro: `Most people treat fatigue as a scheduling problem. Sleep more, take a holiday, push through the busy patch, and it will sort itself out. But chronic tiredness, slow recovery and creeping burnout are rarely about your calendar. They're the output of a deeper pattern: how your system generates energy, spends it and recovers it, repeated daily until it becomes your baseline.

If that pattern is skewed toward output and starved of recovery, you don't feel it as a crisis. You feel it as a slow leak: a bit more tired each week, a bit less resilient, a bit further from the version of you that used to bounce back overnight. Left unaddressed, that leak becomes the ceiling on everything else you're trying to build.

This 2-minute diagnostic will reveal:
- Your dominant energy and recovery pattern
- Why it formed
- How it is limiting your performance and health
- What to do to rebuild long-term capacity`,

  questions: [
    { id: 1, text: 'I feel tired during the day', category: 'cognitive-fatigue' },
    { id: 2, text: 'My focus fluctuates', category: 'cognitive-fatigue' },
    { id: 3, text: 'I feel mentally drained', category: 'cognitive-fatigue' },
    { id: 4, text: 'I struggle with consistency', category: 'resilience-erosion' },
    { id: 5, text: 'I push through fatigue', category: 'high-output-low-recovery' },
    { id: 6, text: 'I feel physically depleted', category: 'resilience-erosion' },
    { id: 7, text: 'My recovery is slow', category: 'high-output-low-recovery' },
    { id: 8, text: 'I feel disconnected from my body', category: 'resilience-erosion' },
    { id: 9, text: 'My energy is inconsistent', category: 'resilience-erosion' },
    { id: 10, text: 'I feel burnout creeping in', category: 'high-output-low-recovery' },
  ],

  // Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4

  // Tie-break order: optimised-performer (the "built to last" outcome) wins
  // ties, including the all-zero case.
  categories: ['cognitive-fatigue', 'resilience-erosion', 'high-output-low-recovery', 'optimised-performer'],

  results: {
    'high-output-low-recovery': {
      title: 'High Output / Low Recovery',
      subtitle: 'Your Pattern: High Output / Low Recovery',
      mirror: `You're a producer. When there's a job to do, you do it, tired or not. Fatigue registers as background noise rather than a signal to stop, so you push through it the same way you push through everything else. The problem isn't your work ethic. It's that your system rarely gets the recovery it needs to match the output you demand of it, and when rest does happen, it takes far longer than it should to actually restore you.

From the outside this often looks like discipline. From the inside, it feels like running a car with the fuel light on, refuelling just enough to keep moving, never enough to fill the tank. Burnout isn't a distant risk here. It's already visible at the edges.`,
      mechanism: `Your system has learned: "Stopping isn't an option, so I'll just keep going." Somewhere along the way, pushing through fatigue got wired in as the reliable response, output as proof of worth, rest as a luxury that gets scheduled after everything else. That pattern works, until the recovery debt outpaces what any weekend or holiday can repay.`,
      impact: [
        'Burnout that arrives suddenly, even though it was building for months',
        'Recovery that keeps taking longer for the same amount of rest',
        'Health, mood and relationships absorbing the cost of unpaid rest',
        'Performance that quietly declines even as effort stays high',
      ],
      shift: [
        'You sustain high output without running on empty',
        'Recovery actually restores you, instead of just pausing the depletion',
        'You catch depletion early, long before burnout',
        'You build a system designed to last decades, not just this quarter',
      ],
      cta: 'Start Your Vitality Protocol',
    },
    'cognitive-fatigue': {
      title: 'Cognitive Fatigue Pattern',
      subtitle: 'Your Pattern: Cognitive Fatigue Pattern',
      mirror: `Your body might look fine, but your mind is doing most of the struggling. Tiredness sets in during the day regardless of how much sleep you got. Focus comes and goes, sharp in short bursts, foggy in between. By the time the important part of your day arrives, the mental clarity you actually need is already spent.

This is easy to miss because it rarely looks like classic exhaustion. You're still functioning, still getting through the list. But the cost is quiet and constant: decisions take longer, small tasks feel heavier than they should, and the version of you that used to think clearly under pressure is harder to access than it used to be.`,
      mechanism: `Your system has learned: "I must keep processing, so I'll run on whatever attention is left, even if it's running low." Mental load has been treated as unlimited for long enough that your system stopped protecting it, drawing down cognitive reserves daily without a mechanism to properly refill them.`,
      impact: [
        'Focus that fades earlier in the day than it used to',
        'Decisions that take longer and feel more effortful',
        'Mental fog that outlasts a good night of sleep',
        'A quiet erosion of the sharpness others used to rely on you for',
      ],
      shift: [
        'Sustained mental clarity through the full day',
        'Focus that holds under pressure instead of fading',
        'Faster, more confident decision-making',
        'Cognitive reserves that are actually replenished, not just borrowed against',
      ],
      cta: 'Start Your Vitality Protocol',
    },
    'resilience-erosion': {
      title: 'Resilience Erosion',
      subtitle: 'Your Pattern: Resilience Erosion',
      mirror: `Nothing about your pattern is dramatic. There's no single crash, no obvious breaking point. Instead, your baseline capacity has been eroding gradually: consistency is harder to hold onto than it used to be, your body feels depleted more often than not, and there's a growing disconnect between what you ask of yourself and what you actually feel able to give.

Energy that used to be dependable now shows up unpredictably. Some days you have it, some days you genuinely don't, and there's rarely a clear reason why. That inconsistency isn't random. It's what a system looks like when its baseline resilience has been worn down slowly, one under-recovered day at a time.`,
      mechanism: `Your system has learned: "I'll keep functioning at a lower baseline rather than signal that something needs to change." Small deficits, in sleep, nutrition, recovery, connection to your own body, have compounded quietly over time rather than showing up as one clear event, so the erosion has been easy to normalise and hard to notice.`,
      impact: [
        'A baseline capacity that keeps drifting lower without a clear cause',
        'Energy and consistency that feel like a lottery rather than something you can rely on',
        'Growing disconnection from your body\'s actual signals',
        'Small setbacks that hit harder and take longer to recover from than they used to',
      ],
      shift: [
        'A stable, dependable baseline you can actually plan around',
        'Reconnection to what your body is telling you, before it has to shout',
        'Energy that holds steady day to day',
        'A resilient foundation that absorbs setbacks instead of eroding further under them',
      ],
      cta: 'Start Your Vitality Protocol',
    },
    'optimised-performer': {
      title: 'Optimised Performer',
      subtitle: 'Your Pattern: Optimised Performer',
      mirror: `Your system is currently built for the long game. Energy is largely dependable, recovery does its job, and you're not running the kind of chronic deficit that quietly turns into burnout further down the line. This isn't luck. It reflects a pattern of output and recovery that is genuinely working.

That said, "working" is not the same as "optimised." Most people at this level still have untapped capacity: refinements to recovery, energy management and resilience that would take you from solid to exceptional, and that matter more the higher the demands on you get.`,
      mechanism: `Your system has learned a pattern that supports sustainable performance rather than depleting against it. The next stage isn't fixing something broken. It's refining a system that already works, so it can carry more, for longer, without the cracks that eventually show up in less optimised patterns.`,
      impact: [
        'Untapped performance capacity left on the table',
        "Recovery habits that work now but haven't been stress-tested against bigger demands",
        'Resilience that is solid but not yet fully future-proofed',
        "A ceiling you haven't actually found yet, because you haven't needed to push toward it",
      ],
      shift: [
        'Performance and recovery refined to their next level, not just maintained',
        'A system built to handle bigger demands without losing ground',
        'Deeper, more efficient recovery that compounds over years, not just weeks',
        'The long-term capacity to lead, produce and perform without the burnout most people eventually hit',
      ],
      cta: 'Refine Your System: Start the Full Vitality Protocol',
    },
  },
}
