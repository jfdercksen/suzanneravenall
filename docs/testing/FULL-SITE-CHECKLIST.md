# Full site checklist

Started 1 Oct 2026 (Johan): test everything on the site, in small sections, one section at a time. This extends `SELF-TEST-PLAN.md`, which covered the shop side only (purchases, Thinkific, order mails, links, content). The client's 30 Sep list showed the gap: forms, diagnostics and bookings were never in a plan.

Target: review box `http://169.239.180.49`.

## Rules

1. **No test may deliver mail into the client's mailboxes.** Before any section marked MAIL, point `CONTACT_NOTIFY_EMAIL` and `QUIZ_NOTIFY_EMAIL` on the review box at our own inbox, run, then set them back. Johan runs server changes.
2. Sections marked READ only read pages. They can run at any time.
3. Sections marked WRITE create records (orders, Thinkific users, CRM contacts, bookings). One named test person, cleanup listed per run, Johan approves each run.
4. Every item gets a result: PASS, FAIL (with a KI number) or N/A. A section is done only when every item has one.
5. A defect found is fixed and re-tested in the same section before the next section starts.

## Sections

| # | Section | Type | Items | Status |
|---|---|---|---|---|
| A | Every page loads | READ | 52 routes plus every dynamic page (shop products, programs, pathways, private sessions, explore topics, blog posts) | DONE 1 Oct: PASS after title fix |
| B | Every link on every page | READ | internal, external, anchors, mailto/tel, images | RUN 1 Oct: PASS except the known video thumbnail |
| C | Content | READ | placeholders, titles, duplicate titles, broken images, the 6 testimonial videos | RUN 1 Oct: PASS, 3 decisions with Johan |
| D | Navigation and search | READ | header, footer, mobile menu, `/search`, 404 page | RUN 1 Oct: 1 FAIL fixed awaiting deploy, 1 FAIL open (search index) |
| E | Forms | MAIL | contact, homepage chapter request, masterclass, resources newsletter, assessments notify, community, unsubscribe | not started |
| F | Diagnostics | MAIL | 8 quizzes: gate, invite mail, link, questions, result, full report mail, notification | not started |
| G | Shop and checkout | WRITE | listing, product page, cart, voucher, free order, PayFast sandbox, PayPal sandbox, confirmation page, order mail, invoice PDF | not started |
| H | Thinkific enrolment | WRITE | course product enrols, direct product does not, course access mail | not started |
| I | Member portal | WRITE | signup, login, login link mail, forgot and reset password, dashboard, programmes, resources, videos, account, upgrade | not started |
| J | Bookings | WRITE | booking page, slots, host and attendee mails, cancel, reschedule, calendar connection, account email, CRM record | not started |
| K | Automations | WRITE | each n8n workflow: trigger, run, result, error alert | not started |
| L | Legal and technical | READ | legal pages, cookie notice, sitemap, robots, health, analytics ids, error tracking | not started |
| M | Phone and desktop look | READ | every page at 375 and 1280: layout, contrast, overflow | not started |

## Known going in (1 Oct)

- Fixed today and proven: contact form, quiz full report mail (1 of 8 quizzes), booking mails, About links, wording on the chapter and masterclass forms.
- Cal.com: account email is Johan's (invites show him as organiser), no calendar connected, one client test booking on 2 Oct 09:30.
- International Client video is private on YouTube (KI042): the client changes it on the channel.
- `app/api/lead-magnet/route.test.ts` has 13 stale failing tests.
- Resources newsletter, assessments notify and community forms have never been run by us.

## Results

One block per section, added as each section runs: date, what was run, counts, FAIL list with KI numbers, re-test result.

### Sections A and B, 1 Oct 2026

Run: `link-crawl.mjs --external --images` (135 pages, 1,753 asset and external links), plus a direct load of all 107 product pages from the Medusa list (the shop listing renders in the browser, so the crawl reaches only 35 of them). Files: `results/links-2026-10-01-09-29.*`, `results/product-pages-2026-10-01.csv`.

| Check | Result |
|---|---|
| Pages reached by the crawl | 135, all 200 |
| Product pages loaded directly | 107 of 107 answer 200, each with a price and a buy or book button |
| Internal links | PASS, no broken link, no link to the old site, no empty or `#` link |
| Images | 1 FAIL: thumbnail of the private testimonial video `E4x3YETXHSA` on `/`, `/about`, `/testimonials` (KI042, client changes it on YouTube) |
| External links | 2 to open by hand: LinkedIn (every page footer, blocks robots) and the Microsoft privacy statement on `/legal/cookies` |
| Page titles | FAIL, fixed: 126 of 135 pages showed the site name twice ("Contact \| Dr. Suzanne Ravenall \| Dr. Suzanne Ravenall"). Cause: the layout template adds the name and 47 page titles also carried it. Suffix removed from the page titles. Re-test after deploy. |
| Duplicate titles | `/portal`, `/portal/login`, `/portal/dashboard` share "Log In" (signed-out redirect, expected). Three pairs of PRODUCTS share an identical title: `getting-unstuck` + `getting-unstuck-self-study`; `rapid-repatterning-session` + `rapid-repatterning-session-60-min-online` (the KI006 duplicate); `resonance-repatterning-all-repatternings-as-demo-s-talk-throughs-resources-self-study` + `resonance-repatterning-full-basic-training-programs-1-5-demos-resources-live-via-zoom`. Johan to decide per pair: duplicate product to remove, or title to correct. |

Not covered by A and B, moved to their own sections: pages behind login (I), the cart and checkout with items in them (G), `/search` results (D), blog posts (the blog index lists none).

### Section C, 1 Oct 2026

Run: every one of the 207 pages (135 crawled plus the product pages) read for placeholder text, main heading, description, image alt text and video status. Files: `results/content-2026-10-01.csv`, `results/titles-2026-10-01.csv`.

| Check | Result |
|---|---|
| Placeholder text (lorem, TODO, TBC, undefined, NaN, raw HTML, zero prices) | PASS, none found |
| "Coming soon" wording | 8 pages. Dates and launches, fine: `/programs`, 2 energy clearing programme pages, `/events`, `/transformation-pathways`, `/book`, `/community`. To decide: `/services/private-sessions/executive-coaching` has no session detail at all ("Full details for this session are coming soon"), and `/speaking` says testimonials from organisers are coming soon. |
| Image alt text | PASS, no image without an alt attribute |
| Testimonial videos | 5 of 6 public. `E4x3YETXHSA` private (KI042, with the client) |
| Main heading | PASS on every page with content. `/services/private-sessions` redirects to `/services#private` by design; `/cart` is empty when signed out. |
| Pages behind login | `/resources/awards`, `/resources/media`, `/resources/assessments` send a signed-out visitor to the login page (silver tier and up, by design in `lib/access/tiers.ts`). The public Resources page links to Awards and Media. Johan to decide whether awards and press belong behind a paid tier. |
| Product descriptions | 35 of 107 product pages carry no product description: the page shows only the standard template copy and the search description is the fallback "Transform your life with Dr. Suzanne Ravenall." List in `content-2026-10-01.csv`. 1 product has no description tag at all (`rapid-repatterning-session-60-min-online`, the KI006 duplicate). |
| Duplicate product titles | Exactly 3 pairs, as listed under A and B. |
| Page titles re-test | NOT YET: review box still served the old titles at 12:05 (198 of 207 double). Re-run after the deploy lands. |

### Page titles re-test, 1 Oct 2026 (after deploy of a87610d)

PASS. 207 pages read: 205 show the site name once. The other 2 (`/about`, `/masterclass`) carry her name inside the page's own headline as well, which reads correctly. Every page has the site name. Section A is closed.

Noted, not a defect: 5 programme pages share a title with their shop product (`/programs/meditation` and `/shop/meditation-live-via-zoom`, and the same for mindfulness, coherence muscle testing, love and relationships, trauma to transcendence).

### Section D, 1 Oct 2026

Run: header and footer links read from the page, missing-page handling on 7 addresses, the search endpoint with 30 queries, and the search box and phone menu used in the browser.

| Check | Result |
|---|---|
| Header menu (desktop) | PASS: 32 links, all resolve |
| Footer | PASS: 32 links, all resolve (LinkedIn by hand). Noted: Private Sessions, Group Coaching, Executive Coaching and Corporate Programs all open `/services`; Practitioner Programmes, Self-Study Courses and Workshops all open `/programs`. |
| Phone menu (375 wide) | PASS: opens, lists every item, a tap opens the page and closes the menu, no sideways scroll. Noted: until the cookie notice is answered it covers the Book a Discovery Call button at the bottom of the menu. |
| 404 page | PASS: unknown address answers 404 with the "page could not be found" screen and a Go home button. Unknown product, programme, blog, session, topic and pathway addresses show the same screen and are marked noindex (they answer 200 because the page streams; not a visitor-facing problem). |
| Search box (Ctrl+K) | Opens, results appear as you type, links open the right pages. FAIL, fixed: Enter did nothing unless a result was highlighted with the arrow keys. Enter now opens the full results page. Re-test after deploy. |
| Search results page | PASS: results, the All / Programmes / Topics tabs, empty and no-result states. Shows at most 10 results with no "more" control. |
| Search endpoint | PASS on odd input (script tags, quotes, %, blanks), and the limit of 20 requests a minute answers 429 as designed. All 43 result links resolve. |
| Search index | FAIL, open: the index is out of date. 9 of 107 live products cannot be found by name (`bonus-lifetime-access-self-study-online`, `coaching-support-package`, `deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom`, `email-support`, `mentorship-single-session-live`, `rapid-repatterning-session-60-min-online`, `ravenall-institute-certification-observation-fee`, `resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom`, `vip-package`), and titles in search differ from the product pages (older names with long dashes). Fix: re-run the index seed on the server (`docker compose exec medusa npx ts-node src/scripts/seed-meilisearch.ts`), Johan to run. Then re-test. Follow-up: confirm product edits update the index on their own. |

### Section D re-test, 1 Oct 2026 (after deploy of 338311a and the index seed re-run)

| Check | Result |
|---|---|
| Enter in the search box | PASS: typing a term and pressing Enter opens `/search?q=...` with results and closes the box. |
| Search index | STILL FAIL: the same 9 products are not findable by name after the seed re-run; the other 98 are, and every title in search equals the title on its product page. Correction to the first run: the "older names" remark compared two different products with similar names, so there is no evidence the titles were ever out of date. The 9 are the products created by the 22 Sep migration (KI006) plus the duplicate. The seed asks Medusa for published products only, so the likely cause is on the Medusa side (status or how the admin list returns them); the seed's own output line "Fetched n / n products" will show it. Open. |
