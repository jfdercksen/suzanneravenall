# H-12 intake forms, browser walk, 2026-10-21

Links: /intake/ytQq... (A, order #412, Rapid Repatterning Session), /intake/fYPf... (B, order #413, Executive Coaching Session). Persona: Johan QA Test, johan@aiautomations.co.za.

| step | verdict | what I saw | evidence |
|---|---|---|---|
| A1 1280 | PASS | Eyebrow "RAPID REPATTERNING SESSION", h1 "Client intake form", intro "Johan, this form helps us prepare... Please fill in the form to the best of your abilities", sections Personal details, Health information, Areas of stress..., Your family, Information about your problem, Information needed for the session, acknowledgement checkbox, "Send my intake form". No horizontal scroll on re-measure (scrollWidth 1280 = clientWidth). First measure read 1265 (scrollbar), see NEW-1 | browser/H-12-A-1280.png |
| A2 375 | PASS | Page scrollWidth 360 (<= 375). All six 1-10 scales render as 2 rows of 5 | browser/H-12-A-375-top.png |
| A3 375 empty submit | PASS | Red (rgb 220,38,38) "This question is required." x4, "Please tick to confirm you have read this." x1, line "5 answers need your attention before the form can be sent." N = 5 | browser/H-12-A-375-errors.png |
| A4 375 fill and send | PASS | Filled name, email, mobile, DOB 1980-01-15, Overwhelm + Uncertainty, stress Family 4 / Relationship 3 / Financial 6 / Health 2 / Other 1 (+ details "QA test, ignore"), mental disorders No, work-on text, readiness 8, acknowledgement. Result "Thank you, your form is in", "We have received your intake form and will read it before your session". POST /api/intake/submit 200. Sent about 07:54:23 UTC (thank-you read 07:54:27 UTC) | browser/H-12-A-375-thanks.png |
| A5 reload A | PASS | "Thank you, your form is in. We have already received your intake form for Rapid Repatterning Session." | browser/H-12-A-used.png |
| A6 bad link | PASS | "This link is not valid", "incomplete or has been changed. Please open it again from the mail we sent you." Tab title "Intake form \| Dr. Suzanne Ravenall" | browser/H-12-bad-link.png |
| B open 1280 (opened 07:58:44 UTC) | PASS with finding | Eyebrow "EXECUTIVE COACHING SESSION", h1 "Client history: Executive and Transformational Coaching" | browser/H-12-B-1280.png |
| B fill and send 1280 | PASS | Required fields (name, mobile, email, challenge, goals, readiness 7, acknowledgement) filled with QA test text. Thank-you state shown. POST /api/intake/submit 200. Sent 07:59:30 UTC | browser/H-12-B-1280-thanks.png |

Console errors: none on any navigation. Requests >= 400: none (only /portal 307 prefetch redirect, expected).

## Findings

| id | severity | finding |
|---|---|---|
| H-12-NEW-1 | minor | At 1280x900 on link B, document scrollWidth was 1316 vs clientWidth 1265 (vertical scrollbar takes 15px, so the layout is wider than the viewport): the header's right-hand "Book a Discovery Call" link (hidden xl:inline-flex) ends at x=1316. Slight horizontal scroll at exactly 1280. Site header, not the form. Link A measured 1280 on re-check, so it is intermittent or load dependent. |
| H-12-NEW-2 | minor | Wording differs between forms: A says "Paralysed", B says "Paralyzed" (British vs US spelling). Also A has a feelings list of 22 and B of 37. Probably copied from the source forms. |
| H-12-NEW-3 | minor | Header link order not checked for the screenshots at 1280: the screenshot for A1 is viewport-only (fullPage capture timed out on fonts twice, third attempt saved full page). |
