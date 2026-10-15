# Catalogue parity: review box vs current site, 14 Oct 2026

Every sellable variant on the review box (Medusa, 59 products, 159 variants) matched against every published sellable product on the current site (WooCommerce, read live through the WC REST API on 14 Oct 08:10 SAST: 146 simple products; the 46 variable products are all draft, 14 external Amazon links and 1 grouped product excluded). Prices compared in ZAR (`_south-africa_price`) and USD (`_other-countries_price`, the current site's geo-pricing meta). Scripts: `infra/scripts/catalogue-parity/`. Full table: `catalogue-parity-2026-10-14-table.md`, raw `catalogue-parity-2026-10-14.csv`.

## Result in one line

ZAR is right on 154 of 159 variants. USD is missing on 141 and off by our own values on 3. One product is duplicated, one variant is a duplicate of another product, one current-site product is not on the new shop. Nothing else differs.

## Findings

| # | Finding | Variants | Cause | Fix / decision |
|---|---|---|---|---|
| P1 | Resonance Repatterning Program 1 to 5, Self Study: R3,100 on the review box, R4,205 on the current site (USD 550) | 5 | The June export carried R3,100 (modified 10 Nov 2025 then); the client raised the price on the current site after the export | Set the 5 variants to R4,205 (admin write on the box, Johan runs) |
| P2 | USD price missing | 141 of 159 | Migration loaded USD for 18 variants only. The storefront is gated to ZAR for everyone (KI034: `MEDUSA_USD_REGION_ENABLED` unset, and no geo header exists in the stack), so no visitor can reach a USD price today | Decision for Suzanne via Johan: (a) go live ZAR-only for everyone, which cuts what international clients pay (Program Live $555 on the current site is R5,315, about $300), or (b) load the 141 USD values from the current site (now in the CSV, scripted) AND add a currency source (geo header via Cloudflare, or a currency switcher), since the gate cannot be switched on without one |
| P3 | USD differs from the current site on 3 variants: Full Basic + Demos Live $2,990 vs $2,490; Full Basic + Demos Self Study $2,540 vs $2,105; Trauma to Transcendence Live $399 vs $440 | 3 | Values on the box differ from the client's; origin not recorded | Align to the current site when P2 is decided |
| P4 | Rapid Repatterning Session exists twice: `rapid-repatterning-session` (linked from the site, has image) and `rapid-repatterning-session-60-min-online` (no image, same 12 variants and prices), both published, both in search as "Start Here" | 12 extra | Second copy left published | Set the `-60-min-online` copy to draft, reseed search (admin write, Johan runs) |
| P5 | "Resonance Repatterning Full Basic Series Programs 1-5" carries a Self Study variant at R13,950 that duplicates the separate product "Full Basic Training, Programs 1-5 + Demos + Resources (Self Study)" at the same price. On the current site that product is Live only (R5,535, the price the box also has) | 1 | Variant added when Self Study course ids were set on 9 Oct (5 RR course ids) | Ask Shayna which listing sells the self-study series; retire the other |
| P6 | Current-site product "Suzanne Ravenall Coaching App" (R250 / $19, since Mar 2026) has no counterpart on the review box | 1 product | Not migrated; the new site has Pattern Coach with a 30-day trial instead | Confirm with Johan whether Pattern Coach replaces it or the R250 product must be added |
| P7 | Group Session Love & Relationships: the current site has two Live listings (unqualified 13168 and "booked as a series only" 6678) and no recorded one; the review box has Live + Recorded series | 1 | Mapping assumption | Ask Shayna whether a recorded series exists for Love & Relationships; if not, retire the Recorded variant |
| P8 | Current-site data errors, not ours: Programs 6, 7 and 9 Live via Zoom carry USD 5,315 (the ZAR figure) and Resonance Repatterning 90 min in-person carries USD 2,990 (also the ZAR figure; hidden product) | 4 | Client's own entries | Tell Shayna if USD goes live; do not copy these values |

Expected and correct: "Breakthrough Trilogy, Pre-order" R165 is the current site's "The Latest Book By Suzanne (Pre-order)" R165 (renamed). Deep Energy Clearing Level 1 & 2 Self Study (R7,905 / $375) and Nice or Not Nice Recorded series (R1,500 / $90) exist only on the new site because the team asked for them on 9 and 12 Oct. The hidden AffWP test product (R5) is not wanted.

## What this does not cover

Fulfilment per variant (which course, booking link or file an order delivers) is a separate check: 73 variants carry a Thinkific course id, 4 products a download file, 82 variants (sessions, packages, live group seats, mentorship, subscriptions, fees) have neither and are fulfilled by the order mail's booking or next-steps block. Paths never exercised by an order are listed in the status list (session packages, in-person, monthly items, lifetime access, pre-order, observation fee, RTT, Live Retaker, Live via Zoom programme).
