# H-12b intake mail template: voucher orders (2026-10-22)

Persona: Johan QA Test, johan@aiautomations.co.za. Voucher QA-SELFTEST-100. Business option left off. One cart line per order. No intake link opened.

| id | verdict | order number | product | variant | total | placed (UTC, approx) | evidence |
|---|---|---|---|---|---|---|---|
| H-12b-A | PASS | #427 | Rapid Repatterning Session | 90 min online | R0,00 (list R2 490,00) | 08:43:55 | docs/testing/results/browser/H-12b-A-confirmation.png |
| H-12b-B | PASS | #428 | Rapid Repatterning Session | 60 min in-person | R0,00 (list R1 995,00) | 08:45:32 | docs/testing/results/browser/H-12b-B-confirmation.png |
| H-12b-C | PASS | #429 | Resonance Repatterning / Coaching Session | 60 min online (first variant) | R0,00 (list R1 660,00) | 08:47:08 | docs/testing/results/browser/H-12b-C-confirmation.png |

Requests >= 400: none. Console errors: none. (Only a 307 on a prefetch of /portal, redirect to login, not a user action.)

Notes: confirmation pages read "Order #NNN is confirmed" and list the product with variant. Gaps between orders were over 30 s. Confirmation mail receipt not checked (out of scope).
