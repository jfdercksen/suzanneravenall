# Acceptance J-02, 20 Oct 2026 (KI079 re-walk)

Target http://169.239.180.49, commit 31a6d73, deploy run 39392862768 (web + medusa). qa-e2e walker for the browser rows; mails, CRM and cleanup by the controller. Verdict: **J-02 PASS**, 7/7.

| id | verdict | actual | evidence |
|---|---|---|---|
| J-02a | PASS | R0,00. Order #392. href: http://169.239.180.49:3002/suzanneravenall/session-30?name=Johan+QA+Test&email=johan%40aiautomations.co.za | docs/testing/results/browser/J-02a-confirmation.png |
| J-02b | PASS | R0,00. Order #393. href .../session-45?name=Johan+QA+Test&email=johan%40aiautomations.co.za | docs/testing/results/browser/J-02b-confirmation.png |
| J-02c | PASS | R0,00. Order #394. href .../session-60?name=Johan+QA+Test&email=johan%40aiautomations.co.za | docs/testing/results/browser/J-02c-confirmation.png |
| J-02d | PASS | R0,00. Order #395. href .../session-90?name=Johan+QA+Test&email=johan%40aiautomations.co.za | docs/testing/results/browser/J-02d-confirmation.png |
| J-02e | PASS | All four load with host 'Dr Suzanne Ravenall' and correct titles/durations: session-30 30m, first slot Wed 21 Oct 11:00; session-45 45m, 10:45; session-60 1h, 11:00; session-90 1h 30m, 11:00 (SAST, read at 10:44 SAST 20 Oct, each just over 24 h away). Not the Discovery Call. Nothing booked on 30, 45, 90. | docs/testing/results/browser/J-02e-30.png, J-02e-45.png, J-02e-60.png, J-02e-90.png |
| J-02f | PASS | Form prefilled name/email, required Phone (default +1). Booked Wed 21 Oct 2026 11:00-12:00 SAST (60 min), 'This meeting is scheduled'. What: Session (60 min) between Dr Suzanne Ravenall and Johan QA Test. uid mD2wEnpyLdctCPdbv2MUKF. Zoom https://zoom.us/j/3603768111. | docs/testing/results/browser/J-02f-form.png, J-02f-booked.png |
| J-02g | PASS | Opened /booking/mD2wEnpyLdctCPdbv2MUKF?cancel=true at 1280x1000, entered reason 'QA walk KI079, please ignore', clicked Cancel event. Page shows 'This event is canceled' with Reason 'QA walk KI079, please ignore' and the same What/When details. | docs/testing/results/browser/J-02g-cancelled.png |

## Controller checks

- Order mails: #392 Executive Coaching 30 min: 08:40:36Z, Book Your Session -> http://169.239.180.49:3002/suzanneravenall/session-30?name=Johan+QA+Test&email=johan%40aiautomations.co.za (Brevo button resolved 302 to the same); #393 Exploring the Alpha Mind 45 min: 08:41:10Z, session-45 with persona prefilled; #394 Rapid Repatterning 60 min online: 08:41:57Z, session-60 with persona prefilled (Brevo button resolved 302 to the same); #395 Resonance Repatterning 90 min online: 08:42:48Z, session-90 with persona prefilled
- Booking mails: Scheduled "Session (60 min) between Dr Suzanne Ravenall and Johan QA Test", Wed 21 Oct 11:00-12:00 SAST: two mails 08:45:11Z and 08:45:13Z (host and attendee). Canceled: two mails 08:48:58Z and 08:49:00Z.
- CRM (K-07 path): nginx POST /api/webhooks/calcom 200 at 08:45:05; web log "[calcom] booking mD2wEnpyLdctCPdbv2MUKF -> contact 12x413 (existing), event 18x625". Vtiger read back: Event 18x625 subject "Session - Session (60 min) between Dr Suzanne Ravenall and Johan QA Test", Call / Planned, 2026-10-21 09:00-10:00 UTC, 1 h 0 min, description "Cal.com booking UID: mD2wEnpyLdctCPdbv2MUKF", contact 12x413. Contact 12x413 stage Closed Won, lead source Shop, modified 08:42:38 (the order sync), not changed by the booking.
- Cleanup: Booking mD2wEnpyLdctCPdbv2MUKF cancelled 08:48:55Z. Orders #392 #393 #394 #395 cancelled via POST /admin/orders/:id/cancel (200) and read back status canceled. No Thinkific course on these products, nothing else to undo.
- Env: CALCOM_SESSION_BOOKING_URL not present in the box infra/.env at 08:37 (printenv empty in medusa and web); both fall back to NEXT_PUBLIC_CAL_URL (http://169.239.180.49:3002) + /suzanneravenall, the same base. Line still to add: CALCOM_SESSION_BOOKING_URL=http://169.239.180.49:3002/suzanneravenall

## Findings

- J-NEW-1: During the Medusa restart (about 08:37-08:38 UTC) /api/store/products returned 502 and product pages 404 instead of a friendly error. Resolved on re-run.
- J-NEW-2: Confirmation page says 'order confirmation and invoice are on their way' for R0 orders (wording only).
- J-NEW-3: Cal.com phone field defaults to US +1 for a South African customer; typing +27 worked.
- J-NEW-4: Page title on the cancel and cancelled views stays 'Your booking has been confirmed | Cal.com'.
