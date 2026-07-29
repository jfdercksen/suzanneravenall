/**
 * Private Sessions — typed catalogue for /services/private-sessions/[slug].
 *
 * `shortDescription` is the existing card copy from
 * components/services/PrivateSessions.tsx.
 * `medusaHandle` is the confirmed live product handle (verified against the
 * running Medusa admin API). Pricing is NOT stored here — the detail page
 * pulls prices from Medusa at runtime via the booking CTA.
 * `bodyContent` is paraphrased from the scraped WordPress source under
 * docs/content-source/services/{slug}.md (shared megamenu chrome ignored).
 * Paragraphs are separated by a blank line and rendered individually.
 * `thinContent: true` marks pages whose source copy is sparse and flags a
 * visible "copy to be expanded" notice for review.
 */

export interface PrivateSessionDualProduct {
  label: string
  handle: string
}

export interface PrivateSession {
  slug: string
  title: string
  shortDescription: string
  medusaHandle: string
  bodyContent: string | null
  thinContent: boolean
  dualProduct?: PrivateSessionDualProduct
}

export const allPrivateSessions: PrivateSession[] = [
  {
    slug: 'transformational-coaching',
    title: 'Transformational & Behavioural Coaching',
    medusaHandle: 'transformation-coaching-60-mins',
    dualProduct: { label: 'Executive Coaching', handle: 'executive-coaching-30-mins' },
    shortDescription:
      'Transformational Coaching has evolved as a more complete approach — shifting from a simple performance-focused tool to a holistic, humanistic and psychological focus. This process focuses on the whole person, not just what is noticeable on the surface.',
    thinContent: false,
    bodyContent: [
      'All transformation is change, but not all change is transformation. A transformational coach helps you reveal the core interpretations and beliefs sitting underneath the parts of life that feel unfulfilled — and then supports you to shift them.',
      "Where traditional coaching is largely results-oriented, transformational coaching works at the level of being rather than doing. It is an ontological, whole-person approach that draws on your cognitive, emotional, somatic and relational patterns to expand what feels possible. The pivotal question isn't only 'what do I want?' but 'who do I need to become for that to be real?'",
      'What to expect: whatever your goals, we uncover what is genuinely standing in the way, then map a path toward where — and who — you want to be. The work is fully customised to you and your situation, and held in a safe space for honest self-exploration. Think of the coaching as the vehicle and Suzanne as your guide: you stay in the driver’s seat throughout.',
      'Executive Coaching: for leaders and professionals, the same depth is applied to leadership, performance and decision-making. This is available as a separate executive coaching engagement alongside the transformational coaching track — book whichever fits where you are.',
    ].join('\n\n'),
  },
  {
    slug: 'rapid-transformational-therapy',
    title: 'Rapid Transformational Therapy®',
    medusaHandle: 'rapid-transformation-therapy-session',
    shortDescription:
      'A hybrid therapy combining the most beneficial principles of Hypnotherapy, CBT (Cognitive Behavioral Therapy), Psychotherapy, NLP (Neuro Linguistic Programming) and Regression Therapy.',
    thinContent: false,
    bodyContent: [
      'Rapid Transformational Therapy (RTT) is a hybrid method that combines the most effective principles of hypnotherapy, CBT, psychotherapy, NLP and regression therapy. Developed and refined over three decades by hypnotherapist Marisa Peer, it works from the premise that past experiences and beliefs create subconscious patterns — and that once the root cause is understood, transformation can begin.',
      "How it works: the subconscious stores not just events but the feelings and beliefs attached to them — 'I'm not good enough', 'there's something wrong with me'. Willpower alone rarely shifts these, because it leaves the underlying cause untouched. In a relaxed, focused hypnotic state the analytical mind quietens, the brain moves from its busy beta frequency into alpha and theta, and those hidden beliefs become accessible — so they can be cleared and the inner 'operating system' updated with healthier patterns.",
      "About hypnosis: hypnosis is a natural state of inward focus we all move through daily — like being absorbed in a film or driving a familiar route on autopilot. You remain fully aware, in control, and able to speak, decide or stop at any time. You cannot be made to act against your values, and you cannot get 'stuck' in a trance.",
      'What a session includes: a 30-minute pre-session, a 90-minute RTT session, a personalised recording of around 20 minutes to listen to daily for 21 days, and email support through the transformational period.',
      'Combination Coaching / RTT: a deeper package pairs one 90-minute RTT session and recording with two one-hour coaching sessions over roughly two to three months, plus tools, exercises and email support to embed the change.',
    ].join('\n\n'),
  },
  {
    slug: 'rapid-repatterning',
    title: 'Rapid Repatterning®',
    medusaHandle: 'rapid-repatterning-session',
    shortDescription:
      'We think 60–70,000 thoughts a day — 90% of them the same as yesterday, driven by memorised beliefs and programmes. Those thoughts lead to the same choices, behaviours and emotions. Rapid Repatterning interrupts the loop at its root.',
    thinContent: false,
    bodyContent: [
      'Frustrated that you keep meeting the same patterns over and over? Rapid Repatterning, using the Ravenall Institute Method, is a combination approach designed to interrupt that loop at its root and create rapid, lasting change.',
      'We think 60,000–70,000 thoughts a day, and around 90% are the same as yesterday — driven by memorised beliefs and programmes. The same thoughts lead to the same choices, the same behaviours and experiences, and the same emotions, and then the cycle begins again. When those patterns are helpful they serve us; when they are harmful, life can feel like groundhog day. Neuroscience puts it simply: nerve cells that fire together wire together, so repeating the same responses keeps the brain firing the same way.',
      'What to expect: the process blends repatterning, hypnotherapy and coaching. You will complete a questionnaire on your history and current challenges, and together we build a plan that may include assessments and hypnosis to cement a new way of being. Using biofeedback and applied kinesiology we locate the unconscious programme beneath the issue, repattern the belief, and shift the resonance — with coaching throughout. Sessions are held over Zoom.',
      'Most core issues shift in one to five sessions, and the work is offered as personal, executive, performance and group repatterning.',
    ].join('\n\n'),
  },
  {
    slug: 'akashic-intuitive-mastery',
    title: 'Akashic Intuitive Mastery',
    medusaHandle: 'akashic-clearing-session',
    shortDescription:
      'Access and rewrite your life’s blueprint. Alter your relationship with success and improve your intuition to such an extent that you receive daily guidance in the direction you are moving in — it is completely possible.',
    thinContent: false,
    bodyContent: [
      "Access and rewrite your life's blueprint. Akashic Intuitive Mastery is a guided way of working with the Akashic Records — described as the energetic record of every soul's experience — to clear the blocks and constrictions sitting beneath the issues you are facing now.",
      'Imagine being able to shift your relationship with success and strengthen your intuition to the point where you receive clear daily guidance. The Records are used as a resource to see beyond the surface, clear disruption in your path, and move through life, work and relationships with greater ease — including the ancestral patterns that can quietly shape a life without our noticing.',
      'In a session the Records can be read — to receive insight and information — and cleared, releasing constrictions and inherited patterns affecting this lifetime. Common focus areas include money and abundance, work and purpose, romantic relationships, your relationship with yourself, family and friendships, and spiritual growth.',
    ].join('\n\n'),
  },
  {
    slug: 'group-family-coaching',
    title: 'Group Family Coaching',
    medusaHandle: 'group-family-coaching-60-mins',
    shortDescription:
      'Some family challenges are difficult to resolve without outside assistance. When we understand how our earliest perceptions and beliefs shape who we are, we can see how our make-up shows up in family dynamics — sometimes in helpful, sometimes in harmful ways.',
    thinContent: false,
    bodyContent: [
      "Some family challenges are hard to resolve without outside support. When we understand how our earliest perceptions and beliefs shape who we are, we can see how each person's make-up shows up in the family dynamic — sometimes helpfully, sometimes not. Group Family Coaching creates a space for everyone to see those dynamics differently and build something richer together.",
      'You might come to this as a parent seeking support with the family environment, because you are struggling with certain dynamics, or to prepare for a transition that lies ahead. Through new understanding and practical tools, willing family members discover fresh possibilities and, over time, forge deeper connections.',
      'How it differs from counselling: counselling tends to focus on pathology and unresolved problems from the past. Family coaching starts in the present — with understanding why we are each made up as we are — and from there works to ease deep stressors, improve decision-making and help the family become a genuine environment of mutual love and support.',
    ].join('\n\n'),
  },
  {
    slug: 'exploring-the-alpha-mind',
    title: 'Exploring the Alpha Mind',
    medusaHandle: 'exploring-the-alpha-mind-45-minutes',
    shortDescription:
      'A deep practice for accessing the alpha brainwave state — the gateway between conscious awareness and the unconscious programmes running your daily life.',
    thinContent: false,
    bodyContent: [
      "Entering a flow state is a kind of magic: time falls away and you move into a calm, creative state of focus where learning accelerates, performance lifts, and insight you didn't think was available becomes accessible. The difficulty is reaching that state on demand in an ordinary working day.",
      'Meditation and mindfulness are excellent routes into relaxation, and from that quieter state a different kind of awareness — and new information — opens up. Exploring the Alpha Mind teaches tools and techniques to reach this alpha brainwave state quickly and deliberately, so that clearer ideas, better choices and a steady sense of guidance can become a normal way of moving through life rather than a rare, accidental occurrence.',
    ].join('\n\n'),
  },
  {
    slug: 'energetic-realignment-optimisation',
    title: 'Energetic Realignment & Optimisation',
    medusaHandle: 'energetic-clearing-completed-remotely',
    shortDescription:
      'Clearings for people, dwellings, businesses, animals, and properties worldwide. These clearings remove negative, imbalanced or stagnated energies. All clearings are performed remotely — a person does not need to be physically present.',
    thinContent: false,
    bodyContent: [
      "Energetic Realignment & Optimisation provides remote clearings for people, homes, businesses, animals and properties anywhere in the world, releasing negative, imbalanced or stagnant energy. Because energy isn't limited by time or space, every clearing is performed at a distance — you don't need to be physically present.",
      'A clearing is a specific, detailed process of releasing negativity, and it works in layers, much like peeling back an onion. Because we are constantly exposed to discordant energy, regular clearings are ideal; the process can take up to two hours, after which you receive an emailed report of the energies that were released.',
      'Personal clearings: strong emotions, repressed feelings and unresolved stress can clog the energy field and attract more of the same — affecting focus, mood and vitality. After a clearing, many people feel calmer, clearer and lighter, sleep better and feel less anxious. A restoration period of several months follows as the body adjusts to a new energetic baseline; lasting change also asks for a willingness to shift habits afterwards.',
      'Beyond the individual, clearings are offered for homes and land (calmer, lighter spaces and better sleep), for animals (who absorb the stress around them and become noticeably more settled), and for businesses (improved morale, productivity and harmony). For the fullest benefit, a personal clearing is often done at the same time as a home or business clearing.',
    ].join('\n\n'),
  },
  {
    slug: 'executive-coaching',
    title: 'Executive Coaching',
    medusaHandle: 'executive-coaching-30-mins',
    shortDescription:
      'Executive-level coaching focused on leadership, performance, and transformational growth.',
    thinContent: false,
    bodyContent: null,
  },
  // Resonance Repatterning deliberately last — Suzanne wants it findable but
  // never front-and-centre (feedback, 27 Jul 2026).
  {
    slug: 'resonance-repatterning',
    title: 'Resonance Repatterning',
    medusaHandle: 'resonance-repatterning-session',
    shortDescription:
      'We attract people at our common level of woundedness or our common level of emotional health. The kind of energy you project has everything to do with the kind of person you attract — become the healthy self you want to meet.',
    thinContent: false,
    bodyContent: [
      "Recommended by Bruce Lipton, author of The Biology of Belief.",
      "Much of what holds us back lives below conscious awareness. The subconscious mind runs an estimated 95% of daily life, quietly replaying beliefs and programmes formed early on — often before we were old enough to choose them. When those patterns are out of sync, we keep meeting the same struggles in work, relationships and health, no matter how hard we try consciously.",
      'Resonance Repatterning works with the principle that everything — our thoughts, feelings and even the body — carries an energetic frequency, and that the patterns we resonate with shape the life we experience. A session brings these hidden patterns into conscious awareness so they can be understood, cleared, and shifted toward greater coherence and alignment with what you actually want.',
      'What to expect: you bring your lived experience and a genuine willingness to change. Using biofeedback and applied kinesiology, we locate the unconscious programme beneath the issue at hand, repattern the belief driving it, and shift the resonance using one of more than a hundred modalities — with coaching throughout so you understand the pattern and can act on the change. Sessions are held over Zoom in the comfort of your own space; you simply show up and participate.',
      'Most core issues begin to shift somewhere between one and five sessions. For some people a single session creates a quantum leap; for others, blended core issues take a little longer. Sessions are offered as personal, executive, performance and group repatterning, and can be booked individually or as multi-session packages.',
    ].join('\n\n'),
  },
]

export const privateSessionBySlug = (slug: string): PrivateSession | undefined =>
  allPrivateSessions.find((session) => session.slug === slug)
