# USD pricing walk - 2026-10-21 (review site 169.239.180.49, commit 90b3472, D021)

Persona: Johan QA Test, johan+usd1021@aiautomations.co.za. Fresh browser context. navigator.language en-GB, navigator.languages [en-GB, en-US, en].

| id | check | expected | result | evidence |
|---|---|---|---|---|
| U1 | /api/region on a fresh context | usd | PASS (with oddity, see NEW-1) | First call: {currency:"usd", country:null, usdEnabled:true, auto:true}; cookies sr_currency=usd; sr_currency_auto=1 |
| U2 | /shop cards in $ | $ prices, no R | FAIL on first load, PASS after toggle | First /shop load: cards "from R1 660" etc. (rand) although region said usd; on the next load cookie had become sr_currency=zar. After clicking header USD: "from $155", "$195", "$275", 0 rand prices. Prices render ~5-8 s after load. usd-U2.png |
| U3 | PDP shows $20.00, Add to Cart works | $20.00 | PASS | "$20.00" x2, item added. usd-U3.png |
| U4 | /cart in $ | $20.00 | PASS (format note) | Line, subtotal, total "$20.00" (not "US$20.00"). usd-U4.png |
| U5 | Checkout, INTL preselected, step 2 PayPal only | only Pay with PayPal + PayPal text | PASS | country select value INTL; buttons: Edit, Apply, "Pay with PayPal"; text "You will be securely redirected to PayPal..." and "Secured by PayPal". No PayFast. usd-U5.png |
| U6 | Click Pay with PayPal | redirect to sandbox.paypal.com or error text | FAIL (blocker for USD purchase) | No redirect. Page error: "PayPal OAuth failed: 401". POST /api/checkout/paypal => 500, body {"error":"PayPal OAuth failed: 401"}. Console: 500 resource error. usd-U6.png |
| U7 | Love & Relationships, Recorded series in USD | Price on request, Contact Us link, no Add to Cart, no R | PASS | "Price on request", link "Contact Us to Discuss Pricing" -> /contact, no Add to Cart button. usd-U7.png |
| Z1 | Header ZAR toggle | /shop in R; cart R350,00 | PASS | /shop "from R1 660", 0 dollars; cart "Bringing Your Energy Back R350,00" total R350,00. Cart page stuck on "Loading your cart..." for 13+ s on first load, loaded after a reload (see NEW-2). usd-Z1-shop.png, usd-Z1-cart.png |
| Z2 | ZAR checkout step 2 | only Pay with PayFast | PASS | Country preselected South Africa (ZA); buttons Edit, Apply, "Pay with PayFast"; not clicked. usd-Z2.png |
| Z3 | Love & Relationships Recorded series in ZAR | R1 500,00 + Add to Cart | PASS | "R1 500,00", Add to Cart present. usd-Z3.png |
| F1 | Free order ZAR | R0,00, order number | PASS | Voucher QA-SELFTEST-100 applied, total R0,00, Order #415 confirmed. usd-F1.png |
| F2 | Free order USD | $0.00, order number | PASS | Cart held one line at $20.00; voucher -$20.00, total $0.00; Order #416 confirmed (~80 s after #415). usd-F2.png |
| C1 | Cookie after F2 | sr_currency=usd, no sr_currency_auto | PASS | document.cookie = "sr_currency=usd" |
| M1 | 375x812 header | toggle visible/usable | PASS (header hides toggle below 640 as designed) | usd-M1-header.png |
| M2 | 375x812 mobile menu | toggle in menu | PASS with minor layout issue | Toggle at x35 y582, 44x24 px; sits tight under "Contact" with no gap. usd-M2-menu.png |

## Orders created (clean up)
- #415 (ZAR, free, voucher QA-SELFTEST-100)
- #416 (USD, free, voucher QA-SELFTEST-100)

## Findings
- NEW-1 (major): a fresh visitor got cookies sr_currency=usd + sr_currency_auto=1, yet /shop rendered rand prices, and by the next page load the cookie had silently become sr_currency=zar (nobody clicked the toggle). Expected USD for en-GB. Cause not identified; looks like a client-side switch or race between the auto cookie and the default (ZAR) region.
- NEW-2 (minor): /cart sat on "Loading your cart..." for 13+ s after switching to ZAR (cart migrating regions); no network request was made until a reload.
- NEW-3 (minor): prices on /shop and PDPs load 5-8 s after page paint (nothing shown meanwhile).
- NEW-4 (minor): USD cart shows "$20.00" rather than "US$20.00"; a South African visitor cannot tell this from other dollar currencies. Cart footer still says "PayFast (South Africa) or PayPal (international)" - fine.
- NEW-5 (minor): no currency toggle in the checkout header (header there has no toggle at 1280 either).
- NEW-6 (minor): hero-shop.mp4 ERR_CONTENT_LENGTH_MISMATCH console error on /shop (once).

## Controller notes (21 Oct, after the walk)
- NEW-1 is the D021 time-zone correction working as designed: the walker's browser runs on this PC's clock (Africa/Johannesburg), so the en-GB guess (USD) was moved to ZAR once, before any choice was made. Re-proved case (a) in a Playwright context with locale en-US and time zone America/New_York: /shop cards $155, $195, $275 and no rand; cookie sr_currency=usd + auto; product $20.00; cart $20.00; checkout billing country INTL preselected, only "Pay with PayPal", totals $20.00; /api/region usd. Screenshots usd-a-shop-ny.png, usd-a-product-ny.png, usd-a-cart-ny.png, usd-a-checkout-ny.png.
- Case (c) ZAR by default, server side (curl, no cookie): Accept-Language en-ZA, af and none give the ZAR region and Set-Cookie sr_currency=zar; en-US and de-DE give USD. Product page server HTML: $20.00 for en-US, R350,00 for en-ZA; Love & Relationships Recorded series: "Price on request" + "Contact Us to Discuss Pricing" for en-US.
- NEW-2 / NEW-3 (slow first paint of prices, cart "Loading" on a hard load): measured in Playwright on a hard load of /shop/rapid-repatterning-session: HTML at 1.15 s, but the small JS chunks took 1.1 s -> 2.8-3.9 s to arrive (main-app.js 1 KB took 2.8 s), so React hydrates around 4 s and /api/region is first called at 4.0 s. Network-bound on the box (three deploys and the intake reminder test ran in the same hour; one hero-shop.mp4 ERR_CONTENT_LENGTH_MISMATCH points the same way). Nothing in the change blocks hydration; re-measure on a quiet box.
- U6 / G-00d: "PayPal OAuth failed: 401" is the box's PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET: both 9 characters (the `chan...` placeholder) in infra/.env and in the web and medusa containers, read back 21 Oct 07:14Z (lengths only). The route now reaches PayPal with a USD cart (KI085 code path fixed); the live capture waits for sandbox credentials.

## Revision: location decides, no toggle (21 Oct, after Johan's instruction)
- The ZAR / USD toggle (rows Z1, C1, M1, M2 above) is removed in b04a090; currency now follows the IP country (DB-IP Lite on the box). Those rows are history.
- Proof after deploy 39573527165 and the DB-IP install (09:15Z, 8 348 509 bytes, cron `17 4 3 * *`): from this PC (South African IP) with Accept-Language en-US: /api/region {currency zar, country ZA, auto false}, product page R350,00; same request with forged CF-IPCountry: US and X-Geo-Country: US: still ZAR. Inside the web container, X-Real-IP with Accept-Language en-ZA: 8.8.8.8 US usd, 81.2.69.160 GB usd, 1.1.1.1 AU usd, 41.13.1.1 ZA zar, 196.25.1.1 ZA zar, 10.0.0.5 unknown -> fallback zar.
- Smoke after the medusa deploy (38c06b3): order #417, USD, $0.00 with QA-SELFTEST-100, confirmation shown. #415, #416, #417 cancelled 08:58Z via the admin API with Johan's sign-in (each re-read by id, number and email first): 200, canceled.
