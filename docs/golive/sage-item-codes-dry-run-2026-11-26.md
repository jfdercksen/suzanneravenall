# Sage item codes: dry-run list (26 Nov 2026)

What the script `apps/medusa/src/scripts/set-sage-item-codes-2026-11-26.ts` would write. **Nothing was written.** The plan logic ran on the review shop's public product list, read today: 62 published products, 149 variants. Draft products (most membership levels, products not on sale) are not in that list; the real dry run inside the box covers them too.

For Carla:
- Check each code against her Sage item list.
- Name the right code for the "no-code" rows at the top.

| Count | |
|---|---|
| set (code would be written) | 144 |
| no-code (check by hand) | 5 |
| unchanged | 0 |
| conflict (already holds another code, never overwritten) | 0 |
| from the 14 Oct catalogue map | 142 |
| from a membership level's own code | 2 |

The code goes in `variant.metadata.sage_item_code`. The SKU field is not touched.

| Action | Product | Variant | Status | Sage code | From | Old shop product | Note |
|---|---|---|---|---|---|---|---|
| no-code | Brainwave Club | Partner product | published |  |  |  | not in the 14 Oct map: check by hand |
| no-code | Energy Alignment & Optimisation Level 1 & 2: Purchased Together | Self Study | published |  |  |  | in the map, but the old product has no code |
| no-code | Group Session: Coherent Communication | Recorded series | published |  |  |  | in the map, but the old product has no code |
| no-code | Group Session: Love & Relationships | Recorded series | published |  |  |  | in the map, but the old product has no code |
| no-code | Suzanne Ravenall Coaching App | Once-off | published |  |  |  | not in the 14 Oct map: check by hand |
| set | Akashic Coaching / Clearing Session | 60 min | published | S0123 | catalogue-map | Akashic Coaching/Clearing Session (60 mins) |  |
| set | Akashic Coaching / Clearing Session | 90 min | published | S0015 | catalogue-map | Akashic Coaching/Clearing Session (90min) |  |
| set | Akashic Coaching / Clearing Session | Package of 04 | published | S0098 | catalogue-map | Akashic Coaching/Clearing Session (60 mins) (package of 04) |  |
| set | Akashic Coaching / Clearing Session | Package of 08 | published | S0097 | catalogue-map | Akashic Coaching/Clearing Session (60 mins) (package of 08) |  |
| set | Akashic Coaching / Clearing Session | Package of 12 | published | S0096 | catalogue-map | Akashic Coaching/Clearing Session (60 mins) (package of 12) |  |
| set | Akashic Navigator Level 1 & 2: Purchased Together | Live Retaker | published | S0010 | catalogue-map | Akashic Navigator & Intuitive Coaching Fundamentals & Adv: Purchased together (Live Retaker Zoom) |  |
| set | Akashic Navigator Level 1 & 2: Purchased Together | Live via Zoom | published | S0061 | catalogue-map | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Live via Zoom) |  |
| set | Akashic Navigator Level 1 & 2: Purchased Together | Self Study | published | S0064 | catalogue-map | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Self Study) |  |
| set | Akashic Navigator Level 1: Fundamentals | Live Retaker | published | S0026 | catalogue-map | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live Retaker via Zoom) |  |
| set | Akashic Navigator Level 1: Fundamentals | Live via Zoom | published | S0112 | catalogue-map | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live via Zoom) |  |
| set | Akashic Navigator Level 1: Fundamentals | Self Study | published | S0114 | catalogue-map | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Self Study) |  |
| set | Akashic Navigator Level 2: Advanced | Live Retaker | published | S0025 | catalogue-map | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live Retaker via Zoom) |  |
| set | Akashic Navigator Level 2: Advanced | Live via Zoom | published | S0005 | catalogue-map | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live via Zoom) |  |
| set | Akashic Navigator Level 2: Advanced | Self Study | published | S0003 | catalogue-map | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Self Study) |  |
| set | Akashic Novice Practitioner - Basic Membership | Annual | published | S0214 | membership-tier |  |  |
| set | Be an Energy Ninja Level 1 | Live via Zoom | published | S0035 | catalogue-map | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Live Zoom) |  |
| set | Be an Energy Ninja Level 1 | Self Study | published | S0036 | catalogue-map | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Self Study) |  |
| set | Be an Energy Ninja Level 2 | Live via Zoom | published | S0018 | catalogue-map | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 2 (Live Zoom) |  |
| set | Bonus Lifetime Access | Per programme level | published | S0186 | catalogue-map | Bonus Lifetime Access (Self Study Online) |  |
| set | Breakthrough Trilogy | Pre-order | published | S0131 | catalogue-map | The Latest Book By Suzanne (Pre-order) |  |
| set | Bringing Your Energy Back | Default | published | S0191 | catalogue-map | Bringing Your Energy Back |  |
| set | Coaching Support Package | Per session | published | S0181 | catalogue-map | Coaching |  |
| set | Coherence Muscle Testing | Self Study | published | S0134 | catalogue-map | Coherence Muscle Testing (Self Study Online) |  |
| set | Email Support | Per month | published | S0182 | catalogue-map | Email Support |  |
| set | Energetic Alignment & Inner Neutrality | Default | published | S0193 | catalogue-map | Energetic Alignment & Inner Neutrality |  |
| set | Energetic Clearing | Package of 04 | published | S0067 | catalogue-map | Energetic Clearing (completed remotely) Package of 04 |  |
| set | Energetic Clearing | Package of 08 | published | S0066 | catalogue-map | Energetic Clearing (completed remotely) Package of 08 |  |
| set | Energetic Clearing | Package of 12 | published | S0065 | catalogue-map | Energetic Clearing (completed remotely) Package of 12 |  |
| set | Energetic Clearing | Single session | published | S0068 | catalogue-map | Energetic Clearing (completed remotely) |  |
| set | Energy Alignment & Optimisation Level 1 & 2: Purchased Together | Live Retaker | published | S0190 | catalogue-map | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Live Retaker via Zoom) |  |
| set | Energy Alignment & Optimisation Level 1 & 2: Purchased Together | Live via Zoom | published | S0151 | catalogue-map | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Live via Zoom) |  |
| set | Energy Alignment & Optimisation Level 1: Fundamentals | Live Retaker | published | S0017 | catalogue-map | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live Retaker via Zoom) |  |
| set | Energy Alignment & Optimisation Level 1: Fundamentals | Live via Zoom | published | S0006 | catalogue-map | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom) |  |
| set | Energy Alignment & Optimisation Level 1: Fundamentals | Self Study | published | S0009 | catalogue-map | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Self Study) |  |
| set | Energy Alignment & Optimisation Level 2: Advanced | Live Retaker | published | S0016 | catalogue-map | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Live Retaker via Zoom) |  |
| set | Energy Alignment & Optimisation Level 2: Advanced | Live via Zoom | published | S0107 | catalogue-map | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Live via Zoom) |  |
| set | Energy Alignment & Optimisation Level 2: Advanced | Self Study | published | S0109 | catalogue-map | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Self Study) |  |
| set | Executive Coaching Session | 30 min | published | S0089 | catalogue-map | Executive coaching (30 mins) |  |
| set | Executive Coaching Session | 60 min | published | S0032 | catalogue-map | Executive coaching (60 mins) |  |
| set | Executive Coaching Session | Package of 04 | published | S0088 | catalogue-map | Executive coaching (60 mins) (package of 04) |  |
| set | Executive Coaching Session | Package of 08 | published | S0087 | catalogue-map | Executive coaching (60 mins) (package of 08) |  |
| set | Executive Coaching Session | Package of 12 | published | S0086 | catalogue-map | Executive coaching (60 mins) (package of 12) |  |
| set | Executive Coaching Session | Package of 16 | published | S0085 | catalogue-map | Executive coaching (60 mins) (package of 16) |  |
| set | Exploring the Alpha Mind | Package of 05 | published | S0072 | catalogue-map | Exploring the Alpha Mind (45 Mins) (Package of 05) |  |
| set | Exploring the Alpha Mind | Package of 08 | published | S0071 | catalogue-map | Exploring the Alpha Mind (45 Mins) (Package of 08) |  |
| set | Exploring the Alpha Mind | Single session (45 min) | published | S0073 | catalogue-map | Exploring the Alpha Mind (45 mins) |  |
| set | Finding My Life Purpose | Live via Zoom | published | S0127 | catalogue-map | Finding My Life Purpose (Live via Zoom) |  |
| set | Finding My Life Purpose | Self Study | published | S0031 | catalogue-map | Finding My Life Purpose (Self Study) |  |
| set | Getting Unstuck (Self Study) | Default | published | S0001 | catalogue-map | Getting Unstuck (Self Study) |  |
| set | Group Family Coaching | Package of 04 | published | S0075 | catalogue-map | Group Family Coaching (60 Mins) (Package of 04) |  |
| set | Group Family Coaching | Package of 08 | published | S0074 | catalogue-map | Group Family Coaching (60 Mins) (Package of 08) |  |
| set | Group Family Coaching | Single session | published | S0076 | catalogue-map | Group Family Coaching (60 Mins) (Single Sesson) |  |
| set | Group Session: Attraction Frequency | Recorded series | published | S0141 | catalogue-map | Group Session Attraction Frequency (available as a recorded series) Coming Soon |  |
| set | Group Session: Being a Great Boundary Setter | Live (booked as series) | published | S0029 | catalogue-map | Group Session Being a Great Boundary Setter (booked as a series only) |  |
| set | Group Session: Being a Great Boundary Setter | Recorded series | published | S0144 | catalogue-map | Group Session Being a Great Boundary Setter (available as a recorded series) |  |
| set | Group Session: Career Progression | Live (booked as series) | published | S0120 | catalogue-map | Group Session Career Progression (booked as a series only) |  |
| set | Group Session: Career Progression | Recorded series | published | S0145 | catalogue-map | Group Session Career Progression (available as a recorded series) |  |
| set | Group Session: Coherent Communication | Live (booked as series) | published | S0027 | catalogue-map | Group Session Coherent Communication (booked as a series only) |  |
| set | Group Session: Develop Super Confidence | Live | published | S0142 | catalogue-map | Group Session Develop Super Confidence |  |
| set | Group Session: Develop Super Confidence | Recorded series | published | S0143 | catalogue-map | Group Session Develop Super Confidence (available as a recorded series) Coming Soon |  |
| set | Group Session: Love & Relationships | Live (booked as series) | published | S0136 | catalogue-map | Group Session Love & Relationships |  |
| set | Group Session: Money Mastery | Live (booked as series) | published | S0122 | catalogue-map | Group Session Money Mastery (booked as a series only) |  |
| set | Group Session: Money Mastery | Recorded series | published | S0146 | catalogue-map | Group Session Money Mastery (available as a recorded series) |  |
| set | Group Session: Shedding Excess Weight | Live (booked as series) | published | S0030 | catalogue-map | Group Session Shedding excess Weight (booked as a series only) |  |
| set | Group Session: Shedding Excess Weight | Recorded series | published | S0139 | catalogue-map | Group Session Shedding excess Weight (available as recorded series) |  |
| set | Intuition (Personal & Business Capacity) | Business Capacity: Live via Zoom | published | S0039 | catalogue-map | Intuition in My Business Capacity (Live via Zoom) |  |
| set | Intuition (Personal & Business Capacity) | Business Capacity: Self Study | published | S0038 | catalogue-map | Intuition in My Business Capacity (Self Study) |  |
| set | Intuition (Personal & Business Capacity) | Personal Capacity: Live via Zoom | published | S0128 | catalogue-map | Intuition in My Personal Capacity (Live via Zoom) |  |
| set | Intuition (Personal & Business Capacity) | Personal Capacity: Self Study | published | S0040 | catalogue-map | Intuition in My Personal Capacity (Self Study) |  |
| set | Lifestyle Membership | Annual | published | S0212 | membership-tier |  |  |
| set | Love & Relationships | Live via Zoom | published | S0129 | catalogue-map | Love & Relationships (Live via Zoom) |  |
| set | Love & Relationships | Self Study | published | S0041 | catalogue-map | Love & Relationships (Self Study) |  |
| set | Meditation | Live via Zoom | published | S0117 | catalogue-map | Meditation (Live via Zoom) |  |
| set | Meditation | Self Study | published | S0034 | catalogue-map | Meditation (Self Study) |  |
| set | Mindfulness | Live via Zoom | published | S0118 | catalogue-map | Mindfulness (Live via Zoom) |  |
| set | Mindfulness | Self Study | published | S0033 | catalogue-map | Mindfulness (Self Study) |  |
| set | Post Traumatic Growth | Self Study | published | S0158 | catalogue-map | Post Traumatic Growth (Self Study Online) |  |
| set | Practitioner Mentorship | Bundle of 5 Sessions (Live) | published | S0178 | catalogue-map | Practitioner Mentorship Bundle of 5 Sessions (Live) |  |
| set | Practitioner Mentorship | Bundle of 5 Sessions (Self Study) | published | S0180 | catalogue-map | Practitioner Mentorship Bundle of 5 Sessions (Self study) |  |
| set | Practitioner Mentorship | Single Session (Live) | published | S0177 | catalogue-map | Practitioner Mentorship Single Session (Live) |  |
| set | Practitioner Mentorship | Single Session (Self Study) | published | S0179 | catalogue-map | Practitioner Mentorship Single Session (Self study) |  |
| set | Quantum Healing Codes | eBook & Audio Download | published | S0150 | catalogue-map | Quantum Healing Codes |  |
| set | Rapid Repatterning Session | 60 min in-person | published | S0156 | catalogue-map | Rapid Repatterning Session (60 mins) (In-person session) |  |
| set | Rapid Repatterning Session | 60 min online | published | S0124 | catalogue-map | Rapid Repatterning Session (60 mins) (single online session) |  |
| set | Rapid Repatterning Session | 90 min in-person | published | S0103 | catalogue-map | Rapid Repatterning Session (90 mins In-person) |  |
| set | Rapid Repatterning Session | 90 min online | published | S0154 | catalogue-map | Rapid Repatterning Session (90 mins) (Single online session) |  |
| set | Rapid Repatterning Session | Package of 04 (60 min online) | published | S0102 | catalogue-map | Rapid Repatterning Session (60 mins) (Package of 04 sessions) |  |
| set | Rapid Repatterning Session | Package of 04 (90 min online) | published | S0194 | catalogue-map | Rapid Repatterning / Coaching (90 mins) (package of 04) |  |
| set | Rapid Repatterning Session | Package of 08 (60 min online) | published | S0101 | catalogue-map | Rapid Repatterning Session (60 mins) (Package of 08 sessions) |  |
| set | Rapid Repatterning Session | Package of 08 (90 min online) | published | S0195 | catalogue-map | Rapid Repatterning / Coaching (90 mins) (package of 08) |  |
| set | Rapid Repatterning Session | Package of 12 (60 min online) | published | S0100 | catalogue-map | Rapid Repatterning Session (60 mins) (Package of 12 sessions) |  |
| set | Rapid Repatterning Session | Package of 12 (90 min online) | published | S0196 | catalogue-map | Rapid Repatterning / Coaching (90 mins) (package of 12) |  |
| set | Rapid Repatterning Session | Package of 16 (60 min online) | published | S0099 | catalogue-map | Rapid Repatterning Session (60 mins) (Package of 16 sessions) |  |
| set | Rapid Repatterning Session | Package of 16 (90 min online) | published | S0197 | catalogue-map | Rapid Repatterning / Coaching (90 mins) (package of 16) |  |
| set | Rapid Transformation Therapy Session | 1 hypnosis session + recording | published | S0104 | catalogue-map | Rapid Transformation Therapy Session (1 hypnosis session + hypnosis recording) |  |
| set | Rapid Transformation Therapy Session | 1 hypnosis session + recording + 2 coaching sessions | published | S0125 | catalogue-map | Rapid Transformation Therapy Session (1 hypnosis session, hypnosis, recording + 2 coaching sessions) |  |
| set | Ravenall Institute Certification Observation Fee | Once-off | published | S0184 | catalogue-map | Ravenall Institute Certification Observation Fee |  |
| set | Relaxation & Energy Reclamation | Default | published | S0192 | catalogue-map | Relaxation & Energy Reclamation |  |
| set | Resonance Repatterning / Coaching Session | 60 min online | published | S0126 | catalogue-map | Resonance Repatterning / Coaching (60 Mins) |  |
| set | Resonance Repatterning / Coaching Session | 90 min online | published | S0084 | catalogue-map | Resonance Repatterning / Coaching (90 Mins) |  |
| set | Resonance Repatterning / Coaching Session | Package of 04 (60 min) | published | S0080 | catalogue-map | Resonance Repatterning / Coaching Session (60 Mins) (package of 04) |  |
| set | Resonance Repatterning / Coaching Session | Package of 04 (90 min) | published | S0116 | catalogue-map | Resonance Repatterning / Coaching (90 mins) (package of 04) |  |
| set | Resonance Repatterning / Coaching Session | Package of 08 (60 min) | published | S0079 | catalogue-map | Resonance Repatterning / Coaching Session (60 Mins) (package of 08) |  |
| set | Resonance Repatterning / Coaching Session | Package of 08 (90 min) | published | S0083 | catalogue-map | Resonance Repatterning / Coaching (90 mins) (package of 08) |  |
| set | Resonance Repatterning / Coaching Session | Package of 12 (60 min) | published | S0078 | catalogue-map | Resonance Repatterning / Coaching Session (60 Mins) (package of 12) |  |
| set | Resonance Repatterning / Coaching Session | Package of 12 (90 min) | published | S0082 | catalogue-map | Resonance Repatterning / Coaching (90 mins) (package of 12) |  |
| set | Resonance Repatterning / Coaching Session | Package of 16 (60 min) | published | S0077 | catalogue-map | Resonance Repatterning / Coaching Session (60 Mins) (package of 16) |  |
| set | Resonance Repatterning / Coaching Session | Package of 16 (90 min) | published | S0081 | catalogue-map | Resonance Repatterning / Coaching (90 mins) (package of 16) |  |
| set | Resonance Repatterning Accelerated Basic 5 Review | Live via Zoom | published | S0241 | catalogue-map | Resonance Repatterning Accelerated Basic 5 Training Series: Review of Programs 1-5 (Live via Zoom) |  |
| set | Resonance Repatterning Accelerated Basic 5 Review | Self Study | published | S0135 | catalogue-map | Resonance Repatterning Accelerated Basic 5 Training Series: Review of Programs 1-5 (Self Study) |  |
| set | Resonance Repatterning Full Basic Series Programs 1–5 | Live via Zoom | published | S0019 | catalogue-map | Resonance Repatterning Full Basic Training Series, Programs 1-5 (Live via Zoom) |  |
| set | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Live via Zoom) | Standard | published | S0043 | catalogue-map | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Live via Zoom) |  |
| set | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Self Study) | Standard | published | S0046 | catalogue-map | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Self Study) |  |
| set | Resonance Repatterning Program 1: Fundamentals | Live Retaker | published | S0024 | catalogue-map | Resonance Repatterning Program 1 Fundamentals (Live Retaker via Zoom) |  |
| set | Resonance Repatterning Program 1: Fundamentals | Live via Zoom | published | S0105 | catalogue-map | Resonance Repatterning Program 1 Fundamentals (Live via Zoom) |  |
| set | Resonance Repatterning Program 1: Fundamentals | Self Study | published | S0060 | catalogue-map | Resonance Repatterning Program 1 Fundamentals (Self Study) |  |
| set | Resonance Repatterning Program 2: Primary Patterns | Live Retaker | published | S0023 | catalogue-map | Resonance Repatterning Program 2 Primary Patterns (Live Retaker via Zoom) |  |
| set | Resonance Repatterning Program 2: Primary Patterns | Live via Zoom | published | S0056 | catalogue-map | Resonance Repatterning Program 2 Primary Patterns (Live via Zoom) |  |
| set | Resonance Repatterning Program 2: Primary Patterns | Self Study | published | S0059 | catalogue-map | Resonance Repatterning Program 2 Primary Patterns (Self Study) |  |
| set | Resonance Repatterning Program 3: Unconscious Patterns | Live Retaker | published | S0022 | catalogue-map | Resonance Repatterning Program 3 Unconscious Patterns (Live Retaker via Zoom) |  |
| set | Resonance Repatterning Program 3: Unconscious Patterns | Live via Zoom | published | S0052 | catalogue-map | Resonance Repatterning Program 3 Unconscious Patterns (Live via Zoom) |  |
| set | Resonance Repatterning Program 3: Unconscious Patterns | Self Study | published | S0055 | catalogue-map | Resonance Repatterning Program 3 Unconscious Patterns (Self Study) |  |
| set | Resonance Repatterning Program 4: Chakra Patterns | Live Retaker | published | S0021 | catalogue-map | Resonance Repatterning Program 4 Chakra Patterns (Live Retaker via Zoom) |  |
| set | Resonance Repatterning Program 4: Chakra Patterns | Live via Zoom | published | S0048 | catalogue-map | Resonance Repatterning Program 4 Chakra Patterns (Live via Zoom) |  |
| set | Resonance Repatterning Program 4: Chakra Patterns | Self Study | published | S0051 | catalogue-map | Resonance Repatterning Program 4 Chakra Patterns (Self Study) |  |
| set | Resonance Repatterning Program 5: Five Elements & Meridians | Live Retaker | published | S0020 | catalogue-map | Resonance Repatterning Program 5 Five Elements & Meridians (Live Retaker via Zoom) |  |
| set | Resonance Repatterning Program 5: Five Elements & Meridians | Live via Zoom | published | S0011 | catalogue-map | Resonance Repatterning Program 5 Five Elements & Meridians (Live via Zoom) |  |
| set | Resonance Repatterning Program 5: Five Elements & Meridians | Self Study | published | S0014 | catalogue-map | Resonance Repatterning Program 5 Five Elements & Meridians (Self Study) |  |
| set | Resonance Repatterning Program 6: Inner Cultivation | Live via Zoom | published | S0199 | catalogue-map | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Live via Zoom) |  |
| set | Resonance Repatterning Program 6: Inner Cultivation | Self Study | published | S0187 | catalogue-map | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Self Study) |  |
| set | Resonance Repatterning Program 7: Principles of Relationships | Live via Zoom | published | S0200 | catalogue-map | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Live via Zoom) |  |
| set | Resonance Repatterning Program 7: Principles of Relationships | Self Study | published | S0188 | catalogue-map | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Self Study) |  |
| set | Resonance Repatterning Program 9: Energetics of Relationships | Live via Zoom | published | S0201 | catalogue-map | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Live via Zoom) |  |
| set | Resonance Repatterning Program 9: Energetics of Relationships | Self Study | published | S0189 | catalogue-map | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Self Study) |  |
| set | Resonance Repatterning: All Demos & Talk Throughs | Self Study | published | S0132 | catalogue-map | Resonance Repatterning All Repatternings as Demo’s / Talk Throughs + Resources (Self Study) |  |
| set | Transformation Coaching Session | 60 min | published | S0095 | catalogue-map | Transformation Coaching (60 mins) |  |
| set | Transformation Coaching Session | 90 min | published | S0094 | catalogue-map | Transformation Coaching (90 mins) |  |
| set | Transformation Coaching Session | Package of 04 | published | S0093 | catalogue-map | Transformation Coaching (60 mins) (package of 04) |  |
| set | Transformation Coaching Session | Package of 08 | published | S0092 | catalogue-map | Transformation Coaching (60 mins) (package of 08) |  |
| set | Transformation Coaching Session | Package of 12 | published | S0091 | catalogue-map | Transformation Coaching (60 mins) (package of 12) |  |
| set | Transformation Coaching Session | Package of 16 | published | S0090 | catalogue-map | Transformation Coaching (60 mins) (package of 16) |  |
| set | Trauma to Transcendence | Live via Zoom | published | S0130 | catalogue-map | Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Live via Zoom) |  |
| set | Trauma to Transcendence | Self Study | published | S0042 | catalogue-map | Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Self Study) |  |
| set | VIP Package | Per month | published | S0183 | catalogue-map | VIP Package |  |
