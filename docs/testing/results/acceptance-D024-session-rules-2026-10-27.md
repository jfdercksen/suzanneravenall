# D024 session rules: no-show, 48 working hours notice, terms tick box (2026-10-27)

Commit 2920cbe on feature/design-standard (eeb9211 plus the base merge), web deploy run 40476240976
(08:49Z, success, clean CI build included). Migration 20261026090000_session_rules.sql applied on
aimate-db1 by the EA session under Johan's approval (all six columns read back, NOTIFY pgrst sent);
read-only check from the web container: PostgREST serves the new columns (HTTP 200).
VPS infra/.env: AUTOMATION_SESSION_NOTICE=code (set by the EA session, web recreated 11:02 SAST,
`printenv` in the container reads "code"); SESSION_ALERT_EMAIL blank, so staff alerts go to
AUTOMATION_ALERT_EMAIL = ai@aiautomations.co.za (ours).

Persona: Johan QA Test, johan+limit1023@aiautomations.co.za (existing portal account from J-07).
Voucher QA-SELFTEST-100. Product: Rapid Repatterning Session, Package of 04 (60 min online).
Change time for the rule = the Cal.com delivery's createdAt.

| step | verdict | evidence |
|---|---|---|
| Live routes after deploy | PASS | /legal/terms 200 without the session section; /legal/terms?draft=sessions shows "4A. Sessions: cancellations, rescheduling and no-shows" with "Draft for approval"; /staff/booking/<bad token> shows "This link is not valid or has expired"; POST /api/staff/booking-credit with a short token answers 400 |
| G-00h checkout refuses without the tick | PASS | contact step filled, Continue to Payment: alert "Please accept the Terms and Conditions to continue.", no payment step; browser/G-00h-refused-without-tick.jpg |
| G-00h ticked, order placed | PASS | payment step opened, voucher applied, R6 310,00 to R0,00, order #446 order_01M5Y9P5V1ETEH9MEGQ1RV4FMB; admin read-back metadata.terms_accepted_at = 2026-10-27T09:04:15.473Z |
| Bookings through the /book gate | PASS | C gMMyEyQaToAnvk9jYeffdZ Wed 28 Oct 12:00 SAST (no-show test); A d6KRwMAoUToYMt77oUnryz Thu 29 Oct 10:00 (late cancel); B aEorT7eBxHa6fdkrbLDvrj Mon 16 Nov 10:00 (early cancel); all three stored "booked" |
| J-09 late cancel (< 48 working hours) | PASS | A cancelled by the client from the Cal.com cancel link (cancelledBy = the attendee) at 09:11Z Tue 27 Oct (16 h 49 min of working hours before the session); row: status cancelled, late_change_at 09:11:22Z, late_change_kind cancelled, late_change_by_staff false, staff_token set; web log "[session-rules] d6KRwMAoUToYMt77oUnryz: late cancelled" |
| J-09 client mail | PASS | Outlook 09:11:29Z, to johan+limit1023@ only: "Your session on Thu, 29 October 2026: less than 48 working hours notice", body "You cancelled this session less than 48 working hours before it was due to start, so this session counts as used." plus the working hours line and "If something exceptional happened, reply to this email" |
| J-09 staff alert to our address only | PASS | Brevo event log for ai@aiautomations.co.za: "[ALERT] A client cancelled a session at short notice" requested 11:11:24, delivered 11:11:27 SAST (inbox not readable from this session; no other recipient) |
| J-10 early cancel (>= 48 working hours) | PASS | B cancelled by the client the same way; row status cancelled, late_change_at null, no staff token, no late mail, no alert; the session is back in the package (portal count below) |
| J-11 staff gives the session back | PASS | /staff/booking/<A token>: client, session, "Cancelled by the client with less than 48 working hours notice (on Tue, 27 October 2026, 11:11 SAST)", "Counts as used"; Give this session back -> "Done: the session is back in the client's package", credit_restored_at 09:47:15Z, web log "restore done"; browser/J-11-staff-given-back.jpg |
| J-11 undo | PASS | Count it as used again -> "Done: the session counts as used again", "Counts as used" |
| Portal | PASS | magic-link sign-in as the persona; /portal/appointments: Upcoming Wed 28 Oct 12:00 Booked; "Rapid Repatterning Session, 60 min sessions, 2 of 4 left to book" (C booked + A late, B given back by the early cancel); Past: Thu 29 Oct 10:00 badge "Late cancellation" with "Changed with less than 48 working hours notice, so this session counts as used."; Mon 16 Nov badge "Cancelled"; browser/J-09-portal-late-cancellation.jpg |
| J-08 no-show | PENDING | Johan to click Mark as no-show on C (Wed 28 Oct 12:00) in Cal.com; then the webhook result, the row and the portal |

Cleanup (after J-08): cancel booking C in Cal.com and order #446 by exact id (read back display id and email first).
A and B are already cancelled.
