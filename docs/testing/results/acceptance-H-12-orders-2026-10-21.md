# H-12 intake forms, step 1: orders (2026-10-21)

Persona: Johan QA Test, johan@aiautomations.co.za. Voucher QA-SELFTEST-100. No intake link opened.

| id | verdict | order number | variant | total | evidence |
|---|---|---|---|---|---|
| H-12-A | PASS | #412 (placed 2026-10-21T07:49:52Z) | Rapid Repatterning Session, 90 min online (list R2 490,00) | R0,00 | docs/testing/results/browser/H-12-A-confirmation.png; "Order #412 is confirmed" |
| H-12-B | PASS | #413 (placed 2026-10-21T07:51:30Z) | Executive Coaching Session, 30 min (list R1 660,00) | R0,00 | docs/testing/results/browser/H-12-B-confirmation.png; "Order #413 is confirmed" |

Failed requests (>=400) in checkout flow: none. Console errors: none.

Findings
- H-12-NEW-1 (minor): product page shows "$230.00" in the disabled loading state, then R2 490,00; cart/checkout pages sit on "Loading your cart..." for roughly 10-20 s on first load.
- H-12-NEW-2 (minor, note): confirmation "Book Your Session" link points to http://169.239.180.49:3002/... (Cal.com on a raw port); not clicked.
