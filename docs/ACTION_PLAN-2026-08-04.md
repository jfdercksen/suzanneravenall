# Launch Action Plan - 2026-08-04

Source: project update session 04 Aug 2026. Ordering is by launch risk, not effort.
Owner legend: **Agent** = dispatched Claude agent (local code change, Johan reviews diff) · **Johan** = manual/VPS/infra action · **Suzanne** = client input needed · **Ext** = third party.

## 🔴 Critical - site may not actually be sellable right now

| # | Item | Owner | Status |
|---|------|-------|--------|
| 1 | Sitewide inventory config: explicitly set `manage_inventory: false` on every non-group-session variant. Every variant currently defaults to `manage_inventory: true` with no stock location linked to a sales channel, so `complete-cart` may throw for every product. | Agent → Johan reviews + deploys | Agent dispatched 04 Aug |
| 2 | One real end-to-end checkout test (sandbox PayFast is enough). Never verified working on this build. | Johan (blocked on #5) | Blocked |
| 3 | Run `seed-group-session-inventory.ts` on the VPS - activates the real 12-seat cap, currently code-only. | Johan | Open |
| 4 | Replace 3 fabricated testimonial spots: `TestimonialsSection.tsx` literal TODO card live in prod, `TestimonialSpotlight.tsx` unverified "Sarah M." quote, `ProductPageContent.tsx` x2. | Agent (gate out) → Suzanne (real content) | Agent dispatched 04 Aug |
| 5 | PayFast + PayPal sandbox credentials + test. Blocks payment entirely. | Suzanne → Johan | Chasing |
| 6 | Resend domain verification for suzanneravenall.com. All transactional email silently broken until done. **Deferred to cutover per Johan 04 Aug - no DNS changes until go-live** (only TXT/DKIM records, but client DNS stays frozen). First action on launch day; allow propagation time. | Suzanne/Johan (DNS) | Deferred to cutover |

## 🟠 High - must happen before DNS cutover

| # | Item | Owner |
|---|------|-------|
| 7 | Cloudflare WAF rule restricting `/admin/*` + `/api/admin/*` to office IPs (KI014) | Johan |
| 8 | POPIA: real unsubscribe links (currently `href="#"` across email templates) + physical address in email footer | Agent dispatched 04 Aug |
| 9 | Sage credentials + integration test | Suzanne → Johan |
| 10 | Legal pages `/legal/*` - lawyer review, currently placeholder | Ext (lawyer) |
| 11 | MeiliSearch seed - search returns 503 sitewide (KI020) | Johan (VPS) |
| 12 | Sentry DSNs (KI001) - error tracking currently blind | Johan |
| 13 | Wild Apricot migration decision (KI012) - blocks Task 3.8 either way | Suzanne |
| 14 | VAT registration number on invoice template | Suzanne → Agent wired the field |

## 🟡 Medium - real gaps, not launch-blocking

| # | Item |
|---|------|
| 15 | Shop-grid decision guidance - no "Most Popular"/recommended signal on `/shop` itself |
| 16 | Mobile CTA overlap - cookie banner + Pattern Coach pill covering hero/shop CTAs on small phones (KI027) |
| 17 | WCAG contrast sweep - ~400 remaining `text-brand-accent`-on-dark instances beyond the 14 fixed (KI026) |
| 18 | `/resources/media` article links point at old WordPress site - break after DNS cutover (KI025) |
| 19 | 15 legitimate WooCommerce products never migrated (KI006) |
| 20 | 68 payment-critical `console.error` calls not forwarded to Sentry (KI017) |
| 21 | `/portal/account` first-load JS 310kB, over budget (KI016) |
| 22 | Suzanne's full site review of http://169.239.180.49 - the real definition of done |

## 🟢 Low - polish / can wait

| # | Item |
|---|------|
| 23 | Stray `pattern mapping...png` at repo root - commit properly or delete |
| 24 | Careers Portal tab from old `/contact` page never rebuilt (KI024) |
| 25 | Quiz flow rate limiting gap on `/explore/*/quiz` (KI028) |
| 26 | Blog still placeholder - no real Payload content |
| 27 | YouTube social link - no URL yet |
| 28 | 1-on-1 / practitioner-training availability static, not tied to real Cal.com availability |

## Sequence for this week

1. **Today (agents):** #1 inventory fix, #4 testimonial gating, #8 POPIA sweep - all with local typecheck/tests, no commits; Johan reviews the diff.
2. **Today (Johan):** #3 seed script on VPS, #11 MeiliSearch seed while on the box, #12 Sentry DSNs.
3. **Inputs: Johan already holds most of them (04 Aug)** - #5 PayFast/PayPal creds, #9 Sage creds, #14 VAT number + address go into Vaultwarden/env; testimonials + book excerpt into `apps/web/data/testimonials.ts`. Remaining true Suzanne items: #13 Wild Apricot decision (if hers to make), #22 site review, any testimonial permissions. (No DNS changes until go-live.)
4. **After creds land:** #2 real end-to-end checkout - the single test that proves the shop works. Test emails via Resend's sandbox/test domain since the real domain stays unverified until cutover.
5. **At cutover (launch day, in order):** #6 Resend DNS verification first (propagation lead time), #7 WAF rule, then the A-record switch. #10 legal sign-off must be done before this day. The 🟡 list as capacity allows.
