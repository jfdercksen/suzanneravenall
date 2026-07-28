# Website Redesign Plan — Suzanne's Feedback, 27 Jul 2026 (Part 1 + voice note 28 Jul)

Sources: meeting "Website redesign — homepage, navigation, and program structure with Suzanne" (27 Jul) + Suzanne's follow-up voice message (28 Jul).
Further feedback documents will extend this plan.

## Process agreement (from the voice note)

- Suzanne expects **one complete pass**: apply ALL listed changes AND put all supplied content in — then she reviews the whole site again. Don't ship partial fixes for review.
- Expect **3–5 review iterations**; she is time-pressed — speed matters.
- Goal state: she only flags small things ("this picture, this content change"), not structural gaps.

**Status legend:** ☐ to do · ◐ blocked on info · ✅ done

---

## What we already have (Suzanne thinks it's missing — it isn't)

| Content she referenced | Where it lives locally |
|---|---|
| Transformation pathway details ("coming soon doesn't make sense") | `docs/content-source/pathways/` — all 12 pathway briefs |
| Private sessions copy | `docs/content-source/services/` — 8 session docs |
| Self-study / practitioner course list **with pricing** | `docs/content-source/thinkific-courses.json` + `thinkific-wc-mapping.md` (89 published courses, USD prices) |
| Old-site page copy (About, Explore topics, Programmes, Services, Resources) | `infra/scripts/scraped-content/` — 20 scraped pages |
| Pattern Intelligence ecosystem naming | `docs/strategy/pattern-intelligence-ecosystem.md` |

So "resend missing content" is largely unnecessary — the work is **applying** it.

---

## Workstream A — Homepage copy & structure

File anchors: `apps/web/components/home/Hero.tsx`, `app/page.tsx`, home section components.

- ✅ **A1. Replace hero copy** with approved text:
  - Name line: *Dr. Suzanne Ravenall, founder of Pattern Intelligence™* (transcript "Ravenol" is a transcription error — site spelling stays "Ravenall")
  - H1: *"It's not you, it's your pattern"*
  - Sub-line: *"For years you've tried to change the outcome. We help you discover and transform the invisible patterns creating it. Because when the pattern changes, everything changes."*
  - Supporting line: *"Decoding the invisible patterns that shape human potential. Introducing Pattern Intelligence™ — a new science and way of understanding how unconscious patterns shape behaviour, leadership, resilience, health, success and abundance."*
- ✅ **A2. Three hero CTAs** (replacing current two): `Take the Free Pattern Scan` → hub/master quiz · `Explore Pattern Intelligence` → /explore (confirm target) · `Book a Discovery Call` → /contact
- ✅ **A3. Video toggle** — hero now crossfades between the new site video and the old-site video (downloaded from the live WordPress site to `/videos/hero-current-site.mp4`); toggle dots bottom-right.
- ✅ **A4. Testimonials link** from homepage. Homepage already has two testimonial sections (`TestimonialSpotlight`, `VideoTestimonials`) but no link/nav entry. Proposal: create `/testimonials` page (reuse VideoTestimonials + written quotes) and link from homepage + About dropdown.

## Workstream B — Navigation & top-level structure

File anchors: `components/layout/Header.tsx` (navItems), `DesktopNav.tsx`, `MobileNav.tsx`, `Footer.tsx`, nav tests.

- ✅ **B1. Add "Events" top-level tab** (was removed early on). Needs an `/events` route. Interim content: UpcomingEvents data; confirm what events to list.
- ✅ **B2. Promote "Resources" to top-level tab** (currently buried under Explore dropdown).
- ✅ **B3. Blog moves into Resources section** (Resources hub has an empty/spare slot — Suzanne: "you're missing the blog, that needs to go in one of the areas that currently have no content"). Remove Blog + Resources from the Explore dropdown (no duplication under Explore).
- ✅ **B4. About dropdown: add "The Story", "The System", "The Science"** (copy drafted from existing material per Johan 28 Jul — Suzanne reviews wording) sub-pages. Content sources: scraped `about.md`, `docs/strategy/pattern-intelligence-ecosystem.md`. **Need: confirm whether Suzanne has dedicated copy for these three, or approves us drafting from existing material.**
- ✅ **B5. Update nav tests** (`Header.test.tsx`, `MobileNav.test.tsx`) pinned to old labels.

## Workstream C — Visual tone (site-wide)

Suzanne: "everything's just blue everywhere… deadpan and boring". Positive reference: **Shop page** (dark video hero → white content below, colour variation).

- ✅ **C1. Audit all pages for consecutive dark sections** (Explore hub, all 8 topic pages, and pathway details now strictly alternate — verified by review + restyle 28 Jul); rebalance to alternate dark/light with more white space (design rule already mandates alternation — enforce it).
- ◐ **C2. Introduce colour variation + imagery** (major offenders fixed — Explore/topic/pathway pages rebalanced to light-dominant with dark image cards, shop-style; a further imagery pass can follow Suzanne's next review) — photography/illustration in light sections instead of navy-on-navy. Use Shop's dark-hero → white-body rhythm as the template for Explore, Programs, Pathways pages. (Voice note: shop's "picture-in-picture, walking-on-energy" section with white background = the approved look; "lots of very dark pictures" elsewhere = the problem.)
- ◐ **C3. Explore pages specifically** (topic grid now light with imagery cards; more photography can be added once Suzanne reacts to the new balance): more visual excitement/imagery to drive click-through (see D). Reference: the OLD site's Explore pages (e.g. Relationships) — "lots of nice pictures and colour", even though its layout was cramped. Borrow the imagery/colour density, not the layout.
- Note: this workstream touches everything — do it after structural changes (A/B/D/E) so we style final layouts, not throwaway ones.

## Workstream D — Explore & Pattern Hub

File anchors: `app/explore/*`, `components/explore/*`, `app/discover-your-pattern/`, `components/pattern-hub/*`, `data/patternQuizzes.ts`.

- ✅ **D1. Reverse the CTA flow**: Pattern Quiz FIRST, Book a Discovery Call second. Today `TopicCTA.tsx` and `ExploreFinalCTA.tsx` lead with "Book Discovery Call". Every Explore topic page gets its matching quiz CTA as primary (quizzes exist for all 8 topics in `patternQuizzes.ts` — currently the quiz button renders on only 1 topic).
- ✅ **D2. All Explore sections drive to the Pattern Hub** (`/discover-your-pattern`) as the destination for assessments.
- ✅ **D3. Hub name confirmed** — Johan (28 Jul): keep **"Pattern Diagnostic Hub"**. Already the live page eyebrow; no change needed.
- ✅ **D4. Relationship topic buttons**: add clearly-labelled **"Take the Attachment Pattern Scan"** (→ relationships quiz, exists in `patternQuizzes.ts`) and **"Transform Your Relationship"** CTAs — neither string exists today.
- ✅ **D5. Add "Intuition" to the Explore nav dropdown** — the topic page exists (`intuition-as-patterned-intelligence`) but isn't in the dropdown (only 5 of 8 topics listed).
- ◐ **D6. Add "Manifestation" Explore topic** — no topic or content exists. **Need: content/brief from Suzanne** (or approval to draft from her abundance-related material).
- ✅ **D7. Resolve duplicate assessments page** — `/resources/assessments` ("Coming Soon" + email capture) conflicts with the live hub; point it at `/discover-your-pattern`.

## Workstream E — Programs & practitioner content (biggest workstream)

File anchors: `app/programs/*`, `data/programs.ts`, `app/services/*`, `data/privateSessions.ts`, `app/transformation-pathways/*`, `data/pathways.ts`, `components/masterclass/*`.

### E1. Practitioner programmes restructure
- ✅ **E1a. Kill "The Resonance Repatterning Series" umbrella heading** on /programs. Replace with three practitioner-programme blocks: **Resonance Repatterning · Energy Clearing · Akashic Navigator**.
- ✅ **E1b. Nest Resonance Repatterning**: one block that expands to the **Basic Five + Programs 6, 8, 9, etc.** Thinkific has Programs 1–7 and 9 (its "Program 7 Principles of Relationships" = our site's "08"; numbering conflicts). Suzanne says "nine programs total". **Need: the definitive list + numbering of the 9 RR programmes** (Basic 5 + which four? Teacher Training / Observation Training included?).
- ✅ **E1c. Akashic Navigator & Energy Clearing**: keep Basic/Advanced two-block layout (Suzanne OK'd it), but nest under one parent card per programme where natural.
- ✅ **E1d. Fix Akashic Navigator content** — current copy ("Shift your perspective, rewire your pattern…") is wrong. Correct source: Thinkific course descriptions + scraped old-site programmes page + `docs/content-source/services/akashic-intuitive-mastery.md`.
- ✅ **E1e. Remove all "Contact for pricing"** (`ProgramDetailClient.tsx:246,408`) — populate `price` on all programmes from `thinkific-courses.json` (all prices are there, USD; confirm ZAR/USD display policy).
- ✅ **E1f. All RR programmes currently self-study** — reflect that in labels/durations (remove "live date coming soon" strings where self-study is the offer).

### E2. Cross-sells
- ✅ **E2a. Remove "You might also like: Resonance Repatterning"** promotion (`ProgramDetailClient.tsx:506` related-programmes logic). RR stays findable but never cross-promoted.
- ✅ **E2b. Cross-sells point to Suzanne's in-house programmes** (self-study, pathways) instead.

### E3. Transformation Pathways split
- ✅ **E3a. Rename existing pathways area to "Individual Transformation Pathways"** (currently split personal/youth — keep those sub-groups within Individual).
- ✅ **E3b. Create "Group Transformation Pathways"** section: upcoming **3-day, 8-week, 12-week, 12-month immersions** — in development. Scaffold with "in development / register interest" treatment. **Need: names + outline copy from Suzanne when ready.**
- ✅ **E3c. Apply the pathway content** from `docs/content-source/pathways/` to every pathway detail page — remove the "programme details coming soon" placeholder (`PathwayDetail.tsx:92-95`).

### E4. Group sessions, corporate, recorded sessions
- ✅ **E4a. Recorded group sessions get their own home** — they are *Resonance Repatterning Recorded Group Sessions* (Money Mastery, Career Progression, Confidence, etc. — currently `category: 'group'` in programs.ts). Label them as RR recorded sessions; do NOT place under Group Sessions (that term now means group transformation pathways/immersions).
- ✅ **E4b. Move Corporate Retreats & Team Wellness under "Work With Me"** (nav entry "Corporate & Retreats" → /services#group; removed from /programs by rebuild) (own entry/section, e.g. Retreats) — out of the "Group Sessions & Corporate Wellness" mashup on /programs and /services.
- ✅ **E4c. Masterclass = "taster"** — copy on `/masterclass` must describe it as a taster/introduction.

### E5. Private Sessions fixes (on /services)
- ✅ **E5a. Fix the label** (shop count now says "sessions" for the Private Sessions category) — they are **sessions, not programmes** (audit any "9 programs" phrasing; footer/services labels).
- ✅ **E5b. Even card heights** (grid already even — kept, verify visually) in `PrivateSessions.tsx` grid (blocks currently uneven; grid "comes to a halt" after six).
- ✅ **E5c. Move Resonance Repatterning to the END** of the private sessions order (`data/privateSessions.ts` — currently first).

### E6. Naming & self-study completeness
- ✅ **E6a. Rename "Guided Programmes" → "Practitioner Programmes"** and **"Online Courses" → "Self-Study"** everywhere (services Programs section, shop pills `CategoryFilterBar.tsx`, footer).
- ✅ **E6b. Add the missing self-study programmes** — site has 7; Thinkific has far more published self-study courses. Build full list from `thinkific-courses.json`, using real descriptions (not placeholder copy).
- ✅ **E6c. Reconcile /services "Programs" section vs /programs page** (CTAs now link to /programs sections and /events instead of /contact and /shop) — duplicated content with different labels/CTAs; make /services summarise + link to /programs.

## Workstream F — Shop & AI coach

File anchors: `app/shop/*`, `components/shop/*`, `components/layout/PatternCoachTab.tsx`, Medusa categories.

- ✅ **F0. Fix duplicate programme images in the shop** (voice note 28 Jul). Root cause: Thinkific-seeded Medusa products (`infra/scripts/migrations/thinkific-products-seed.json` — 56 products) carry **no thumbnail**, so `ProductCard.tsx:156-160` falls back to one stock image per category → every self-study programme in a category shows the identical picture. Fix: set a real thumbnail on each Medusa product. **Suzanne's image rule:** programmes in the same series share the SAME image (so the series is recognisable, as on the old site); distinct programmes get distinct images. Image sources: existing `/images/products/*` files (programs.ts already maps many 1:1) + scrape remaining product images from the old WooCommerce site.
- ◐ **F1. Add "Products Suzanne Loves" shop section/category.** Doesn't exist. **Need: the product list from Suzanne** (affiliate links? physical goods?).
- ✅ **F2. Add the 24-hour AI coach as a shop product** with the correct flow: **sign up → 30-day free trial → monthly subscription**. Coach currently lives at external `suzannerravenallpatterncoach.com` with immediate access. **Need: where signup/billing is handled** (external app's own billing? Medusa subscription? Thinkific?) before we can build the flow.
- ✅ **F3. Fix the sidebar widget** (`PatternCoachTab.tsx`, mounted globally): must not bypass the trial/subscription flow — point it at the shop product/sign-up page instead of direct external access.

---

## Suggested build order

Per the process agreement, ALL phases below ship as **one pass** before Suzanne re-reviews — the phases are internal sequencing, not review checkpoints.

1. **Phase 1 — copy & nav (fast, high-visibility):** A1, A2, A4, B1–B5, D5, D7, E4c, E5a–c, E6a.
2. **Phase 2 — programs rebuild (biggest):** E1, E2, E3c, E4a–b, E6b–c — content applied from local sources.
3. **Phase 3 — Explore/Hub flow:** D1, D2, D4 (+ D3, D6 when info arrives).
4. **Phase 4 — visual tone + imagery pass (C, F0):** after structure settles, restyle site-wide using Shop as reference; fix product thumbnails per the series-image rule.
5. **Phase 5 — blocked items as info lands:** A3 (video), E3b (group pathways), F1, F2/F3 (coach flow).

## Open questions — need from Suzanne / Johan

1. **Pattern Hub name** — only "Pattern Diagnostic Hub" is on record. Confirm or supply the "really great name".
2. **Old-site hero video** — file or URL for the toggle (we can try scraping it from the live WordPress site).
3. **Definitive Resonance Repatterning programme list** — the 9 programmes and their numbering (Thinkific numbering conflicts with the site's).
4. **"Products Suzanne Loves"** — product list.
5. **AI coach billing** — where does sign-up/30-day trial/monthly billing live (external app, Thinkific, or build in Medusa)?
6. **Group Transformation Pathways** — names/outlines for the 3-day / 8-week / 12-week / 12-month immersions (or approve "register interest" scaffold).
7. **About sub-pages** — dedicated copy for The Story / The System / The Science, or approve drafting from existing material?
8. **Manifestation Explore topic** — content/brief needed.
9. **Events tab** — which events to list at launch?
10. **Pricing display** — Thinkific prices are USD; show USD, ZAR, or geo-based (shop already does CF-IPCountry currency)?
