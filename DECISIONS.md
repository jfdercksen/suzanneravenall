# Architectural Decisions — Suzanne Ravenall Platform

This is the decision log. Every significant architectural choice is recorded here with reasoning. Decisions are immutable once made — if a decision is reversed, add a new entry referencing the original.

---

## D001 — VPS over Vercel

**Decision:** All services on single VPS via Docker Compose. Not Vercel.
**Reason:** Medusa.js requires persistent Node.js process — incompatible with Vercel serverless. Single VPS keeps all services on Docker network, reducing latency.
**Date:** March 2026 | **Decided by:** Johan (Ai Dynamic Advisory)

---

## D002 — Supabase as central data layer

**Decision:** Supabase PostgreSQL is the single database for Next.js and Medusa. Supabase Auth is the single identity source.
**Reason:** One database, one auth, one storage. Medusa v2 supports external PostgreSQL natively.
**Date:** March 2026 | **Decided by:** Johan

---

## D003 — Wild Apricot retired not integrated

**Decision:** Wild Apricot fully replaced. Member data migrated to Supabase.
**Reason:** Client confirmed equivalent functionality acceptable. Building natively gives full ownership and removes ongoing SaaS cost.
**Date:** March 2026 | **Decided by:** Suzanne Ravenall + Johan

---

## D004 — Vtiger for sales pipeline only

**Decision:** Vtiger used exclusively for leads, discovery calls, pipeline stages, client notes. Not for member management.
**Reason:** Vtiger is a CRM not a membership platform. Member management belongs in Supabase/Medusa. Vtiger populated automatically via webhooks.
**Date:** March 2026 | **Decided by:** Johan

---

## D005 — Vibe Marketing replaces all email marketing tools

**Decision:** Ai Dynamic Advisory's proprietary Vibe Marketing platform handles all email marketing. No Mautic, Mailchimp or third-party marketing tools.
**Reason:** Same agency, same stack (Next.js + Supabase + Claude + n8n). Better integration, better control, no additional SaaS cost.
**Date:** March 2026 | **Decided by:** Johan

---

## D006 — Bunny Stream for video not Supabase Storage

**Decision:** Course and training videos hosted on Bunny Stream. Supabase Storage for documents, images and assets only.
**Reason:** Supabase Storage not built for video streaming. Bunny Stream has proper CDN, adaptive bitrate and South Africa-optimised delivery.
**Date:** March 2026 | **Decided by:** Johan

---

## D007 — n8n replaces Zapier

**Decision:** All workflow automation via self-hosted n8n. No Zapier.
**Reason:** Zapier costs per task. n8n is open source, self-hosted on VPS, no per-task pricing. All workflow JSON exports committed to infra/n8n/workflows/.
**Date:** March 2026 | **Decided by:** Johan

---

## D008 — PayFast primary PayPal international

**Decision:** PayFast for South African customers (ZAR). PayPal for international clients.
**Reason:** PayFast is the dominant SA gateway. PayPal required for international clients who cannot use PayFast.
**Date:** March 2026 | **Decided by:** Johan

---

## D009 — Discourse for community forums

**Decision:** Self-hosted Discourse with Supabase SSO integration.
**Reason:** Building custom forum is a rabbit hole. Discourse is open source, mature, self-hosted and supports SSO so members use one login.
**Date:** March 2026 | **Decided by:** Johan

---

## D010 — Three-environment workflow mandatory

**Decision:** Local → staging VPS → production VPS. Suzanne reviews and signs off on staging before anything goes to production.
**Reason:** No surprises on launch day. Suzanne sees exactly what goes live before it does.
**Date:** March 2026 | **Decided by:** Johan

---

## D011 — Next.js over plain React or Flutter for web

**Decision:** Next.js 14 App Router for web platform. Flutter reserved for Phase 2 mobile app.
**Reason:** Next.js IS React with SSR — critical for SEO on coaching content. Flutter Web has poor SEO. Flutter native app reserved for Phase 2.
**Date:** March 2026 | **Decided by:** Johan

---

## D012 — Payload CMS for content management

**Decision:** Payload CMS self-hosted for all content editing.
**Reason:** Suzanne's team needs to edit content without developer involvement. Payload integrates natively with Next.js App Router and connects to the same Supabase PostgreSQL instance.
**Date:** March 2026 | **Decided by:** Johan

---

## D013 — MeiliSearch for product and content search

**Decision:** Self-hosted MeiliSearch for all product, course and content search.
**Reason:** Native Medusa integration. Open source. Fast. Self-hosted on VPS keeps costs minimal.
**Date:** March 2026 | **Decided by:** Johan

---

## D014 — Discourse community deferred to post-launch

**Decision:** Discourse community forum deferred. Placeholder `/community` page in place with email capture for launch notification.
**Reason:** VPS has only 1.6Gi available RAM. Discourse requires a minimum of 2GB — deploying on the current VPS would destabilise all other containers.
**When to revisit:** After VPS upgrade (8GB RAM recommended) or when a dedicated community server is provisioned. SSO implementation plan is documented in IMPLEMENTATION_WORKFLOW.md Task 3.8 — ready to build when hardware allows.
**Alternatives evaluated:** Hosted Discourse ($100/month) ruled out to avoid recurring cost at launch. Supabase-backed custom forum ruled out — scope too large for this phase.
**Date:** May 2026 | **Decided by:** Johan

---

## D020 — Pattern Intelligence™ as governing principle

**Decision:** All future platform builds must answer: "Does this strengthen Pattern Intelligence™?" This is the acceptance criterion for every new feature, page, or integration. Any feature that does not map to one of the seven PI™ frameworks should not be built without explicit client approval.
**Reason:** Received from Suzanne July 2026 — Pattern Intelligence™ is the overarching IP framework governing all of her work, products, and intellectual property. See `docs/strategy/pattern-intelligence-ecosystem.md`.
**Date:** July 2026 | **Decided by:** Suzanne Ravenall

---

## D021 — USD pricing for visitors outside South Africa

**Decision:** Visitors outside South Africa see and pay in USD, as on the current site. Confirmed by the client 21 Oct 2026; Johan's rule: a USD price is never derived from ZAR.

- **Master switch:** `MEDUSA_USD_REGION_ENABLED` (web container). Default `true` since 21 Oct 2026 (`infra/docker-compose.yml`). Set it to `false` and everyone gets ZAR, and any USD cart is moved back to ZAR on the next visit. `NEXT_PUBLIC_MEDUSA_REGION_USD_ID` must also be set; without it the site stays ZAR.
- **Location decides, no choice (Johan, 21 Oct, revised the same day):** South Africa = ZAR, anywhere else = USD, and visitors are not offered a currency toggle (the first build had one in the header, menu and footer; removed). Precedence in `lib/visitor-region.ts`: 1) a geo header if the stack gains one (`CF-IPCountry` at a Cloudflare cutover), 2) the country of the visitor's IP address, looked up on our own server in the DB-IP "IP to Country Lite" database (`lib/geoip.ts`; client IP from nginx's `X-Real-IP`; file `infra/geoip/dbip-country-lite.mmdb`, refreshed monthly by `infra/scripts/geoip/update-dbip.sh`, mounted read-only at `/data/geoip`; CC BY 4.0, credited in the privacy policy; no account or key), 3) only when the location is unknown (no database, a private IP): the `sr_currency` cookie written on the first visit, else `Accept-Language` (ZA region or a South African language = ZAR, else USD), else ZAR. The edge middleware cannot read the database, so it only stores the browser-language guess; server pages and `/api/region` apply the IP rule. A known location cannot be overridden (`POST /api/region` returns the located currency). A visitor can send any header, so `CF-IPCountry` is trusted only with `TRUST_CF_IPCOUNTRY=true`; at a Cloudflare cutover set that AND give nginx `set_real_ip_from <Cloudflare ranges>; real_ip_header CF-Connecting-IP;`, or every visitor would look up as a Cloudflare address.
- **Correction on the client (unknown location only):** a browser on `Africa/Johannesburg` time whose guess was USD is moved to ZAR once.
- **Cart region:** the cart is always in the visitor's region. When a stored cart is in the other region (the visitor moved, or the rule changed) it is re-assigned (`POST /store/carts/:id {region_id}`), which re-prices every line in Medusa. If Medusa refuses (a line has no price in the new region), a new cart is created in the new region, the lines that have a price there are re-added, the voucher is re-applied, and the buyer is told which items could not move. On load, a stored cart whose region no longer matches is re-assigned the same way, not thrown away.
- **Prices:** listing, product, cart, checkout, confirmation, invoice and order mail all follow the cart's (else the visitor's) currency. A variant without a USD price shows "Price on request" to a USD visitor, with a contact link and no Add to Cart. Never a converted figure.
- **Gateway:** follows the cart currency, not the billing country. ZAR cart = PayFast only; USD cart = PayPal only; a cart a voucher takes to zero = "Place order" in either currency. `/api/checkout/payfast` keeps refusing non-ZAR and `/api/checkout/paypal` keeps refusing ZAR as guards.
- **PayPal completion:** after the capture, the web app opens a Medusa payment session on `pp_paypal_paypal` carrying `{cart_id, paypal_order_id, capture_id, amount_cents, currency_code, capture_proof}`, where `capture_proof` is an HMAC of those values keyed with `PAYPAL_CLIENT_SECRET` (only our servers hold it). The provider marks the session captured only for a valid proof at the cart amount, so the order reads as paid (same pattern as PayFast, KI086). The capture route and the `PAYMENT.CAPTURE.COMPLETED` webhook both do this; completion is idempotent.

**Edge cases:** a South African travelling abroad sees USD while abroad (location decides), and a VPN exit country decides the currency; a ZAR cart with items unpriced in USD keeps those items only if the visitor stays in ZAR; a cart-recovery link (`/checkout?cartId=`) opens the cart in its own region and sets the visitor's currency to match, so the buyer pays what the reminder showed; Sage and Vtiger receive the order currency as Medusa stores it.
**Not covered:** the homepage cohort cards and the search results still show the ZAR figure (search indexes `price_zar` only); follow-up.
**Date:** 21 Oct 2026 | **Decided by:** Johan (client confirmation 21 Oct)

---

## D022 - Booking limits per session package: a gate before Cal.com and a flag after

**Decision:** A client can book only as many sessions as they paid for (Package of N = N, a single = 1, times the quantity, summed over all their orders by email; a cancelled booking gives its session back). Enforced in two layers, because the Cal.com on the review box cannot refuse or cancel a booking from code:

- **Gate (before):** the order mail and the confirmation page no longer carry the reusable Cal.com event link. They link to `/book/<token>`, one row per (order, session service) in `public.booking_tokens` (32 random bytes, service role only). The page counts sessions left with the same sums as `/portal/appointments` (`lib/portal/session-credits.ts`) and only then redirects to the Cal.com event of the right length with the buyer filled in and the token as booking metadata (`metadata[bt]`). At zero it says "All sessions in this package are booked" and links to `/portal/appointments` and `/services`. The portal "Book Now" uses the same link.
- **Flag (after):** the Cal.com webhook re-counts after every new or rescheduled session booking. A booking no credit covers (made on the public event page, or two tabs racing the gate) is stored as `over_limit`, uses no credit, the client gets a mail (package fully booked, how to buy more) and staff get an alert with the Cal.com link to cancel it. Credits go in booking order, so the newest booking is the one flagged.
- The session event types stay hidden from the public Cal.com profile (checked 23 Oct: only discovery-call and 15min are listed).

**Why not the Cal.com API:** checked 23 Oct on :3002. `/api/v1/*` answers 404 (the v1 API is a separate app, not in the `calcom/cal.com` image), `/api/v2/*` answers 500 (the image proxies to a v2 service that is not deployed), and no `CALCOM_API_KEY` exists in the env examples. The only cancel endpoint is the web app's internal `/api/cancel`, CSRF-guarded and undocumented; building on it would break on an image update. If a v2 API service is added later, the flag step can cancel the booking itself instead of alerting staff.

**Edge cases:** a booking counts against the address typed at Cal.com (the gate fills in the buyer's; counting it against the link's buyer instead would let anyone holding a link bought under another person's address spend that person's sessions, audit 23 Oct), so a client who types another address with no purchase under it is flagged and staff sort it out; if Medusa cannot be read the gate falls back to the order line alone and the webhook alerts staff instead of flagging; an `over_limit` booking keeps its calendar slot until staff cancel it; a booking of another length than the one bought (a 90 min session on a 30 min credit) uses one credit and is not flagged (Johan, 23 Oct: leave it). Orders placed before the gate keep their old direct link, guarded by the flag only.
**Date:** 23 Oct 2026 | **Decided by:** proposed by the build (no API on the box decides the mechanism), for Johan to confirm; requested by Suzanne 22 Oct

## D023 - Intake form only for first-time clients, any service

**Decision:** Johan, 23 Oct 2026: "the rule is ANY service, not per service: skip the intake mail and its reminders when that email address already has an earlier session order or a completed intake submission." Before an order's intake mail goes, the address (case-insensitive) is checked for (a) an earlier order that was not cancelled and contains any session product, or (b) a completed intake form from any order. Either one: no intake record, no mail, no reminders, and the skip is logged with the reason (order number and reason, never the address).

**How:** Medusa finds (a) when it hands the order to the web app (the order-placed subscriber and the hourly sweep, `findPriorSessionOrder`); the web app also checks its own intake records for (a) and for (b), so the rule holds if the Medusa lookup fails. The hourly reminder run applies the same check to records that already exist and ends their reminders (records made before this rule, such as a second package bought the same day).

**Why:** Shayna received the intake mail again on her second Resonance Repatterning Package of 4 (23 Oct). A returning client has already given the practice this information.

**Edge cases:** a cancelled earlier order does not count; a first-time client's own order re-posted by the hourly sweep still counts as first-time; two orders placed in the same second can both be treated as first-time.
**Date:** 23 Oct 2026 | **Decided by:** Johan

## D024 - Session rules: no-shows, 48 working hours notice, Terms tick box at checkout

**Decision:** Suzanne's three rules (her mail 24 Oct), with Johan's calls of 26 Oct.

- **No-show:** staff mark it where they already work, in Cal.com: Bookings, Past, the booking, the attendee, "Mark as no-show". Cal.com v6.2.0 on the review box has that action and sends `BOOKING_NO_SHOW_UPDATED`, which our webhook was already subscribed to (checked 26 Oct in the Cal.com database: the trigger is in the enum and on our webhook). The booking gets `no_show_at` and keeps the session it used; the portal shows "No-show: this session was missed, so it counts as used". Unmarking in Cal.com clears it. In exceptional cases Shayna reschedules the booking in Cal.com instead, which moves the session and keeps the credit.
- **48 working hours:** a client who cancels or moves a session with less than 48 working hours to go loses it. Applied automatically (Johan): the cancelled booking, or the booking a move left, gets `late_change_at` and keeps using its credit; a late move's new booking uses another session (so a client with none left gets the J-07 over-limit mail and staff cancel it). The client gets our mail "Your session on <date>: less than 48 working hours notice" on top of Cal.com's own mail (Cal.com's text cannot be changed on this image), and staff get an alert with a link to `/staff/booking/<token>` that shows the client and the session and gives the session back with one click (or counts it as used again). Shayna can restore a credit without logging in anywhere; the link is the key (32 random bytes, no index, no referrer, kept out of analytics).
- **Who changed it:** Cal.com takes `cancelledBy` / `rescheduledBy` from the link, so a client can type a staff address there (audit 27 Oct). A late change under a staff address (the Cal.com organiser, or one in `SESSION_STAFF_EMAILS`) is therefore marked, given back at once, the client is not mailed, and staff get an alert "under a staff address" with the link to count it as used if it was not them. A change with no name on it counts as the client's, and Shayna gives it back if it was hers. The rule is not applied to bookings past the package (over_limit), to no-shows, or to non-session events (discovery calls).
- **Switch:** the rule runs only with `AUTOMATION_SESSION_NOTICE=code` (default off), per the automation flag convention, and only logs under `AUTOMATION_DRY_RUN=true`. Proposed: switch it on together with `SESSION_TERMS_LIVE`, so no client is held to a rule the Terms do not yet state.
- **Staff link:** works for 60 days after the change; giving back a late move also frees its new booking if that was flagged over the package because the lost session held the last credit, and counting a session as used again re-counts the package (a booking it had covered is flagged over the package and mailed as in J-07). The cost of catching a typed staff address: Shayna and Suzanne also get an alert for their own late changes.
- **Working hours, PROPOSED for Suzanne to confirm:** Monday to Friday, 08:00 to 17:00 South African time, excluding South African public holidays (the ten fixed days, Good Friday, Family Day, and the Monday after a holiday on a Sunday; one-off declared days go in `SA_EXTRA_PUBLIC_HOLIDAYS`). 48 such hours is five working days and three hours: a Monday 09:00 session must be changed by Friday 15:00 ten days earlier. If Suzanne meant 48 clock hours (two days), it is one function to change (`lib/booking/working-hours.ts`).
- **The time of the change** is the Cal.com delivery's `createdAt`, so a delayed or retried delivery is judged on when the client acted.
- **Terms tick box:** every order. "I have read and accept the Terms and Conditions" (linking `/legal/terms`) is required before Continue to Payment, and the time of the tick is stored on the cart (`terms_accepted_at`), which Medusa copies to the order. Live now.
- **Terms wording:** the section "4A. Sessions: cancellations, rescheduling and no-shows" (`lib/legal/session-terms.ts`) shows only with `SESSION_TERMS_LIVE=true`, read per request, so going live is an env change and a web recreate. Until Suzanne approves it, `/legal/terms?draft=sessions` shows it with a "Draft for approval" banner.

**Not covered (follow-ups):** restoring a credit does not mail the client; the Cal.com mails themselves do not mention the rule; the staff page needs no login (Johan asked for a no-login way for Shayna; the link is the key); a cancel of the old booking that arrives before its reschedule is labelled a late cancel, not a late move (credit sums still right); two no-show deliveries out of order are not ordered by time; the terms tick is checked in the browser only (Medusa does not refuse an order without `terms_accepted_at`); Sentry session replay can still record a token page's URL.
**Date:** 26 Oct 2026 | **Decided by:** Suzanne (rules, 24 Oct), Johan (automatic with Shayna's undo, terms approval first, 26 Oct); working hours definition proposed by the build for Suzanne to confirm
