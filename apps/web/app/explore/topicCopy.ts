/**
 * The top three bands of six Explore topic pages: "Sound Familiar?",
 * "The Pattern Underneath" and "What Shifts". Suzanne's copy of 8 Nov 2026,
 * pasted as she wrote it (mail "Website checks / changes required"); only the
 * rendering is ours. A topic without an entry here keeps the older
 * `recognitionItems`, `overview`/`corePrinciple` and `discover` fields of
 * topics.ts.
 */
import type { TopicSlug } from './topics'

export type RecognitionCopy = {
  intro: string
  groups: { heading: string; items: string[] }[]
  /** Optional line after the groups, before the closing line. */
  note?: string
  closing: string
}

export type PatternBlock =
  | { kind: 'text'; heading?: string; paragraphs: string[] }
  | { kind: 'list'; heading?: string; intro?: string; items: string[]; outro?: string }
  | {
      kind: 'cards'
      heading?: string
      intro: string[]
      cards: { title: string; subtitle: string; body: string }[]
      outro?: string
    }
  | { kind: 'compare'; heading?: string; columns: [string, string]; rows: [string, string][] }
  | { kind: 'statement'; text: string; body?: string }

export type PatternCopy = { headline: string; blocks: PatternBlock[] }

export type ShiftsCopy = {
  headline: string
  intro: string
  items: { title: string; body: string }[]
  closing: string
}

export type TopicCopy = {
  recognition: RecognitionCopy
  pattern: PatternCopy
  shifts: ShiftsCopy
}

export const topicCopy: Partial<Record<TopicSlug, TopicCopy>> = {
  'emotional-nervous-system-mastery': {
    recognition: {
      intro: 'You might recognise this…',
      groups: [
        {
          heading: 'In the moment',
          items: [
            'Overreacting, then replaying it and regretting it for days',
            'Going from calm to furious, or close to tears, in seconds',
            'Saying yes when you mean no, just to keep the peace',
            'Going blank or numb just when you need to speak',
          ],
        },
        {
          heading: 'Underneath it all',
          items: [
            'Anxiety with no clear cause',
            'Feeling on edge even when nothing is wrong',
            'Emotional highs and lows that wear you out',
            'A body that never fully relaxes',
          ],
        },
        {
          heading: 'Over time',
          items: [
            'Emotional shutdown: switching off to get through the day',
            'Burnout that won’t lift, however much you rest',
            'Living in fight, flight, freeze or fawn without realising it',
            'Understanding exactly why you react, and doing it anyway',
          ],
        },
      ],
      closing: 'This isn’t your personality. It’s your patterning.',
    },
    pattern: {
      headline: 'Your emotions aren’t the problem. They’re the evidence.',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Most people believe their emotions are what’s wrong. “I’m anxious.” “I overreact.” “I shut down.” So they try to control them, suppress them or think their way out of them.',
            'But emotions aren’t the cause. They’re the output. They show you how your nervous system is reading the world.',
          ],
        },
        {
          kind: 'list',
          items: [
            'If your system feels unsafe, you’ll feel anxious, even in a safe room.',
            'If your system expects pressure, you’ll feel stress, even when nothing is wrong.',
            'If your system learned to shut down, you’ll disconnect, even when you want to engage.',
          ],
        },
        {
          kind: 'statement',
          text: 'You aren’t reacting to what’s happening now. You’re reacting to what your system expects, based on the past.',
        },
        {
          kind: 'cards',
          heading: 'The four survival patterns',
          intro: [
            'Your nervous system is built for survival. When it senses threat, physical or social, it fires one of four responses before you’ve had time to think. Repeat a response often enough and it becomes your default.',
          ],
          cards: [
            {
              title: 'Fight',
              subtitle: 'Protect by taking control.',
              body: 'You react, push back, control and dominate. Irritability, a short fuse, and needing to win or be right.',
            },
            {
              title: 'Flight',
              subtitle: 'Protect by escaping.',
              body: 'You feel anxious, overthink, stay busy and can’t sit still. Running from the feeling, often straight into overwork.',
            },
            {
              title: 'Freeze',
              subtitle: 'Protect by shutting down.',
              body: 'You go numb, withdraw, collapse and switch off. Going blank under pressure and losing access to your own voice.',
            },
            {
              title: 'Fawn',
              subtitle: 'Protect by pleasing.',
              body: 'You appease, over-accommodate and abandon your own needs to keep others happy. Safety bought at the cost of yourself.',
            },
          ],
        },
        {
          kind: 'list',
          heading: 'One pattern shows up everywhere',
          items: [
            'In your emotions: anxiety, irritability, overwhelm, highs and lows',
            'In your relationships: reactivity, miscommunication, withdrawal, the same arguments over and over',
            'In your performance: burnout, output driven by pressure, loss of clarity',
            'In your body: fatigue, tension, poor sleep, symptoms linked to stress',
          ],
          outro:
            'Think of your nervous system as a bottle of water. Every stress you don’t release pours a little more in. If you fill it without ever draining it, it eventually overflows into your mood, your relationships and your health.',
        },
        {
          kind: 'text',
          heading: 'Why insight isn’t enough',
          paragraphs: [
            'You can understand this pattern completely and still repeat it. That’s because it doesn’t live in your thinking. It lives in your nervous system and your body, below conscious thought.',
            'You can’t think your way out of a survival response, and you can’t heal in survival mode.',
          ],
        },
        { kind: 'statement', text: 'You have to change the system.' },
      ],
    },
    shifts: {
      headline: 'Life after repatterning',
      intro:
        'When your nervous system learns it’s safe, you no longer have to manage your emotions. They regulate themselves.',
      items: [
        {
          title: 'Calm without forcing it',
          body: 'Regulation replaces the constant effort of managing yourself. Calm becomes your baseline, not something you have to perform.',
        },
        {
          title: 'You respond instead of react',
          body: 'Pressure no longer pulls you into fight, flight, freeze or fawn. There’s space between the trigger and your response.',
        },
        {
          title: 'Clear thinking under pressure',
          body: 'Clarity returns because your nervous system is no longer hijacking it.',
        },
        {
          title: 'No more living on edge',
          body: 'Your baseline moves out of survival and back into safety. Your body finally gets to rest.',
        },
        {
          title: 'Relationships soften',
          body: 'Fewer arguments, more connection. You stop repeating old conflicts and start being truly present.',
        },
        {
          title: 'Your energy stabilises',
          body: 'Your output becomes sustainable rather than running on pressure. The bottle drains, and your capacity grows.',
        },
      ],
      closing: 'Decode the pattern. Master your emotional world.',
    },
  },

  'relationships-attachment-patterns': {
    recognition: {
      intro: 'You might recognise this…',
      groups: [
        {
          heading: 'In love',
          items: [
            'Repeating the same relationship cycle with a different person',
            'Being drawn to people who are emotionally unavailable',
            'Mistaking intensity for intimacy, and calm for boredom',
            'Fear of abandonment: holding on tighter the more someone pulls away',
          ],
        },
        {
          heading: 'In how you give',
          items: [
            'Over-giving, over-functioning and over-explaining',
            'Putting everyone else’s needs first, then quietly resenting it',
            'Struggling to ask for what you need, or not knowing what that is',
          ],
        },
        {
          heading: 'In conflict',
          items: [
            'Avoiding conflict at all costs, or exploding when it finally comes out',
            'Having the same argument again and again, just about different things',
            'Feeling unheard, even by people who love you',
          ],
        },
        {
          heading: 'In closeness',
          items: [
            'Emotional distance: being physically present but not really reachable',
            'Wanting closeness, then pulling away when it arrives',
            'Feeling alone inside your relationship',
          ],
        },
      ],
      note: 'And it’s not only romance. The same pattern shows up with your family, your friends, your business partners and your team.',
      closing: 'You’re not unlucky in love. You’re loyal to a pattern.',
    },
    pattern: {
      headline: 'You aren’t attracted to what’s healthy. You’re attracted to what’s familiar.',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'You don’t choose relationships consciously. Your nervous system chooses what it recognises.',
            'Your mind thinks it’s choosing love, but your body is choosing what it already knows. Familiar dynamics feel like home, even when home was chaotic.',
          ],
        },
        {
          kind: 'list',
          items: [
            'If intensity once felt like love, you’ll keep chasing intensity.',
            'If distance once felt protective, you’ll keep settling for distance.',
            'If love once had to be earned, you’ll keep over-giving to deserve it.',
          ],
        },
        {
          kind: 'statement',
          text: 'Your system isn’t choosing the person. It’s choosing the pattern.',
        },
        {
          kind: 'cards',
          heading: 'Where it began',
          intro: [
            'Your attachment pattern formed early, long before you could choose. It taught your nervous system what connection should feel like, what to expect from other people and how to stay safe in closeness.',
            'Most people carry one of three attachment patterns:',
          ],
          cards: [
            {
              title: 'The Pursuer',
              subtitle: 'Anxious attachment',
              body: 'Connection never feels secure, so you chase it. You read every silence as rejection, need reassurance and hold on tighter, which can push away the very closeness you want.',
            },
            {
              title: 'The Protector',
              subtitle: 'Avoidant attachment',
              body: 'Closeness feels like a threat to your independence, so you keep a safe distance. You’re self-reliant, private and hard to reach. You stay safe, and you stay alone.',
            },
            {
              title: 'The Push-Pull',
              subtitle: 'Disorganised attachment',
              body: 'You want closeness and fear it at the same time. You come close, then pull away, so relationships feel like a storm you’re both creating and trying to survive.',
            },
          ],
          outro:
            'Beneath all three is the same thing: a need for love, safety or belonging that went unmet when the pattern formed, and that your system is still trying to meet.',
        },
        {
          kind: 'list',
          heading: 'Why you can see the pattern and still repeat it',
          intro: 'Your nervous system:',
          items: [
            'recognises familiar signals and calls it chemistry',
            'confuses familiar with safe, so red flags feel comforting',
            'replays old protective strategies, even when they cause the same pain',
          ],
        },
        {
          kind: 'compare',
          columns: ['Familiar', 'Safe'],
          rows: [
            ['Instant, intense chemistry', 'Interest that builds steadily'],
            ['Anxiety you mistake for excitement', 'Calm you learn to trust'],
            ['Earning love through effort', 'Love that doesn’t need to be earned'],
            ['Highs, lows and making up', 'Consistency without the drama'],
            ['Feels like home', 'Feels new, at first'],
          ],
        },
        {
          kind: 'statement',
          text: 'It’s not the people who are fighting. It’s the patterns.',
          body: 'Two people in conflict are usually two patterns colliding: two nervous systems each defending what they learned to expect. Change the pattern, and the relationship changes.',
        },
      ],
    },
    shifts: {
      headline: 'Relationships after repatterning',
      intro:
        'When your system learns that closeness is safe, you stop repeating the past and start choosing your future.',
      items: [
        {
          title: 'Connection feels safe',
          body: 'Closeness stops setting off the old fear response. You can let love in without bracing for it to leave.',
        },
        {
          title: 'You ask for what you need',
          body: 'You express your needs clearly, without over-explaining, apologising or bracing for rejection.',
        },
        {
          title: 'Healthy boundaries',
          body: 'You stop over-giving to be loved. You can say no without guilt and yes without resentment.',
        },
        {
          title: 'Conflict becomes connection',
          body: 'Disagreements become conversations instead of battles. You can stay present, be heard and repair.',
        },
        {
          title: 'The cycle breaks',
          body: 'The familiar dynamic loses its pull. You recognise it, and you walk the other way.',
        },
        {
          title: 'You choose from values, not patterns',
          body: 'Chemistry is no longer confused with familiarity. You choose people who are good for you, not just people who feel like home.',
        },
      ],
      closing: 'Decode the pattern. Love differently.',
    },
  },

  'next-level-health-vitality-longevity': {
    recognition: {
      intro: 'You might recognise this…',
      groups: [
        {
          heading: 'In your body',
          items: [
            'Exhausted but wired: tired all day, awake at 3am',
            'Energy that crashes without warning',
            'Tension held in your jaw, shoulders, neck or gut',
            'Recurring headaches, digestive trouble or flare-ups with no clear cause',
            'Getting sick as soon as you finally slow down',
          ],
        },
        {
          heading: 'In your mind',
          items: [
            'Brain fog and forgetfulness',
            'A mind that won’t switch off',
            'Decisions that used to be easy now feel heavy',
            'Running on caffeine, adrenaline and deadlines',
          ],
        },
        {
          heading: 'In your emotions',
          items: [
            'A short fuse, or feeling numb',
            'Background anxiety, even when life is good',
            'Overwhelm you can’t quite explain',
          ],
        },
        {
          heading: 'In your life',
          items: [
            'High-achiever burnout: succeeding on the outside, depleted on the inside',
            'Rest that never restores you',
            'Health routines you start but can’t sustain',
            'Knowing exactly what to do, and still not doing it',
          ],
        },
      ],
      closing: 'This isn’t a weakness. It’s a pattern.',
    },
    pattern: {
      headline: 'Your energy isn’t fixed. It follows your pattern.',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Your genes aren’t your destiny. How you feel every day, in your energy, focus, sleep and resilience, depends far more on the pattern your nervous system runs under pressure.',
            'That pattern was learned. At some point your system worked out how to survive, perform and get results, and it has repeated that strategy ever since, long after it stopped serving you.',
          ],
        },
        {
          kind: 'cards',
          intro: ['Most high performers run one of three patterns on repeat:'],
          cards: [
            {
              title: 'Overdrive',
              subtitle: 'Always on, never off.',
              body: 'You produce output faster than your body can recover. It works until it doesn’t, and then the crash comes as burnout, illness or exhaustion that sleep can’t fix.',
            },
            {
              title: 'Reactivity',
              subtitle: 'Threat at the wheel.',
              body: 'Your nervous system reads pressure as danger. Your decisions come from the survival brain rather than the thinking brain, which leads to errors, conflict and eroded trust, along with a body that rarely gets the signal that it’s safe to rest.',
            },
            {
              title: 'Chaos',
              subtitle: 'Brilliant bursts, no foundation.',
              body: 'There’s no steady structure or rhythm. You get sporadic wins, inconsistent energy and constant restarting, and each cycle costs more than the one before.',
            },
          ],
        },
        {
          kind: 'text',
          heading: 'The outcome is predictable.',
          paragraphs: [
            'Plateau. Exhaustion. Inconsistency. Leadership running on empty.',
            'And the usual answer, which is to push harder, discipline yourself more and add another routine, only strengthens the pattern that’s draining you.',
          ],
        },
        {
          kind: 'statement',
          text: 'You can’t out-work a pattern. You have to change it.',
        },
      ],
    },
    shifts: {
      headline: 'Life after repatterning',
      intro:
        'When your nervous system leaves survival mode, your body can finally do what it was built to do: rest, repair and restore.',
      items: [
        {
          title: 'Energy you can count on',
          body: 'No more crashes, slumps or running on fumes. Your energy steadies and lasts through the day.',
        },
        {
          title: 'Sleep that actually restores',
          body: 'You switch off at night and wake up rested. The 3am mind racing goes quiet.',
        },
        {
          title: 'A clear mind',
          body: 'The brain fog lifts. Focus, memory and decision-making come back, because pressure is no longer hijacking your thinking.',
        },
        {
          title: 'A body at ease',
          body: 'The tension in your jaw, shoulders and gut lets go. Your body stops bracing for threats that aren’t there.',
        },
        {
          title: 'Performance from capacity, not cortisol',
          body: 'You still achieve, without burning out to do it. Output comes from a full tank, not from stress chemistry.',
        },
        {
          title: 'Habits that finally stick',
          body: 'Healthy routines stop feeling like a fight. When the pattern changes, looking after yourself becomes natural rather than forced.',
        },
      ],
      closing: 'Decode the pattern. Unlock your energy.',
    },
  },

  'identity-purpose-activation': {
    recognition: {
      intro: 'You might recognise this…',
      groups: [
        {
          heading: 'How you show up',
          items: [
            'Playing small, even though you know you’re capable of more',
            'Holding back your ideas, then watching someone else say them',
            'Shrinking in rooms where you should be leading',
            'Deflecting compliments and downplaying your wins',
          ],
        },
        {
          heading: 'What you tell yourself',
          items: [
            'Imposter syndrome: waiting to be found out',
            '“Who am I to do this?”',
            'Never feeling quite ready, qualified or good enough',
            'Measuring your worth by what you produce',
          ],
        },
        {
          heading: 'How success feels',
          items: [
            'Success without fulfilment: you got what you wanted, so why does it feel empty?',
            'Hitting the goal and immediately moving the line',
            'Living a life that looks right but doesn’t feel like yours',
          ],
        },
        {
          heading: 'Where you’re heading',
          items: [
            'Confusion about direction, or a quiet sense that you’re off course',
            'Starting over and over without ever fully committing',
            'Knowing there’s more for you and not knowing how to reach it',
          ],
        },
      ],
      closing: 'This isn’t who you are. It’s who you learned to be.',
    },
    pattern: {
      headline: 'Your life reflects your identity, not your goals.',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'If your identity says stay invisible, you’ll play small however big the goal is.',
            'Identity isn’t a choice you made. It was built early, from moments that taught you who you had to be to stay safe, loved or valued. You were praised for some roles and punished for others. Those lessons became rules, and the rules became you.',
          ],
        },
        {
          kind: 'statement',
          text: 'The strategy that protected you then is the one running you now.',
        },
        {
          kind: 'cards',
          intro: ['Most people carry one of three identity patterns:'],
          cards: [
            {
              title: 'The Prover',
              subtitle: 'Worth must be earned.',
              body: 'You’re driven, accomplished and never satisfied. Every win buys a moment of relief before the next proof is due. Rest feels like falling behind, and enough never arrives.',
            },
            {
              title: 'The Invisible One',
              subtitle: 'Safety lives in the shadows.',
              body: 'You’re capable but unseen. You hold back your voice, your ideas and your ambition, because at some point being seen felt dangerous. Others take the opportunities that were yours.',
            },
            {
              title: 'The Drifter',
              subtitle: 'Commitment feels like risk.',
              body: 'You’re full of potential with no clear direction. You keep options open, start things and move on. You stay uncommitted, so you never fail, but you never fully arrive either.',
            },
          ],
        },
        {
          kind: 'text',
          heading: 'Why you can’t “just change”',
          paragraphs: [
            'Identity sets the limits on what’s possible. It decides which actions are even allowed, repeats the behaviours that fit the story, and quietly filters out every new strategy that doesn’t match who you believe you are.',
            'That’s why goals, affirmations and willpower fade. They’re working against an identity that’s still in charge.',
          ],
        },
        {
          kind: 'statement',
          text: 'You don’t rise to the level of your goals. You return to the level of your identity.',
          body: 'Change the identity pattern, live the new story until your body believes it, and the behaviour follows naturally.',
        },
      ],
    },
    shifts: {
      headline: 'Life after repatterning',
      intro:
        'When the identity pattern changes, you don’t have to force the change. It feels natural.',
      items: [
        {
          title: 'Decisions get easier',
          body: 'You stop fighting the old story. Choices that once took willpower become obvious.',
        },
        {
          title: 'Confidence becomes steady',
          body: 'You no longer need to prove yourself or hide to feel safe. Your worth stops depending on how you perform.',
        },
        {
          title: 'You take up your space',
          body: 'Your voice, ideas and ambition come out into the open. You stop shrinking in the rooms you were meant to lead.',
        },
        {
          title: 'Direction becomes clear',
          body: 'Purpose is no longer an idea you chase. You live it, in your body and in your daily choices.',
        },
        {
          title: 'Success feels like yours',
          body: 'Achievement finally comes with fulfilment, because it reflects who you really are rather than who you had to be.',
        },
        {
          title: 'You become your next chapter',
          body: 'You show up as the person your future needs. You stop waiting until you feel ready and become ready.',
        },
      ],
      closing: 'Decode the pattern. Become who you really are.',
    },
  },

  'leadership-high-performance': {
    recognition: {
      intro: 'You might recognise this…',
      groups: [
        {
          heading: 'In your performance',
          items: [
            'Hitting a plateau you can’t break through, however hard you push',
            'Freezing, over-talking or sending the wrong signal in the room that matters most',
            'Your best thinking showing up only after the meeting is over',
            'Being highly capable but inconsistent under pressure',
          ],
        },
        {
          heading: 'In your decisions',
          items: [
            'Decision fatigue: everything feels urgent and nothing feels clear',
            'Second-guessing calls you would once have made with confidence',
            'Reacting quickly, then spending days repairing the fallout',
          ],
        },
        {
          heading: 'In your team',
          items: [
            'Team friction that keeps coming back however many offsites you run',
            'People waiting for you to decide, fix or rescue',
            'The same conflicts and the same bottlenecks, quarter after quarter',
            'A culture that mirrors your stress back to you',
          ],
        },
        {
          heading: 'In you',
          items: [
            'Leadership burnout: carrying everything and recovering from nothing',
            'Feeling lonely at the top, even in a full room',
            'Knowing you’re the ceiling, and not knowing how to lift it',
          ],
        },
      ],
      closing: 'This isn’t a skills gap. It’s a pattern, and your whole organisation is feeling it.',
    },
    pattern: {
      headline: 'Your ceiling isn’t your skill level. It’s your pattern.',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Leadership development teaches you what to do. It can’t account for what your nervous system does in the split second before you do it.',
            'Under pressure, every leader falls back on the pattern they learned in order to survive and succeed. That pattern fires faster than thought. It shapes your tone, your timing and your decisions, and the signal you send into the room.',
          ],
        },
        {
          kind: 'statement',
          text: 'Your team doesn’t just hear your words. They read your nervous system.',
        },
        {
          kind: 'cards',
          intro: ['Most high-performing leaders run one of three patterns:'],
          cards: [
            {
              title: 'Overdrive',
              subtitle: 'Always on, and everyone feels it.',
              body: 'You produce output faster than you can recover. Your team learns that urgency is normal and rest is weakness. Results come at a cost, and eventually it’s you who pays it.',
            },
            {
              title: 'Reactivity',
              subtitle: 'Threat at the wheel.',
              body: 'Pressure reads as danger, so your decisions come from the survival brain rather than the strategic one. That leads to sharp reactions, costly errors and slowly eroding trust. Your people stop bringing you bad news.',
            },
            {
              title: 'Chaos',
              subtitle: 'Brilliant bursts, no foundation.',
              body: 'You have vision without rhythm, and priorities change with your energy. The wins are sporadic, the team is unreliable and everyone keeps restarting. The organisation can’t get ahead of you.',
            },
          ],
        },
        {
          kind: 'text',
          heading: 'The outcome is predictable.',
          paragraphs: [
            'Plateau. Exhaustion. Mixed signals. A team that can only rise as high as your pattern allows.',
            'Pushing harder doesn’t fix it. You mistake intensity for progress, recycle the same stress chemistry and reinforce the pattern that’s holding you back.',
          ],
        },
        {
          kind: 'statement',
          text: 'Leadership development changes the behaviour. Coaching motivates it. Pattern Intelligence™ changes the pattern that creates it.',
        },
      ],
    },
    shifts: {
      headline: 'Leadership after repatterning',
      intro: 'When the leader’s pattern changes, the whole system around them changes too.',
      items: [
        {
          title: 'Calm, clear decisions',
          body: 'You decide from clarity rather than threat. The noise of the survival response no longer drowns out your judgement.',
        },
        {
          title: 'Presence in the room that matters',
          body: 'You hold steady under pressure. The boardroom, the negotiation or the difficult conversation gets the best of you, not your pattern.',
        },
        {
          title: 'Sustainable performance',
          body: 'You stop trading recovery for results. Your energy becomes a resource you can manage rather than one you burn through.',
        },
        {
          title: 'One clear signal',
          body: 'Your words, tone and actions finally match. Your team gets one consistent message instead of a mixed one.',
        },
        {
          title: 'Teams align around your clarity',
          body: 'A regulated leader sets the tone for the room. Friction falls, trust rises and people step up instead of waiting for you.',
        },
        {
          title: 'The ceiling lifts',
          body: 'Your organisation is no longer limited by your old pattern, so it can grow beyond what you thought was possible.',
        },
      ],
      closing: 'Decode the pattern. Lead beyond the ceiling.',
    },
  },

  'intuition-as-patterned-intelligence': {
    recognition: {
      intro: 'You might recognise this…',
      groups: [
        {
          heading: 'Before the decision',
          items: [
            'Second-guessing yourself, even when you know the answer',
            'Asking everyone else’s opinion before you trust your own',
            'Gathering more data to avoid a call you’ve already made inside',
            'Overthinking simple choices until they become complicated',
          ],
        },
        {
          heading: 'In the moment',
          items: [
            'Mistaking fear for intuition, or intuition for fear',
            'A gut feeling you override because it isn’t logical',
            'Feeling pulled in two directions with no clear signal',
          ],
        },
        {
          heading: 'After the decision',
          items: [
            'Misaligned decisions that looked right on paper and felt wrong in your body',
            '“I knew it.” Afterwards, every time',
            'Regret over the opportunity you talked yourself out of',
            'Staying in situations long after your body told you to leave',
          ],
        },
      ],
      closing: 'Your intuition isn’t broken. The signal is buried in noise.',
    },
    pattern: {
      headline: 'Intuition isn’t a gift for the few. It’s an intelligence you can develop.',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Intuition is your nervous system processing information faster than your conscious mind can follow. It’s a high-speed pattern-recognition engine built from every experience your system has ever stored. Neuroscience has a name for these body-based signals: somatic markers. They’re the body’s way of flagging what the mind hasn’t worked out yet.',
            'Elite decision-makers in emergency rooms, cockpits and boardrooms rely on this capacity every day. It isn’t luck. It’s patterned intelligence.',
          ],
        },
        {
          kind: 'text',
          heading: 'But intuition needs a steady system to come through.',
          paragraphs: [
            'When your nervous system is dysregulated, the signal gets drowned out by noise. Fear is loud. Old patterns speak with authority. Survival responses feel exactly like knowing. So you second-guess, override or miss what your body already knew.',
          ],
        },
        {
          kind: 'statement',
          text: 'Your gut feeling isn’t unreliable. It’s being interfered with.',
        },
        {
          kind: 'compare',
          heading: 'Fear or intuition? How to tell the difference',
          columns: ['Fear', 'Intuition'],
          rows: [
            ['Loud, urgent, insistent', 'Quiet, calm, clear'],
            ['Lives in the past or a feared future', 'Lives in the present moment'],
            ['Contracts the body: tight, braced, shallow breath', 'Settles the body: grounded, still, open'],
            ['Argues, repeats and escalates', 'Speaks once, then waits'],
            ['Pushes you toward safety and the familiar', 'Points you toward truth, even when it’s uncomfortable'],
            ['Grows louder the more you think', 'Grows clearer the calmer you get'],
          ],
        },
        {
          kind: 'text',
          heading: 'Regulate the system, and intuition comes back online.',
          paragraphs: [
            'It’s no longer a lucky hunch. It becomes a consistent, reliable read you can act on without hesitation.',
          ],
        },
        {
          kind: 'statement',
          text: 'You can’t hear your intuition over the sound of your survival response.',
        },
      ],
    },
    shifts: {
      headline: 'Life after repatterning',
      intro: 'When the noise settles, the signal returns, and you can trust what it tells you.',
      items: [
        {
          title: 'You trust the read',
          body: 'The signal comes through clearly instead of being overridden by doubt. You know, and you know that you know.',
        },
        {
          title: 'You can tell fear from intuition',
          body: 'You recognise the difference in your body straight away. Fear no longer passes itself off as wisdom.',
        },
        {
          title: 'Decisions cost less energy',
          body: 'Good calls no longer need the exhausting internal negotiation. You decide faster and with less doubt.',
        },
        {
          title: 'Your choices align',
          body: 'What you decide finally matches what you know. Fewer regrets and fewer “I knew it” moments.',
        },
        {
          title: 'You lead from signal, not noise',
          body: 'Your clarity creates certainty in the room. People trust your judgement because you do.',
        },
        {
          title: 'You act at the speed of insight',
          body: 'Opportunities stop slipping past while you deliberate. You move when it matters.',
        },
      ],
      closing: 'Decode the pattern. Trust what you know.',
    },
  },
}

/** Every line of a topic's copy, for the site search index. */
export const topicCopyText = (copy: TopicCopy): string[] => [
  copy.recognition.intro,
  ...copy.recognition.groups.flatMap((g) => [g.heading, ...g.items]),
  ...(copy.recognition.note ? [copy.recognition.note] : []),
  copy.recognition.closing,
  copy.pattern.headline,
  ...copy.pattern.blocks.flatMap((block): string[] => {
    switch (block.kind) {
      case 'text':
        return [...(block.heading ? [block.heading] : []), ...block.paragraphs]
      case 'list':
        return [
          ...(block.heading ? [block.heading] : []),
          ...(block.intro ? [block.intro] : []),
          ...block.items,
          ...(block.outro ? [block.outro] : []),
        ]
      case 'cards':
        return [
          ...(block.heading ? [block.heading] : []),
          ...block.intro,
          ...block.cards.flatMap((c) => [c.title, c.subtitle, c.body]),
          ...(block.outro ? [block.outro] : []),
        ]
      case 'compare':
        return [...(block.heading ? [block.heading] : []), ...block.columns, ...block.rows.flat()]
      case 'statement':
        return [block.text, ...(block.body ? [block.body] : [])]
    }
  }),
  copy.shifts.headline,
  copy.shifts.intro,
  ...copy.shifts.items.flatMap((i) => [i.title, i.body]),
  copy.shifts.closing,
]
