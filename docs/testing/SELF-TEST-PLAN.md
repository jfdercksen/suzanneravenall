# Self-test plan before handover

Internal. Written 21 Sep 2026 for the 29 Sep handover. Suzanne's team (Shayna and Cassidy) starts testing on Wed 30 Sep; they are a double check only. Everything on this page is done and passed by us first.

Review site: http://169.239.180.49 (branch `feature/design-standard`). Nothing here goes to the client; Johan sends the progress reports.

## What Suzanne asked for (18 Sep)

| # | Her test | Our coverage target |
|---|---|---|
| T1 | Every product purchase using a voucher | Every purchasable variant (178 ZAR variants across 98 published products), one order each, 100% voucher, through the real checkout endpoints |
| T2 | Each product lands in Thinkific | Every variant whose product carries `thinkific_course_id` (56 products) enrols the buyer in that course within 60 seconds of the order; every variant without one is confirmed as "no course by design" |
| T3 | Every email notification per product: design, content, flow | Every mail each order triggers is received in an inbox we control, opened on phone and desktop, screenshotted, and checked against a per-product expected list |
| T4 | Every link on every page lands in the right place | Automated crawl of every page (status, redirect target, anchors, wrong destination) plus a manual phone and desktop read |
| T5 | Content errors | Automated text scan (placeholders, NaN, undefined, lorem, TODO, duplicate titles) plus the manual read from T4 |

## Blockers, in the order they must fall

These are checked, not assumed. Each has an owner. Until B1 to B3 are cleared, the full run cannot pass.

| ID | Blocker | Evidence (21 Sep) | Fix | Owner |
|---|---|---|---|---|
| B1 | The checkout has no voucher field and no way to place a free order. T1 cannot be done from the site at all. | `components/checkout/CheckoutContent.tsx` only offers PayFast and PayPal; no call to `/store/carts/:id/promotions` anywhere in `apps/web`; the Medusa DB has 0 promotions | Add a voucher input to the checkout (applies `promo_codes` to the cart), and when the cart total is 0 show "Place order" that completes the cart without a gateway. Medusa 2.14 already completes a zero-total cart with no payment session (`validateCartPaymentsStep`, `canSkipPayment`). Create the QA voucher (100%, order level) via the admin API. Filed as KI040 | Build (this repo) |
| B2 | Thinkific is not wired on the VPS. No order enrols anyone. | VPS `infra/.env`: `THINKIFIC_API_KEY` empty, `N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL` empty; the n8n workflow "Medusa Order → Thinkific Enrollment" is not imported (12 workflows listed, this one absent). The subscriber skips the call when the URL is empty | The token exists locally (`infra/.env`, a Thinkific API access token, scope write:all, valid to 17 Jun 2027, subdomain ravenallinstitute-9629, tested 200 on 21 Sep). Steps: (1) token into Vaultwarden, name only into the API catalog; (2) VPS `infra/.env`: `THINKIFIC_API_KEY`, `N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL=http://n8n:5678/webhook/medusa-order-complete`; (3) import and activate the workflow (`docker compose exec n8n n8n import:workflow --input=/workflows/medusa-thinkific-enrollment.json`, then activate); (4) `docker compose up -d medusa n8n`. Filed as KI041 | Johan approves the VPS write, then build applies |
| B3 | No email can leave the platform. T3 fails for every product. | Resend domain unverified (KI035); GoTrue SMTP host empty (KI039); the n8n Thinkific and Vtiger workflows also send through Resend | Brevo: DNS records at host-h (Johan, never DMARC or SPF), Brevo SMTP key into Vaultwarden (Johan), then the app and GoTrue switch to Brevo SMTP. DNS propagation is the long pole; start now | Johan |
| B4 | 15 add-on products (KI006) do not exist on the VPS yet, so they cannot be tested | Migration fixed in code 11 Aug, never run on the box | Run the migration on the VPS (dry run, then live), re-run descriptions and images scripts | Johan approves, build runs |
| B5 | Every test order writes to Suzanne's live Thinkific and to our Vtiger (workflow "Medusa Order → Vtiger Contact Update" is active) | n8n list on the VPS | One named test buyer, one cleanup step, Johan approves per item before anything is removed (see Side effects) | Johan approves before the full run |

Checked and NOT a blocker:

- Sage being off (KI010) does not stop the confirmation email. In `order-placed.ts` the invoice step calls the Next route `/api/invoices/generate`, and the confirmation email fires whether or not that returned OK (it just gets `invoiceUrl: null`). Sage is a separate fire-and-forget n8n call. The active Sage workflow will error on every order and try to email an alert through Resend, which also fails; harmless, but noisy in the n8n execution log.
- PayFast and PayPal are both in sandbox on the VPS. Voucher orders never touch a gateway, so this only matters for the two paid smoke tests below.

## Test matrix

### T1 Voucher purchase, every variant

Tool: `node infra/scripts/qa/purchase-harness.mjs` (see Commands). It uses the same store endpoints the checkout uses: create cart in the ZAR region, add the variant, set the buyer email and name, apply the voucher, assert the total is 0, complete the cart, record the order.

Pass criteria per variant:

1. Cart total after voucher is exactly 0 and the discount total equals the variant price.
2. `POST /store/carts/:id/complete` returns `type: order` with a display id.
3. The order is visible in Medusa admin with the buyer email, one line item, total 0.
4. In the UI (once B1 lands): one manual purchase per product family (self-paced, live, group, private session, book, membership, add-on) through the browser at 375px and 1280px, screenshots kept.

Coverage: all 178 ZAR variants, plus the KI006 additions once B4 is done. A run takes about 10 minutes at 3 orders in flight.

Paid smoke (not vouchers, two orders only): one PayFast sandbox card purchase and one PayPal sandbox purchase, to prove the gateway return and the ITN path still complete the cart. Not part of Suzanne's list, but it is the path her real customers use.

### T2 Thinkific enrolment

Pass criteria per variant:

1. Product has `thinkific_course_id` in metadata: within 60 seconds of the order, `GET /api/public/v1/enrollments?query[email]=<buyer>` on Thinkific shows an enrolment for that course id. The harness polls and records `enrolled` or `missing`.
2. Product has no course id: recorded as `no-course`. That list goes to Johan to confirm with Suzanne that none of them should have one (42 products today).
3. Multi-item order: one order with three course products enrols all three (the n8n workflow enrols per item, isolated failures).
4. Existing Thinkific user: a second order for the same buyer reuses the user (no duplicate account).

### T3 Emails

Inbox: one address we control, `QA_BUYER_EMAIL`. Proposal: a Gmail address with plus-addressing so every mail lands in one inbox we can read from the session (the Gmail connector is available here); the per-order subject carries the order number. Johan to confirm the address before the run.

Expected mails per order (the harness writes this list per row):

| Trigger | Mail | Sender | When |
|---|---|---|---|
| Every order | Order confirmation, with invoice link when the PDF generated | Next `/api/email/order-confirmation` via Resend (Brevo after B3) | Right after order.placed |
| Course product | Enrolment confirmation | n8n Thinkific workflow via Resend | After enrolment |
| Course product, first time | Thinkific's own welcome and course access mail | Thinkific | On user creation |
| Membership product | Membership welcome | Next `/api/email/membership-welcome` | After activation |
| Private session | Confirmation includes the Cal.com booking link | same order confirmation | |

Pass criteria: every expected mail arrives within 5 minutes; opens without broken images on phone and desktop; product name, price (R0,00 with the voucher shown), order number and buyer name are right; every link in the mail lands on the review site, not the old WordPress site; footer has the physical address and a working unsubscribe where required (KI032); no VAT wording (KI033). Screenshot every distinct template once, and every product-specific variation.

### T4 Links

Tool: `node infra/scripts/qa/link-crawl.mjs` (see Commands). Starts from `/` and `/sitemap.xml`, follows every internal link, checks every link on every page.

Pass criteria:

1. No internal link answers 404 or 500, and none redirects to `/`.
2. No link points at `https://suzanneravenall.com/...` (that is still the OLD WordPress site until DNS cutover; on the review box such links leave the new site). Exception: none.
3. No `href="#"`, empty href, or `javascript:` links.
4. Every in-page anchor (`#section`) exists on the target page.
5. Every external link answers 2xx or 3xx.
6. Link text and destination agree for the known pages (Contact goes to `/contact`, Shop to `/shop`, and so on; the crawler carries the map).
7. Manual: every page read on a phone (375px) and a desktop (1280px), clicking every button and menu item, including the header, footer, mobile menu, cookie bar and the Pattern Coach tab. One row per page in the results sheet.

### T5 Content errors

Automated (same crawl): any page text containing `lorem`, `TODO`, `undefined`, `NaN`, `[object Object]`, `{{`, `R0,00` outside the voucher checkout, a missing `<title>`, or a duplicate `<title>` across pages, is a row.

Manual: read every page for typos, wrong names, wrong prices against the WooCommerce export, wrong dates on events, broken images, and text baked into images (KI037 is one). Product pages: title, price, variant names, description, image, category, "what you get" against the seed data.

## Order of work

1. Blockers first (today and 22 Sep): B1 code, B2 VPS wiring proposal to Johan, B3 chased with Johan, B4 proposal.
2. Link crawl and content scan now; they do not depend on the blockers. Fix what they find.
3. Dry run of the harness against every variant (cart, voucher, total 0, no completion): proves B1's backend half and the catalogue.
4. After Johan approves the side effects: full run of T1 and T2 for every variant. Fix, re-run only the failed rows (`--handle`), then one clean full run.
5. After B3: full run again for T3, this time reading the inbox. Screenshot every template.
6. Manual phone and desktop read of every page (T4 point 7, T5 manual).
7. Cleanup, item by item, with Johan's ok.
8. Final green run on 28 Sep; the results sheet is the evidence.

## Side effects and cleanup

One test buyer only, named so nothing can be mistaken for a real customer: first name `QA`, last name `SelfTest`, email from `QA_BUYER_EMAIL`. Every order, Thinkific user, Vtiger contact and activity carries that identity.

Per full run the platform creates: 178 Medusa orders and one guest customer; one Thinkific user with up to 56 enrolments; one Vtiger contact with 178 activities; 178 failed Sage executions in n8n.

Cleanup (`--cleanup-plan` prints it, nothing runs without `--cleanup --yes`, and Johan approves the list first):

| What | How | Approval |
|---|---|---|
| Medusa orders | `POST /admin/orders/:id/cancel` for each order in the run file; the guest customer stays unless Johan wants it removed | Johan, per run |
| Thinkific enrolments and the test user | `DELETE /api/public/v1/enrollments/:id`, then `DELETE /users/:id` | Johan, per run (this is Suzanne's live Thinkific) |
| Vtiger contact and activities | Listed by the harness; removed by hand or by the EA `/crm` skill | Johan, per item |
| The QA voucher | `DELETE /admin/promotions/:id` after the final run so it cannot be used by anyone else | Johan |

## Results sheet

`docs/testing/results/` holds one CSV per run, the same columns Suzanne asked Shayna for:

`page_or_product, test, problem, screenshot, link, status, found_on, fixed_in`

The harness and the crawler write their rows; manual findings are added by hand. `status` is one of `pass`, `fail`, `blocked`, `fixed`.

## Commands

All from the repo root. Config comes from `infra/.env` (gitignored) or the shell; nothing is written into the scripts.

```bash
node infra/scripts/qa/link-crawl.mjs --base=http://169.239.180.49
```

```bash
node infra/scripts/qa/purchase-harness.mjs --list
```

```bash
node infra/scripts/qa/purchase-harness.mjs --dry-run --ensure-promo
```

```bash
node infra/scripts/qa/purchase-harness.mjs --run --verify --limit=3
```

```bash
node infra/scripts/qa/purchase-harness.mjs --cleanup-plan --from=docs/testing/results/purchase-<date>.json
```

Env the harness reads: `NEXT_PUBLIC_MEDUSA_URL` (default `http://169.239.180.49/api`), `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `MEDUSA_ADMIN_EMAIL` and `MEDUSA_ADMIN_PASSWORD` (or `MEDUSA_API_TOKEN`), `QA_BUYER_EMAIL`, `QA_PROMO_CODE` (default `QA-SELFTEST-100`), `THINKIFIC_API_KEY` (for the enrolment check only).
