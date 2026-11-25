# A14 - Go-live acceptance matrix: https://suzanneravenall.com

Walked on **https://suzanneravenall.com** after the DNS switch (A9 step F14), by Johan with us driving the checks. Same rules as `docs/testing/ACCEPTANCE.md`: one section at a time; every row gets PASS, FAIL (KI number), N/A or BLOCKED (owner); a section is DONE only when no row is empty; a FAIL is fixed and re-walked before the next section.

**Persona:** Johan QA Test, `johan@aiautomations.co.za`, with a fresh plus-address per row that creates a record (`johan+gl-<row id>@aiautomations.co.za`), phone +27 82 000 0000, billing country South Africa (USD rows: a non-South-African connection, see the foreign visitor rig in project memory).

**Live site rules (new since ACCEPTANCE.md):**
- This is production. Every record a row creates goes on the A13 clean-up list at the end of the walk, with Johan's yes per item.
- **Real money only with Johan's yes per payment:** one low-value live payment per gateway, refunded the same day. State the product, amount and gateway before paying.
- No test mail to Suzanne's or the team's mailboxes except the rows whose purpose is the team mail (E-01, F-01, H-01), announced to the team beforehand.
- The 100% vouchers are gone (A13 C1). Rows marked **[code]** need either a real payment or a single-use walk code (for example `GOLIVE-WALK-100`, usage limit 3, deleted after the walk): Johan decides before section G (decision D1).

**Evidence:** screenshots and mail headers under `docs/testing/results/golive-2026-11-27/`, named by row id.

## Sections

| # | Section | Type | Rows | Status |
|---|---|---|---|---|
| T | Transport: https, redirects, DNS, mail records | READ | T-01..T-09 | |
| N | Home, navigation, search, programme page | READ | N-01..N-06 | |
| R | Old WordPress URLs, sitemap, robots | READ | R-01..R-12 | |
| L | Legal, cookies, newsletter | READ + MAIL | L-01..L-06 | |
| G | Shop, cart, checkout, payments, order mail, invoice | WRITE (money) | G-01..G-08 | |
| H | Fulfilment: Thinkific, sessions, intake, Cal.com | WRITE | H-01..H-05 | |
| E | Contact form, quiz diagnostic | MAIL | E-01, F-01 | |
| P | Portal: sign-up, login, reset, upgrade, Novice | WRITE + MAIL | P-01..P-09 | |
| S | Staff pages, CMS and Medusa admin | READ | S-01..S-05 | |
| M | Mail deliverability | MAIL | M-01..M-03 | |

## Items

### T - Transport (READ)

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| T-01 | DNS points at the new box | Run the propagation loop in A9 section 1 | apex and www are 169.239.180.49 on the four Xneelo servers, 8.8.8.8, 1.1.1.1, 9.9.9.9; no AAAA | | |
| T-02 | Mail records untouched | `Resolve-DnsName` MX, TXT, `_dmarc` TXT, `brevo1._domainkey` and `brevo2._domainkey` CNAME, `autodiscover` CNAME against 8.8.8.8 | identical to the A9 section 1 table | | |
| T-03 | Certificate | Open https://suzanneravenall.com in Chrome, padlock, certificate; or the openssl line in A9 section 7 | Let's Encrypt, names suzanneravenall.com and www.suzanneravenall.com, valid about 90 days, no warning | | |
| T-04 | http to https | `curl -sI http://suzanneravenall.com/about` | 301, `Location: https://suzanneravenall.com/about` | | |
| T-05 | www to apex (https) | `curl -sI https://www.suzanneravenall.com/shop` | 301, `Location: https://suzanneravenall.com/shop` | | |
| T-06 | www to apex (http) | `curl -sI http://www.suzanneravenall.com/shop` | 301 to https apex (one or two hops), never a page on www | | |
| T-07 | Old IP links | `curl -sI http://169.239.180.49/shop` | 301 to `https://suzanneravenall.com/shop` | | |
| T-08 | Security headers | `curl -sI https://suzanneravenall.com/` | `Strict-Transport-Security: max-age=31536000` (no includeSubDomains), X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, Referrer-Policy | | |
| T-09 | No mixed content | Chrome DevTools console on /, /shop, a product page, /contact, /portal/login | no "Mixed Content" warnings; no request to `http://169.239.180.49` in the Network tab (except Cal.com if A9 G3 option b) | | |

### N - Home, navigation, search, a programme page (READ)

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| N-01 | Home page | Open / at 1280x800 and at 375x812 | hero video or picture loads, no layout break, no console errors, page title correct | | |
| N-02 | Header menu | Open every top-level menu and one link in each | every link opens a page that is not a 404 (23 header links, D-01) | | |
| N-03 | Footer | Click every footer link once | no 404; social links open in a new tab | | |
| N-04 | Phone menu | 375x812, tap the menu button, tap Shop | menu lists every item, opens /shop, closes; no sideways scroll | | |
| N-05 | Search | Ctrl+K, type "repatterning", press Enter | live results while typing; /search?q=repatterning lists programmes; a result opens the right page (reindex A9 F8 done) | | |
| N-06 | Programme page | Open /programs, then one programme (for example Rapid Repatterning Program 1) | price in ZAR from South Africa, description, Add to Cart; access wording says 12 months (readiness item 8 fixed) | | |

### R - Old WordPress URLs, sitemap, robots (READ)

Ten redirects from `apps/web/data/wordpress-redirects.json` (every one is a 308 from Next.js `permanent: true`), plus sitemap and robots. Check with `curl -sI "https://suzanneravenall.com<source>"` and then open the destination.

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| R-01 | Old blog URL | `/achieving-work-life-balance-2` | 308 to `/blog/achieving-work-life-balance-2`, page loads | | |
| R-02 | Old newsletter URL (emoji, lower-case escape) | `/april-newsletter%e2%9c%a8not-all-healing-heals` | 308 to `/blog/april-newsletter-not-all-healing-heals` | | |
| R-03 | Old newsletter URL (upper-case escape) | `/august-newsletter%E2%9C%A8effortless-flow%E2%9C%A8from-control-to-co-creation` | 308 to `/blog/august-newsletter-effortless-flow-from-control-to-co-creation` | | |
| R-04 | Old newsletter URL | `/december-newsletter%e2%9c%a8a-quiet-threshold%e2%9c%a8connection-begins-inside` | 308 to `/blog/december-newsletter-a-quiet-threshold-connection-begins-inside` | | |
| R-05 | Old newsletter URL | `/february-newsletter%e2%9c%a8own-your-happiness%e2%9c%a8joy-isnt-rented-its-owned` | 308 to `/blog/february-newsletter-own-your-happiness-joy-isnt-rented-its-owned` | | |
| R-06 | Old newsletter URL | `/july-newsletter%E2%9C%A8riding-the-waves%E2%9C%A8finding-calm-and-clarity-in-the-chaos` | 308 to `/blog/july-newsletter-riding-the-waves-finding-calm-and-clarity-in-the-chaos` | | |
| R-07 | Old newsletter URL | `/june-newsletter%e2%9c%a8navigating-the-threshold-between-striving-and-surrender` | 308 to `/blog/june-newsletter-navigating-the-threshold-between-striving-and-surrender` | | |
| R-08 | Old newsletter URL | `/march-newsletter%e2%9c%a8conscious-choice-%e2%9c%a8attention-shapes-experience` | 308 to `/blog/march-newsletter-conscious-choice-attention-shapes-experience` | | |
| R-09 | Old newsletter URL | `/may-newsletter%E2%9C%A8a-message-from-your-future-self` | 308 to `/blog/may-newsletter-a-message-from-your-future-self` | | |
| R-10 | Old newsletter URL (other emoji) | `/november-newsletter-%f0%9f%8c%9fembracing-the-power-within` | 308 to `/blog/november-newsletter-embracing-the-power-within` | | |
| R-11 | Sitemap | `curl -s https://suzanneravenall.com/sitemap.xml \| head -20`; open 3 random `loc` entries | every `loc` starts with `https://suzanneravenall.com`; the 3 open | | |
| R-12 | robots.txt | `curl -s https://suzanneravenall.com/robots.txt` | Allow /, Disallow /portal/, /api/, /admin/; `Sitemap: https://suzanneravenall.com/sitemap.xml` | | |

Also worth one look (rules in `next.config.mjs`, not in the JSON): `/privacy-policy` to `/legal/privacy`, `/terms-and-conditions` to `/legal/terms`, `/product/<any>` to `/shop`, `/wp-admin` to `/cms/admin`.

### L - Legal, cookies, newsletter (READ + MAIL)

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| L-01 | Legal pages | Open /legal/privacy, /legal/terms, /legal/disclaimer, /legal/cookies | each loads; Privacy shows the PO Box only (readiness item 4); Terms carries the recording licence and live-programme rules (items 2, 13); Disclaimer's 7-day line agrees with Terms | | |
| L-02 | Checkout terms tick | Cart with any item, checkout, try to continue without the tick, then tick | blocked without the tick; the link opens /legal/terms in a new tab; continues with it | | |
| L-03 | Cookie consent, first visit | Private window, open / | consent bar shows; no Clarity request before consent (Network tab); GA in its consent-denied mode | | |
| L-04 | Cookie consent, choice kept | Decline non-essential, reload, open /shop | bar does not return; Clarity still not loaded; footer "Cookie settings" reopens it | | |
| L-05 | Newsletter sign-up | Footer (or /resources) newsletter form with `johan+gl-l05@` | thank-you message; welcome mail "Welcome to the Monthly Insights Newsletter" arrives with https links; a `leads` row with source newsletter | | |
| L-06 | Unsubscribe | Unsubscribe link in the L-05 mail | /unsubscribe confirms; an `email_unsubscribes` row | | |

### G - Shop, cart, checkout, payments, order mail, invoice (WRITE, real money)

Decisions before this section: **D1** walk code or real payments for the [code] rows; **D2** which low-value product for G-03 and G-04 (the cheapest ZAR product, and one with a USD price). Payments need A9 gate G1 (live credentials, sandbox off).

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| G-01 | Product to cart | /shop, open a product, Add to Cart, open the cart | item and ZAR price in the cart; quantity change and remove work | | |
| G-02 | Checkout form | Checkout with first name, last name, `johan+gl-g02@`, phone, South Africa | PayFast offered for ZAR; terms tick required (L-02) | | |
| G-03 | **Live PayFast, ZAR** (Johan's yes: product, amount) | Pay the D2 ZAR product with Johan's card through PayFast | PayFast live page (no "sandbox"); back on /checkout/confirmation; Medusa order paid; ITN logged by `/api/webhooks/payfast` (web log) | | |
| G-04 | **Live PayPal, USD** (Johan's yes: product, amount) | From a non-South-African connection, the D2 USD product, checkout, PayPal | prices in $, PayPal only; PayPal live login; back on the confirmation page; Medusa order paid; custom_id matches the cart (no-bad-patterns) | | |
| G-05 | Order confirmation mail | Inbox of the G-03 and G-04 addresses | one confirmation each, sender `hello@suzanneravenall.com`, every link https://suzanneravenall.com | | |
| G-06 | Invoice | Invoice link or PDF from G-05 | PDF opens, order number, amount, company details, no VAT line (KI033) | | |
| G-07 | **Refunds** (Johan's yes per refund: amount and gateway) | Medusa admin, orders G-03 and G-04, Refund the full amount | Medusa shows refunded only if the gateway accepted (KI on refundPayment); PayFast or PayPal dashboard shows the refund; if the PayFast provider cannot refund, refund in the PayFast merchant dashboard and record it here | | |
| G-08 | Sage | n/a until credentials (KI010) | BLOCKED (Suzanne/bookkeeper) is the expected result today | | |

### H - Fulfilment (WRITE)

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| H-01 | Thinkific, **live** variant [code] | Buy one programme's "Live via Zoom" variant as `johan+gl-h01@` | course access mail; Thinkific shows an enrolment in the LIVE course id for that programme (readiness section 1 table); remove the enrolment after (A13 list) | | |
| H-02 | Thinkific, **self-study** variant [code] | Buy the self-study variant of a programme as `johan+gl-h02@` | enrolment in the self-study course; access wording 12 months | | |
| H-03 | Session purchase and intake form [code] | Buy a private session (30 or 60 min) as `johan+gl-h03@` | confirmation page shows Book Your Session (Cal.com link by length, KI079); intake mail with a personal /intake/<token> link | | |
| H-04 | Intake form | Open the H-03 intake link, fill it, send | thank-you page; the team mail (INTAKE_NOTIFY_EMAIL, A9 G2) lists the answers (D025); the page has no referrer to outside sites | | |
| H-05 | Cal.com booking | From H-03, book a slot | Cal.com page over https (A9 G3 a) or the http link (G3 b, noted); host and attendee mails; `session_bookings` row via `/api/webhooks/calcom`; cancel it in Cal.com (not in the database) and see the row turn cancelled | | |

### E and F - Contact form, quiz diagnostic (MAIL)

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| E-01 | Contact form | /contact, name, `johan+gl-e01@`, phone, enquiry type, message "Go-live test, please ignore" | success message; team mail at CONTACT_NOTIFY_EMAIL (the inbox Suzanne named); acknowledgement to the sender; a `leads` row | | |
| F-01 | Quiz diagnostic | /discover-your-pattern, one quiz, gate with `johan+gl-f01@`, answer all, see the result | invite mail "<quiz> - your diagnostic is ready" with an https link; result page; team mail at QUIZ_NOTIFY_EMAIL lists the answers (D025) | | |

### P - Portal (WRITE + MAIL)

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| P-01 | Sign-up | /portal/signup with `johan+gl-p01@` and a test password | "check your email" screen; no immediate login (autoconfirm is off) | | |
| P-02 | Confirmation link | Open the P-01 confirmation mail | branded template (served from https://suzanneravenall.com/email-templates, A9 F6); the link goes through suzanne.db.aimate.co.za and lands on https://suzanneravenall.com/portal/callback, then the dashboard | | |
| P-03 | Login with password | Log out, /portal/login, email and password | dashboard; one free (Guest) membership row only (KI137 fix) | | |
| P-04 | Magic link | /portal/login, Magic Link tab, `johan+gl-p01@` | mail "Your login link" arrives; link logs in on https | | |
| P-05 | Password reset | /portal/forgot-password, then the "Reset your password" mail | link opens /portal/reset-password over https; new password works on the next login | | |
| P-06 | Second sign-in does not add rows | Log out and in again | still one free row (`member_subscriptions` read-back) | | |
| P-07 | Membership upgrade page | /portal/upgrade | shows only the levels on sale (Lifestyle, Student, Novice) or the "not yet" state if MEMBERSHIPS_ENABLED is false; no Silver/Gold or Premier claims (KI140); a Buy button adds the right SKU to the cart | | |
| P-08 | Novice upload [code] | Buy a Novice level as `johan+gl-p08@`, then /portal/novice, upload a PDF, send | application status submitted; Novice mail with reply-to support@ravenallinstitute.com (readiness item 12) | | |
| P-09 | Staff approves Novice | Staff login, /staff/novice, open the P-08 application, view the file, Approve | member sees the level active; every view and the decision in `novice_application_events`; the form post is not refused (KI138) | | |

### S - Staff pages and admin (READ)

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| S-01 | CMS admin login | Private window, /cms/admin/login as Johan | dashboard stays after a reload and after opening Users (KI135); styled (KI004) | | |
| S-02 | Staff list | `list-staff-users` with EXPECT_STAFF (A13 C7) | MATCH: exactly sravenall@suzanneravenall.com and support@ravenallinstitute.com | | |
| S-03 | Staff submissions | Suzanne (Staff) opens /staff/submissions/quiz and /staff/submissions/intake, opens the F-01 and H-04 entries | lists and answers shown; each view logged in `staff_submission_views`; an Admin login is refused | | |
| S-04 | Medusa admin | /medusa/app, log in | dashboard, orders list shows G-03 and G-04 | | |
| S-05 | Admin protection (A10) | From a phone on mobile data (outside any allow-list): /medusa/app, /cms/admin | as decided in A10 (403 or a login prompt); N/A if A10 is "later" | | |

### M - Mail deliverability (MAIL)

Open the message source ("View message source" or "Show original") of the received mail and read the `Authentication-Results` header.

| Id | Journey | Steps | Expected | Result | Evidence |
|---|---|---|---|---|---|
| M-01 | Brevo (site mail) | Headers of the G-05 order mail (or E-01 acknowledgement) | `dkim=pass header.d=suzanneravenall.com`; `dmarc=pass`; SPF passes for Brevo's own return-path domain (SPF on suzanneravenall.com lists only Microsoft 365, which is fine: DMARC aligns through DKIM) | | |
| M-02 | Login server mail (Brevo SMTP) | Headers of the P-05 reset mail | same as M-01 | | |
| M-03 | Team mailbox still works | Send a mail from an outside address to the team inbox, and a reply from it | delivered both ways; the reply's headers show `spf=pass` (Microsoft 365) and `dmarc=pass` (no Microsoft 365 DKIM is published, so `dkim=none` from the M365 side is expected) | | |

## After the walk

- Every record created above goes onto A13's record table for clean-up, with Johan's yes per item (orders cancelled by exact id, Thinkific enrolments removed, test portal accounts deleted, quiz and contact leads, Novice application of P-08, the walk code if D1 chose one).
- Copy the results into `docs/testing/ACCEPTANCE.md` Results log as "Go-live walk, 27 Nov 2026".
