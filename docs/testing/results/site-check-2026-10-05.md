# Site check: consolidated report for http://169.239.180.49 (5 Oct 2026)

## 1. Summary

**Approach:** 26 agents each tested one section. Their 323 raw findings were merged into 77 unique issues, because the same issue often showed up in several sections. I re-checked 13 claims myself with curl and the code, and all 13 held up.

**Dropped (3), none of them wrong on the facts:**
- Header dropdowns open on click, not hover. The code does this on purpose.
- /book has no booking widget. The test brief assumed /book was a booking page, but it is the book sales page.
- The footer has no newsletter form. This was also a wrong brief assumption. It is kept below as a suggestion only.

**What I re-checked:**
- Soft 404s: /shop/bogus-xyz, /explore/bogus and /blog/x all return 200. /nonexistent-xyz correctly returns 404.
- favicon.ico returns 404.
- Each response carries two X-Frame-Options headers, plus HSTS over plain HTTP.
- YouTube maxresdefault images return 404 for 4 of the 5 testimonial videos. hqdefault returns 200 for all 5.
- G-XXXXXXXXXX is in the page source.
- The sitemap has 189 URLs and /pattern-coach is not one of them.
- /api/search returns a `url` field and no `handle` field, which is why the shop search cards link to /shop/undefined.
- The "twenty minutes" text is still on /services.
- /resources/media and /services/private-sessions return 200, not a redirect status.

**Merged issues by severity:**

| Severity | Raw (all agents) | After merging |
|---|---|---|
| Broken | 26 | 17 |
| Wrong destination | 33 | 8 |
| Content | 135 | 23 |
| Visual | 28 | 12 |
| Minor | 101 | 17 |
| **Total** | **323** | **77** |

The "after merging" column is my own severity call on each merged issue. Some raw findings moved up or down a level.

**Per section (raw counts):**

| Section | Pages | Elements | Broken | Wrong dest | Content | Visual | Minor |
|---|---|---|---|---|---|---|---|
| header-desktop | 27 | 42 | 0 | 1 | 4 | 1 | 4 |
| header-mobile | 36 | 38 | 1 | 0 | 2 | 2 | 3 |
| footer | 5 | 32 | 0 | 2 | 3 | 1 | 3 |
| home-top | 19 | 40 | 1 | 2 | 3 | 3 | 6 |
| home-bottom | 15 | 31 | 1 | 1 | 4 | 2 | 3 |
| about | 4 | 21 | 0 | 1 | 3 | 0 | 4 |
| services | 15 | 19 | 1 | 3 | 2 | 0 | 5 |
| private-sessions | 19 | 38 | 0 | 0 | 6 | 0 | 5 |
| programs | 54 | 650 | 0 | 5 | 6 | 3 | 4 |
| pathways | 14 | 122 | 0 | 0 | 3 | 0 | 5 |
| explore | 17 | 276 | 1 | 0 | 3 | 0 | 7 |
| diagnostic-pages | 20 | 94 | 0 | 1 | 3 | 2 | 6 |
| shop-listing | 110 | 148 | 5 | 1 | 7 | 2 | 4 |
| shop-products-1 | 36 | 350 | 0 | 2 | 9 | 1 | 3 |
| shop-products-2 | 36 | 372 | 0 | 1 | 13 | 0 | 6 |
| shop-products-3 | 35 | 380 | 0 | 1 | 14 | 0 | 5 |
| cart-checkout | 6 | 34 | 3 | 0 | 2 | 0 | 6 |
| book | 3 | 14 | 0 | 1 | 4 | 0 | 1 |
| contact-forms | 5 | 52 | 3 | 1 | 4 | 1 | 7 |
| portal | 13 | 46 | 0 | 0 | 2 | 0 | 5 |
| resources-media | 4 | 44 | 1 | 3 | 5 | 0 | 3 |
| content-pages | 8 | 62 | 2 | 4 | 8 | 1 | 5 |
| legal-tech | 201 | 58 | 1 | 0 | 6 | 1 | 8 |
| email-links | 27 | 38 | 1 | 3 | 3 | 0 | 5 |
| all-pages-mobile | 189 | ~4500 | 0 | 0 | 0 | 5 | 4 |
| all-pages-errors | 51 | 66 | 1 | 0 | 1 | 0 | 6 |
| **Total** | 969 page visits (about 190 unique URLs) | ~7567 | 26 | 33 | 135 | 28 | 101 |

## 2. Findings

### Broken

**B1. Shop search result cards link to /shop/undefined (verified)**
- Page: /shop search box.
- Expected: a result card opens its product.
- Actual: every result card opens /shop/undefined, which shows the 404 page.
- Code: `ShopCatalogueContent.tsx` `searchHitToProduct()` reads `hit.handle`, but `app/api/search/route.ts` returns only `url: '/shop/<handle>'`. Strip /shop/ from `url`, or return `handle` from the API.

**B2. Raw `<mark>` tags shown as text (verified in the API)**
- Pages: /shop search card titles, and the subtitles of Topic results in the header search (all pages).
- Expected: the matched word is highlighted, or plain text is shown.
- Actual: the text reads like "Rapid `<mark>`Repatterning`</mark>` Session".
- Code: `components/search/SearchBar.tsx` around line 230 prints `{item.subtitle}` as plain text. Render it safely the way `SearchResultsContent.tsx` lines 196-197 already do. The shop cards need the tags stripped.

**B3. Shop price sort only sorts the current page**
- Page: /shop.
- Expected: the whole catalogue in price order, in one currency.
- Actual: only the 12 cards on the current page are re-ordered. The cheapest item (R165) sits on page 4. USD and ZAR amounts are compared as raw numbers, so $555 sorts below R775.
- Code: `sortProducts()` runs in the browser on one page of results. Sort on the server instead, using the Medusa `order` param.

**B4. Shop search ignores the active filter**
- Page: /shop.
- Expected: results stay within the chosen category, and all matches can be reached.
- Actual:
  - The "Private Sessions" pill stays highlighted while books and group sessions are listed.
  - The sort dropdown disappears.
  - Results stop at 24 with no paging, while the API has 50 matches.
- Code: `ShopCatalogueContent.tsx`, search mode and `limit=24`.

**B5. Shop state is not kept in the URL**
- Pages: /shop, every product breadcrumb, and the membership-expired email.
- Expected: Back returns to the same page and filter, and category links open filtered.
- Actual:
  - Back always returns to page 1 with "All" selected.
  - Breadcrumb links to `/shop?category=<handle>` show the unfiltered list.
  - The email link `/shop?filter=memberships` shows the full catalogue, which has no membership products.
- Code: `ShopCatalogueContent.tsx` has no `useSearchParams`. Sync category, page and sort to the URL.

**B6. Featured video posters broken for Matheo, Amelia, Jayne and Ivana (verified)**
- Pages: / and /testimonials (every page that uses VideoTestimonials).
- Expected: the big player shows that client's video still.
- Actual: a black box with a broken image. maxresdefault returns 404 for those 4 videos. Play still works.
- Code: `components/shared/VideoTestimonials.tsx:100`. Switch to `hqdefault.jpg`, or fall back to it on error.

**B7. The Brilliant Coach side tab catches clicks meant for page links (desktop, 1280)**
- Pages and links affected:
  - "View All" on all 29 /programs/<slug> pages: 29 out of 29 clicks landed on /pattern-coach.
  - /resources "See all awards" and "Join free" also landed on /pattern-coach.
  - The home page "All programs" link.
  - The first 3 footer Group Sites links, on every page.
- It also covers content on:
  - Home: The Basic Five, the "Pre-Order Now" button and badge.
  - /masterclass card 03.
  - /speaking, /testimonials, /transformation-pathways.
  - The /contact column edge.
- Other problems with the tab:
  - Its own text is cut off ("COACHING APF").
  - On /pattern-coach it links to the page you are already on.
  - It adds 1px of horizontal overflow at 1280.
- Expected: a floating promo never covers or steals clicks from content.
- Code: `components/layout/PatternCoachTab.tsx` (fixed `right-0 top-1/2 z-[60]`, 120px wide). Shrink it to a collapsed edge tab, hide it when it would overlap the footer or right-aligned links, and hide it on /pattern-coach.

**B8. The "Book a Discovery Call" button in the mobile menu cannot be tapped (375)**
- Pages: every page, with the mobile menu open.
- Expected: the menu sits above everything and the button works.
- Actual:
  - After cookie consent, the Coach pill (`z-[60]`) sits over the button inside the menu overlay (`z-50`). A tap does nothing or opens /pattern-coach.
  - Before consent, the cookie banner (`z-[70]`) hides the button instead.
- Code: `PatternCoachTab` should listen to the `pattern-hub:mobile-nav-toggle` event the way `PatternHubStickyBar` does. Raise the menu above both, or hide the banner while the menu is open.

**B9. /checkout/confirmation shows "Payment received" with no order and empties the cart**
- Pages: /checkout/confirmation with no parameters, `?free=1&order=<anything>`, and `?m_payment_id=fake`.
- Expected: no order means a "no order to show" message and the cart is left alone.
- Actual:
  - It says "PAYMENT RECEIVED / Thank You!" and runs `clearCart()`, so a live cart gets wiped.
  - Any order number in the URL is shown as confirmed.
- Code: `components/checkout/ConfirmationContent.tsx`. Tie the success text and `clearCart()` to a confirmed API result.

**B10. /checkout with no cart shows the full form instead of redirecting**
- Page: /checkout for a fresh visitor, or after B9 has cleared the cart.
- Expected: redirect to /cart.
- Actual: the contact form shows with no Order Summary.
- Code: `CheckoutContent.tsx` only redirects when `cart !== null && items.length === 0`. A null cart is never redirected.

**B11. The cart-recovery link in abandonment emails does not restore the cart**
- Where: cart abandonment emails 1, 2 and 3, which link to `/checkout?cartId=<id>`.
- Expected: the email reopens the cart on any device.
- Actual: `cartId` is ignored and the cart is only loaded from localStorage. On another device or browser the checkout is empty.
- Code: `lib/cart/cart-context.tsx` `init()` should read `?cartId=` first. The link is built in `apps/medusa/src/subscribers/cart-updated.ts:100`.

**B12. The /resources/assessments waitlist is behind a login, and the name field is dropped**
- Expected: anyone can open the "Coming Soon, notify me" page and join.
- Actual:
  - A visitor who is not logged in is sent to /portal/login, so the people it is meant for never see it.
  - The form posts `name`, but the API only reads `firstName`, so the name is thrown away.
- Code: `app/resources/assessments/page.tsx` `requireAccess`, and `EmailNotifyForm.tsx` (rename the field to `firstName`). Smaller issues in the same form: the error sits in the wrong place (`sm:col-span-3` in a flex row) and the inputs have no labels.

**B13. Lead forms always report success, even when the lead is lost**
- Forms: masterclass (2), community, /resources newsletter, assessments notify.
- Expected: if storing the lead fails, the visitor sees an error, the way /api/contact does.
- Actual: `/api/lead-magnet` sends to n8n with `void fetch(...)` (not waited on) and always returns 200.
- Code: `app/api/lead-magnet/route.ts`. Wait for the n8n call and return a 5xx on failure.

**B14. /search "All" tab shows only half the product matches**
- Page: /search?q=session.
- Expected: "All" shows at least as many results as the "Programmes" tab.
- Actual: "All" shows 10 results and says "10 results found". "Programmes" shows 20. There is no "show more".
- Code: `app/api/search/route.ts` lines ~127-143 split the limit 10 products plus 10 topics. When no topics match, half the products are lost.

**B15. /explore diagnostic cards look clickable but do nothing**
- Page: /explore, section "Not sure where to start?".
- Elements: cards 01-03 and the "+ 5 more" text.
- Code: `components/explore/ExploreDiagnosticCTA.tsx` renders them as plain divs. Make them links to `/explore/<topic>/quiz`.

**B16. The "Download Speaking Kit" button on /speaking is permanently disabled**
- This is the main call to action for event organisers, and it does nothing.
- Code: `SpeakingContent.tsx` around line 465 (TODO: no PDF yet). Hide the button, or have it link to /contact, until the kit exists.

**B17. Go-live config is still placeholders (every page; verified)**
- Sentry: every page logs "Invalid Sentry Dsn: <DSN from suzanneravenall-web project>", so error tracking is off.
- Google Analytics: hits are sent with `tid=G-XXXXXXXXXX`. A ping still goes out when cookies are rejected (consent mode is set to denied).
- Quiz token privacy: GA records the full page URL, which includes the private `?token=` on quiz pages. Once a real GA ID is set, every emailed quiz token will be sent to Google. Strip the query string from `page_location` on /explore/*/quiz.
- Clarity: no ID is set, but the Cookie Policy lists Clarity cookies.
- Cal booking:
  - `NEXT_PUBLIC_CAL_URL` is `http://169.239.180.49:3002`. Once the site is on HTTPS, the /services Cal button will be blocked as mixed content.
  - The /services button has no fallback link, so it would stay disabled.
  - The code default `cal.suzanneravenall.com` does not resolve in DNS.
- Code: rebuild with the real `NEXT_PUBLIC_SENTRY_DSN` and `NEXT_PUBLIC_GA_MEASUREMENT_ID` (both are baked in at build time). See `app/layout.tsx:57`.

### Wrong destination

**W1. Every "Book a Discovery Call" style button goes to the top of /contact, with the booking calendar below the fold**
- Affected buttons:
  - The header button.
  - Home: hero, the 1-on-1 card, "Three ways to begin: Book Now", and the final CTA.
  - About: /about and its 3 sub-pages.
  - Services: 2 buttons. Their "Book a Discovery Call" Cal modal on the same page does work.
  - /programs: 3 buttons, and every programme detail page.
  - Explore: the hub and all 8 topics.
  - /pattern-coach.
  - /testimonials.
  - /events: 2 buttons.
  - The /shop hero. The /shop bottom button opens Cal directly.
  - All 107 product pages.
  - Pathways: "Book a Discovery Session".
- Expected: the button lands on the booking calendar. /blog and the /shop bottom button already open Cal.
- Fix: give the /contact booking card an id (e.g. `#book`) and link to `/contact#book` everywhere, or open the Cal modal everywhere.

**W2. Section links land on the top of the page instead of the section they name**
- Footer Services column: 4 links, all to `/services`. Use `#private`, `#group` and so on.
- Footer Programs column: 3 links, all to `/programs`. Use `#practitioner`, `#self-paced`, `#live`.
- Home "Precision Pattern Sessions" card goes to `/services`. Use `/services#private`.
- "Discover The Method" goes to /about. It should go to /about/the-system.
- The "All Services" back link on all 9 session pages goes to /services. Use `/services#private`.
- /services "See Live Dates" goes to /events. Use `/programs#live`.

**W3. Programme buttons point at the wrong products**
- The 5 recorded group series (money-mastery, career-progression, attraction-frequency, develop-super-confidence, overcoming-the-need-to-fix-others):
  - "Book Now" goes to /contact, so there is no way to buy them.
  - These entries have no `shopHandle` in `data/programs.ts`.
- /programs/meditation (a live programme): "Add to Cart" opens the self-study product.
- /programs/...-08-principles-of-relationship: "Add to Cart" opens the "Program 7" product.
- All /programs "Add to Cart" buttons only open the shop page. A label like "View in shop" would be accurate.

**W4. Enquiry buttons go to a blank contact form with no context**
- Buttons:
  - /events: 11 "Register Your Interest" and "Join Waitlist" buttons.
  - /transformation-pathways: 4 immersion "Register Your Interest" buttons.
  - /speaking: "Book Suzanne to Speak" and "Start the Conversation".
  - /blog "Stay Updated", whose copy promises a subscription.
- Expected: the matching enquiry type is preselected, or there is a real waitlist or subscribe form.
- Fix: have /contact read `?enquiry=` and `?topic=`. The "Speaking Enquiry" option already exists in `ENQUIRY_OPTIONS`.

**W5. "Gift This Book" on /book opens the same product page as "Pre-Order"**
- The product page has no gift option.

**W6. Resources cards lead to login walls or the wrong pages**
- The MEDIA card, "See all media appearances" and "See all awards" all hit the login wall. Press coverage and awards sit behind the Silver tier, with no members-only label.
- The "Member Media Library" card points to the press page.
- The "Articles" card scrolls to the press section.
- /community "Explore the Portal" is a login wall, and its arrow icon points backwards.
- Code: `lib/access/tiers.ts`, `MemberResourcesSection.tsx:21-25`, `ResourcesCategories.tsx`, and the `rotate-180` arrow in `CommunityContent.tsx`.

**W7. All 8 "Book a <named> Session" buttons on /explore/<slug> go to the Rapid Repatterning page**
- That page does not mention any of the named sessions.
- The code says this follows Suzanne's instruction, so the fix is a decision: change the labels or the destination (see section 4).

**W8. Email buttons go to the wrong places**
- Order confirmation "Book your session" opens the free discovery-call event. Cal has no paid-session event. See `order-placed.ts:13-14`.
- Every quiz report "Book ..." button goes to /contact (`quiz/report/route.ts:90`, and `QuizFlow.tsx:339` on screen).
- Membership expired "Rejoin" goes to `/shop?filter=memberships`, which does nothing (see B5).

### Content (code-side unless marked "data")

**C1. Every product page uses one generic programme template (all 107 product pages)**
- The type badge, "What's Included", the FAQ ("Sessions are typically 90 minutes, via Zoom or in person"), "Prerequisites: None required" and the "programme" wording are the same on every product. This includes:
  - The book.
  - The ebook.
  - Email Support.
  - The VIP package (also sold as a one-off with no sign that billing recurs).
  - Group family coaching ("Private session via Zoom").
  - Energetic clearing (done remotely).
  - Level 2 courses.
  - Retaker seats.
- A product with `thinkific_course_id` is always labelled Self-Paced with "instant access", even when it is live via Zoom. More than 17 live products are labelled this way.
- Only the first sentence of the description is shown, and the full description appears nowhere. `ProductHero.tsx:22` also splits on ". " across line breaks, which produces run-on text.
- The default variant is `variants[0]`, so Programs 1 and 3 preselect "Live Retaker".
- Code: `components/shop/ProductPageContent.tsx` (`FAQ_ITEMS`, `includedItems`, `isThinkificCourse`, the hard-coded "None required", lines ~54/425/439) and `VariantSelector.tsx:109` ("Choose Your Programme").

**C2. The catalogue still contains about 59 legacy WooCommerce products (data)**
- /shop shows "107 programmes", but the hero says "48 programmes". The legacy items have no category, mostly USD prices and no images.
- The same offering often appears 2 or 3 times at conflicting prices. Examples:
  - Program 2: R2 215 / R5 315 / R3 100.
  - Meditation self-study: R2 770 vs R1 660.
  - Mindfulness: R1 660 vs R2 770.
  - Love & Relationships and Intuition self-study: R1 610 vs R995.
  - Energy Ninja: R4 980 vs R3 320 / R1 660.
  - Akashic L1: R10 295 vs R4 650.
  - Two pages are both titled "Rapid Repatterning Session".
- Some product URLs do not match their titles (e.g. `art-of-deep-clearing-level-1-self-study` shows the Live product; `the-art-of-deep-clearing-live` shows the bundle).
- Price inversions:
  - The Full Basic 5 is cheaper live than self-study (R5 535 vs R13 950).
  - Trauma to Transcendence: self-study R3 500 vs live R3 320.
  - The bundle retaker costs less than a single-level retaker.
- Internal items are for sale: Email Support, VIP Package, Bonus Lifetime Access, the Observation Fee, the Coaching Support Package.
- All of these are in sitemap.xml.

**C3. The catalogue and shop listing disagree on badges, labels and prices**
- Delivery badges are wrong. The book shows "Session", live items show "Session", and a self-study item shows "Live".
- Cards say "GUIDED PROGRAMMES" under the "Practitioner Programmes" filter.
- The "Self-Study" filter includes about 20 live products.
- Counts read "2 programmes" for a book and an ebook.
- Currencies are mixed on the same page. Search results always show Rand.
- Programme pages disagree with shop prices:
  - energy-clearing-advanced: R7 860 vs R3 320.
  - mindfulness: R2 770 vs R1 660.
- The USD/ZAR pairs do not follow any consistent rate.
- Code: `ProductCard.tsx` (`getDeliveryBadge`, the currency fallback), `CategoryFilterBar.tsx`, `data/programs.ts` (`priceZar`/`priceUsd`).

**C4. Spelling and naming are inconsistent**
- "Programs" (header, footer, home) vs "Programmes" (page titles, search, cart). The site is South African, so "Programmes" is likely the intended spelling.
- "Precision Sessions" (menu) vs "Private Sessions" (page).
- "Behavioral" (should be "Behavioural").
- Session names differ from their product names (e.g. Transformational Coaching vs "Transformation Coaching Session").
- Em dashes appear in product titles, descriptions and variant names (data).

**C5. Home page**
- The Group card says "Complimentary", but the product costs R1 500 (`UpcomingEvents.tsx` `buildGroupOpportunity`).
- The card says "Pre-Order Now" and "Available now" at the same time.
- "12 spots left" and "Next intake" give no date or cohort.
- Prices use two formats: R1 500 and R1,500.
- "Read Chapter 1 Free" only captures an email. No chapter is sent (`LeadMagnet.tsx` TODO).
- The media logo alt text says "The Start" (should be "The Star").
- The 4th magazine cover is labelled "Cover Feature" instead of "The African Millionaire" (also on /about).

**C6. /services**
- "Spend twenty minutes with Suzanne" contradicts the 30-minute call stated everywhere else (verified, `ServicesFinalCTA.tsx:60`).
- The Live card lists Inner Cultivation (RR 06) and Principles of Relationship (RR 08), but /programs says all RR programmes are self-study only.
- "Basic 5 Series" vs "Basic Five".

**C7. Private session pages**
- Executive Coaching shows a "Coming Soon" block (`bodyContent: null` in `data/privateSessions.ts`).
- Rapid and Resonance Repatterning say "Zoom only", but their products sell in-person variants.
- No session page shows delivery format, length or price.
- Three pages repeat the hero text in the body.

**C8. /programs detail pages**
- The same generic outcomes, "Who This Is For" text and facilitator bio appear on all 29 pages (TODOs).
- Energy Clearing and Akashic say "Live via Zoom" alongside "self-study available now" and point to "(Live via Zoom)" products.
- Live Mindfulness and Meditation show "Add to Cart" with no dates.
- "Shedding Excess Weight" says sessions are 6.5 hours each on the shop page (data).

**C9. /explore**
- On topics 02, 04, 05, 07 and 08 the panel heading and the line under it are the same sentence (`topics.ts`).
- The hub images differ from each topic's own hero image (`TOPIC_IMAGES`).
- The diagnostic card "Is Your Intuition Clear or Distorted?" opens a quiz titled "...Helping You or Holding You Back?".
- The quiz gate has no privacy or POPIA consent line (`QuizGate.tsx`).

**C10. /speaking shows public placeholders**
- "Conference and corporate client logos, to be provided by Suzanne" is shown to the public.
- "Speaker testimonials ... coming soon".
- The "Keynote preview" is the same 10-second AI hero loop already playing in the header.

**C11. The blog is empty but linked from many places**
- /blog says "Launching Soon".
- It is linked from the menu, the footer, the /resources Blog card and /community.

**C12. /events**
- Cards marked "New dates coming soon" (live) also say "Recorded series".
- "The Basic Five" sits under "Live via Zoom" but says "Self-study: start anytime".
- "Available this week" is hard-coded.

**C13. /book**
- "Read an Excerpt" repeats a paragraph from higher on the page (TODO).
- The trilogy titles and status are unconfirmed.
- R165 reads as the price of all three books.
- No release date is shown.

**C14. /transformation-pathways**
- The "Break the Loop" card image has "TRANSFORMATION MASTERCLASS" baked into it (`PathwaysIntro.tsx`).
- The Young People pages show the adult "your old pattern" line, have no h2, and have a broken `aria-labelledby`.
- The children's umbrella page has only one section.

**C15. Legal pages contradict each other**
- The Disclaimer promises a 7-day refund under a "satisfaction guarantee". Terms s4 says programmes are non-refundable.
- The liability caps differ between the two pages.
- Four different contact emails are used across two domains.
- The legal entity is "Ravenall Institute" in one place and "Dr. Suzanne Ravenall" in another.
- "We are not medical doctors" sits beside the "Dr." title.
- Clarity is listed as a processor, but no Clarity ID is set.

**C16. Contact details are inconsistent**
- Contact addresses used:
  - sravenall@ on the site and footer.
  - hello@ in /api/contact errors and the delivery fallback.
  - support@ravenallinstitute.com in the order email HTML.
- The address appears as "Johannesburg" in some places and as "8 Oxmoor Street, Kyalami Estates" in others.
- The footer has no phone number. The phone numbers in the code are placeholders.
- The order email says "create your account at suzanneravenall.com/portal" (bare text, and a 404 on the live domain). A separate Thinkific email sends the same buyer elsewhere.

**C17. The public Cal discovery-call page shows a personal Zoom room**
- `zoom.us/j/3603768111` is visible to every visitor before they book.
- Move it to the booking-confirmation details only.

**C18. Lead source tags are missing**
- Masterclass and community sign-ups send no `source`, so they are logged as "homepage".
- Fix: add `source: 'masterclass'` and `source: 'community'` to the form requests.

**C19. Cart wording does not fit what is sold**
- "Cancel anytime" appears on one-off sessions.
- "Shipping: Free" appears on services.
- Only the PayFast badge is shown, though international buyers pay with PayPal.
- The quantity can be raised on a single-seat programme with no limit.
- The voucher field only appears after the contact details are submitted.

**C20. /resources**
- The "TV, Podcast & Press" card leads to magazine items only, and none of them link anywhere.
- The "Assessments & Workbooks" card leads to a "Coming Soon" page, even for paying members.
- The hub's press titles differ from `data/mediaArticles.ts`.

**C21. Search coverage is thin**
- Topic page body text is not indexed: "anxiety" finds no topics, and "anxious" finds nothing at all.
- Services, about and blog pages are not indexed at all.

**C22. Smaller copy issues**
- /pattern-coach step 03 has a grammar slip ("Keep going, then a simple monthly subscription").
- /masterclass has two reassurance lines that repeat each other ("Takes 2 minutes") and gives no date or format.
- The /resources/assessments page metadata says "Silver required" for a coming-soon page.
- The Membership Expired email promises a 30-day grace period that is not confirmed.
- Hero copy says "Join thousands of clients" while /shop says "2,000+".
- Typos: "Repattering" and "whats".

**C23. Unconfirmed claims marked [CONFIRM]/TODO in code**
- Stats: 20+ years, 2,000+ clients, 30+ awards, 30+ countries, "1000s lives".
- The HPR card copy.
- The 6 contact FAQ answers.
- The accreditation logos.

### Visual

**V1. Search modal layering and mobile close**
- The search modal is rendered inside the sticky header (which has `z-50`), so the cookie bar and the Coach widget sit above its backdrop. Clicking near the bottom of the screen does not close it.
- Fix: render the modal through a portal to `document.body`.
- On mobile the modal has no close (X) button and shows keyboard-only hints. The desktop hint always shows the Mac symbol "⌘K", even on Windows.

**V2. All 107 product pages are 389px wide at 375 on load**
- Cause: the "What's Included" column uses `motion.div initial x:30` (`ProductPageContent.tsx:290`).
- Fix: add `overflow-x-clip` to the section, or animate on y below `sm`.

**V3. /explore mobile cards have no gradient behind their text**
- `from-black/88` is not a valid opacity step in Tailwind v3, so the gradient never renders and white text sits on bright photos (`ExploreTopicGrid.tsx:246`).

**V4. /programs category chips (mobile)**
- The active chip does not follow the section on screen. The IntersectionObserver threshold of 0.3 can never be reached on 3400-4600px sections.
- The "Live" and "Recorded Group" chips are cut off or off screen, with no scroll hint.
- Code: `ProgramsPageClient.tsx` around line 170.

**V5. /shop filter bar and pagination**
- On mobile the sticky filter bar wraps to 4 rows (305px tall). On desktop "Self-Study" wraps to a second row.
- Changing the page does not scroll back to the top of the grid.

**V6. The cookie banner covers content until a choice is made**
- Before consent it hides:
  - The hero video toggle dots and the scroll chevron.
  - The "Browse Programmes" button on the empty cart (1280).
  - The final CTA row on /about.
  - The footer copyright line.
- Fix: add bottom padding equal to the banner's height while it shows.

**V7. At 320px wide the header overflows to 336px**
- The hamburger button is partly off screen.

**V8. The home About teaser credentials badge is hidden behind the accent block at 375 and 768**
- Code: `AboutTeaser.tsx`.

**V9. /discover-your-pattern cards: "Take Quiz" buttons touch the description text**
- Code: `PatternHubQuizGrid.tsx:53-56`.

**V10. /contact layout**
- The Cal iframe (1464px tall) sits in a 600px box, which makes a scroll inside a scroll.
- On mobile the Coach pill sits over the "Send a Message" fields.

**V11. Mobile menu**
- The menu flattens into one list of 23 links at `text-3xl` with no group headings (1699px of scrolling).
- Fix: use accordion groups.
- The `#private` and `#group` anchors land 20px under the sticky header. Add `scroll-margin-top` of about 80px.

**V12. /legal/cookies tables cut off the Duration column at 375, with no scroll hint**

### Minor

**M1. Soft 404s and statuses on gated pages (verified)**
- Unknown slugs return 200 with the 404 content on:
  - `/shop/*`
  - `/programs/*`
  - `/explore/*` and `/explore/*/quiz`
  - `/transformation-pathways/*`
  - `/services/private-sessions/*`
  - `/blog/*`
- The tab titles are wrong ("Programme", "Diagnostic Coming Soon").
- The gated `/resources/*` pages and `/services/private-sessions` return 200 with a meta refresh instead of a 307 or 308.
- Cause: `app/loading.tsx` starts streaming before `notFound()` or `redirect()` runs.
- Fix: use `dynamicParams=false` where `generateStaticParams` covers every slug, add `next.config` redirects, and move the auth check into middleware.

**M2. Headers and HTTPS (verified)**
- Each response has two conflicting X-Frame-Options headers (DENY from Next and SAMEORIGIN from nginx), plus HSTS over HTTP.
- Port 443 is filtered (connections time out), which causes Chrome's HTTPS-upgrade delays.

**M3. /favicon.ico returns 404 (verified)**
- The icon.png in use is 117x118, not a standard size.
- There is no web manifest.

**M4. Sitemap**
- Every `lastmod` is the time of the request.
- /pattern-coach is missing (verified).
- `NEXT_PUBLIC_SITE_URL` must be set to the real domain before launch.

**M5. No validation messages on blur**
- Forms affected: the home lead magnet, quiz gates, checkout, contact, masterclass and the portal forms. Messages only appear on submit.
- The phone field accepts letters.
- /masterclass renders its form twice with the same ids (`#masterclass-email`).
- Fix: use `useId`.

**M6. Portal**
- On the login, signup and forgot-password pages the hidden site header and footer can still be reached with Tab (about 80 links). Use `inert`.
- /portal/reset-password silently redirects to the login page when the link has expired.
- The Sign up and Forgot links drop the `?redirect=` parameter.
- The magic-link `next` value is not URL-encoded. The same issue appears in the email link builder.
- "Log In" and "Sign In" are used for the same action.

**M7. Header**
- "Work With Me" is never highlighted as the active section, because `isActivePath` compares hrefs with the `#` still attached (`DesktopNav.tsx`).

**M8. Hero media and tap targets**
- The hero toggle dots are 10px, too small to tap.
- The second hero video is 853x480 stretched full width.
- The /services hero video is 25.6 MB with no mobile version.
- Footer links are 20px high.

**M9. Quiz gate**
- There is no link back to the topic.
- "Get a New Link" keeps the bad `?token=` in the URL.
- Dismissing the announcement bar is not remembered on reload.

**M10. Cookies**
- There is no way to change cookie consent once given.
- The Microsoft opt-out on /legal/cookies is plain text, not a link.

**M11. Shop and product details**
- "Payment plans available: contact us" is not a link (`VariantSelector.tsx:209`).
- The breadcrumb is cut off at 200px.
- /shop bottom Cal link uses the raw IP over HTTP (see B17).

**M12. Headings and titles**
- /checkout has no h1.
- The 404 page title is just "Dr. Suzanne Ravenall".

**M13. Elements that look clickable but are not, or links that are missing**
- On desktop /explore, clicking a topic title only changes the preview. Only Enter opens the topic.
- /about has no links to its 3 sub-pages.
- /about/the-system cards are not clickable.
- /services programme names and group cards are not links.
- Award and press cards on /resources have hover effects but no links.
- The Rapid Repatterning card on /about uses an "external link" arrow for an internal page.
- /services Speaking has no link to /speaking.

**M14. Email links**
- The invoice link expires after 7 days.
- `NEXT_PUBLIC_SITE_URL ??` falls back badly when the value is empty (use `||`).
- "Contact us" is hard-coded to suzanneravenall.com/contact.

**M15. Dead code and upgrade paths**
- The unused `ArticlesContent.tsx` links to a 404.
- "Unlock with Silver" goes to `/shop?collection=membership`, while `requireAccess` sends people to `/portal/upgrade`.

**M16. /search has no search box of its own**

**M17. Smaller layout and network points**
- The home Areas panel's Explore link sits below the fold and auto-rotates.
- Next `Link` prefetches the Cal URL on /contact. Use `prefetch={false}`.

## 3. What was not checked, and why

- **Submitting anything** (contact, lead magnet, masterclass, community, newsletter, quiz gate, checkout contact step, vouchers, PayFast/PayPal, Cal bookings, unsubscribe confirm): the rules forbid submitting forms, orders or bookings. The voucher, payment-choice and "Check your inbox" screens were reviewed in the code only.
- **Logged-in portal and members pages** (`/portal/*` and gated `/resources/*`): logging in is not allowed, so they were checked through the code and the login redirect only.
- **Real quiz-token and unsubscribe-token flows, and the quiz questions and results:** these need real emailed tokens.
- **Emails actually being sent and rendered:** their links were checked from the source code plus curl on the destinations. Server environment values were not read (secrets).
- **Blog post pages:** no posts are published.
- **Real devices:** no iOS Safari, real touch or 1440+ testing; everything ran in headless Chromium. The widths tested were 1280 and 375, plus spot checks at 320 and 768.
- **The services agent and the shop-products-3 agent could not get a browser running.** Their sections were checked with curl and code reading. shop-products-3 tested Add to Cart through the API, which left about 64 abandoned carts in Medusa. cart-checkout also left a test cart (`cart_01M46818VE59874MFEQ0ET5574`, no email given).
- **YouTube playback, Cal embed behaviour, and the rate-limit and error screens:** only confirmed that they load (status 200 / iframe present).
- **Whether accreditation logos match their alt text, and whether claims and stats are accurate:** these need the client to confirm.

## 4. Who owns what

### Ours to fix (code, config, data cleanup)
- **Broken:** B1-B17, all of them.
- **Wrong destination:** W1, W2, W3, W5, W6 (deciding which resources are public needs a quick yes from Suzanne), W8.
- **W4:** /contact preselection and context.
- **Content:**
  - C1 (product template).
  - C3 (badges, labels, filters, currency display).
  - C4 (spelling and naming in code, em dashes).
  - C9 (duplicate headings, images, privacy line).
  - C14 (image, Young People CTA).
  - C17 (Zoom link on the Cal page).
  - C18 (source tags).
  - C19 (cart wording).
  - C21 (search coverage).
  - The C2 cleanup itself (unpublishing and recategorising legacy products) once Suzanne confirms the canonical list and prices.
- **Visual:** V1-V12, all of them.
- **Minor:** M1-M17, all of them.
- **Go-live config:** a real Sentry DSN, the GA ID, Clarity, the HTTPS Cal domain, `NEXT_PUBLIC_SITE_URL`, and the duplicate header.

### Needs Suzanne's team (content decisions)
- **Catalogue (C2, C3, C8):**
  - Which of the 107 products are real.
  - The correct ZAR and USD prices, including the inversions and the meditation, mindfulness and energy clearing mismatches.
  - Whether Programs 1-9, Meditation, Mindfulness, Energy Clearing and Akashic are currently live or self-study.
  - Whether the 5 recorded group series are for sale.
  - The Program 7/8 numbering.
- **Booking:**
  - Confirm the discovery call is 30 minutes.
  - Whether "Book a <named> Session" should stay pointed at Rapid Repatterning (W7).
  - A paid-session Cal event for order emails (W8).
  - Whether the Group Transformation Session is complimentary.
- **Copy and assets:**
  - Executive Coaching session text.
  - Delivery format, length and price per session.
  - Programme-specific outcomes and bio (C8).
  - Speaking logos, testimonials, keynote reel and speaking kit PDF (C10, B16).
  - The real book excerpt, trilogy titles, release dates and pre-order status (C13).
  - The Chapter 1 asset to send (C5).
  - The masterclass date and format.
- **Claims to confirm (C23, C5):**
  - Stats (20+ years, 2,000+ clients, 30+ awards and countries, "12 spots left").
  - HPR copy and FAQ answers.
  - Accreditations.
  - The 30-day membership grace period.
- **Legal and contact (C15, C16):**
  - Which legal entity is correct.
  - The refund and liability policy (Disclaimer vs Terms).
  - Which mailboxes are real (sravenall@, hello@, privacy@, admin@ravenallinstitute, support@ravenallinstitute).
  - A phone number.
  - The "not medical doctors" wording.
  - The processors in use (Cal.com, Discourse, Sage).
- **Policy and content choices:**
  - Should press and awards be public, or members-only (W6)?
  - Should the empty blog stay linked (C11)?
  - Should there be a footer newsletter? (suggestion only)
  - Should the Coach widget stay visible on every page (B7 needs a design call)?
- **Spelling:** "Programmes" or "Programs" site-wide, and "Precision Sessions" or "Private Sessions".

Raw agent scripts and screenshots are under `C:\Users\DELL\AppData\Local\Temp\claude\C--Johan-Brain\886334ee-9342-43b6-ba61-8849430ed28b\scratchpad\sitecheck\`.