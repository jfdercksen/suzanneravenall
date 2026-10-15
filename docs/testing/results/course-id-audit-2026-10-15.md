# H-00 course-id audit, 15 Oct 2026

Read-only pass over every Medusa product (admin API: 136 products, 234 variants, of which 58 published with 145 variants) against the Thinkific public API (103 courses, 111 products; the bundles endpoint is not exposed on this account, 404). Course ids are read the way `packages/integrations/src/thinkific-enrolment.ts` reads them: the variant's `metadata.thinkific_course_id` wins, the product's is the fallback, and a comma-separated value is a bundle. Nothing was written to Medusa or Thinkific. Raw data: scratchpad `audit-rows.json`, `audit-medusa-products.json`, `audit-thinkific.json` (not committed).

## Result in one line

The published catalogue is clean: every id on a published variant is a real Thinkific COURSE id (no Thinkific product or bundle ids), 71 of 145 published variants carry one, and the section G walk enrolled every one of them (69 course-access mails, 37 new enrolments after Thinkific deduped the ones the buyer already held). Four published variants that should grant access carry no id, and four unpublished drafts carry Thinkific PRODUCT ids. The "course / no course" labels in the 15 Oct store list were wrong because that list only read product-level metadata; 70 of the 71 ids live on the variant.

## Gaps on published products (4)

| # | Product / variant | Category | What the walk showed | Proposed fix (Johan applies in Medusa admin) |
|---|---|---|---|---|
| 1 | Resonance Repatterning Accelerated Basic 5 Review / Self Study (G-068, order #309) | rp-live | no course-access mail, no enrolment; the Live via Zoom variant (G-069, #310) enrols course 2353636 | Thinkific has no Self Study course for the Accelerated series (only 2353636 Live, 2434087 Accelerated Retakers, 2445019 Part 2). Either Shayna confirms which course a Self Study buyer gets (then set that id on the variant) or the Self Study variant comes off sale. KI069 |
| 2 | Bringing Your Energy Back / Default (G-126, #365) | energy-clearing-self-paced | no course mail; product carries `download_file` audio metadata | This is a download, not a course: move it to the `digital-downloads` category (as Quantum Healing Codes is) so the order mail uses the download wording and no course is expected. No Thinkific course exists for it |
| 3 | Energetic Alignment & Inner Neutrality / Default (G-127, #366) | energy-clearing-self-paced | same as 2 | same as 2 |
| 4 | Relaxation & Energy Reclamation / Default (G-128, #367) | energy-clearing-self-paced | same as 2 | same as 2 |

Follow-up for 2 to 4: the walkers did not open the order mails for #365 to #367; whoever applies the fix should check one order mail of a download product carries the file link.

## Thinkific PRODUCT ids stored as course ids (4, all on unpublished drafts)

| Draft handle | Status | Id found | What it is |
|---|---|---|---|
| art-of-deep-clearing-levels1-2-self-study | draft | 2617987 | Thinkific product (Bundle) "Deep Energy Clearing Fundamentals & Advanced: Purchased Together (Self Study)" |
| the-art-of-deep-clearing-live | draft | 2618693 | Thinkific product (Bundle) ".. Purchased Together (Live via Zoom)" |
| akashic-navigation-coaching-self-study-online-with-mentoring | draft | 2617995 | Thinkific product (Bundle) "Akashic Navigator .. Purchased together (Self Study)" |
| akashic-navigation-coach-live | draft | 2618687 | Thinkific product (Bundle) ".. Purchased together (Live via Zoom)" |

These are the old single-variant duplicates of the published "Purchased Together" products, which already carry the right course lists (DEC: 1892663,1892662 live and 2832722,2832723 self study; Akashic: 2434137,2434102 live and 2833011,2833014 self study). Proposed fix: leave them unpublished or delete them; nothing to change on the published ones. 48 drafts in total still carry ids; none is reachable from the shop.

## Products outside the category map (10 published, no category)

`order-placed.ts` detects the product type from the category handle (CATEGORY_ACCESS_MAP) and falls back to pattern matching on the handle; `apps/web/lib/access/product-access.ts` mirrors it. These published products have no category at all: both Full Basic + Demos bundles, Program 6, Deep Energy Clearing 1 & 2 Purchased Together, Practitioner Mentorship, Email Support, Coaching Support Package, VIP Package, Bonus Lifetime Access, Observation Fee. The bundle and programme ones still enrol (ids are on the variant) and the 14 Oct worklog says their order mails read right, but the access level written to Supabase member_subscriptions for them comes from the fallback. Proposed fix: give the four course products their category (rp-self-paced / rp-live for the bundles and Program 6; energy-clearing-live / -self-paced for DEC 1 & 2) and leave the six service products uncategorised on purpose, or add a `services` category if the portal needs it.

## Design notes confirmed (no action)

- Live Retaker variants reuse the Live via Zoom course id on every programme (Programs 1 to 5, Akashic 1, 2 and 1 & 2, DEC 1, 2 and 1 & 2): retakers join the live course. The mails say "(Live Retaker)" because the title comes from the variant.
- Live group sessions carry no course id and recorded series do (7 of 8 recorded series; Attraction Frequency is marked coming soon and has id 1901224 ready).
- Full Basic + Demos bundles list the five programme courses plus the Demos course 1799809; the plain Full Basic Series lists the five live courses only.
- Membership: no membership product is published. The 29 seeded tiers (membership-s0211 to s0239, `product_type: membership`) are drafts; the VIP Package is a plain product with no metadata, so an order for it (G-143, #382) takes the generic path. Section H-07 cannot be walked until a tier is published (see ACCEPTANCE.md).

## Numbers

| | Count |
|---|---|
| Published products / variants | 58 / 145 |
| Published variants with a course id | 71 (70 on the variant, 1 on the product) |
| Published variants expected to grant access but without an id | 4 |
| Published variants with a wrong kind of id | 0 |
| Unpublished drafts with ids | 48 (4 with Thinkific product ids) |
| Thinkific courses / products | 103 / 111 |
