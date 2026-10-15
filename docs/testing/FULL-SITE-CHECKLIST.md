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
| E | Forms | MAIL | contact, homepage chapter request, masterclass, resources newsletter, assessments notify, community, unsubscribe | PART RUN 1 Oct: no-mail checks PASS after 1 fix; real submissions wait for the workflow re-import and the notify address |
| F | Diagnostics | MAIL | 8 quizzes: gate, invite mail, link, questions, result, full report mail, notification | PART RUN 1 Oct: no-mail checks PASS; the mail run waits for the notify address |
| G | Shop and checkout | WRITE | listing, product page, cart, voucher, free order, PayFast sandbox, PayPal sandbox, confirmation page, order mail, invoice PDF | not started |
| H | Thinkific enrolment | WRITE | course product enrols, direct product does not, course access mail | not started |
| I | Member portal | WRITE | signup, login, login link mail, forgot and reset password, dashboard, programmes, resources, videos, account, upgrade | not started |
| J | Bookings | WRITE | booking page, slots, host and attendee mails, cancel, reschedule, calendar connection, account email, CRM record | not started |
| K | Automations | WRITE | each n8n workflow: trigger, run, result, error alert | not started |
| L | Legal and technical | READ | legal pages, cookie notice, sitemap, robots, health, analytics ids, error tracking | RUN 1 Oct: 1 FAIL fixed awaiting deploy, 2 launch items |
| M | Phone and desktop look | READ | every page at 375 and 1280: layout, contrast, overflow | DONE 1 Oct: PASS after the header fix; pages behind login move to I |

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

### Re-tests after the deploy of 86ea858, 1 Oct 2026

Deployed through the GitHub "Deploy" workflow (review job, web only, run 36864550937): build and test passed, review deploy passed, site answers 200.

| Check | Result |
|---|---|
| Header, sideways scroll (section M) | PASS on the review box: 0px over and nothing past the edge on `/`, `/shop` and `/contact` at 1009, 1024, 1265, 1280 and 1366 wide. Section M is closed. |
| Unsubscribe page (section E) | PASS: `/unsubscribe` answers 200 and shows its own page; a forged link shows "this unsubscribe link is incomplete or has been altered". Still to do with a real signed link. |

### Section F part 1, 1 Oct 2026 (checks that send no mail and create no records)

| Check | Result |
|---|---|
| The 8 diagnostic gates | PASS: every `/explore/<topic>/quiz` page answers 200 and shows its sign-up form. |
| Sign-up endpoint, invalid input | PASS: empty and bad email 422 with a clear message, unknown diagnostic 404. |
| Answers and report endpoints, invalid input | PASS: empty 422, forged link 404 "Invalid or expired link". |
| Diagnostic content and scoring | PASS in the unit tests: 65 of 65 (the 8 question sets, results and the three endpoints). |
| Who gets mail | Invite and full report go to the visitor. The completion notice goes to `QUIZ_NOTIFY_EMAIL`, then `CONTACT_NOTIFY_EMAIL`, then `hello@suzanneravenall.com`: so the full run waits until one of the first two points at our inbox. |

Server steps still open before E and F can finish (not possible from this session: the server takes a key from the pipeline only, and password sign-in is not something the session does):
1. Re-import `infra/n8n/workflows/lead-magnet-to-vtiger.json` in n8n (the file is on the box after the deploy).
2. Set `CONTACT_NOTIFY_EMAIL` and `QUIZ_NOTIFY_EMAIL` in `infra/.env` to our inbox and recreate web; set them back after the run.
3. Tell the session whether `VIBE_MARKETING_WEBHOOK_URL` is set on the box (a lead form test would send the test address to Vibe).

### Test order #19 - session booking link (2 Oct)

Rapid Repatterning Session, 60 min online, buyer johan@aiautomations.co.za, voucher QA-SELFTEST-100, total R0. Free-order path, no gateway.

| Check | Result |
|---|---|
| Checkout contact, voucher, place order | PASS |
| Confirmation page text (What Happens Next) | PASS |
| Order mail arrives, to buyer only | PASS (1 min) |
| Booking block and link to own booking page | PASS (http://169.239.180.49:3002/suzanneravenall/discovery-call) |
| Greeting uses buyer name | FAIL - "Dear valued customer" |
| Voucher line in mail summary | FAIL - Subtotal R1,660, Total R0, no discount row |
| Wording | "Programme" heading for a session; em dashes; "2-3 business days" promise unconfirmed |
| Invoice PDF link | not opened yet |

Re-test on order #20 after 60a30ba (2 Oct): greeting "Dear Johan" PASS; "Voucher / discount" row PASS; heading "Item" PASS; no long dashes PASS; booking link PASS. Still open: "2-3 business days" wording, invoice PDF link not opened.

Sitemap re-check (2 Oct): 189 addresses (107 products + 82 others), no duplicates, 189 of 189 answer 200. PASS. The 1 Oct "82, no products" result was taken while the shop container was restarting. Launch item: addresses use NEXT_PUBLIC_SITE_URL.

### Shayna 9 Oct feedback (traced 12 Oct)
| Item | Result | Fix |
|---|---|---|
| Purchased-together orders not in Thinkific | Old standalone copies carry bundle ids; courses API 404 | 30 old copies set to draft (admin API, backup in session scratchpad) |
| Self Study priced like Live | Old copies only; merged Akashic together Self Study is R7,905 | Copies drafted; Deep Energy together Self Study format still to add (price from Shayna) |
| Cassidy's 12 courses not loading | Merged formats had no course id | Course id per format set (21 variants) |
| Invoice PDF text jumbled | react-pdf hyphenation + no column gap | 573b3cd deployed; sample and live invoice #170 re-rendered clean |

### Test order #211 - audio download delivery (12 Oct)

Bringing Your Energy Back (R350 download), buyer johan@aiautomations.co.za, voucher QA-SELFTEST-100, total R0. Free-order path, no gateway. Code 741a084; files uploaded to the private Supabase bucket `downloads` and `download_file` / `download_filename` set on the three audio products the same day.

| Check | Result |
|---|---|
| Product page reads as a download (no Zoom text) | PASS: "Download details", format label "Download" |
| Checkout contact, voucher, place order | PASS |
| Order mail arrives, to buyer only | PASS (sent 14:19 SAST, from hello@suzanneravenall.com) |
| "Your Downloads" block with one button per file | PASS: "Download: Bringing Your Energy Back" |
| Download next steps (no course-access promise) | PASS: 3 download steps |
| Button link resolves to the file | PASS: Brevo click tracking to the signed Supabase URL, 206 on a range request, audio/mpeg, 6,165,958 bytes, Content-Disposition "Bringing Your Energy Back.mp3", ID3 header |
| Invoice PDF attached | PASS: invoice-211.pdf (4.4 KB) |

Not yet tested: Relaxation & Energy Reclamation and Energetic Alignment & Inner Neutrality (same code path, same metadata keys, both sign tests passed at upload). Open: Quantum Healing Codes (eBook & Audio Download) has no file yet.

### Search index reseed (12 Oct)

Run on the box by Johan (session scratchpad reseed-meili.sh: clear the products index, `npx ts-node src/scripts/seed-meilisearch.ts` in the medusa container, wait, check). Verified from the laptop through `/api/search`:

| Check | Result |
|---|---|
| Renamed titles (colon instead of the long dash) | PASS: "Deep Energy Clearing Level 1 & 2: Purchased Together", "Akashic Navigator Level 1 & 2: Purchased Together" |
| Drafted standalone copies gone from search | PASS: "purchased together" returns only the two merged products |
| New audio product searchable | PASS: "Bringing Your Energy Back" |
| Full Basic Programs 1-5 + Demos (Live via Zoom) | PASS, found |

Reminder for go-live: the n8n content sync does not follow product edits, so any catalogue edit needs this reseed until the sync is fixed.

## Test order #220 - Quantum Healing Codes download delivery (13 Oct)

| Check | Result |
|---|---|
| Product page /shop/quantum-healing-codes-ebook-audio-download reads as a download (Download details, category Digital Downloads) | PASS |
| Checkout with QA-SELFTEST-100, buyer johan@aiautomations.co.za, total R0, order #220 confirmed | PASS |
| Order mail 11:58 SAST from hello@suzanneravenall.com with Your Downloads block, one button "Download: Quantum Healing Codes", 30-day wording, download next steps | PASS |
| Button resolves via Brevo tracking to the signed Supabase URL, 206, application/zip, 36,673,184 bytes, filename Quantum Healing Codes.zip | PASS |
| invoice-220.pdf attached | PASS |

Source files: eBook PDF (second edition, 2.7 MB) retrieved from the current site via a completed R0 WooCommerce order (#17877, johan@aiautomations.co.za) created through the WooCommerce REST API; 22 audio codes fetched from the current site's public uploads on 12 Oct. Zip layout: Quantum Healing Codes/<eBook>.pdf + Quantum Healing Codes/Audio Codes/<22 mp3>. Bucket path downloads/quantum-healing-codes/quantum-healing-codes.zip; product metadata download_file + download_filename set via admin API.

## Group sessions catalogue change - verified 13 Oct ~12:45 (review box 169.239.180.49)

| Check | Result |
|---|---|
| Develop Super Confidence page: Recorded series chip marked (coming soon), disabled Coming Soon button + contact link, Live still Add to Cart | PASS |
| Attraction Frequency page: Coming Soon badge, no Add to Cart | PASS |
| Group Sessions grid: Attraction Frequency card badge Coming Soon, Super Confidence card Live or Recorded | PASS |
| Nice or Not Nice page: two formats, Live (booked as series) + Recorded series R1 500, Add to Cart on both | PASS |
| Retired standalone copy /shop/resonance-repatterning-group-session-communication | 404 (draft) PASS |
| MeiliSearch index | reseeded 12:52, 59 docs, search "nice or not nice" returns only the merged product | PASS |

## Re-run for the Friday 16 Oct status mail (13 Oct, review box, buyer johan@aiautomations.co.za, voucher QA-SELFTEST-100)

| Flow | Order / record | Result |
|---|---|---|
| 1. Session purchase: Rapid Repatterning 60 min online, voucher typed in LOWER CASE, place order, confirmation page #221, order mail 14:20 SAST (Dear Johan, Book Your Session block + link to the booking page, Voucher / discount row -R1,660, Total R0, invoice-221.pdf attached) | #221 | PASS (also proves flow 4, voucher case) |
| 2a. Group session LIVE seat: Money Mastery, Live (booked as series), voucher, order #222, mail 14:22 SAST (Dear Johan, no booking block, What Happens Next: Zoom link emailed 24 h before, sessions recorded, invoice-222.pdf attached) | #222 | PASS (Shayna 6 Oct item 16 re-proven) |
| 2b. Group session RECORDED series: Career Progression, Recorded series, voucher, order #223, order mail 14:23 SAST + course-access mail 14:23 SAST ("Your course access is ready - Group Session: Career Progression (Recorded series)", Access your courses on Thinkific button, invoice-223.pdf on the order mail) | #223 | PASS (Shayna 6 Oct item 18 re-proven, enrolment ran) |
| 5a. Masterclass Watch Now: form (name + email) opens /masterclass/watch immediately; video is /uploads/media/suzanne-masterclass.mp4 (1004 s = 16:44); at the end the page shows "take 25% off the Trauma to Transcendence programme with the code MASTERCLASS-T59SW7S" + View the programme | 13 Oct 14:24 | PASS (Shayna 7/8 Oct items 24, 26, 27 re-proven; page copy says 17 minutes) |
| 5b. Masterclass code in the cart: Trauma to Transcendence Live via Zoom R3,320, code typed masterclass-t59sw7s (lower case) applied as MASTERCLASS-T59SW7S, -R830, total R2,490. Order NOT placed (paid flow). | 13 Oct 14:28 | PASS (item 27 re-proven) |
| NEW DEFECT found in the re-run: 12 programme pages link View in Shop to retired product copies (404): become-an-energy-ninja, become-an-energy-ninja-level-2, coherence-muscle-testing, energy-clearing-basic, energy-clearing-advanced, finding-my-purpose, getting-unstuck, intuition-in-business, intuition-in-my-personal-capacity, nice-or-not-nice-communication, post-traumatic-growth, trauma-to-transcendence. Cause: data/programs.ts shopHandle still names the standalone copies drafted on 12 Oct (and today). | 13 Oct 14:30 | FAIL, fix below |
| Programme shop links: 16 shopHandle values repointed at the published products (Rapid Repatterning introduction link removed), data/programs.test.ts updated, new scripts/check-shop-handles.mjs reports 27 handles all resolving. Commit 130e334, deploy 38424387644 started 17:42 SAST. Re-check of the 12 pages after deploy below. | 13 Oct 17:45 | FIXED, deploy pending |
| 3a. Programme Self Study: Akashic Navigator Level 1 Self Study (R4,650), voucher, order #224, order mail 17:45 SAST + course-access mail "Akashic Navigator Level 1: Fundamentals (Self Study)" 17:45 (enrolment ran, New course per Shayna 8 Oct), invoice-224.pdf | #224 | PASS (Shayna 9 Oct items 34/36 re-proven) |
| Masterclass code scoping: removing Trauma to Transcendence from the cart dropped the MASTERCLASS code automatically (it applies to that programme only) | 13 Oct 17:44 | PASS |
| 5c. Masterclass registration mail: Watch Now registration 14:24 sent "You're on the list for the free masterclass" (hello@, link to the viewing page). Watch Later registration 17:43 with the SAME address sent nothing: sendLeadWelcomeIfDue dedupes one welcome per address per form per window (by design). Watch Later date line to be proven with a fresh address (plus-address) in the next run. | 13 Oct | PASS, Watch Later wording pending |
| 7. Mentorship order: Practitioner Mentorship Single Session (Live) R575, voucher, order #225, mail 17:46 SAST: no booking block; What Happens Next = last Wednesday monthly 4pm SAST, nothing to book, we email closer to the time; invoice-225.pdf | #225 | PASS (Shayna 7 Oct item 25 re-proven) |
| 9. Read-only re-checks 13 Oct 17:48: Speaking second button -> Acuity (appointmentType 24190547), Start the Conversation -> /contact; all 12 Transformation Pathways carry Discover Your Pattern + Book buttons; Services Love & Relationships -> /programs/love-and-relationships (200); Resonance Repatterning session page: Resonance copy, Rapid appears only in footer links | | PASS (items 7, 15, 17, 23 re-proven) |
| Programme shop links after deploy 38424387644 (success 17:51 SAST): re-crawl of 49 programme/service/pathway pages, 31 shop links, 0 dead; /programs/trauma-to-transcendence -> the live product | 13 Oct 17:55 | PASS |
| 3b. Deep Energy Clearing Level 1 & 2: Purchased Together, Self Study (R7,905, the format added 12 Oct), voucher, order #226, order mail 18:09 SAST (invoice-226.pdf) + course-access mail 18:09 with the Thinkific button; two courses enrolled (the two New ids), the mail listed the product title twice | #226 | PASS (Shayna 9 Oct item 35 re-proven); cosmetic: title repeated, fixed below |
| 3c. Full Basic Series Programs 1-5, Self Study (R13,950), voucher, order #227, order mail 18:13 SAST (invoice-227.pdf) + course-access mail 18:13; five courses enrolled (the series), the mail subject and list named the product five times | #227 | PASS (item 29/30 re-proven); cosmetic: title repeated, fixed below |
| Course-access mail for series / purchased-together products: titles deduped in apps/medusa automations handler (one line per product), test added (18 pass). Commit 15b5ab0, deploy 38428867528 (services=medusa) started 18:14 SAST | 13 Oct 18:15 | FIXED, deploy pending |
| Test-harness note: the hidden browser pane suspended the cart response twice on #227 ("Saving..." never cleared, console ERR_NETWORK_IO_SUSPENDED) although Medusa had answered 200; fronting the tab released it. Not a site defect. | 13 Oct 18:12 | n/a |
| 5c (cont). Masterclass Watch Later with a fresh address (johan+watchlater@aiautomations.co.za), date 15 Oct, time 19:00: form shows "Thank you, you're registered", welcome mail 18:18 SAST to the plus-address, subject "You're on the list for the free masterclass", What happens next = "You chose to watch on Thursday 15 October 2026 at 19:00. Your link is below and works whenever you are ready." + Watch the masterclass button | 13 Oct 18:18 | PASS (Shayna 7 Oct item 24 Watch Later wording re-proven) |
| 6. Diagnostics, invite step: all 8 sign-ups from one connection within one minute (health-energy-intelligence, identity-purpose-activation, intuition-as-patterned-intelligence, leadership-high-performance, life-transitions-reinvention, emotional-nervous-system-mastery, relationships-attachment-patterns, next-level-health-vitality-longevity), all HTTP 200, no "Too many requests"; 8 invite mails 18:17 SAST "<title> - your diagnostic is ready", each with Start the Diagnostic + "Requested 13 Oct 2026, 18:17 (SAST). If you asked more than once, every copy of this link works."; link resolves to http://169.239.180.49/explore/<slug>/quiz?token=... (HTTP 200) | 13 Oct 18:17 | PASS for invite + link (items 1, 9, 10, 11). Completion NOT run: /api/quiz/complete mails Suzanne's hello@ address on the review box (QUIZ_NOTIFY_EMAIL and CONTACT_NOTIFY_EMAIL unset), so the report step and the Gmail delivery folder stay with Cassidy, or run after Johan sets a notify address |
| Contact form: NOT run for the same reason (CONTACT_NOTIFY_EMAIL unset on the review box = hello@suzanneravenall.com) | 13 Oct | BLOCKED, Johan to set CONTACT_NOTIFY_EMAIL on the box or run it himself |
| PayFast / PayPal sandbox orders: NOT run. PAYFAST_SANDBOX and PAYPAL_SANDBOX are unset on the review box (both gateways in live mode), so a paid order would be a real payment | 13 Oct | BLOCKED, needs sandbox flags + sandbox credentials on the box |
| Member portal signup / login / reset: NOT run by the EA (needs an account created with a password on a non-local host). Steps for Johan: /portal/signup with johan+portal@aiautomations.co.za, confirmation mail from Supabase (suzanne.db.aimate.co.za), /portal/login, /portal/forgot-password, reset mail, new password, /portal/dashboard | 13 Oct | FOR JOHAN |
| Course-access mail dedupe after deploy 38428867528 (success 18:20 SAST; the store API answered 502 from 18:17 to 18:21 while Medusa restarted, then normal): Deep Energy L1 & 2 together Self Study again, order #228, order mail 18:23 SAST (invoice-228.pdf) + course-access mail 18:23 "Your course access is ready - Deep Energy Clearing Level 1 & 2: Purchased Together (Self Study)" with the title once | #228 | PASS (fix proven) |
| 6 (cont). Diagnostics completion, 14 Oct 04:13-04:29 SAST after Johan set CONTACT_NOTIFY_EMAIL and QUIZ_NOTIFY_EMAIL on the review box to johan@aiautomations.co.za: every invite link opened, Start the Diagnostic, all questions answered (12 for nervous system, 10 for the other seven), results page rendered, POST /api/quiz/complete 200 for all 8, and 8 notification mails "Johan QA Test completed: <title>" from hello@ landed at johan@ (04:13 nervous system = The Anxious Anticipator, 04:18 identity = The Emerging Leader, 04:19 performance = The Strategic Integrator, 04:22 stress = Energy Dysregulated, 04:25 life transition = The Conscious Rebuilder, 04:26 long-term performance = Cognitive Fatigue Pattern, 04:27 attachment = The Anxious Connector, 04:29 intuition = Clear Inner Compass) | 14 Oct | PASS for all 8 (items 10, 11: completion + notification proven) |
| 6 (cont). Email Me the Full Report: clicked on identity, performance, stress, life transition; POST /api/quiz/report 200, page shows "Your full <title> Report is on its way!", 4 report mails "Your diagnostic report: <result>" from hello@ at johan@ (04:18, 04:22, 04:23, 04:25). The other four report clicks were refused by the EA's own tool guard (not the site); Johan or Cassidy can click them on the results page | 14 Oct | PASS (4 of 8 proven, same code path for all) |
| Observation, by design: a second run of the same invite link (performance quiz retaken 04:21) shows the new on-screen result (The Overloaded Driver) but /api/quiz/complete keeps the first stored result and the report mail carries that one (The Strategic Integrator). One completion per link; only a visitor who retakes with different answers would notice. Not reported by the team, no change made | 14 Oct | NOTE |
| Test-harness note: the hidden browser pane does not run animation frames, so the quiz's framer-motion transitions (intro to question 1, last answer to results) stay at opacity 0 until a real click, key press or screenshot ticks a frame. Not a site defect; the same pages render normally in a visible browser | 14 Oct | n/a |
| Contact form (/contact, item "contact form"): submitted 14 Oct 04:39 SAST with name Johan QA Test, email johan@aiautomations.co.za, enquiry Other, test message. POST /api/contact 200, page shows "Thank you. Suzanne's team will be in touch within 2 business days." Two mails from hello@ at johan@ at 04:39: notification "New contact message from Johan QA Test" (name, email, enquiry, message all present) and acknowledgement "We received your message, Johan". CONTACT_NOTIFY_EMAIL was johan@ on the box for this run | 14 Oct | PASS (notification + acknowledgement proven) |
| Catalogue price parity vs the current site (Johan's rule: copy both currencies exactly, never derive USD from ZAR). 08:10 read of all 146 current-site products via the WC REST API vs 159 review-box variants (infra/scripts/catalogue-parity/, record docs/testing/results/catalogue-parity-2026-10-14.md): 5 ZAR wrong (RR Program 1-5 Self Study R3,100 vs R4,205), USD missing on 141, 3 USD differing, duplicate product rapid-repatterning-session-60-min-online. 11:18 Johan ran price_parity_apply.py: 135 variant price writes on 58 products, backup price-parity-backup-20261014-111851.json, 0 mismatches on verify, duplicate set to draft; 11:20 search reseeded (58 docs). 11:25 re-read from the laptop: 139 matched variants identical in ZAR and USD, 0 differences; 4 variants left without USD on purpose because the current site's USD field holds the ZAR figure (Programs 6, 7, 9 Live via Zoom; RR 90 min in-person, hidden) - for Shayna; 3 new-site-only formats unchanged (Deep Energy 1 & 2 Self Study, Nice or Not Nice Recorded, Love & Relationships Recorded); search returns one Rapid Repatterning Session, drafted page 404 | 14 Oct | PASS (parity 0 differences; 4 USD values await Shayna) |
| Fulfilment matrix, 14 Oct 11:38-11:41 SAST: 8 voucher orders placed by Johan with scratchpad fulfil_orders.py through the site's own path (store cart, line item, contact Johan QA Test, QA-SELFTEST-100, /api/checkout/free), buyer johan@, total R0 each. #229 Rapid Repatterning Package of 04 (60 min online); #230 Rapid Repatterning 60 min in-person; #231 Rapid Transformation Therapy 1 hypnosis session + recording; #232 RR Program 1 Live via Zoom; #233 RR Program 1 Live Retaker; #234 Breakthrough Trilogy Pre-order; #235 Email Support per month; #236 Bonus Lifetime Access. All 8 order mails "Your transformation begins - Order #N" from hello@ at johan@ within 10 s of placing, Dear Johan, item + variant, Voucher / discount row, Total R 0.00, invoice-N.pdf attached (4.4 KB). #232 and #233: course-access mail "Your course access is ready - RR Program 1: Fundamentals (Live via Zoom / Live Retaker)" 11:40 with the Thinkific button (enrolment ran, course 1349879). #229, #230, #231: Book Your Session block + button to the Cal booking page + session next steps. #234, #235: generic next steps (access details within 24 hours). #236: course next steps | 14 Oct | PASS for order, mail, invoice, enrolment and booking block on all 8; wording findings below |
| F1 Bonus Lifetime Access (#236): the order mail says "Watch for your course access email" and "Sign in at Thinkific", but the product has no Thinkific course id and no category, so no course-access mail follows; the wording comes from the handle fallback ("self-study" in bonus-lifetime-access-self-study-online). The buyer waits for a mail that never comes | 14 Oct | DEFECT: give the product the course it grants (Shayna: what does lifetime access unlock?) or classify it as other |
| F2 Live via Zoom and Live Retaker programmes (#232, #233): next steps read as self study ("work through the materials at your own pace"), no Zoom joining wording, because since 13 Oct any order with a course id is sent the self-paced steps (apps/medusa order-placed.ts line 516). Enrolment and the course-access mail are correct | 14 Oct | WORDING: a combined live + course step set (course access now, Zoom details 48 h before); confirm with Shayna that live attendees also get the Thinkific materials |
| F3 Sessions: a Package of 04 (#229) reads "Schedule your session" (one booking) and the in-person session (#230) gets the same online booking link and no in-person wording; every session order books through the Cal event suzanneravenall/discovery-call (CALCOM_SESSION_BOOKING_URL unset on the box) | 14 Oct | QUESTION for Shayna: one booking event for all paid sessions, how packages are booked, in-person wording |
| F4 Pre-order (#234) and Email Support (#235): generic "You will receive access details and confirmation within 24 hours". Readable, but "access details" is odd for a book pre-order | 14 Oct | NOTE, Shayna's wording call |
| F5 Ninth order (Certification Observation Fee) not placed: the add-to-cart call got HTTP 502 "Connection timed out" from the proxy at 11:41:55 while the box was still rendering invoices and mails for the previous 8 orders (one order every 23 s); the store API answered 200 in 0.2 s moments later. Retried alone 11:51:08: order #237 placed, order mail 11:51 with generic next steps (access details within 24 hours) and invoice-237.pdf; the fee wording is the F4 note | 14 Oct | PASS on retry; LOAD NOTE: single worker on the review box, watch for it during the team's burst testing |
| 12:00-12:15 Answers from the current site's own data (WC REST: purchase notes, descriptions, categories; Thinkific API: courses and bundles), instead of questions to Shayna. F1 Bonus Lifetime Access: no purchase note, no course on the current site, short description "add LIFETIME ACCESS to the SELF-STUDY PROGRAMME for $100 per level... after the event"; no lifetime course exists in Thinkific (103 courses). It is a manual add-on: order mail now uses the generic steps (commit 3c78ba4). F2 Live via Zoom programmes: the current site's purchase note for every Live programme is "Log into the Learning Management System... to access your programme", so live buyers do get the materials; new product type live-course = course access line + Zoom details 48 h before (3c78ba4, tests 38 + 23 green). F3 Sessions: every session product on the current site, packages, in-person and RTT included, carries the same purchase note "Please book your ... Session: Session Booking" with one link, so one booking link for all is parity; no change. P5 Full Basic Series 1-5: the current site sells it Live only (R5,535, its own description calls it the retaker price); the self-study series is the "+ Demos + Resources (Self Study)" product. P7 Love & Relationships: the current site has a Live product (13168, category Live) and a recorded one (6678, category Self Paced, purchase note "access your Love & Relationships recording", mis-titled "booked as a series only"); Thinkific course 1799794 "Group session series: Love & Relationships" exists; the new site's Live + Recorded is right, no change. P8 Programs 6, 7, 9 Live: current site USD field holds 5,315 (ZAR), every other Live programme is $555; set $555 and tell Shayna. RR 90 min in-person: hidden on the current site, not on sale; remove the variant. P6 Coaching App: an empty product on the current site (no description, no note, category "not used"); not migrated, Pattern Coach stands | 14 Oct | RESOLVED from data; writes W1-W4 in catalogue_fixes.py for Johan |
| NEW DEFECT found while resolving P5: both "Full Basic Training, Programs 1-5 + Demos + Resources" products (Self Study R13,950, Live R23,910, the ones the current site sells) carry thinkific_course_id 2329050 / 2329161, which are Thinkific PRODUCT ids (bundle products 111033 / 111037), not course ids; the enrolment step enrols by course id, so an order on either would enrol nothing (the 9 Oct Akashic failure, item 34, same cause; these two were missed). Thinkific bundle 111033 = courses 2165207, 2165208, 2165227, 2165210, 2165229, 1799809; bundle 111037 = 1349879, 1383462, 1402405, 1405974, 1505335, 1799809 | 14 Oct | FIX W1 in catalogue_fixes.py (Johan runs), then one QA order on each to prove enrolment |
| Catalogue fixes W1-W4 applied by Johan (catalogue_fixes.py apply, backup catalogue-fixes-backup-20261014-142650.json): W1 both + Demos products now carry the Thinkific bundle course lists; W2 duplicate Self Study variant removed from the plain Full Basic Series; W3 USD 555 on Programs 6, 7, 9 Live via Zoom; W4 RR 90 min in-person variant removed. Verify clean. Re-read: parity 138 OK, 3 USD DIFF = the 6/7/9 corrections against the current site's wrong field, 3 NO MATCH + 1 hidden as this morning; check-shop-handles 27/27 resolve | 14 Oct 14:40 | DONE; reseed + one QA order per + Demos product next |
| + Demos enrolment proof: reseed 14:31 (58 docs, both + Demos products in search); orders #238 (+ Demos Self Study) and #239 (+ Demos Live via Zoom) placed 14:32 with QA-SELFTEST-100; order mail + invoice + course-access mail for both within 30 s; Thinkific API: Self Study = 1799809 new + 5 programmes already enrolled 13 Oct (kept); Live = Programs 2-5 Live new + Program 1 Live from #232 + 1799809 shared; all 12 course ids enrolled for johan@, pre-existing enrolments did not block the rest | 14 Oct 14:40 | PASS, defect closed (Live wording pending 3c78ba4 deploy) |
| Order mail wording after deploy of 3c78ba4 (run 38565175753, web + medusa, live 14:48): #240 Program 1 Live via Zoom shows course access email + Zoom details 48 h before + join the live session, and the course-access mail followed; #241 Bonus Lifetime Access shows the generic steps and no course promise, no course-access mail | 14 Oct 14:52 | PASS, F1 + F2 closed |
