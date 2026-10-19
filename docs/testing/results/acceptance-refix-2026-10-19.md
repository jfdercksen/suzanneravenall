# Acceptance REFIX 2026-10-19 (http://169.239.180.49)

| id | verdict | severity | actual (short) | evidence |
|---|---|---|---|---|
| D-08 | PASS | - | 404, title "Page not found \| Dr. Suzanne Ravenall", header present | browser/REFIX-D-08-1.png |
| D-04 | PASS | - | Results shown; P1 Programmes, P2 "Deep Dive" (KI059 pending), P3-5 Programmes | browser/REFIX-D-04-1.png |
| G-00 | PASS | - | Hero 58 = list header "58 items" | snapshot |
| G-124 | PASS | - | Pre-order notes on PDP and cart line, no date; removed | browser/REFIX-G-124-1.png |
| G-141 | PASS | - | Months note, Add another, + gives qty 2; coaching package speaks of sessions; removed | browser/REFIX-G-141-1.png |
| G-043 | PASS (note) | - | Variant in cart, checkout, confirmation; R0,00; order #390 (cancelled by controller ~10:06Z); What Happens Next generic (REFIX-NEW-1) | browser/REFIX-G-043-1..3.png |
| I-01 | PASS | - | Check-your-email, then dashboard "Welcome, Johan", no tier UI | browser/REFIX-I-01-1.png, -2.png |
| I-06 | PASS | - | 3 real links, no tier text, awards -> /resources | browser/REFIX-I-06-1.png |
| I-09 | PASS | - | N/A for launch, 404 as designed | snapshot |
| I-08 | PASS | - | Phone saved and persisted, success message, no Membership block, "Delete My Account" | browser/REFIX-I-08-1.png |
| I-11 | PASS | - | scrollWidth 360, six tabs, Videos works, no overlap with pill or cookie banner | browser/REFIX-I-11-*.png |
| I-01b | PASS | - | Sign Out 659-699 above banner 723-800 | browser/REFIX-I-01b-1.png |
| I-03 | PASS | - | Expired state, request, reset, "Password updated" + "Go to Your Dashboard", "Welcome back, Johan", login with new password works | browser/REFIX-I-03-1..3.png |

Findings
- REFIX-NEW-1 (major): category exploring-the-alpha-mind is a child of private-sessions but the product-type rule reads only the direct category, so session buyers get no session wording or booking link (page and mail).
- REFIX-NEW-2 (minor): nested main in main.
- REFIX-NEW-3 (minor): account subtitle mentions "membership details".
- REFIX-NEW-4 (minor): mobile tab labels truncate.
- REFIX-NEW-5 (minor): reset-password form shows the portal sidebar with Sign Out.
- Note: signup uses one "Full name" field.

Records: order #390 (cart_01M59SH6P8RQSAXQFGQZ8JY8NA, cancelled); account johan+portal1019@aiautomations.co.za.
