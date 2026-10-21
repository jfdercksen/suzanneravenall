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
