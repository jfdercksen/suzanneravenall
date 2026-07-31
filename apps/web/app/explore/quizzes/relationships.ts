import type { Quiz } from './types'

export const relationshipsQuiz: Quiz = {
  slug: 'relationships-attachment-patterns',
  title: 'What Attachment Pattern Is Shaping Your Relationships?',
  subtitle: 'The way you love is not random. It is patterned.',
  intro: `Most people think their relationship struggles are about the other person. The wrong partner, the wrong timing, the wrong friend group. But the pattern that shows up in one relationship almost always shows up in the next one too. That is not bad luck. That is attachment.

Your attachment pattern was set early, long before you had any say in it, by how safe and how seen you felt in your first close relationships. It now runs quietly underneath every connection you have: how much you need, how much you give, how you handle distance, how you handle closeness. Until it is named, it feels like "just who you are." Once it is named, it becomes something you can actually change.

This 2-minute diagnostic will reveal:
- Your dominant relationship pattern
- Why it formed
- How it is shaping your relationships right now
- What to do to repattern it`,

  questions: [
    { id: 1, text: 'I worry about being abandoned', category: 'anxious-connector' },
    { id: 2, text: 'I need reassurance in relationships', category: 'anxious-connector' },
    { id: 3, text: 'I struggle to express my needs', category: 'push-pull' },
    { id: 4, text: 'I value independence over closeness', category: 'distant-protector' },
    { id: 5, text: 'I avoid conflict', category: 'distant-protector' },
    { id: 6, text: 'I feel overwhelmed by emotional intensity', category: 'push-pull' },
    { id: 7, text: 'I over-give to maintain connection', category: 'anxious-connector' },
    { id: 8, text: 'I pull away when things get too close', category: 'distant-protector' },
    { id: 9, text: 'I fear rejection', category: 'anxious-connector' },
    { id: 10, text: "I feel safest when I'm in control emotionally", category: 'distant-protector' },
  ],

  // Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4

  // Tie-break order: secure-connector (the healthy-attachment outcome) wins
  // ties, including the all-zero case.
  categories: ['distant-protector', 'anxious-connector', 'push-pull', 'secure-connector'],

  results: {
    'anxious-connector': {
      title: 'The Anxious Connector',
      subtitle: 'Your Pattern: The Anxious Connector',
      mirror: `You love hard and you love fast. You are attentive, generous, and deeply attuned to the people you care about. But underneath that generosity is a quiet, constant fear: that if you stop giving, stop checking in, stop making yourself needed, the connection will disappear. So you over-give. You seek reassurance. You read into silences. You feel the relationship even when you are alone in the room.`,
      mechanism: `Your system has learned: "I must earn love to keep it." Somewhere early on, connection felt conditional, so you built a strategy around never letting the thread go slack. It worked, in the sense that it kept people close. But it also means you rarely feel settled inside a relationship, even a good one.`,
      impact: [
        'Exhaustion from constantly monitoring the relationship',
        'Attracting or tolerating partners who are emotionally unavailable',
        'Losing your own needs inside the effort to meet everyone else\'s',
        'Anxiety that does not ease even when things are going well',
      ],
      shift: [
        'You feel secure without needing constant reassurance',
        'You give from fullness, not fear',
        'You can tolerate distance without spiralling',
        'You attract relationships that meet you, not ones you have to chase',
      ],
      cta: 'Book Your Relationship Repatterning Intensive',
    },
    'distant-protector': {
      title: 'The Distant Protector',
      subtitle: 'Your Pattern: The Distant Protector',
      mirror: `You are self-sufficient, capable, and genuinely comfortable on your own. Independence feels like strength to you, and in many ways it is. But there is a line, somewhere just before real vulnerability, that you rarely cross. You avoid conflict. You keep a part of yourself in reserve, even with people who love you. Closeness is welcome, up to a point. Past that point, you protect.`,
      mechanism: `Your system has learned: "It is safer to need less." At some point, depending on others did not go well, so your nervous system built a quieter strategy: stay capable, stay contained, do not let anyone get close enough to let you down. It is not coldness. It is protection that has outlived its usefulness.`,
      impact: [
        'Partners experiencing you as unreachable, even when you care deeply',
        'Conflict left unresolved because it never gets addressed',
        'Intimacy that plateaus and never deepens',
        'Loneliness that independence does not actually solve',
      ],
      shift: [
        'You can let people in without feeling exposed',
        'Vulnerability starts to feel like strength, not risk',
        'Conflict becomes something you can move through, not around',
        'Closeness deepens instead of capping out',
      ],
      cta: 'Book Your Relationship Repatterning Intensive',
    },
    'push-pull': {
      title: 'The Push-Pull Pattern',
      subtitle: 'Your Pattern: The Push-Pull Pattern',
      mirror: `You want connection. Genuinely, deeply. But when it arrives, something in you tenses. You struggle to say what you actually need, and when emotional intensity rises, whether it is theirs or your own, you feel overwhelmed. So you pursue closeness, and then, without quite meaning to, you create distance from it. It is one of the most confusing patterns to live inside, because you are not choosing between wanting and fearing connection. You are doing both, at the same time.`,
      mechanism: `Your system has learned: "Closeness is what I want and what I cannot fully trust." This usually forms when connection in your early life was inconsistent: sometimes warm, sometimes withdrawn, never reliably safe. So your system learned to want it and brace against it in the same breath. The result is a cycle that can look erratic from the outside but makes complete sense once you see where it came from.`,
      impact: [
        'Relationships that feel like a rollercoaster of closeness and withdrawal',
        'Partners left confused about where they actually stand with you',
        'Needs that go unspoken until they come out as distance or frustration',
        'A private sense that you are sabotaging the very connection you want',
      ],
      shift: [
        'You can stay present through emotional intensity instead of retreating',
        'You name your needs before they turn into distance',
        'Connection stops feeling like a threat',
        'The cycle of pursue-and-withdraw finally settles',
      ],
      cta: 'Book Your Relationship Repatterning Intensive',
    },
    'secure-connector': {
      title: 'The Secure Connector',
      subtitle: 'Your Pattern: The Secure Connector',
      mirror: `You bring a real, steady capacity for connection. You can be close without losing yourself and independent without shutting others out. You handle conflict without either collapsing or disappearing, and reassurance is nice to have, not something you require to feel safe. This is what secure attachment looks like in practice, and it did not happen by accident.`,
      mechanism: `You have built a genuine capacity for secure connection, but security is not a fixed state you arrive at once. It is a range, and life will still test the edges of it: new relationships, higher stakes, old wounds surfacing under pressure. There is still room to deepen what you have built.`,
      impact: [
        'Relationships that are generally stable and trusting',
        'A steady sense of self inside closeness',
        'The ability to repair after conflict rather than avoid it',
      ],
      shift: [
        'Even greater depth and ease in your closest relationships',
        'More resilience under real relational pressure',
        'A widened capacity to hold intimacy without losing yourself',
        'Patterns fully integrated, not just managed',
      ],
      cta: 'Go Deeper With a Relationship Repatterning Session',
    },
  },
}
