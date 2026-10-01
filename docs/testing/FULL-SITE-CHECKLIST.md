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
| D | Navigation and search | READ | header, footer, mobile menu, `/search`, 404 page | DONE 1 Oct: PASS after 2 fixes; follow-up open on the n8n index sync |
| E | Forms | MAIL | contact, homepage chapter request, masterclass, resources newsletter, assessments notify, community, unsubscribe | PART RUN 1 Oct: no-mail checks done, 2 FAIL fixed awaiting deploy; real submissions wait for the notify address and Johan's go |
| F | Diagnostics | MAIL | 8 quizzes: gate, invite mail, link, questions, result, full report mail, notification | not started |
| G | Shop and checkout | WRITE | listing, product page, cart, voucher, free order, PayFast sandbox, PayPal sandbox, confirmation page, order mail, invoice PDF | not started |
| H | Thinkific enrolment | WRITE | course product enrols, direct product does not, course access mail | not started |
| I | Member portal | WRITE | signup, login, login link mail, forgot and reset password, dashboard, programmes, resources, videos, account, upgrade | not started |
| J | Bookings | WRITE | booking page, slots, host and attendee mails, cancel, reschedule, calendar connection, account email, CRM record | not started |
| K | Automations | WRITE | each n8n workflow: trigger, run, result, error alert | not started |
| L | Legal and technical | READ | legal pages, cookie notice, sitemap, robots, health, analytics ids, error tracking | RUN 1 Oct: 1 FAIL fixed awaiting deploy, 2 launch items |
| M | Phone and desktop look | READ | every page at 375 and 1280: layout, contrast, overflow | RUN 1 Oct: 1 FAIL fixed awaiting deploy; pages behind login move to I |

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

Cause found (Johan's server output, 1 Oct): the seed did not run, it stopped on "Medusa products fetch failed: 401". The script sent the shop's secret key as Bearer, which Medusa v2 rejects (same fault as KI048). The index is therefore still the 19 Aug build with 98 products, and the 9 products added since are missing. Script fixed to send the key as Basic. The n8n workflow `meilisearch-content-sync` sends the same key as Bearer on both of its Medusa calls, so product edits do not reach the index either: open, to fix and re-import in n8n.

### Section L, 1 Oct 2026

Run: robots, sitemap, health, legal pages, page head tags, analytics and response headers, all read-only.

| Check | Result |
|---|---|
| Legal pages | PASS: privacy, terms, cookies and disclaimer load, are dated (12 May and 29 July 2026), name POPIA and carry no placeholder text. Refunds and cancellations sit in section 4 of the terms; there is no separate refund page. To confirm with Johan: the contact addresses in them (`privacy@` and `hello@suzanneravenall.com`, `admin@ravenallinstitute.com`) must be real mailboxes. |
| Cookie notice | PASS: shown until answered, analytics consent defaults to denied until Accept. |
| robots.txt | PASS: allows the site, blocks `/portal/`, `/api/`, `/admin/`, names the sitemap. |
| Health | PASS: `/api/health` answers ok. Hidden files (`/.env`, `/.git/config`) answer 404. |
| Sitemap | FAIL, fixed: 50 addresses only. Missing were all 107 shop products, the 29 programme pages, `/events`, `/testimonials`, the three About sub-pages and the disclaimer. Listed but wrong: `/services/private-sessions` (a redirect) and the member-only `/resources/media` and `/resources/assessments`. Now built per request with products read from Medusa. Re-test after deploy. |
| Site address in sitemap, robots and share tags | Shows the review box address `http://169.239.180.49`. LAUNCH ITEM: set `NEXT_PUBLIC_SITE_URL` to the real domain at cutover. |
| Analytics | LAUNCH ITEM: the Google Analytics id is still the placeholder `G-XXXXXXXXXX`, so nothing is measured. Needs the real id from the client's Google account. |
| Error tracking | Sentry code is in the page. Whether events arrive is not checked here (section K). |
| Head tags | Icon, language, share title and image, 4 structured-data blocks present. No canonical link on pages: open, low priority. `/favicon.ico` itself answers 404 (the page names `/icon.png`, so browsers show the icon). |
| Response headers | Security headers present, but each is sent twice (nginx and the app) and X-Frame-Options is sent as both DENY and SAMEORIGIN. No Content-Security-Policy. `X-Powered-By: Next.js` exposed. Open, low priority. |

### Search index re-test, 1 Oct 2026 (after the fixed seed ran on the server)

PASS. Seed output: 107 of 107 products and 8 topics indexed. Re-test: all 107 live products are findable by name and every title in search equals the product page. Section D is closed, except the open follow-up that the n8n workflow `meilisearch-content-sync` still sends the key as Bearer, so product edits do not update the index on their own.

### Section M, 1 Oct 2026

Run: `look-scan.mjs` over all 207 pages at 375 x 812 and at 1280 x 800 (414 page loads, no errors), plus header screenshots of ten page types read by eye. Per page it measures sideways overflow, elements past the screen edge, cut-off text, broken images, text under 12px, the page title size and weight, and text contrast (48,820 pieces of text checked). File: `results/look-2026-10-01.csv`.

| Check | Result |
|---|---|
| Phone (375), sideways scroll | PASS: none on any of the 207 pages, nothing past the screen edge, no cut-off text. |
| Desktop (1280), sideways scroll | FAIL, fixed: the header row is wider than the page at two window widths, so every page scrolls sideways there and the Book a Discovery Call button touches the screen edge. At 1280 to about 1297 wide (a common laptop size): 1 to 2px over without a scrollbar, about 17px with one. At 1024 to about 1045: 7px over, about 22px with a scrollbar. From 1100 to 1279 and from 1300 up it fits. This is the 28 Aug item that was never fixed. Fix: logo margin 48px to 24px, menu spacing one step tighter, menu text 14px at every desktop width (was 15px from 1280), the keyboard hint beside search shown from 1280 only. Measured on the local build with a real scrollbar: 40px to spare at 1280, 34px at 1024, no sideways scroll at 1009, 1024, 1040, 1265, 1280, 1300, 1440. Header and search tests 82 of 82 pass. Re-test on the review box after deploy. |
| Text contrast | PASS: no text below AA on a flat ground on any page, no button that vanishes into its ground. The only entries are the three large decorative numerals on `/book` (01, 02, 03 at 15% strength, decoration by design, accepted in KI026). |
| Text over pictures | Cannot be measured by the scan (862 pieces of text per width sit on pictures). By eye on ten page types: white text on a black fade, readable on every header. To decide: the three poster cards on the homepage (Precision Pattern Sessions, Recorded Group Repatterning, The Basic Five) set their headline across the faces in the photo; readable, but the small label above each headline is weak where the photo is light. |
| Page titles | PASS against the header rule: 36px on the phone and 60px on desktop, never above 60px, weight normal on 172 pages and medium on the rest (flat-ground and card headings), none bold. Every page has exactly one main heading. |
| Images | 1 FAIL, known: the private testimonial video thumbnail on `/testimonials` (KI042). No other broken image on any page at either width. |
| Small text | Noted, low: the coaching app pill uses 9px ("24/7 Coaching App" on the phone, "close" on desktop) and 10 to 11px for its other lines, on every page. `/explore` step numbers, `/transformation-pathways` labels and badges are 10px. Under 12px is hard to read on a phone. Johan to decide. |
| Phone headers by eye | PASS on home, about, shop, product, programmes, programme, services, events: picture on top, text on black beneath, buttons full width. Noted: the coaching app pill sits over the second button of the Services header until the visitor scrolls or closes it. |
| Pages behind login | NOT COVERED: `/portal`, `/portal/dashboard`, `/resources/awards`, `/resources/media`, `/resources/assessments` land on the login page when signed out, so the scan measured the login page five times. Their look is checked in section I with a signed-in test member. `/cart` and `/checkout` were measured empty; with items in them they belong to section G. |

Not a defect: the Services header looked black in one desktop capture. It is a video and the capture caught a dark frame; the phone capture shows it playing.

### Section E part 1, 1 Oct 2026 (checks that send no mail and create no records)

Run: the code behind each form read end to end, 12 invalid submissions sent to the three form endpoints on the review box, and each form page loaded. No valid submission was sent, so no mail went out and no CRM record was written.

Where each form goes:

| Form | Page | Endpoint | What a submission does |
|---|---|---|---|
| Contact | `/contact` | `/api/contact` | One mail to `CONTACT_NOTIFY_EMAIL` (falls back to `hello@suzanneravenall.com`), reply-to the visitor. Nothing to the visitor, nothing to the CRM. |
| Chapter request | `/` | `/api/lead-magnet` | CRM contact through the n8n workflow `lead-magnet-to-vtiger`, and the Vibe webhook when set. No mail to anyone. |
| Masterclass (2 forms) | `/masterclass` | same | same |
| Newsletter | `/resources` | same | same. The address is not added to any newsletter list: it becomes a CRM contact only. |
| Notify me | `/resources/assessments` | same | same (page is behind login) |
| Community | `/community` | same | same |
| Unsubscribe | `/unsubscribe?token=` | `/api/email/unsubscribe` | Adds the address to the suppression list. |

| Check | Result |
|---|---|
| Form pages load with their form | PASS: contact, home, masterclass (2), resources, community. |
| Contact, invalid input (empty, not JSON, bad email, blank name, blank message) | PASS: all 400 with a clear message, nothing sent. |
| Lead forms, invalid input (empty, not JSON, bad email, name over 100 characters) | PASS: 400 or 422, nothing sent. Noted: an over-long name answers "Please enter a valid email address", which names the wrong field. |
| Unsubscribe, no token and forged token (body and query) | PASS: 400, nothing recorded. |
| Unsubscribe page | FAIL, fixed: `/unsubscribe` answered 308 to the homepage. An old WordPress redirect in `next.config.mjs` (`/unsubscribe` to `/`) fires before the page, so the unsubscribe link in every marketing mail (cart reminders, membership renewal and expiry) lands on the homepage and unsubscribes nobody. The one-click header that mail apps use goes to the API and was not affected. Redirect removed; no other redirect hides a real page (161 checked). Re-test after deploy. |
| CRM write behind the five lead forms | FAIL by code read, fixed in the file, NOT YET PROVEN: `lead-magnet-to-vtiger.json` still carried the four Vtiger faults that were found and fixed in the order workflow on 22 Sep (KI054): contact query without its closing semicolon, no owner on a new contact, an update that drops the mandatory fields, and the activity written to a type Vtiger refuses. On that evidence every chapter, masterclass, newsletter, notify and community submission has failed to reach the CRM, with an alert mail to `ALERT_EMAIL` each time. Fixed with the same changes proven on orders #8 to #13. Needs: re-import in n8n, then one test submission. |
| Flood protection | Open, low: `/api/contact` and `/api/lead-magnet` have no request limit (the quiz and unsubscribe endpoints do). A script could fill the client's inbox or the CRM. |
| Booking workflow | Noted for section J: `calcom-booking-to-vtiger.json` shows the same four Vtiger faults and still reads the webhook fields off the top level. Not changed here. |

Still to run in section E, each needs a server step first:
1. Contact form, one real submission: after `CONTACT_NOTIFY_EMAIL` points at our inbox.
2. One lead form submission per source (5): after the workflow re-import. Writes one test CRM contact, listed for cleanup. Check whether the Vibe webhook is set on the box first, because it would put the test address into Vibe.
3. Unsubscribe with a real signed link: after the redirect fix is deployed.

To decide with Johan: the homepage form asks for an address for the chapter and the newsletter form says subscribe, but neither sends the visitor anything and neither feeds a newsletter list.
