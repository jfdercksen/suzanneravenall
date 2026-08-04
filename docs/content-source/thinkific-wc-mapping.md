# Thinkific ↔ WooCommerce Product Mapping

_Generated for the n8n enrollment webhook foundation. Source: `docs/content-source/thinkific-courses.json` (Thinkific API) + WooCommerce product export (`wc-product-export-17-6-2026`)._

## ⚠️ Critical caveat — no authoritative ID link in the export

The WooCommerce export contains a `Meta: thinkific_id` column, **but it is empty for all 248 products** (only `Meta: is_a_thinkific_product` is populated, on 98 rows). There is therefore **no exact product→course key** in this CSV. Every match below is derived from **name similarity** (Jaccard on normalised tokens), not a stored ID.

- **HIGH** (score ≥ 0.7) — names match almost exactly; safe to treat as confirmed.
- **MEDIUM** (0.5–0.7) — likely correct but **verify before automating enrollment**.
- **UNMATCHED** — no WC product cleared the 0.5 threshold; needs manual decision.

**For the webhook:** before wiring automated enrollment, the exact `Thinkific course ID ↔ Medusa/WC product` pairs should be confirmed (ideally by back-filling `thinkific_id` on each WC/Medusa product, or confirming the HIGH matches and hand-mapping the rest). Do not drive automated enrollment off MEDIUM/UNMATCHED rows as-is.

## Summary counts

| Bucket | Count |
|---|---|
| **Matched** (Thinkific → WC) | **66** (HIGH 56 · MEDIUM 10) |
| **Unmatched Thinkific** (no WC equivalent) | **15** |
| **WC-only** (no Thinkific equivalent) | **111** (0 flagged thinkific · 111 commerce: sessions/memberships/goods) |

## Published Thinkific courses by category (89 published; 13 drafts excluded)

### 1. Resonance Repatterning (41)

| id | name | price (USD) | slug |
|---|---|---|---|
| 2445019 | Resonance Repatterning Accelerated Basic 5 Training Series : Part 2 (Live Online) | 550.0 | resonance-repatterning-accelerated-retakers-live-part-2 |
| 2353636 | Resonance Repatterning Accelerated Basic 5 Training Series: Review of Programs 1-5 (Live via zoom) | 550.0 | Resonance-Repatterning-Accelerated-Basic-5 |
| 1799809 | Resonance Repatterning All Repatternings as Demo's / Talk Throughs + Resources (Self Study) | 220.0 | Resonance-Repatterning-Full-Basic-Training-Programs-1-5-Demos-Resources-Live-via-zoom |
| 2178705 | Resonance Repatterning All Repatternings as Demo's / Talk Throughs + Resources (Self Study) | 220.0 | Resonance-Repatterning-All-Repatternings-as-Demo's-Talk-Throughs-&-Resources-Self-Study |
| 1954672 | Resonance Repatterning Chakra patterns 4 May 2022 Series | 600.0 | resonance-repatterning-programme-4-self-paced-home-study-practitioner-training-transforming-chakra-patterns |
| 1843429 | Resonance Repatterning Fundamentals May 2022 Series | 600.0 | resonance-repatterning-fundamentals-may-2022-series |
| 1799794 | Resonance Repatterning Group session series : Love & Relationships | 90.0 | Resonance-Repatterning-Group-session-series-Love-and-Relationships |
| 1875277 | Resonance Repatterning Primary Patterns May 2022 Series | 600.0 | rr-may-2022-series-primary-patterns |
| 1349879 | Resonance Repatterning Program 1 Fundamentals (Live via Zoom) | 555.0 | Resonance-Repatterning-Program-1-Fundamentals-Live-via-Zoom |
| 2165207 | Resonance Repatterning Program 1 Fundamentals (Self Study) | 440.0 | resonance-repatterning-Resonance-Repatterning-Program-1-Fundamentals-Self-Study |
| 1383462 | Resonance Repatterning Program 2 Primary Patterns (Live via Zoom) | 555.0 | Resonance-Repatterning-Program-2-Primary-Patterns-Live |
| 2165208 | Resonance Repatterning Program 2 Primary Patterns (Self Study) | 440.0 | Resonance-Repatterning-Program-2-Primary-Patterns-Self-Study |
| 1402405 | Resonance Repatterning Program 3 Unconscious Patterns (Live via Zoom) | 555.0 | resonance-repatterning-Program-3-Unconscious-Patterns-Live-via-Zoom |
| 2165227 | Resonance Repatterning Program 3 Unconscious Patterns (Self Study) | 440.0 | resonance-repatterning-Program-3-Unconscious-Patterns-Self-Study |
| 1405974 | Resonance Repatterning Program 4 Chakra Patterns (Live via Zoom) | 555.0 | Resonance-Repatterning-Program-4-Chakra-Patterns-Live-via-Zoom |
| 2165210 | Resonance Repatterning Program 4 Chakra Patterns (Self Study) | 440.0 | Resonance-Repatterning-Program-4-Chakra-Patterns-Self-Study |
| 1505335 | Resonance Repatterning Program 5 Five Elements & Meridians (Live via Zoom) | 555.0 | Resonance-Repatterning-Program-5-Five-Elements-&-Meridians-Live-via-Zoom |
| 2165229 | Resonance Repatterning Program 5 Five Elements & Meridians (Self Study) | 440.0 | resonance-repatterning-program-5-Five-Elements-Meridians-Self-Study |
| 2165217 | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Live via Zoom) | 555.0 | resonance-repatterning-inner-cultivation |
| 3064382 | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Self Study) | 550.0 | resonance-repatterning-inner-cultivation-self-study |
| 2165209 | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Live via Zoom) | 555.0 | resonance-repatterning-principles-of-relationship-live |
| 3064388 | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Self Study) | 550.0 | resonance-repatterning-Program-7-Principle-of-Relationships-Self-Study |
| 2165225 | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Live via Zoom) | 555.0 | resonance-repatterning-energetics-of-relationship-live |
| 3064390 | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Self Study) | 550.0 | resonance-repatterning-Program-9-Energetics-of-Relationships-Self-Study |
| 1981488 | Resonance Repatterning Programme 5, Five Elements & Meridians May 2022 series | 600.0 | resonance-repatterning-programme-5-self-paced-home-study-practitioner-training-5-element-meridian-patterns |
| 1405977 | Resonance Repatterning Recorded Group Session Series - Career progression | 90.0 | Resonance-Repatterning-Recorded-Group-Session-Series-Career-progression |
| 1892070 | Resonance Repatterning Recorded Group Session Series : Money Mastery | 90.0 | resonance-repatterning-group-series-money-mastery |
| 1776395 | Resonance Repatterning Recorded Group Session Series : Nice or Not Nice Communication | 90.0 | resonance-repatterning-group-session-communication |
| 1696047 | Resonance Repatterning Recorded Group Session Series : Shedding Excess Weight | 90.0 | resonance-repatterning-group-session-shedding-excess-weight |
| 1895575 | Resonance Repatterning Recorded Group Session: Overcoming the need to fix others | 90.0 | Resonance-Repatterning-Recorded-Group-Session-Overcoming-the-need-to-fix-others |
| 1901206 | Resonance Repatterning Recording Group Session: Superhuman confidence | 90.0 | Resonance-Repatterning-Recording-Group-Session-Superhuman-confidence |
| 1901224 | Resonance Repatterning Recording Group Session: The Attraction Frequency | 90.0 | Resonance-Repatterning-Recording-Group-Session-The-Attraction-Frequency |
| 1670729 | Resonance Repatterning Self Paced Home Study: Energetics of Relationship | 180.0 | resonance-repatterning-self-paced-home-study-energetics-of-relationship |
| 1670724 | Resonance Repatterning Self Paced Home Study: Energizing Options taught in the Fundamentals seminar | 25.0 | resonance-repatterning-self-paced-home-study-energizing-options-taught-in-the-fundamentals-seminar |
| 1670727 | Resonance Repatterning Self Paced Home Study: Inner Cultivation Through the 12 Meridians | 185.0 | resonance-repatterning-self-paced-home-study-Inner-cultivation-through-the-12-meridians |
| 1670726 | Resonance Repatterning Self Paced Home Study: Polarity Principles & Contacts for the Five Chakras | 180.0 | resonance-repatterning-self-paced-home-study-polarity-principles-contacts-for-the-five-chakras |
| 1670728 | Resonance Repatterning Self Paced Home Study: Principles of Relationship | 175.0 | resonance-repatterning-self-paced-home-study-principles-of-relationship |
| 1670725 | Resonance Repatterning Self Paced Home Study: Spiral Up! Energizing Options | 49.0 | resonance-repatterning-self-paced-home-study-spiral-up-energizing-options |
| 1776096 | Resonance Repatterning Teacher Training 01 : Train the Trainer | 900.0 | resonance-repatterning-train-the-trainer |
| 1919683 | Resonance Repatterning Unconscious Patterns May 2022 Series | 600.0 | Resonance-Repatterning-Unconscious-Patterns-May-2022-Series |
| 1868702 | RR Observation Training | 350.0 | rr-observation-training |

### 2. Akashic Navigator / Intuitive Coaching (5)

| id | name | price (USD) | slug |
|---|---|---|---|
| 1892654 | Akashic Navigation Basic Coaching & Clearing Self - Level 1 (Self Study) | 330.0 | copy-of-akashic-navigation-advanced-coaching-clearing-level-2-self-study |
| 2434102 | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live via Zoom) | 500.0 | akashic-navigator-and-intuitive-coaching-clearing-others-level-2-advanced-live-via-zoom |
| 2434137 | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live via Zoom) | 500.0 | akashic-navigator-and-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom |
| 1461729 | Akashic Navigator Fundamentals, Intuitive Coaching & Clearing Self Level 1 (Self-Study) | 330.0 | akashic-navigation-coaching-clearing-level-1-self-study |
| 2833014 | New Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Self Study) | 220.0 | new-akashicnavigation-advanced-level2 |

### 3. Deep Energy Clearing / Be an Energy Ninja (8)

| id | name | price (USD) | slug |
|---|---|---|---|
| 2434133 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Live Zoom) | 440.0 | be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live-zoom |
| 1892677 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Self Study) | 220.0 | be-an-energy-ninja-level-1-self-study |
| 2434134 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 2 (Live Zoom) | 440.0 | be-an-energy-ninja-mastering-energy-for-an-abundant-life-level-2-energy-practices-for-repatterning-your-life-level2-live-zoom |
| 1892689 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 2 (Self Study) | 220.0 | be-an-energy-ninja-mastering-energy-for-an-abundant-life-level-2-energy-practices-for-repatterning-your-life-self-study |
| 1892662 | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Live via Zoom) | 350.0 | art-of-deep-clearing-level-2-self-study |
| 1892663 | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom) | 350.0 | art-of-deep-clearing-level-1-self-study |
| 2165221 | The Art of Deep Clearing Level 1 (Live) | 450.0 | the-art-of-deep-clearing-level-1-live |
| 1895592 | The Art of Deep Clearing Level 2 (Live) | 450.0 | art-of-deep-clearing-level-2-live |

### 4. Trauma / Transformation (3)

| id | name | price (USD) | slug |
|---|---|---|---|
| 2920523 | New: Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Self Study) | 220.0 | New-trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-your-adult-self-self-study-online |
| 1287690 | Post Traumatic Growth Presentation | 15.0 | post-traumatic-growth |
| 2331256 | Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Live via Zoom) | 399.0 | trauma-to-transcendence-Breaking-the-hold-of-the-childhood-brain-on-your-adult-self-Live |

### 5. Personal Development / Self Study (16)

| id | name | price (USD) | slug |
|---|---|---|---|
| 1324340 | Coherence Muscle Testing (Self Study Online) | 110.0 | coherence-muscle-testing-self-study-online |
| 2434115 | Finding My Life Purpose (Live via Zoom) | 330.0 | finding-my-life-purpose-live-via-zoom |
| 1892701 | Finding My Life Purpose (Self Study) | 220.0 | finding-my-life-purpose-self-study |
| 1284792 | Getting Unstuck (Self Study) | 110.0 | getting-unstuck |
| 1730348 | Group Session Being a Great Boundary Setter (available as a recorded series) | 90.0 | resonance-repatterning-group-session-boundary-setting |
| 2434092 | Intuition in My Business Capacity (Live via Zoom) | 330.0 | intuition-in-my-business-capacity-live-via-zoom |
| 1895565 | Intuition in My Business Capacity (Self Study) | 220.0 | Intuition- in-my-business-capacity-Self-Study |
| 1892722 | Intuition in My Personal Capacity (Live via Zoom) | 330.0 | Intuition-personal-capacity-live-via-zoom |
| 2434112 | Intuition in My Personal Capacity (Self Study) | 220.0 | intuition-in-my-personal-capacity-1-self-study |
| 2434091 | Love & Relationships (Live via Zoom) | 330.0 | love-relationships-live-via-zoom |
| 1892729 | Love & Relationships (Self Study) | 220.0 | Love-&-Relationships-Self Study |
| 2434094 | Meditation (Live via Zoom) | 440.0 | meditation-live-via-zoom |
| 1892716 | Meditation (Self Study) | 220.0 | meditation-self-study |
| 1892702 | Mindfulness (Live via Zoom) | 440.0 | mindfulness-live-via-zoom |
| 2434157 | Mindfulness (Self Study) | 220.0 | mindfulness-selfstudy |
| 1896029 | Rapid Repatterning Session Introduction | 99.0 | Rapid-Repatterning-Session-Introduction |

### 6. Bundles (8) — productable_type = Bundle

| id | name | price (USD) | slug |
|---|---|---|---|
| 2329050 | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Self Study) | 2540.0 | resonance-repatterning-full-basic-5-series-demo-s-self-study-online-with-mentoring |
| 2329161 | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Live via Zoom) | 2990.0 | resonance-repatterning-full-basic-5-series-demo-s-live |
| 2618925 | Be an Energy Ninja Levels 1 & 2 (Self Study) | 410.0 | be-an-energy-ninja-levels-1-2-self-study |
| 2618833 | Be an Energy Ninja Levels 1 & 2 (Live) | 600.0 | be-an-energy-ninja |
| 2617987 | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Self Study) | 600.0 | Art-of-Deep-Clearing-Levels1-2-Self-Study |
| 2618693 | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Live via Zoom) | 775.0 | the--art-of-deep-clearing-live |
| 2617995 | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Self Study) | 555.0 | akashic-navigation-coaching-self-study-online-with-mentoring |
| 2618687 | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Live via Zoom) | 845.0 | akashic-navigation-coach-live |

### 7. Free / Internal (16) — price = 0 (not individually sellable; no WC match expected)

| id | name | price (USD) | slug |
|---|---|---|---|
| 1822943 | Resonance Repatterning internal training videos | 0.0 | rr-internal-training-videos |
| 1831329 | Suzanne Ravenall Internal Training | 0.0 | suzanne-ravenall-internal-training |
| 2552084 | Monthly Mentorship up to March 2024 | 0.0 | monthly-mentorship |
| 2710688 | draft spare program | 0.0 | trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-the-adult-self-taster |
| 2812936 | Monthly Mentorship April to Sept 2024 | 0.0 | monthly-mentorship-april-to-sept-2024 |
| 2832722 | New Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Self Study) | 0.0 | New-the-art-of-deep-clearing-level-1-how-to-clear-yourself-self-study |
| 2832723 | New Deep Energy Clearing Advanced: Clearing Others, Level 2 (Self Study) | 0.0 | New-the-art-of-deep-clearing-level-2-how-to-clear-others-self-study |
| 2833011 | New Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Self Study) | 0.0 | new-akashic-selfstudy-level-1-readingforself |
| 2913377 | Trauma to Transcendence: Snippets as a taster | 0.0 | trauma-to-transcendence-1hr-talktaster |
| 2946781 | Monthly Mentorship Oct 24 to Nov 24 | 0.0 | monthly-mentorship-Oct-2024-to-May24 |
| 3020989 | Monthly Mentorship Jan'25 to May '25 | 0.0 | monthly-mentorship-Jan'25-to-May'25 |
| 3145236 | Monthly Mentorship June'25 | 0.0 | monthly-mentorship-jan-25-onwards |
| 3173265 | Monthly Mentorship July'25 to August '25 | 0.0 | copy-of-monthly-mentorship-june-25-onwards |
| 3240902 | Monthly Mentorship Sept '25 onwards | 0.0 | monthly-mentorship-sept'25-onwards |
| 3241713 | Trauma to Transcendence: Range of tolerance lesson | 0.0 | trauma-to-transcendence-rangeoftolerance |
| 3283423 | Monthly Mentorship Feb '26 onwards | 0.0 | monthly-mentorship-feb-26-onwards |

## MATCHED — Thinkific course → WooCommerce product

| Confidence | Thinkific ID | Thinkific course | → | WC product | WC SKU | WC ZAR | Thinkific USD |
|---|---|---|---|---|---|---|---|
| HIGH (1) | 1284792 | Getting Unstuck (Self Study) | → | Getting Unstuck (Self Study) | S0001 | 1660 | 110.0 |
| HIGH (1) | 1324340 | Coherence Muscle Testing (Self Study Online) | → | Coherence Muscle Testing (Self Study Online) | S0134 | 1610 | 110.0 |
| HIGH (1) | 1349879 | Resonance Repatterning Program 1 Fundamentals (Live via Zoom) | → | Resonance Repatterning Program 1 Fundamentals (Live via Zoom) | S0105 | 5315 | 555.0 |
| HIGH (1) | 1383462 | Resonance Repatterning Program 2 Primary Patterns (Live via Zoom) | → | Resonance Repatterning Program 2 Primary Patterns (Live via Zoom) | S0056 | 5315 | 555.0 |
| HIGH (1) | 1402405 | Resonance Repatterning Program 3 Unconscious Patterns (Live via Zoom) | → | Resonance Repatterning Program 3 Unconscious Patterns (Live via Zoom) | S0052 | 5315 | 555.0 |
| HIGH (1) | 1405974 | Resonance Repatterning Program 4 Chakra Patterns (Live via Zoom) | → | Resonance Repatterning Program 4 Chakra Patterns (Live via Zoom) | S0048 | 5315 | 555.0 |
| HIGH (1) | 1461729 | Akashic Navigator Fundamentals, Intuitive Coaching & Clearing Self Level 1 (Self-Study) | → | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live via Zoom) | S0112 | 10295 | 330.0 |
| HIGH (1) | 1505335 | Resonance Repatterning Program 5 Five Elements & Meridians (Live via Zoom) | → | Resonance Repatterning Program 5 Five Elements & Meridians (Live via Zoom) | S0011 | 5315 | 555.0 |
| HIGH (1) | 1730348 | Group Session Being a Great Boundary Setter (available as a recorded series) | → | Group Session Being a Great Boundary Setter (available as a recorded series) | S0144 | 1500 | 90.0 |
| HIGH (1) | 1799809 | Resonance Repatterning All Repatternings as Demo's / Talk Throughs + Resources (Self Study) | → | Resonance Repatterning All Repatternings as Demo's / Talk Throughs + Resources (Self Study) | S0132 | 3210 | 220.0 |
| HIGH (1) | 1892662 | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Live via Zoom) | → | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Live Retaker via Zoom) | S0016 | 3320 | 350.0 |
| HIGH (1) | 1892663 | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom) | → | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom) | S0006 | 7860 | 350.0 |
| HIGH (1) | 1892677 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Self Study) | → | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Live Zoom) | S0035 | 4980 | 220.0 |
| HIGH (1) | 1892689 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 2 (Self Study) | → | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Live Zoom) | S0035 | 4980 | 220.0 |
| HIGH (1) | 1892701 | Finding My Life Purpose (Self Study) | → | Finding My Life Purpose (Live via Zoom) | S0127 | 995 | 220.0 |
| HIGH (1) | 1892702 | Mindfulness (Live via Zoom) | → | Mindfulness (Self Study) | S0033 | 1660 | 440.0 |
| HIGH (1) | 1892716 | Meditation (Self Study) | → | Meditation (Live via Zoom) | S0117 | 2770 | 220.0 |
| HIGH (1) | 1892722 | Intuition in My Personal Capacity (Live via Zoom) | → | Intuition in My Personal Capacity (Live via Zoom) | S0128 | 1610 | 330.0 |
| HIGH (1) | 1892729 | Love & Relationships (Self Study) | → | Love & Relationships (Live via Zoom) | S0129 | 1610 | 220.0 |
| HIGH (1) | 1895565 | Intuition in My Business Capacity (Self Study) | → | Intuition in My Business Capacity (Live via Zoom) | S0039 | 1610 | 220.0 |
| HIGH (1) | 2165207 | Resonance Repatterning Program 1 Fundamentals (Self Study) | → | Resonance Repatterning Program 1 Fundamentals (Live via Zoom) | S0105 | 5315 | 440.0 |
| HIGH (1) | 2165208 | Resonance Repatterning Program 2 Primary Patterns (Self Study) | → | Resonance Repatterning Program 2 Primary Patterns (Live via Zoom) | S0056 | 5315 | 440.0 |
| HIGH (1) | 2165209 | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Live via Zoom) | → | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Live via Zoom) | S0200 | 5315 | 555.0 |
| HIGH (1) | 2165210 | Resonance Repatterning Program 4 Chakra Patterns (Self Study) | → | Resonance Repatterning Program 4 Chakra Patterns (Live via Zoom) | S0048 | 5315 | 440.0 |
| HIGH (1) | 2165217 | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Live via Zoom) | → | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Self Study) | S0187 | 4205 | 555.0 |
| HIGH (1) | 2165225 | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Live via Zoom) | → | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Live via Zoom) | S0201 | 5315 | 555.0 |
| HIGH (1) | 2165227 | Resonance Repatterning Program 3 Unconscious Patterns (Self Study) | → | Resonance Repatterning Program 3 Unconscious Patterns (Live via Zoom) | S0052 | 5315 | 440.0 |
| HIGH (1) | 2165229 | Resonance Repatterning Program 5 Five Elements & Meridians (Self Study) | → | Resonance Repatterning Program 5 Five Elements & Meridians (Live via Zoom) | S0011 | 5315 | 440.0 |
| HIGH (1) | 2178705 | Resonance Repatterning All Repatternings as Demo's / Talk Throughs + Resources (Self Study) | → | Resonance Repatterning All Repatternings as Demo's / Talk Throughs + Resources (Self Study) | S0132 | 3210 | 220.0 |
| HIGH (1) | 2331256 | Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Live via Zoom) | → | Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Live via Zoom) | S0130 | 3320 | 399.0 |
| HIGH (1) | 2353636 | Resonance Repatterning Accelerated Basic 5 Training Series: Review of Programs 1-5 (Live via zoom) | → | Resonance Repatterning Accelerated Basic 5 Training Series: Review of Programs 1-5 (Self Study) | S0135 | 5315 | 550.0 |
| HIGH (1) | 2434091 | Love & Relationships (Live via Zoom) | → | Love & Relationships (Live via Zoom) | S0129 | 1610 | 330.0 |
| HIGH (1) | 2434092 | Intuition in My Business Capacity (Live via Zoom) | → | Intuition in My Business Capacity (Live via Zoom) | S0039 | 1610 | 330.0 |
| HIGH (1) | 2434094 | Meditation (Live via Zoom) | → | Meditation (Live via Zoom) | S0117 | 2770 | 440.0 |
| HIGH (1) | 2434102 | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live via Zoom) | → | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live via Zoom) | S0005 | 10295 | 500.0 |
| HIGH (1) | 2434112 | Intuition in My Personal Capacity (Self Study) | → | Intuition in My Personal Capacity (Live via Zoom) | S0128 | 1610 | 220.0 |
| HIGH (1) | 2434115 | Finding My Life Purpose (Live via Zoom) | → | Finding My Life Purpose (Live via Zoom) | S0127 | 995 | 330.0 |
| HIGH (1) | 2434133 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Live Zoom) | → | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Live Zoom) | S0035 | 4980 | 440.0 |
| HIGH (1) | 2434134 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 2 (Live Zoom) | → | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Live Zoom) | S0035 | 4980 | 440.0 |
| HIGH (1) | 2434137 | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live via Zoom) | → | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live via Zoom) | S0112 | 10295 | 500.0 |
| HIGH (1) | 2434157 | Mindfulness (Self Study) | → | Mindfulness (Self Study) | S0033 | 1660 | 220.0 |
| HIGH (1) | 3064382 | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Self Study) | → | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Self Study) | S0187 | 4205 | 550.0 |
| HIGH (1) | 3064388 | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Self Study) | → | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Live via Zoom) | S0200 | 5315 | 550.0 |
| HIGH (1) | 3064390 | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Self Study) | → | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Live via Zoom) | S0201 | 5315 | 550.0 |
| HIGH (1) | 2329050 _(bundle)_ | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Self Study) | → | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Self Study) | S0046 | 13950 | 2540.0 |
| HIGH (1) | 2329161 _(bundle)_ | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Live via Zoom) | → | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Self Study) | S0046 | 13950 | 2990.0 |
| HIGH (1) | 2617987 _(bundle)_ | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Self Study) | → | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Live via Zoom) | S0151 | 17500 | 600.0 |
| HIGH (1) | 2618693 _(bundle)_ | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Live via Zoom) | → | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Live via Zoom) | S0151 | 17500 | 775.0 |
| HIGH (1) | 2617995 _(bundle)_ | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Self Study) | → | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Live via Zoom) | S0061 | 13360 | 555.0 |
| HIGH (1) | 2618687 _(bundle)_ | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Live via Zoom) | → | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Live via Zoom) | S0061 | 13360 | 845.0 |
| HIGH (0.91) | 2920523 | New: Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Self Study) | → | Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Live via Zoom) | S0130 | 3320 | 220.0 |
| HIGH (0.89) | 2833014 | New Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Self Study) | → | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live via Zoom) | S0005 | 10295 | 220.0 |
| HIGH (0.75) | 1287690 | Post Traumatic Growth Presentation | → | Post Traumatic Growth (Self Study Online) | S0158 | 220 | 15.0 |
| HIGH (0.75) | 1896029 | Rapid Repatterning Session Introduction | → | Rapid Repatterning Session (60 mins) (In-person session) | S0156 | 1995 | 99.0 |
| HIGH (0.71) | 1696047 | Resonance Repatterning Recorded Group Session Series : Shedding Excess Weight | → | Group Session Shedding excess Weight (available as recorded series) | S0139 | 1500 | 90.0 |
| HIGH (0.71) | 1776395 | Resonance Repatterning Recorded Group Session Series : Nice or Not Nice Communication | → | Group Session Nice or not nice in communication (booked as a series only) | S0027 | 1500 | 90.0 |
| MEDIUM (0.67) | 1405977 | Resonance Repatterning Recorded Group Session Series - Career progression | → | Group Session Career Progression (available as a recorded series) | S0145 | 1500 | 90.0 |
| MEDIUM (0.67) | 1799794 | Resonance Repatterning Group session series : Love & Relationships | → | Group Session Love & Relationships | S0136 | 1500 | 90.0 |
| MEDIUM (0.67) | 1892070 | Resonance Repatterning Recorded Group Session Series : Money Mastery | → | Group Session Money Mastery (available as a recorded series) | S0146 | 1500 | 90.0 |
| MEDIUM (0.63) | 2445019 | Resonance Repatterning Accelerated Basic 5 Training Series : Part 2 (Live Online) | → | Resonance Repatterning Accelerated Basic 5 Training Series: Review of Programs 1-5 (Self Study) | S0135 | 5315 | 550.0 |
| MEDIUM (0.57) | 1875277 | Resonance Repatterning Primary Patterns May 2022 Series | → | Resonance Repatterning Program 2 Primary Patterns (Live via Zoom) | S0056 | 5315 | 600.0 |
| MEDIUM (0.57) | 1919683 | Resonance Repatterning Unconscious Patterns May 2022 Series | → | Resonance Repatterning Program 3 Unconscious Patterns (Live via Zoom) | S0052 | 5315 | 600.0 |
| MEDIUM (0.57) | 1954672 | Resonance Repatterning Chakra patterns 4 May 2022 Series | → | Resonance Repatterning Program 4 Chakra Patterns (Live via Zoom) | S0048 | 5315 | 600.0 |
| MEDIUM (0.56) | 1981488 | Resonance Repatterning Programme 5, Five Elements & Meridians May 2022 series | → | Resonance Repatterning Program 5 Five Elements & Meridians (Live via Zoom) | S0011 | 5315 | 600.0 |
| MEDIUM (0.5) | 1843429 | Resonance Repatterning Fundamentals May 2022 Series | → | Resonance Repatterning Program 1 Fundamentals (Live via Zoom) | S0105 | 5315 | 600.0 |
| MEDIUM (0.5) | 1892654 | Akashic Navigation Basic Coaching & Clearing Self - Level 1 (Self Study) | → | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live via Zoom) | S0112 | 10295 | 330.0 |

## UNMATCHED — Thinkific (published, non-free) with no WC equivalent ≥ 0.5

| Thinkific ID | Thinkific course | closest WC (score) |
|---|---|---|
| 1670724 | Resonance Repatterning Self Paced Home Study: Energizing Options taught in the Fundamentals seminar | Resonance Repatterning Program 1 Fundamentals (Live via Zoom) (0.33) |
| 1670725 | Resonance Repatterning Self Paced Home Study: Spiral Up! Energizing Options | Resonance Repatterning / Coaching (60 Mins) (0.33) |
| 1670726 | Resonance Repatterning Self Paced Home Study: Polarity Principles & Contacts for the Five Chakras | Resonance Repatterning Program 5 Five Elements & Meridians (Live via Zoom) (0.25) |
| 1670727 | Resonance Repatterning Self Paced Home Study: Inner Cultivation Through the 12 Meridians | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Self Study) (0.4) |
| 1670728 | Resonance Repatterning Self Paced Home Study: Principles of Relationship | Resonance Repatterning / Coaching (60 Mins) (0.4) |
| 1670729 | Resonance Repatterning Self Paced Home Study: Energetics of Relationship | Resonance Repatterning / Coaching (60 Mins) (0.4) |
| 1776096 | Resonance Repatterning Teacher Training 01 : Train the Trainer | Resonance Repatterning Full Basic Training Series, Programs 1-5 (Live via Zoom) (0.3) |
| 1868702 | RR Observation Training | Ravenall Institute Certification Observation Fee (0.17) |
| 1895575 | Resonance Repatterning Recorded Group Session: Overcoming the need to fix others | Resonance Repatterning / Coaching Session (60 Mins) (package of 04) (0.3) |
| 1895592 | The Art of Deep Clearing Level 2 (Live) | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom) (0.38) |
| 1901206 | Resonance Repatterning Recording Group Session: Superhuman confidence | Resonance Repatterning / Coaching Session (60 Mins) (package of 04) (0.38) |
| 1901224 | Resonance Repatterning Recording Group Session: The Attraction Frequency | Group Session Attraction Frequency (available as a recorded series) Coming Soon (0.4) |
| 2165221 | The Art of Deep Clearing Level 1 (Live) | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom) (0.38) |
| 2618925 _(bundle)_ | Be an Energy Ninja Levels 1 & 2 (Self Study) | Relaxation & Energy Reclamation (0.2) |
| 2618833 _(bundle)_ | Be an Energy Ninja Levels 1 & 2 (Live) | Relaxation & Energy Reclamation (0.2) |

## WC-ONLY — published WooCommerce products with no Thinkific equivalent

These are the commerce products that are **not** Thinkific courses — private sessions (already handled in the Private Session pages), session packages, memberships, and physical goods. 0 of the WC-only products carry `is_a_thinkific_product=true` (i.e. they *should* link to a course but didn't name-match — listed first for reconciliation).

### WC-only commerce (111) — sessions / memberships / packages / goods

| WC ID | WC product | SKU | ZAR | Type |
|---|---|---|---|---|
| 6675 | Akashic Coaching/Clearing Session (60 mins) | S0123 | 1660 | simple, virtual |
| 9234 | Akashic Coaching/Clearing Session (60 mins) (package of 04) | S0098 | 6310 | simple, virtual |
| 9235 | Akashic Coaching/Clearing Session (60 mins) (package of 08) | S0097 | 11955 | simple, virtual |
| 9236 | Akashic Coaching/Clearing Session (60 mins) (package of 12) | S0096 | 16940 | simple, virtual |
| 10768 | Akashic Coaching/Clearing Session (90min) | S0015 | 2325 | simple, virtual |
| 10711 | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live Retaker via Zoom) | S0025 | 2215 | simple |
| 11614 | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Self Study) | S0003 | 4650 | simple, virtual |
| 11504 | Akashic Navigator & Intuitive Coaching Fundamentals & Adv: Purchased together (Live Retaker Zoom) | S0010 | 1660 | simple, virtual |
| 9269 | Akashic Navigator & Intuitive Coaching Fundamentals & Advanced: Purchased together (Self Study) | S0064 | 7905 | simple, virtual |
| 10710 | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live Retaker via Zoom) | S0026 | 2215 | simple |
| 8724 | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Self Study) | S0114 | 4650 | simple, virtual |
| 9300 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Self Study) | S0036 | 3320 | simple, virtual |
| 10722 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 2 (Live Zoom) | S0018 | 1660 | simple, virtual |
| 16110 | Bonus Lifetime Access (Self Study Online) | S0186 | 2060 | simple, virtual |
| 16441 | Bringing Your Energy Back | S0191 | 350 | simple, downloadable, virtual |
| 16067 | Coaching | S0181 | 1660 | simple, virtual |
| 8731 | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Live via Zoom) | S0107 | 7860 | simple |
| 8729 | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Self Study) | S0109 | 4650 | simple, virtual |
| 16260 | Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Live Retaker via Zoom) | S0190 | 1660 | simple |
| 10723 | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live Retaker via Zoom) | S0017 | 3320 | simple |
| 11608 | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Self Study) | S0009 | 4650 | simple, virtual |
| 16065 | Email Support | S0182 | 200 | simple, virtual |
| 16437 | Energetic Alignment & Inner Neutrality | S0193 | 350 | simple, downloadable, virtual |
| 9265 | Energetic Clearing (completed remotely) | S0068 | 830 | simple, virtual |
| 9266 | Energetic Clearing (completed remotely) Package of 04 | S0067 | 3155 | simple, virtual |
| 9267 | Energetic Clearing (completed remotely) Package of 08 | S0066 | 5980 | simple, virtual |
| 9268 | Energetic Clearing (completed remotely) Package of 12 | S0065 | 8470 | simple, virtual |
| 9243 | Executive coaching (30 mins) | S0089 | 1660 | simple, virtual |
| 9332 | Executive coaching (60 mins) | S0032 | 2770 | simple, virtual |
| 9245 | Executive coaching (60 mins) (package of 04) | S0088 | 10515 | simple, virtual |
| 9246 | Executive coaching (60 mins) (package of 08) | S0087 | 19930 | simple, virtual |
| 9247 | Executive coaching (60 mins) (package of 12) | S0086 | 28230 | simple, virtual |
| 9248 | Executive coaching (60 mins) (package of 16) | S0085 | 35425 | simple, virtual |
| 9260 | Exploring the Alpha Mind (45 mins) | S0073 | 775 | simple, virtual |
| 9261 | Exploring the Alpha Mind (45 Mins) (Package of 05) | S0072 | 3680 | simple, virtual |
| 9262 | Exploring the Alpha Mind (45 Mins) (Package of 08) | S0071 | 5580 | simple, virtual |
| 9542 | Finding My Life Purpose (Self Study) | S0031 | 995 | simple, virtual |
| 9258 | Group Family Coaching (60 Mins) (Package of 04) | S0075 | 6310 | simple, virtual |
| 9259 | Group Family Coaching (60 Mins) (Package of 08) | S0074 | 11955 | simple, virtual |
| 9257 | Group Family Coaching (60 Mins) (Single Sesson) | S0076 | 1660 | simple, virtual |
| 13235 | Group Session Attraction Frequency (available as a recorded series) Coming Soon | S0141 | 1500 | simple, virtual |
| 13492 | Group Session Being a Great Boundary Setter (booked as a series only) | S0029 | 1500 | simple, virtual |
| 6679 | Group Session Career Progression (booked as a series only) | S0120 | 1500 | simple, virtual |
| 13237 | Group Session Develop Super Confidence | S0142 | 1500 | simple, virtual |
| 13241 | Group Session Develop Super Confidence (available as a recorded series) Coming Soon | S0143 | 1500 | simple, virtual |
| 6678 | Group Session Love & Relationships (booked as a series only) | S0121 | 1500 | simple, virtual |
| 6677 | Group Session Money Mastery (booked as a series only) | S0122 | 1500 | simple, virtual |
| 13493 | Group Session Shedding excess Weight (booked as a series only) | S0030 | 1500 | simple, virtual |
| 9297 | Intuition in My Business Capacity (Self Study) | S0038 | 995 | simple, virtual |
| 9295 | Intuition in My Personal Capacity (Self Study) | S0040 | 995 | simple, virtual |
| 9294 | Love & Relationships (Self Study) | S0041 | 995 | simple, virtual |
| 9302 | Meditation (Self Study) | S0034 | 1660 | simple, virtual |
| 8604 | Mindfulness (Live via Zoom) | S0118 | 2770 | simple, virtual |
| 16062 | Practitioner Mentorship Bundle of 5 Sessions (Live) | S0178 | 1900 | simple, virtual |
| 16064 | Practitioner Mentorship Bundle of 5 Sessions (Self study) | S0180 | 1900 | simple, virtual |
| 16061 | Practitioner Mentorship Single Session (Live) | S0177 | 575 | simple, virtual |
| 16063 | Practitioner Mentorship Single Session (Self study) | S0179 | 575 | simple, virtual |
| 14243 | Quantum Healing Codes | S0150 | 345 | simple, downloadable, virtual |
| 16449 | Rapid Repatterning / Coaching (90 mins) (package of 04) | S0194 | 9465 | simple, virtual |
| 16450 | Rapid Repatterning / Coaching (90 mins) (package of 08) | S0195 | 17935 | simple, virtual |
| 16452 | Rapid Repatterning / Coaching (90 mins) (package of 12) | S0196 | 25410 | simple, virtual |
| 16451 | Rapid Repatterning / Coaching (90 mins) (package of 16) | S0197 | 31885 | simple, virtual |
| 9230 | Rapid Repatterning Session (60 mins) (Package of 04 sessions) | S0102 | 6310 | simple, virtual |
| 9231 | Rapid Repatterning Session (60 mins) (Package of 08 sessions) | S0101 | 11960 | simple, virtual |
| 9232 | Rapid Repatterning Session (60 mins) (Package of 12 sessions) | S0100 | 16940 | simple, virtual |
| 9233 | Rapid Repatterning Session (60 mins) (Package of 16 sessions) | S0099 | 21260 | simple, virtual |
| 6674 | Rapid Repatterning Session (60 mins) (single online session) | S0124 | 1660 | simple, virtual |
| 14331 | Rapid Repatterning Session (90 mins In-person) | S0103 | 2990 | simple, virtual |
| 9229 | Rapid Repatterning Session (90 mins) (Single online session) | S0154 | 2490 | simple, virtual |
| 9228 | Rapid Transformation Therapy Session (1 hypnosis session + hypnosis recording) | S0104 | 2325 | simple, virtual |
| 6673 | Rapid Transformation Therapy Session (1 hypnosis session, hypnosis, recording + 2 coaching sessions) | S0125 | 4540 | simple, virtual |
| 16138 | Ravenall Institute Certification Observation Fee | S0184 | 2800 | simple, virtual |
| 16440 | Relaxation & Energy Reclamation | S0192 | 350 | simple, downloadable, virtual |
| 6671 | Resonance Repatterning / Coaching (60 Mins) | S0126 | 1660 | simple, virtual |
| 9249 | Resonance Repatterning / Coaching (90 Mins) | S0084 | 2490 | simple, virtual |
| 13786 | Resonance Repatterning / Coaching (90 Mins) (In-person session) | S0133 | 2990 | simple, virtual |
| 8630 | Resonance Repatterning / Coaching (90 mins) (package of 04) | S0116 | 9465 | simple, virtual |
| 9250 | Resonance Repatterning / Coaching (90 mins) (package of 08) | S0083 | 17935 | simple, virtual |
| 9251 | Resonance Repatterning / Coaching (90 mins) (package of 12) | S0082 | 25410 | simple, virtual |
| 9252 | Resonance Repatterning / Coaching (90 mins) (package of 16) | S0081 | 31885 | simple, virtual |
| 9253 | Resonance Repatterning / Coaching Session (60 Mins) (package of 04) | S0080 | 6310 | simple, virtual |
| 9254 | Resonance Repatterning / Coaching Session (60 Mins) (package of 08) | S0079 | 11960 | simple, virtual |
| 9255 | Resonance Repatterning / Coaching Session (60 Mins) (package of 12) | S0078 | 16940 | simple, virtual |
| 9256 | Resonance Repatterning / Coaching Session (60 Mins) (package of 16) | S0077 | 21260 | simple, virtual |
| 14090 | Resonance Repatterning 05 Five Elements & Meridians Retaker (AffWP-test) | S0-test-affiliate | 5 | simple, virtual |
| 17526 | Resonance Repatterning Accelerated Basic 5 Training Series: Review of Programs 1-5 (Live via Zoom) | S0241 | 5315 | simple, virtual |
| 10721 | Resonance Repatterning Full Basic Training Series, Programs 1-5 (Live via Zoom) | S0019 | 5535 | simple, virtual |
| 13795 | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Live via Zoom) | S0043 | 23910 | simple, virtual |
| 10713 | Resonance Repatterning Program 1 Fundamentals (Live Retaker via Zoom) | S0024 | 2215 | simple |
| 9273 | Resonance Repatterning Program 1 Fundamentals (Self Study) | S0060 | 3100 | simple, virtual |
| 10714 | Resonance Repatterning Program 2 Primary Patterns (Live Retaker via Zoom) | S0023 | 2215 | simple |
| 9274 | Resonance Repatterning Program 2 Primary Patterns (Self Study) | S0059 | 3100 | simple, virtual |
| 10716 | Resonance Repatterning Program 3 Unconscious Patterns (Live Retaker via Zoom) | S0022 | 2215 | simple, virtual |
| 9278 | Resonance Repatterning Program 3 Unconscious Patterns (Self Study) | S0055 | 3100 | simple, virtual |
| 10718 | Resonance Repatterning Program 4 Chakra Patterns (Live Retaker via Zoom) | S0021 | 2215 | simple, virtual |
| 9283 | Resonance Repatterning Program 4 Chakra Patterns (Self Study) | S0051 | 3100 | simple, virtual |
| 10719 | Resonance Repatterning Program 5 Five Elements & Meridians (Live Retaker via Zoom) | S0020 | 2215 | simple |
| 11266 | Resonance Repatterning Program 5 Five Elements & Meridians (Self Study) | S0014 | 3100 | simple, virtual |
| 16491 | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Live via Zoom) | S0199 | 5315 | simple |
| 16237 | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Self Study) | S0188 | 4205 | simple, virtual |
| 16236 | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Self Study) | S0189 | 4205 | simple, virtual |
| 17133 | Suzanne Ravenall Coaching App | — | 250 | simple, virtual |
| 4740 | The Latest Book By Suzanne (Pre-order) | S0131 | 165 | simple |
| 9237 | Transformation Coaching (60 mins) | S0095 | 1660 | simple, virtual |
| 9239 | Transformation Coaching (60 mins) (package of 04) | S0093 | 6310 | simple, virtual |
| 9240 | Transformation Coaching (60 mins) (package of 08) | S0092 | 11960 | simple, virtual |
| 9241 | Transformation Coaching (60 mins) (package of 12) | S0091 | 16940 | simple, virtual |
| 9242 | Transformation Coaching (60 mins) (package of 16) | S0090 | 21255 | simple, virtual |
| 9238 | Transformation Coaching (90 mins) | S0094 | 2325 | simple, virtual |
| 9292 | Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Self Study) | S0042 | 3500 | simple, virtual |
| 16066 | VIP Package | S0183 | 1500 | simple, virtual |
